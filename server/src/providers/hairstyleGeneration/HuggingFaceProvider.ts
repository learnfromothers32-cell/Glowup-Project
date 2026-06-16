import axios from "axios";
import fs from "fs";
import path from "path";
import type { HairstyleGenerationProvider, GenerationResult } from "../types";
import { cloudinary, isCloudinaryConfigured } from "../../config/cloudinary";
import logger from "../../utils/logger";

const HF_API_BASE = "https://api-inference.huggingface.io/models";
const FALLBACK_MODEL = "black-forest-labs/FLUX.1-schnell";

export class HuggingFaceGenerationProvider implements HairstyleGenerationProvider {
  private apiToken: string;
  private model: string;

  constructor(model?: string) {
    this.apiToken = process.env.HF_TOKEN || "";
    this.model = model || process.env.HF_MODEL || FALLBACK_MODEL;
  }

  get isConfigured(): boolean {
    return !!this.apiToken;
  }

  async generate(params: {
    originalImage: string;
    hairstyleId: string;
    templateImage?: string;
    faceLandmarks?: Record<string, { x: number; y: number; z?: number }>;
  }): Promise<GenerationResult> {
    if (!this.isConfigured) {
      return {
        imageUrl: params.templateImage || params.originalImage,
        provider: "huggingface-fallback",
        metadata: { hairstyleId: params.hairstyleId, note: "HF_TOKEN not set" },
      };
    }

    try {
      const sourceUrl = params.originalImage;
      const imageResp = await axios.get(sourceUrl, { responseType: "arraybuffer", timeout: 10000 });
      const imageBase64 = Buffer.from(imageResp.data).toString("base64");

      const payload = {
        inputs: imageBase64,
        parameters: {
          prompt: "realistic portrait, natural lighting",
          negative_prompt: "deformed, distorted, bad anatomy",
          strength: 0.75,
          guidance_scale: 7.5,
        },
      };

      const response = await axios.post(
        `${HF_API_BASE}/${this.model}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
          timeout: 60000,
        },
      );

      const fileName = `hf-${params.hairstyleId}-${Date.now()}.png`;
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
        provider: "huggingface",
        metadata: { model: this.model, hairstyleId: params.hairstyleId },
      };
    } catch (err) {
      logger.warn("HuggingFace generation failed:", { error: err instanceof Error ? err.message : err });
      return {
        imageUrl: params.templateImage || params.originalImage,
        provider: "huggingface-fallback",
        metadata: {
          hairstyleId: params.hairstyleId,
          error: err instanceof Error ? err.message : "unknown",
        },
      };
    }
  }
}
