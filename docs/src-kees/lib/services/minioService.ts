/**
 * MinIO Storage Service
 * Provides S3-compatible file management capabilities using MinIO with AWS SDK
 */

import * as eventLogService from "./eventLogService";
import { ok, err, type Result } from "$lib/types/result";
import {
  ValidationError,
  NetworkError,
  NotFoundError,
} from "$lib/types/errors";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Environment variables - handle both browser and Node.js environments
// In SvelteKit, PUBLIC_ vars are embedded at BUILD TIME for client-side code
// This means Railway must have these vars available during the build phase
const getEnvVar = (name: string, defaultValue: string = ""): string => {
  // Client-side (browser) - MUST use import.meta.env (build-time embedded)
  // This is where file uploads happen, so vars must be embedded during Railway build
  if (typeof window !== "undefined") {
    const value = import.meta.env[name];
    if (value) return value;
    // In production, if import.meta.env doesn't have it, it wasn't embedded at build time
    return defaultValue;
  }

  // Server-side - use process.env (runtime values from Railway)
  // $env/dynamic/public only works in SvelteKit load functions, not in regular server code
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[name];
    if (value) return value;
  }

  // Fallback: import.meta.env (might work in some server contexts during build)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const value = import.meta.env[name];
    if (value) return value;
  }

  return defaultValue;
};

// Lazy evaluation of environment variables
const getMinIOConfig = () => {
  const MINIO_ENDPOINT = getEnvVar("PUBLIC_MINIO_ENDPOINT");
  const MINIO_ACCESS_KEY = getEnvVar("PUBLIC_MINIO_ACCESS_KEY");
  const MINIO_SECRET_KEY = getEnvVar("PUBLIC_MINIO_SECRET_KEY");
  const MINIO_BUCKET = getEnvVar("PUBLIC_MINIO_BUCKET", "files");
  const MINIO_USE_SSL = getEnvVar("PUBLIC_MINIO_USE_SSL") === "true";

  return {
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
    MINIO_USE_SSL,
  };
};

// Debug environment variables (remove in production)
const isDev = () =>
  (typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
  (typeof process !== "undefined" && process.env.NODE_ENV === "development");

// MinIO/S3 API Types
export interface MinIOFile {
  key: string;
  name: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
  url?: string;
}

export interface MinIOFolder {
  prefix: string;
  name: string;
}

export interface MinIOUploadResponse {
  key: string;
  etag: string;
  location: string;
}

export interface MinIOListResponse {
  files: MinIOFile[];
  folders: MinIOFolder[];
  isTruncated: boolean;
  nextMarker?: string;
}

// File node interface for compatibility with existing FileManager
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  datetime?: string;
  children?: FileNode[];
}

/**
 * Get MinIO S3 client instance
 */
function getS3Client(): S3Client {
  const config = getMinIOConfig();

  // Debug configuration values
  if (isDev()) {
    console.log("🔧 MinIO S3 Client Configuration:");
    console.log("MINIO_ENDPOINT:", config.MINIO_ENDPOINT || "EMPTY");
    console.log(
      "MINIO_ACCESS_KEY:",
      config.MINIO_ACCESS_KEY ? "***SET***" : "EMPTY",
    );
    console.log(
      "MINIO_SECRET_KEY:",
      config.MINIO_SECRET_KEY ? "***SET***" : "EMPTY",
    );
    console.log("MINIO_BUCKET:", config.MINIO_BUCKET);
    console.log("MINIO_USE_SSL:", config.MINIO_USE_SSL);
  }

  // Always log config status for debugging (helps diagnose production issues)
  const missingVars: string[] = [];
  if (!config.MINIO_ENDPOINT) missingVars.push("PUBLIC_MINIO_ENDPOINT");
  if (!config.MINIO_ACCESS_KEY) missingVars.push("PUBLIC_MINIO_ACCESS_KEY");
  if (!config.MINIO_SECRET_KEY) missingVars.push("PUBLIC_MINIO_SECRET_KEY");

  if (missingVars.length > 0) {
    // Enhanced debugging info
    const isBrowser = typeof window !== "undefined";
    const envInfo = {
      context: isBrowser ? "browser" : "server",
      missing: missingVars,
      endpoint: config.MINIO_ENDPOINT || "NOT_SET",
      endpointLength: config.MINIO_ENDPOINT?.length || 0,
      hasAccessKey: !!config.MINIO_ACCESS_KEY,
      hasSecretKey: !!config.MINIO_SECRET_KEY,
      availableEnvKeys:
        isBrowser && typeof import.meta !== "undefined" && import.meta.env
          ? Object.keys(import.meta.env).filter((k) => k.includes("MINIO"))
          : typeof process !== "undefined" && process.env
            ? Object.keys(process.env).filter((k) => k.includes("MINIO"))
            : [],
    };

    console.error("❌ MinIO Configuration Error:", envInfo);

    // More helpful error message
    const errorMsg = isBrowser
      ? `MinIO not configured in client bundle. Missing: ${missingVars.join(", ")}. These PUBLIC_* variables must be available during Railway build phase. Current context: browser. Available MINIO vars: ${envInfo.availableEnvKeys.join(", ") || "none"}`
      : `MinIO not configured. Missing: ${missingVars.join(", ")}. Please set PUBLIC_MINIO_ENDPOINT, PUBLIC_MINIO_ACCESS_KEY, and PUBLIC_MINIO_SECRET_KEY environment variables.`;

    throw new Error(errorMsg);
  }

  return new S3Client({
    endpoint: `${config.MINIO_USE_SSL ? "https" : "http"}://${config.MINIO_ENDPOINT}`,
    region: "us-east-1", // MinIO requires a region, use default
    credentials: {
      accessKeyId: config.MINIO_ACCESS_KEY,
      secretAccessKey: config.MINIO_SECRET_KEY,
    },
    forcePathStyle: true, // Required for MinIO
  });
}

/**
 * Generate pre-signed URL for file access
 */
async function generatePresignedUrl(key: string): Promise<string> {
  try {
    const client = getS3Client();
    const config = getMinIOConfig();

    // Decode the key first to avoid double-encoding
    // The key may already be URL-encoded (from database URLs)
    const decodedKey = decodeURIComponent(key);

    const command = new GetObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: decodedKey,
    });

    // Generate pre-signed URL valid for 1 hour
    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch (error) {
    // Fallback to direct URL if pre-signed URL generation fails
    const config = getMinIOConfig();
    const protocol = config.MINIO_USE_SSL ? "https" : "http";
    return `${protocol}://${config.MINIO_ENDPOINT}/${config.MINIO_BUCKET}/${key}`;
  }
}

/**
 * Generate a fresh presigned URL for a file
 * Handles both file keys and existing URLs (for backward compatibility)
 * @param fileIdentifier - Either a file key (e.g., "tasks/1618/file.png") or a full URL
 * @returns Fresh presigned URL valid for 1 hour
 */
export async function getPresignedUrlForFile(
  fileIdentifier: string,
): Promise<string> {
  try {
    // Check if it's already a full URL
    if (
      fileIdentifier.startsWith("http://") ||
      fileIdentifier.startsWith("https://")
    ) {
      // Extract key from URL
      const urlObj = new URL(fileIdentifier);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);

      // Pathname format: /bucket/key or bucket/key
      // Remove bucket name (first part), keep rest as key
      if (pathParts.length >= 2) {
        const key = pathParts.slice(1).join("/");
        return await generatePresignedUrl(key);
      }

      // Fallback: try to extract from URL string
      const match = fileIdentifier.match(
        /(?:processes|cases|tasks|projects)\/\d+\/[^?]+/,
      );
      const key = match ? match[0] : pathParts.join("/") || fileIdentifier;
      return await generatePresignedUrl(key);
    } else {
      // It's already a file key
      return await generatePresignedUrl(fileIdentifier);
    }
  } catch (error) {
    // Fallback: return original identifier
    return fileIdentifier;
  }
}

/**
 * Generate permanent URL for a file key
 * Creates a direct URL that doesn't expire (unlike presigned URLs)
 * @param key - File key/path in MinIO storage
 * @returns Permanent URL string
 */
function generatePermanentUrl(key: string): string {
  const config = getMinIOConfig();
  const protocol = config.MINIO_USE_SSL ? "https" : "http";
  return `${protocol}://${config.MINIO_ENDPOINT}/${config.MINIO_BUCKET}/${key}`;
}

/**
 * Upload file to MinIO
 *
 * Client-side: Uses API route (/api/files/upload) to upload server-side
 * Server-side: Direct upload using MinIO credentials from process.env
 */
export async function uploadFile(
  file: File,
  folder?: string,
  entityId?: number,
): Promise<Result<MinIOFile, NetworkError | ValidationError>> {
  if (!file) {
    return err(ValidationError.create("File is required", "file", file));
  }

  console.log("📤 Uploading file to MinIO:", file.name);

  // Client-side: Use API route (keeps credentials server-side)
  if (typeof window !== "undefined") {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) formData.append("folder", folder);
      if (entityId) formData.append("entityId", entityId.toString());

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Upload failed" }));
        return err(
          NetworkError.from(
            new Error(
              errorData.error || `Upload failed: ${response.statusText}`,
            ),
            "upload",
          ),
        );
      }

      const data = await response.json();
      if (!data.success) {
        return err(
          NetworkError.from(new Error(data.error || "Upload failed"), "upload"),
        );
      }

      console.log("✅ File uploaded successfully to MinIO via API");
      return ok(data.file);
    } catch (error) {
      return err(
        NetworkError.from(
          error instanceof Error ? error : new Error(String(error)),
          "upload",
        ),
      );
    }
  }

  // Server-side: Direct upload using MinIO credentials
  try {
    const client = getS3Client();
    const key = folder ? `${folder}/${file.name}` : file.name;

    // Convert File to ArrayBuffer for AWS SDK
    const arrayBuffer = await file.arrayBuffer();

    const config = getMinIOConfig();
    const command = new PutObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
      ContentLength: file.size,
    });

    const response = await client.send(command);

    // Create MinIOFile object
    // Use permanent URL instead of presigned URL since URLs are stored in database
    // and presigned URLs expire after 1 hour
    const minioFile: MinIOFile = {
      key,
      name: file.name,
      size: file.size,
      lastModified: new Date(),
      etag: response.ETag || "",
      contentType: file.type,
      url: generatePermanentUrl(key),
    };

    console.log("✅ File uploaded successfully to MinIO");

    // Log MinIO file upload event only if entityId is provided and valid
    if (entityId && entityId > 0) {
      await eventLogService
        .logEvent("minio_file_uploaded", "file", entityId, {
          newValues: { key: minioFile.key, size: minioFile.size },
          metadata: { content_type: minioFile.contentType },
        })
        .catch(console.error);
    }

    return ok(minioFile);
  } catch (error) {
    return err(
      NetworkError.from(
        error instanceof Error ? error : new Error(String(error)),
        "upload",
      ),
    );
  }
}

/**
 * List files and folders in MinIO bucket
 */
export async function listFiles(
  prefix?: string,
  maxKeys: number = 1000,
): Promise<Result<MinIOListResponse, NetworkError>> {
  console.log("📋 Listing MinIO files...");

  try {
    const client = getS3Client();
    const config = getMinIOConfig();

    const command = new ListObjectsV2Command({
      Bucket: config.MINIO_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
      Delimiter: "/",
    });

    const response = await client.send(command);

    const files: MinIOFile[] = [];
    const folders: MinIOFolder[] = [];

    // Process files (Contents)
    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key && !object.Key.endsWith("/")) {
          files.push({
            key: object.Key,
            name: object.Key.split("/").pop() || object.Key,
            size: object.Size || 0,
            lastModified: object.LastModified || new Date(),
            etag: object.ETag?.replace(/"/g, "") || "",
            url: await generatePresignedUrl(object.Key),
          });
        }
      }
    }

    // Process folders (CommonPrefixes)
    if (response.CommonPrefixes) {
      for (const commonPrefix of response.CommonPrefixes) {
        if (commonPrefix.Prefix) {
          const name =
            commonPrefix.Prefix.replace(/\/$/, "").split("/").pop() ||
            commonPrefix.Prefix;
          folders.push({
            prefix: commonPrefix.Prefix,
            name,
          });
        }
      }
    }

    const listResponse: MinIOListResponse = {
      files,
      folders,
      isTruncated: response.IsTruncated || false,
      nextMarker: response.NextContinuationToken,
    };

    console.log(
      `✅ Listed ${files.length} files and ${folders.length} folders from MinIO`,
    );
    return ok(listResponse);
  } catch (error: any) {
    // Enhanced error handling for credential issues
    let errorMessage = error instanceof Error ? error.message : String(error);

    // Check for specific credential-related errors
    if (
      errorMessage.includes("Access Key Id") ||
      errorMessage.includes("does not exist")
    ) {
      errorMessage =
        "MinIO credentials are invalid or expired. Please check your access keys in the environment configuration.";
    } else if (
      errorMessage.includes("Forbidden") ||
      error.$metadata?.httpStatusCode === 403
    ) {
      errorMessage =
        "MinIO access forbidden. Please verify your credentials and bucket permissions.";
    } else if (
      errorMessage.includes("Not Found") ||
      error.$metadata?.httpStatusCode === 404
    ) {
      errorMessage = `MinIO bucket "${getMinIOConfig().MINIO_BUCKET}" does not exist. Please create the bucket or check the bucket name.`;
    }

    return err(NetworkError.from(new Error(errorMessage), "list"));
  }
}

/**
 * Delete file from MinIO
 *
 * Client-side: Uses API route (/api/files/delete) to delete server-side
 * Server-side: Direct delete using MinIO credentials from process.env
 */
export async function deleteFile(
  key: string,
  entityId?: number,
): Promise<Result<void, NetworkError>> {
  if (!key) {
    return err(NetworkError.from(new Error("File key is required"), "delete"));
  }

  console.log("🗑️ Deleting file from MinIO:", key);

  // Client-side: Use API route (keeps credentials server-side)
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/files/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, entityId }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Delete failed" }));
        return err(
          NetworkError.from(
            new Error(
              errorData.error || `Delete failed: ${response.statusText}`,
            ),
            "delete",
          ),
        );
      }

      const data = await response.json();
      if (!data.success) {
        return err(
          NetworkError.from(new Error(data.error || "Delete failed"), "delete"),
        );
      }

      console.log("✅ File deleted successfully from MinIO via API");
      return ok(undefined);
    } catch (error) {
      return err(
        NetworkError.from(
          error instanceof Error ? error : new Error(String(error)),
          "delete",
        ),
      );
    }
  }

  // Server-side: Direct delete using MinIO credentials
  try {
    const client = getS3Client();
    const config = getMinIOConfig();

    const command = new DeleteObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: key,
    });

    await client.send(command);

    console.log("✅ File deleted successfully from MinIO");

    // Log MinIO file deletion event only if entityId is provided and valid
    if (entityId && entityId > 0) {
      await eventLogService
        .logEvent("minio_file_deleted", "file", entityId, {
          oldValues: { key },
        })
        .catch(console.error);
    }

    return ok(undefined);
  } catch (error) {
    return err(
      NetworkError.from(
        error instanceof Error ? error : new Error(String(error)),
        "delete",
      ),
    );
  }
}

/**
 * Create folder in MinIO (by creating an empty object with trailing slash)
 */
export async function createFolder(
  folderName: string,
): Promise<Result<MinIOFolder, NetworkError | ValidationError>> {
  if (!folderName || !folderName.trim()) {
    return err(
      ValidationError.create(
        "Folder name is required",
        "folderName",
        folderName,
      ),
    );
  }

  console.log("📁 Creating folder in MinIO:", folderName);

  try {
    const client = getS3Client();
    const config = getMinIOConfig();
    const key = `${folderName.trim()}/`;

    const command = new PutObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: key,
      Body: new Uint8Array(0), // Empty body
      ContentType: "application/x-directory",
    });

    await client.send(command);

    const folder: MinIOFolder = {
      prefix: key,
      name: folderName.trim(),
    };

    console.log("✅ Folder created successfully in MinIO");
    return ok(folder);
  } catch (error) {
    return err(
      NetworkError.from(
        error instanceof Error ? error : new Error(String(error)),
        "createFolder",
      ),
    );
  }
}

/**
 * Get file info from MinIO
 */
export async function getFileInfo(
  key: string,
): Promise<Result<MinIOFile, NetworkError | NotFoundError>> {
  if (!key) {
    return err(
      NetworkError.from(new Error("File key is required"), "getFileInfo"),
    );
  }

  console.log("ℹ️ Getting file info from MinIO:", key);

  try {
    const client = getS3Client();
    const config = getMinIOConfig();

    const command = new HeadObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: key,
    });

    const response = await client.send(command);

    const file: MinIOFile = {
      key,
      name: key.split("/").pop() || key,
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      etag: response.ETag?.replace(/"/g, "") || "",
      contentType: response.ContentType || undefined,
      url: await generatePresignedUrl(key),
    };

    return ok(file);
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return err(NotFoundError.resource("File", key));
    }

    return err(
      NetworkError.from(
        error instanceof Error ? error : new Error(String(error)),
        "getFileInfo",
      ),
    );
  }
}

/**
 * Check if bucket exists
 */
export async function bucketExists(): Promise<Result<boolean, NetworkError>> {
  try {
    const client = getS3Client();
    const config = getMinIOConfig();

    const command = new HeadBucketCommand({
      Bucket: config.MINIO_BUCKET,
    });

    await client.send(command);
    return ok(true);
  } catch (error: any) {
    if (error.$metadata?.httpStatusCode === 404) {
      return ok(false);
    }
    return err(
      NetworkError.from(
        error instanceof Error ? error : new Error(String(error)),
        "bucketExists",
      ),
    );
  }
}

/**
 * Create bucket if it doesn't exist
 */
export async function createBucketIfNotExists(): Promise<
  Result<boolean, NetworkError>
> {
  try {
    const bucketExistsResult = await bucketExists();
    if (!bucketExistsResult.success) {
      return err(bucketExistsResult.error);
    }

    if (bucketExistsResult.value) {
      console.log("✅ Bucket already exists");
      return ok(true);
    }

    console.log("📦 Creating bucket...");
    const client = getS3Client();
    const config = getMinIOConfig();

    const command = new CreateBucketCommand({
      Bucket: config.MINIO_BUCKET,
    });

    await client.send(command);
    console.log("✅ Bucket created successfully");
    return ok(true);
  } catch (error: any) {
    return err(
      NetworkError.from(
        error instanceof Error ? error : new Error(String(error)),
        "createBucket",
      ),
    );
  }
}

/**
 * Test MinIO connection
 */
export async function testConnection(): Promise<Result<boolean, NetworkError>> {
  console.log("🔐 Testing MinIO connection...");

  try {
    const client = getS3Client();
    const config = getMinIOConfig();

    // First check if bucket exists
    const bucketExistsResult = await bucketExists();
    if (!bucketExistsResult.success) {
      return err(bucketExistsResult.error);
    }

    if (!bucketExistsResult.value) {
      return err(
        NetworkError.from(
          new Error(
            `Bucket "${config.MINIO_BUCKET}" does not exist. Please create it first.`,
          ),
          "testConnection",
        ),
      );
    }

    // Test connection by listing objects with limit 1
    const command = new ListObjectsV2Command({
      Bucket: config.MINIO_BUCKET,
      MaxKeys: 1,
    });

    await client.send(command);

    console.log("✅ MinIO connection successful");
    return ok(true);
  } catch (error: any) {
    // Enhanced error handling for connection test
    let errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("Access Key Id") ||
      errorMessage.includes("does not exist")
    ) {
      errorMessage =
        "MinIO credentials are invalid or expired. Please verify your access keys.";
    } else if (
      errorMessage.includes("Forbidden") ||
      error.$metadata?.httpStatusCode === 403
    ) {
      errorMessage =
        "MinIO access forbidden. Check credentials and bucket permissions.";
    } else if (
      errorMessage.includes("Network") ||
      errorMessage.includes("ENOTFOUND")
    ) {
      errorMessage =
        "Cannot connect to MinIO server. Check endpoint URL and network connectivity.";
    } else if (
      errorMessage.includes("Not Found") ||
      error.$metadata?.httpStatusCode === 404
    ) {
      errorMessage = `Bucket "${getMinIOConfig().MINIO_BUCKET}" does not exist. Please create the bucket first.`;
    }

    return err(NetworkError.from(new Error(errorMessage), "testConnection"));
  }
}

/**
 * Get MinIO configuration status for diagnostics
 */
export function getConfigurationStatus(): {
  configured: boolean;
  endpoint: string;
  bucket: string;
  hasCredentials: boolean;
  useSSL: boolean;
} {
  const config = getMinIOConfig();

  return {
    configured: !!(
      config.MINIO_ENDPOINT &&
      config.MINIO_ACCESS_KEY &&
      config.MINIO_SECRET_KEY
    ),
    endpoint: config.MINIO_ENDPOINT || "NOT_SET",
    bucket: config.MINIO_BUCKET,
    hasCredentials: !!(config.MINIO_ACCESS_KEY && config.MINIO_SECRET_KEY),
    useSSL: config.MINIO_USE_SSL,
  };
}

/**
 * Convert MinIO files to FileNode format for compatibility
 */
export function convertToFileNodes(
  files: MinIOFile[],
  folders: MinIOFolder[],
): FileNode[] {
  const nodes: FileNode[] = [];

  // Add folders
  folders.forEach((folder) => {
    nodes.push({
      name: folder.name,
      path: folder.prefix,
      type: "directory",
    });
  });

  // Add files
  files.forEach((file) => {
    nodes.push({
      name: file.name,
      path: file.key,
      type: "file",
      size: file.size,
      datetime: file.lastModified.toISOString(),
    });
  });

  return nodes;
}
