import { z } from "zod";
import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

const responseParser = z.object({
  post: z
    .object({
      post: z.object({
        id: z.number(),
        created_at: z.string(),
        user_id: z.string(),
        title: z.string(),
        attempting: z.string().nullable(),
      }),
      shapes: z.array(
        z.object({
          id: z.number(),
          shape_type: z.string(),
          left: z.number(),
          top: z.number(),
          width: z.number(),
          height: z.number(),
          zIndex: z.number(),
          color: z.string(),
        })
      ),
    })
    .nullable(),
  error: z.string().nullable(),
});

export default async function handler(req: NextRequest) {
  const postId = z
    .number()
    .parse(parseInt(req.nextUrl.searchParams.get("post_id") ?? "asd"));
  const result = await fetch(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    `http://${req.headers.get("host")!}/api/posts/${postId}`
  );
  const { post, error } = responseParser.parse(await result.json());
  if (error)
    return new Response(error, {
      status: 500,
    });

  function weirdColorize(s: string) {
    return s === "#ffffff"
      ? "#ffffff"
      : s === "#e574bc"
      ? "#e574bc"
      : s === "#56e39f"
      ? "#56e39f"
      : s === "#f1d302"
      ? "#f1d302"
      : s === "#c1292e"
      ? "#c1292e"
      : s === "#235789"
      ? "#235789"
      : "#000000";
  }
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: 320,
          width: 320,
          padding: "16px",
          background: "black",
        }}
      >
        {post?.shapes
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((shape) => (
            <div
              key={shape.id}
              style={{
                top: `${shape.top}px`,
                left: `${shape.left}px`,
                width: `${shape.width}px`,
                height: `${shape.height}px`,
                zIndex: `${shape.zIndex}`,
                display: "flex",
                position: "absolute",
              }}
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                }}
              >
                {shape.shape_type === "SQUARE" ? (
                  <rect
                    x="0"
                    y="0"
                    width="100"
                    height="100"
                    fill={weirdColorize(shape.color)}
                  />
                ) : shape.shape_type === "TRIANGLE" ? (
                  <polygon
                    points="50 15, 100 100, 0 100"
                    fill={weirdColorize(shape.color)}
                  />
                ) : (
                  <circle
                    cx="50"
                    cy="50"
                    r="50"
                    fill={weirdColorize(shape.color)}
                  />
                )}
              </svg>
            </div>
          ))}
      </div>
    ),
    {
      height: 320,
      width: 320,
    }
  );
}
