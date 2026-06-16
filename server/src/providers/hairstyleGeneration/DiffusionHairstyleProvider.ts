import axios from "axios";
import fs from "fs";
import path from "path";
import type { HairstyleGenerationProvider, GenerationResult } from "../types";
import { HAIRSTYLE_PROMPTS } from "./HairstylePrompts";
import { cloudinary, isCloudinaryConfigured } from "../../config/cloudinary";
import logger from "../../utils/logger";

const HF_API_BASE = "https://api-inference.huggingface.io/models";
const INPAINTING_MODEL = "stabilityai/stable-diffusion-3.5-medium";
const FALLBACK_MODEL = "black-forest-labs/FLUX.1-schnell";

export class DiffusionHairstyleProvider implements HairstyleGenerationProvider {
  private apiToken: string;

  constructor() {
    this.apiToken = process.env.HF_TOKEN || "";
  }

  get isConfigured(): boolean {
    return !!this.apiToken;
  }

  async generate(params: {
    originalImage: string;
    hairstyleId: string;
    templateImage?: string;
    faceLandmarks?: Record<string, { x: number; y: number; z?: number }>;
    maskPath?: string;
  }): Promise<GenerationResult> {
    if (!this.isConfigured) {
      return {
        imageUrl: params.templateImage || params.originalImage,
        provider: "diffusion-fallback",
        metadata: { hairstyleId: params.hairstyleId, note: "HF_TOKEN not set" },
      };
    }

    const hairstylePrompt = HAIRSTYLE_PROMPTS[params.hairstyleId] || {
      prompt: "A person with a stylish haircut, professional portrait, high quality",
      negative: "deformed, distorted, bad anatomy, low quality"
    };

    try {
      const imageResp = await axios.get(params.originalImage, { responseType: "arraybuffer", timeout: 15000 });
      const imageBase64 = Buffer.from(imageResp.data).toString("base64");

      // Try mask-based inpainting first if a mask was provided
      if (params.maskPath && fs.existsSync(params.maskPath)) {
        try {
          const maskBuffer = fs.readFileSync(params.maskPath);
          const maskBase64 = maskBuffer.toString("base64");

          const result = await this.callInpaintingAPI(imageBase64, maskBase64, hairstylePrompt, params.hairstyleId);
          fs.unlinkSync(params.maskPath);
          return result;
        } catch (err) {
          logger.warn("Inpainting failed, falling back to img2img:", { error: err instanceof Error ? err.message : err });
          if (params.maskPath && fs.existsSync(params.maskPath)) {
            try { fs.unlinkSync(params.maskPath); } catch {}
          }
        }
      }

      // Fall back to standard img2img
      return await this.callImg2img(imageBase64, hairstylePrompt, params.hairstyleId, params.templateImage);
    } catch (err) {
      logger.warn("Diffusion generation failed:", { error: err instanceof Error ? err.message : err });
      return {
        imageUrl: params.templateImage || params.originalImage,
        provider: "diffusion-fallback",
        metadata: {
          hairstyleId: params.hairstyleId,
          error: err instanceof Error ? err.message : "unknown",
        },
      };
    }
  }

  private async callInpaintingAPI(
    imageBase64: string,
    maskBase64: string,
    prompt: { prompt: string; negative: string },
    hairstyleId: string,
  ): Promise<GenerationResult> {
    const payload = {
      inputs: imageBase64,
      parameters: {
        mask: maskBase64,
        prompt: prompt.prompt,
        negative_prompt: prompt.negative + ", deformed, distorted, bad anatomy, ugly",
        guidance_scale: 7.0,
        num_inference_steps: 25,
      },
    };

    const response = await axios.post(
      `${HF_API_BASE}/${INPAINTING_MODEL}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
        timeout: 120000,
      },
    );

    const fileName = `gen-${hairstyleId}-${Date.now()}.png`;
    const outputPath = path.resolve(__dirname, "../../../uploads", fileName);
    fs.writeFileSync(outputPath, response.data);

    let imageUrl = `/uploads/${fileName}`;

    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.upload(outputPath, {
        folder: "hairstyle-generated",
      });
      try { fs.unlinkSync(outputPath); } catch { /* ignore */ }
      imageUrl = result.secure_url;
    }

    return {
      imageUrl,
      provider: "inpainting",
      metadata: { model: INPAINTING_MODEL, hairstyleId, prompt: prompt.prompt },
    };
  }

  private async callImg2img(
    imageBase64: string,
    hairstylePrompt: { prompt: string; negative: string },
    hairstyleId: string,
    templateImage?: string,
  ): Promise<GenerationResult> {
    const models = [
      process.env.HF_MODEL || FALLBACK_MODEL,
      FALLBACK_MODEL,
    ];
    let lastError: unknown;

    for (const model of models) {
      try {
        const payload = {
          inputs: imageBase64,
          parameters: {
            prompt: hairstylePrompt.prompt,
            negative_prompt: hairstylePrompt.negative + ", deformed, distorted, bad anatomy, ugly",
            strength: 0.8,
            guidance_scale: 7.0,
            num_inference_steps: 8,
          },
        };

        const response = await axios.post(
          `${HF_API_BASE}/${model}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.apiToken}`,
              "Content-Type": "application/json",
            },
            responseType: "arraybuffer",
            timeout: 90000,
          },
        );

        const fileName = `gen-${hairstyleId}-${Date.now()}.png`;
        const outputPath = path.resolve(__dirname, "../../../uploads", fileName);
        fs.writeFileSync(outputPath, response.data);

        let imageUrl = `/uploads/${fileName}`;

        if (isCloudinaryConfigured) {
          const result = await cloudinary.uploader.upload(outputPath, {
            folder: "hairstyle-generated",
          });
          try { fs.unlinkSync(outputPath); } catch { /* ignore */ }
          imageUrl = result.secure_url;
        }

        return {
          imageUrl,
          provider: "diffusion",
          metadata: { model, hairstyleId, prompt: hairstylePrompt.prompt },
        };
      } catch (err) {
        lastError = err;
        logger.warn(`Model ${model} failed, trying next:`, { error: err instanceof Error ? err.message : err });
      }
    }

    throw lastError;
  }
}
