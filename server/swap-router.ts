import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
  import { z } from "zod";
  import { TRPCError } from "@trpc/server";
  import { storagePut } from "./storage";
import { updateUserCredits } from "./db.js";

  const CREATOR_TIERS = new Set(["amateur", "independent", "creator", "studio", "industry", "beta"]);

  // ── Shared helpers ────────────────────────────────────────────────────────────

  function decodeImage(base64: string): { buffer: Buffer; mimeType: string } {
    const match = base64.match(/^data:(image\/[^;]+);base64,(.+)$/);
    return {
      mimeType: match?.[1] ?? "image/jpeg",
      buffer: Buffer.from(match?.[2] ?? base64, "base64"),
    };
  }

  // ── FREE PATH ─────────────────────────────────────────────────────────────────
  // Pollinations.ai — completely free, no API key required.
  // Uploads the target image to internal storage (for img2img conditioning),
  // then calls Pollinations FLUX to generate a creative face-swap inspired result.
  async function swapWithPollinations(
    sourceImageBase64: string,
    targetImageBase64: string,
  ): Promise<string> {
    const { buffer: tgtBuffer } = decodeImage(targetImageBase64);

    // Try to upload target to storage so Pollinations can reference it as img2img
    let imageParam = "";
    try {
      const { url } = await storagePut(`swaps/tgt-${Date.now()}.jpg`, tgtBuffer, "image/jpeg");
      imageParam = `&image=${encodeURIComponent(url)}`;
    } catch {
      // Storage not available — proceed without image reference
    }

    const prompt = encodeURIComponent(
      "photorealistic creative face swap portrait, seamless face blend onto body, " +
      "natural skin tone, cinematic studio lighting, high quality photography, " +
      "sharp focus, professional retouching"
    );
    const seed = Math.floor(Math.random() * 999999);
    const pollinationsUrl =
      `https://image.pollinations.ai/prompt/${prompt}` +
      `?width=1024&height=1024&nologo=true&model=flux&seed=${seed}${imageParam}`;

    const resp = await fetch(pollinationsUrl);
    if (!resp.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Creative swap failed — please try again.",
      });
    }

    // Pollinations returns raw image bytes — save to storage and return URL
    const resultBuffer = Buffer.from(await resp.arrayBuffer());
    const { url: resultUrl } = await storagePut(
      `swaps/free-${Date.now()}.jpg`,
      resultBuffer,
      "image/jpeg",
    );
    return resultUrl;
  }

  // ── CREATOR PATH ──────────────────────────────────────────────────────────────
  // fal.ai face-swap — high-quality, photorealistic swap.
  // Requires FAL_KEY set as a server environment variable (managed by Virelle Studios).
  // Users never need their own key — it is provided through their Creator subscription.

  async function uploadToFalStorage(base64: string, falKey: string): Promise<string> {
    const { buffer, mimeType } = decodeImage(base64);
    const initResp = await fetch("https://rest.alpha.fal.ai/storage/upload/initiate", {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ file_name: `swap-${Date.now()}.jpg`, content_type: mimeType }),
    });
    if (!initResp.ok) throw new Error(`fal storage initiate: ${initResp.status}`);
    const { upload_url, file_url } = await initResp.json() as { upload_url: string; file_url: string };
    const putResp = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": mimeType },
      body: new Uint8Array(buffer),
    });
    if (!putResp.ok) throw new Error(`fal storage put: ${putResp.status}`);
    return file_url;
  }

  async function swapWithFal(
    sourceImageBase64: string,
    targetImageBase64: string,
    falKey: string,
  ): Promise<string> {
    // Upload both images to fal.ai storage simultaneously
    let sourceUrl: string, targetUrl: string;
    try {
      [sourceUrl, targetUrl] = await Promise.all([
        uploadToFalStorage(sourceImageBase64, falKey),
        uploadToFalStorage(targetImageBase64, falKey),
      ]);
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Image upload failed — check your connection and try again.",
      });
    }

    // Submit to fal.ai queue
    const submitResp = await fetch("https://queue.fal.run/fal-ai/face-swap", {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        base_image_url: targetUrl, // the body/scene image
        face_image_url: sourceUrl, // the face to swap in
      }),
    });
    if (!submitResp.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Swap failed to start — please try again.",
      });
    }
    const { request_id } = await submitResp.json() as { request_id: string };

    // Poll for completion — max 90 seconds (45 × 2 s)
    for (let i = 0; i < 45; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const statusResp = await fetch(
        `https://queue.fal.run/fal-ai/face-swap/requests/${request_id}/status`,
        { headers: { Authorization: `Key ${falKey}` } },
      );
      const { status } = await statusResp.json() as { status: string };
      if (status === "COMPLETED") {
        const resultResp = await fetch(
          `https://queue.fal.run/fal-ai/face-swap/requests/${request_id}`,
          { headers: { Authorization: `Key ${falKey}` } },
        );
        const result = await resultResp.json() as {
          image?: { url: string };
          images?: { url: string }[];
        };
        const imageUrl = result.image?.url ?? result.images?.[0]?.url;
        if (!imageUrl) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No output image returned." });
        }
        return imageUrl;
      }
      if (status === "FAILED") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Swap failed — try different photos and try again.",
        });
      }
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Swap timed out — please try again.",
    });
  }

  // ── Router ────────────────────────────────────────────────────────────────────
  export const swapRouter = router({
    bodyFaceSwap: protectedProcedure
      .input(
        z.object({
          sourceImageBase64: z.string().max(8 * 1024 * 1024),
          targetImageBase64: z.string().max(8 * 1024 * 1024),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const falKey = process.env.FAL_KEY;
        const isCreator =
          ctx.user != null && CREATOR_TIERS.has((ctx.user as any).subscriptionTier ?? "");

        const isAdmin = ctx.user.role === "admin";
        const creditCost = isCreator && falKey ? 5 : 2;
        if (!isAdmin && ctx.user.credits < creditCost) {
          throw new TRPCError({ code: "FORBIDDEN", message: `Insufficient credits — this swap costs ${creditCost} credits.` });
        }
        const imageUrl =
          isCreator && falKey
            ? await swapWithFal(input.sourceImageBase64, input.targetImageBase64, falKey)
            : await swapWithPollinations(input.sourceImageBase64, input.targetImageBase64);

        if (!isAdmin) {
          await updateUserCredits(ctx.user.id, -creditCost, `Face/body swap (${isCreator && falKey ? "Creator" : "free"})`, "spend");
        }
        return {
          imageUrl,
          hasWatermark: !isCreator,
          isCreatorSwap: isCreator && !!falKey,
          swapsRemaining: null as number | null,
        };
      }),
  });
  