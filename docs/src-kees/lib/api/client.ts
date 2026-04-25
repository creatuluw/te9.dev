/**
 * Typed API client wrapper with interceptors, retry logic, and error handling
 */

import type { AppError, NetworkError } from "$lib/types/errors";
import { err, ok, type Result } from "$lib/types/result";
import {
  NetworkError as NetworkErrorClass,
  AppError as AppErrorClass,
} from "$lib/types/errors";
import { isApiLoggingEnabled } from "$lib/config/apiLogging";

/**
 * Conditional headers for HTTP conditional requests
 */
export interface ConditionalHeaders {
  /**
   * If-None-Match header value (ETag)
   */
  ifNoneMatch?: string;

  /**
   * If-Modified-Since header value (Last-Modified date)
   */
  ifModifiedSince?: string;
}

/**
 * Request configuration
 */
export interface RequestConfig extends RequestInit {
  /**
   * Base URL for the request
   */
  baseURL?: string;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Number of retry attempts
   */
  retries?: number;

  /**
   * Retry delay in milliseconds (exponential backoff)
   */
  retryDelay?: number;

  /**
   * Custom headers
   */
  headers?: HeadersInit;

  /**
   * Whether to include credentials
   */
  credentials?: RequestCredentials;

  /**
   * Conditional headers for HTTP conditional requests (ETag/Last-Modified)
   */
  conditionalHeaders?: ConditionalHeaders;
}

/**
 * Request interceptor function
 */
export type RequestInterceptor = (
  config: RequestConfig,
) => RequestConfig | Promise<RequestConfig>;

/**
 * Response interceptor function
 */
export type ResponseInterceptor = (
  response: Response,
) => Response | Promise<Response>;

/**
 * Error interceptor function
 */
export type ErrorInterceptor = (
  error: AppError,
) => AppError | Promise<AppError>;

/**
 * API Client class
 */
export class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private defaultRetryDelay: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(
    config: {
      baseURL?: string;
      defaultTimeout?: number;
      defaultRetries?: number;
      defaultRetryDelay?: number;
    } = {},
  ) {
    this.baseURL = config.baseURL || "";
    this.defaultTimeout = config.defaultTimeout ?? 30000; // 30 seconds
    this.defaultRetries = config.defaultRetries ?? 3;
    this.defaultRetryDelay = config.defaultRetryDelay ?? 1000; // 1 second
  }

  /**
   * Add a request interceptor
   */
  useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add an error interceptor
   */
  useErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    return baseDelay * Math.pow(2, attempt);
  }

  /**
   * Execute request with retry logic
   */
  private async executeRequest(
    url: string,
    config: RequestConfig,
    attempt: number = 0,
  ): Promise<Result<Response, AppError>> {
    let requestConfig: RequestConfig = { ...config };

    // Apply request interceptors (before URL construction)
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig);
    }

    // Build full URL
    const fullURL =
      requestConfig.baseURL || this.baseURL
        ? `${requestConfig.baseURL || this.baseURL}${url}`
        : url;

    // Log the full URL if API logging is enabled
    if (isApiLoggingEnabled()) {
      console.log("[API Request]", {
        method: requestConfig.method || "GET",
        url: fullURL,
        body: requestConfig.body,
        headers: requestConfig.headers,
      });
    }

    // Merge headers
    const headers = new Headers(requestConfig.headers);
    if (requestConfig.headers instanceof Headers) {
      requestConfig.headers.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    // Create fetch options
    const fetchOptions: RequestInit = {
      ...requestConfig,
      headers,
      credentials: requestConfig.credentials || "same-origin",
    };

    const timeout = requestConfig.timeout ?? this.defaultTimeout;

    try {
      // Create timeout race
      const fetchPromise = fetch(fullURL, fetchOptions);
      const timeoutPromise = this.createTimeoutPromise(timeout);

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      // Apply response interceptors
      let processedResponse = response;
      for (const interceptor of this.responseInterceptors) {
        processedResponse = await interceptor(processedResponse);
      }

      // Check if response is ok
      if (!processedResponse.ok) {
        const error = await NetworkErrorClass.fromResponse(processedResponse);

        // Apply error interceptors
        let processedError = error;
        for (const interceptor of this.errorInterceptors) {
          processedError = await interceptor(processedError);
        }

        // Retry logic for retryable errors
        const retries = requestConfig.retries ?? this.defaultRetries;
        if (attempt < retries && this.isRetryableError(error)) {
          const delay = this.calculateRetryDelay(
            attempt,
            requestConfig.retryDelay ?? this.defaultRetryDelay,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.executeRequest(url, config, attempt + 1);
        }

        return err(processedError);
      }

      return ok(processedResponse);
    } catch (error) {
      const networkError = NetworkErrorClass.from(error, fullURL);

      // Apply error interceptors
      let processedError = networkError;
      for (const interceptor of this.errorInterceptors) {
        processedError = await interceptor(processedError);
      }

      // Retry logic for network errors
      const retries = requestConfig.retries ?? this.defaultRetries;
      if (attempt < retries && this.isRetryableError(networkError)) {
        const delay = this.calculateRetryDelay(
          attempt,
          requestConfig.retryDelay ?? this.defaultRetryDelay,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeRequest(url, config, attempt + 1);
      }

      return err(processedError);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: AppError): boolean {
    if (error instanceof NetworkErrorClass) {
      const statusCode = error.statusCode;
      // Retry on network errors, timeouts, and 5xx server errors
      return (
        !statusCode ||
        statusCode >= 500 ||
        statusCode === 408 || // Request Timeout
        statusCode === 429 // Too Many Requests
      );
    }
    return false;
  }

  /**
   * GET request with support for conditional headers and 304 Not Modified responses
   *
   * @param url - Request URL
   * @param config - Request configuration including optional conditionalHeaders
   * @returns Result containing data, status, and headers. For 304 responses, data will be null.
   */
  async get<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<
    Result<{ data: T | null; status: number; headers: Headers }, AppError>
  > {
    // Build headers with conditional headers if provided
    const headers = new Headers(config?.headers);

    if (config?.conditionalHeaders) {
      if (config.conditionalHeaders.ifNoneMatch) {
        headers.set("If-None-Match", config.conditionalHeaders.ifNoneMatch);
      }
      if (config.conditionalHeaders.ifModifiedSince) {
        headers.set(
          "If-Modified-Since",
          config.conditionalHeaders.ifModifiedSince,
        );
      }
    }

    const responseResult = await this.executeRequest(url, {
      ...config,
      method: "GET",
      headers,
    });

    if (!responseResult.success) {
      return err(responseResult.error);
    }

    const response = responseResult.value;

    // Handle 304 Not Modified - return null data with status and headers
    if (response.status === 304) {
      return ok({
        data: null as T | null,
        status: 304,
        headers: response.headers,
      });
    }

    try {
      const data = await response.json();
      return ok({
        data: data as T,
        status: response.status,
        headers: response.headers,
      });
    } catch (error) {
      return err(AppErrorClass.from(error));
    }
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<Result<T, AppError>> {
    const responseResult = await this.executeRequest(url, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...(config?.headers || {}),
      },
    });

    if (!responseResult.success) {
      return err(responseResult.error);
    }

    try {
      const responseData = await responseResult.value.json();
      return ok(responseData as T);
    } catch (error) {
      return err(AppErrorClass.from(error));
    }
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<Result<T, AppError>> {
    const responseResult = await this.executeRequest(url, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...(config?.headers || {}),
      },
    });

    if (!responseResult.success) {
      return err(responseResult.error);
    }

    try {
      const responseData = await responseResult.value.json();
      return ok(responseData as T);
    } catch (error) {
      return err(AppErrorClass.from(error));
    }
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<Result<T, AppError>> {
    const responseResult = await this.executeRequest(url, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...(config?.headers || {}),
      },
    });

    if (!responseResult.success) {
      return err(responseResult.error);
    }

    try {
      const responseData = await responseResult.value.json();
      return ok(responseData as T);
    } catch (error) {
      return err(AppErrorClass.from(error));
    }
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<Result<T, AppError>> {
    const responseResult = await this.executeRequest(url, {
      ...config,
      method: "DELETE",
    });

    if (!responseResult.success) {
      return err(responseResult.error);
    }

    try {
      // DELETE might not return body (204 No Content)
      if (responseResult.value.status === 204) {
        return ok(undefined as T);
      }
      const responseData = await responseResult.value.json();
      return ok(responseData as T);
    } catch (error) {
      // If JSON parsing fails but status is 2xx, consider it success
      if (responseResult.value.ok) {
        return ok(undefined as T);
      }
      return err(AppErrorClass.from(error));
    }
  }

  /**
   * Request with custom method
   */
  async request<T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<Result<T, AppError>> {
    const responseResult = await this.executeRequest(url, config ?? {});

    if (!responseResult.success) {
      return err(responseResult.error);
    }

    try {
      const responseData = await responseResult.value.json();
      return ok(responseData as T);
    } catch (error) {
      return err(AppErrorClass.from(error));
    }
  }
}

/**
 * Create a new API client instance
 */
export function createApiClient(config?: {
  baseURL?: string;
  defaultTimeout?: number;
  defaultRetries?: number;
  defaultRetryDelay?: number;
}): ApiClient {
  return new ApiClient(config);
}

/**
 * Default API client instance
 */
export const apiClient = createApiClient();
