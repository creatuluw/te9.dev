/**
 * File Proxy API Route
 *
 * Proxies file requests to MinIO without using presigned URLs.
 * This ensures files can always be opened regardless of when they were uploaded.
 *
 * Usage: /api/files/proxy?key=tasks/1618/filename.png
 */

import type { RequestHandler } from "./$types";
import { error } from "@sveltejs/kit";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { ReadableStream } from "node:stream/web";

// Environment variables - must be available at runtime
const MINIO_ENDPOINT = process.env.PUBLIC_MINIO_ENDPOINT;
const MINIO_ACCESS_KEY = process.env.PUBLIC_MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.PUBLIC_MINIO_SECRET_KEY;
const MINIO_BUCKET = process.env.PUBLIC_MINIO_BUCKET || "files";
const MINIO_USE_SSL = process.env.PUBLIC_MINIO_USE_SSL === "true";

/**
 * Normalize endpoint URL to handle both with and without protocol
 */
function normalizeEndpoint(endpoint: string, useSSL: boolean): string {
  const hasProtocol =
    endpoint.startsWith("http://") || endpoint.startsWith("https://");

  if (hasProtocol) {
    return endpoint;
  }

  const protocol = useSSL ? "https" : "http";
  return `${protocol}://${endpoint}`;
}

/**
 * Get MinIO S3 client instance
 */
function getS3Client(): S3Client | null {
  if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
    return null;
  }

  return new S3Client({
    endpoint: normalizeEndpoint(MINIO_ENDPOINT, MINIO_USE_SSL),
    region: "us-east-1",
    credentials: {
      accessKeyId: MINIO_ACCESS_KEY,
      secretAccessKey: MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  });
}

export const GET: RequestHandler = async ({ url }) => {
  const key = url.searchParams.get("key");

  if (!key) {
    return error(400, "File key is required");
  }

  const client = getS3Client();

  if (!client) {
    return error(500, "MinIO not configured");
  }

  try {
    console.log(`[File Proxy] Serving file: ${key}`);

    const command = new GetObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      return error(404, "File not found");
    }

    // Get file extension for content type
    const extension = key.split(".").pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      txt: "text/plain",
      md: "text/markdown",
      markdown: "text/markdown",
      json: "application/json",
      zip: "application/zip",
      rar: "application/vnd.rar",
      mp3: "audio/mpeg",
      wav: "audio/wav",
    };

    const contentType =
      (extension && contentTypeMap[extension]) || "application/octet-stream";

    // Convert stream to readable stream for SvelteKit
    const inputStream = response.Body.transformToByteArray();

    // Set appropriate headers
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
      "Cache-Control": "public, max-age=31536000", // 1 year cache
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    });

    // Return stream with headers
    return new Response(inputStream as any, {
      headers,
      status: 200,
    });
  } catch (err: any) {
    console.error("[File Proxy] Error serving file:", err);

    // Handle NoSuchKey error specifically
    if (
      err.name === "NoSuchKey" ||
      err.name === "NotFound" ||
      err.$metadata?.httpStatusCode === 404
    ) {
      return error(404, "File not found");
    }

    return error(
      500,
      `Failed to serve file: ${err.message || "Unknown error"}`,
    );
  }
};

// Handle OPTIONS for CORS preflight
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
};
