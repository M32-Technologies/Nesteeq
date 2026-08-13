import http from "node:http";
import https from "node:https";

import { NextResponse } from "next/server";

const BACKEND_API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:6000"
).replace(/\/$/, "");

type ProxyOptions = {
  request: Request;
  backendPath: string;
};

const requestBackend = (
  targetUrl: URL,
  method: string,
  headers: Record<string, string>,
  body: string
) => {
  const transport =
    targetUrl.protocol === "https:" ? https : http;

  return new Promise<Response>((resolve, reject) => {
    const backendRequest = transport.request(
      targetUrl,
      {
        method,
        headers,
      },
      (backendResponse) => {
        const chunks: Buffer[] = [];

        backendResponse.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        backendResponse.on("end", () => {
          const contentType =
            backendResponse.headers["content-type"];

          resolve(
            new Response(Buffer.concat(chunks), {
              status: backendResponse.statusCode || 500,
              headers: {
                "content-type": Array.isArray(contentType)
                  ? contentType[0]
                  : contentType || "application/json",
              },
            })
          );
        });
      }
    );

    backendRequest.on("error", reject);

    if (body) {
      backendRequest.write(body);
    }

    backendRequest.end();
  });
};

export const proxyBackendRequest = async ({
  request,
  backendPath,
}: ProxyOptions) => {
  const targetUrl = new URL(
    backendPath,
    BACKEND_API_BASE_URL
  );

  try {
    const body = await request.text();
    const headers: Record<string, string> = {};
    const contentType =
      request.headers.get("content-type");
    const cookie = request.headers.get("cookie");
    const authorization =
      request.headers.get("authorization");

    if (contentType) {
      headers["content-type"] = contentType;
    }

    if (cookie) {
      headers.cookie = cookie;
    }

    if (authorization) {
      headers.authorization = authorization;
    }

    headers["content-length"] =
      Buffer.byteLength(body).toString();

    return await requestBackend(
      targetUrl,
      request.method,
      headers,
      body
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: `Backend unreachable at ${BACKEND_API_BASE_URL}`,
      },
      {
        status: 502,
      }
    );
  }
};
