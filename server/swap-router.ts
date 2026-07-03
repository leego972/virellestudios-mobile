import { router, publicProcedure } from "./_core/trpc";
  import { z } from "zod";
  import { TRPCError } from "@trpc/server";

  const CREATOR_TIERS = new Set(["amateur", "independent", "creator", "studio", "industry", "beta"]);

  async function uploadToFal(base64: string, falKey: string): Promise<string> {
    const match = base64.match(/^data:(image\/[^;]+);base64,(.+)$/);
    const mimeType = match?.[1] ?? "image/jpeg";
    const raw = match?.[2] ?? base64;
    const buffer = Buffer.from(raw, "base64");

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
      body: buffer,
    });
    if (!putResp.ok) throw new Error(`fal storage put: ${putResp.status}`);
    return file_url;
  }

  export const swapRouter = router({
    bodyFaceSwap: publicProcedure
      .input(z.object({
        sourceImageBase64: z.string().max(8 * 1024 * 1024),
        targetImageBase64: z.string().max(8 * 1024 * 1024),
      }))
      .mutation(async ({ input, ctx }) => {
        const falKey = process.env.FAL_KEY;
        if (!falKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Swap service not configured — contact support@virelle.life",
          });
        }

        const isCreator =
          ctx.user != null && CREATOR_TIERS.has((ctx.user as any).subscriptionTier ?? "");

        let sourceUrl: string, targetUrl: string;
        try {
          [sourceUrl, targetUrl] = await Promise.all([
            uploadToFal(input.sourceImageBase64, falKey),
            uploadToFal(input.targetImageBase64, falKey),
          ]);
        } catch {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Image upload failed — check your connection and try again.",
          });
        }

        const resp = await fetch("https://fal.run/fal-ai/face-swap", {
          method: "POST",
          headers: {
            Authorization: `Key ${falKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base_image_url: targetUrl,
            swap_image_url: sourceUrl,
          }),
        });
        if (!resp.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Swap generation failed — please try again.",
          });
        }

        const json = await resp.json() as { image?: { url: string }; images?: { url: string }[] };
        const imageUrl = json.image?.url ?? json.images?.[0]?.url;
        if (!imageUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No output returned — try a different photo.",
          });
        }

        return {
          imageUrl,
          hasWatermark: !isCreator,
          swapsRemaining: null as number | null,
        };
      }),
  });
  