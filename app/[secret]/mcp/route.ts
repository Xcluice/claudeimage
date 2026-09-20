import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const MODELS = [
  "@cf/black-forest-labs/flux-1-schnell",
  "@cf/bytedance/stable-diffusion-xl-lightning",
  "@cf/stabilityai/stable-diffusion-xl-base-1.0",
  "@cf/lykon/dreamshaper-8-lcm",
] as const;

const mcpHandler = createMcpHandler((server) => {
  server.tool(
    "generate_image",
    "Generate an AI image from a text prompt (free, backed by Cloudflare Workers AI). Returns the generated image directly.",
    {
      prompt: z.string().describe("Detailed description of the image to generate"),
      model: z
        .enum(MODELS)
        .optional()
        .describe(
          "Model to use. Defaults to @cf/black-forest-labs/flux-1-schnell (best quality/speed balance)."
        ),
      negative_prompt: z
        .string()
        .optional()
        .describe("Things to avoid in the image, e.g. 'blurry, watermark, text'"),
    },
    async ({ prompt, model, negative_prompt }) => {
      const workerUrl = process.env.CF_WORKER_URL;
      const workerKey = process.env.CF_WORKER_API_KEY;

      if (!workerUrl || !workerKey) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: "Image worker is not configured yet. Set CF_WORKER_URL and CF_WORKER_API_KEY in this project's environment variables.",
            },
          ],
        };
      }

      let res: Response;
      try {
        res = await fetch(`${workerUrl.replace(/\/$/, "")}/v1/images/generations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${workerKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            model: model || MODELS[0],
            negative_prompt,
            n: 1,
          }),
        });
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: `Failed to reach image worker: ${String(err)}` }],
        };
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return {
          isError: true,
          content: [
            { type: "text" as const, text: `Image worker returned ${res.status}: ${errText}` },
          ],
        };
      }

      const data = (await res.json()) as {
        data?: { b64_json?: string; revised_prompt?: string }[];
      };
      const b64 = data?.data?.[0]?.b64_json;

      if (!b64) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: "Image worker response had no image data." }],
        };
      }

      return {
        content: [
          {
            type: "image" as const,
            data: b64,
            mimeType: "image/png",
          },
        ],
      };
    }
  );
});

async function withAuth(req: Request, params: { secret: string }) {
  const expected = process.env.MCP_SECRET;
  if (!expected || params.secret !== expected) {
    return new Response("Not found", { status: 404 });
  }
  return mcpHandler(req);
}

export async function GET(req: Request, ctx: { params: Promise<{ secret: string }> }) {
  return withAuth(req, await ctx.params);
}

export async function POST(req: Request, ctx: { params: Promise<{ secret: string }> }) {
  return withAuth(req, await ctx.params);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ secret: string }> }) {
  return withAuth(req, await ctx.params);
}
