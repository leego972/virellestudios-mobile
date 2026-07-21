import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const CANONICAL_VIRELLE_URL = (process.env.VIRELLE_WEB_BASE_URL || "https://virelle.life").replace(/\/$/, "");
const MAX_ENCODED_IMAGE_LENGTH = 12_000_000;

const imageDataUrl = z.string()
  .min(100)
  .max(MAX_ENCODED_IMAGE_LENGTH)
  .regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/i, "Use a valid JPEG, PNG or WebP image.");

function safeCanonicalBase(): string {
  try {
    const parsed = new URL(CANONICAL_VIRELLE_URL);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("invalid URL");
    return parsed.origin;
  } catch {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "The Virelle transformation service is not configured for this build.",
    });
  }
}

export const swapRouter = router({
  bodyFaceSwap: protectedProcedure
    .input(z.object({
      sourceImageBase64: imageDataUrl,
      targetImageBase64: imageDataUrl,
    }))
    .mutation(async ({ input, ctx }) => {
      const baseUrl = safeCanonicalBase();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120_000);

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Swappys-Client": "virelle-mobile",
        };
        const authorization = ctx.req.headers.authorization;
        if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
          headers.Authorization = authorization;
        }

        const response = await fetch(`${baseUrl}/api/trpc/vfxSfx.swappysMobileSwap`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            json: {
              sourceImageBase64: input.sourceImageBase64,
              targetImageBase64: input.targetImageBase64,
              consentConfirmed: true,
            },
          }),
          signal: controller.signal,
        });

        let payload: any = null;
        try {
          payload = await response.json();
        } catch {
          // A non-JSON upstream error is handled below.
        }

        if (!response.ok) {
          const message = payload?.error?.json?.message || payload?.error?.message;
          throw new TRPCError({
            code: response.status === 429 ? "TOO_MANY_REQUESTS" : "INTERNAL_SERVER_ERROR",
            message: message || `Virelle transformation failed (HTTP ${response.status}).`,
          });
        }

        const result = payload?.result?.data?.json ?? payload?.result?.data;
        if (!result?.imageUrl || typeof result.imageUrl !== "string") {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Virelle returned no transformation image." });
        }

        return {
          imageUrl: result.imageUrl,
          hasWatermark: result.hasWatermark !== false,
          isCreatorSwap: result.hasWatermark === false,
          swapsRemaining: null as number | null,
          upgradeUrl: result.upgradeUrl || `${baseUrl}/pricing?source=virelle-mobile-swappys`,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        if (error?.name === "AbortError") {
          throw new TRPCError({ code: "TIMEOUT", message: "The transformation timed out. Try smaller, clearer images." });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Swappys could not reach the Virelle transformation service. Try again shortly.",
        });
      } finally {
        clearTimeout(timer);
      }
    }),
});
