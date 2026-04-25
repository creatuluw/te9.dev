/**
 * Standardized error types for the application
 * Provides consistent error handling across all layers
 */

/**
 * Error codes for categorizing different types of errors
 */
export enum ErrorCode {
  // Validation errors (400-level)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",

  // Authentication & Authorization errors (401, 403)
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  SESSION_EXPIRED = "SESSION_EXPIRED",

  // Not Found errors (404)
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  CONNECTION_TIMEOUT = "CONNECTION_TIMEOUT",
  REQUEST_FAILED = "REQUEST_FAILED",

  // Server errors (500-level)
  SERVER_ERROR = "SERVER_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Business logic errors
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  OPERATION_FAILED = "OPERATION_FAILED",
  CONFLICT = "CONFLICT",
  VERSION_CONFLICT = "VERSION_CONFLICT",

  // Unknown errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly originalError?: Error;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    details?: Record<string, unknown>,
    originalError?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.originalError = originalError;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Create an AppError from an unknown error
   */
  static from(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(
        error.message,
        ErrorCode.UNKNOWN_ERROR,
        undefined,
        error,
      );
    }

    return new AppError(String(error), ErrorCode.UNKNOWN_ERROR, {
      originalError: error,
    });
  }

  /**
   * Convert error to a plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}

/**
 * Validation error - used when input validation fails
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    value?: unknown,
    details?: Record<string, unknown>,
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, {
      field,
      value,
      ...details,
    });
  }

  /**
   * Create a ValidationError with a standardized message
   */
  static create(
    message: string,
    field?: string,
    value?: unknown,
  ): ValidationError {
    return new ValidationError(message, field, value);
  }

  /**
   * Create a ValidationError for missing required field
   */
  static missingField(field: string): ValidationError {
    return new ValidationError(
      `Missing required field: ${field}`,
      field,
      undefined,
      { code: ErrorCode.MISSING_REQUIRED_FIELD },
    );
  }

  /**
   * Create a ValidationError for invalid format
   */
  static invalidFormat(
    field: string,
    format: string,
    value?: unknown,
  ): ValidationError {
    return new ValidationError(
      `Invalid format for ${field}. Expected: ${format}`,
      field,
      value,
      { code: ErrorCode.INVALID_FORMAT, expectedFormat: format },
    );
  }
}

/**
 * Network error - used for network-related failures
 */
export class NetworkError extends AppError {
  readonly statusCode?: number;
  readonly url?: string;

  constructor(
    message: string,
    statusCode?: number,
    url?: string,
    originalError?: Error,
  ) {
    super(
      message,
      statusCode && statusCode >= 500
        ? ErrorCode.SERVER_ERROR
        : ErrorCode.NETWORK_ERROR,
      { statusCode, url },
      originalError,
    );
    this.statusCode = statusCode;
    this.url = url;
  }

  /**
   * Create a NetworkError from a fetch response
   */
  static async fromResponse(response: Response): Promise<NetworkError> {
    const url = response.url;
    const statusCode = response.status;
    let message = `Network request failed with status ${statusCode}`;
    let details: Record<string, unknown> = {};

    try {
      // Clone the response to avoid "body stream already read" errors
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      const data = text ? JSON.parse(text) : {};
      message = data.message || data.error || data.hint || message;
      details = data.details || data;
    } catch {
      // Ignore parsing errors or empty bodies
    }

    const error = new NetworkError(message, statusCode, url);
    if (Object.keys(details).length > 0) {
      (error as any).details = details;
    }
    return error;
  }

  /**
   * Create a NetworkError from an Error or unknown
   */
  static from(error: unknown, url?: string): NetworkError {
    if (error instanceof NetworkError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for timeout errors
      if (error.message.includes("timeout") || error.name === "TimeoutError") {
        return new NetworkError("Request timeout", undefined, url, error);
      }

      return new NetworkError(error.message, undefined, url, error);
    }

    return new NetworkError(String(error), undefined, url);
  }
}

/**
 * Not Found error - used when a resource is not found
 */
export class NotFoundError extends AppError {
  readonly resourceType?: string;
  readonly resourceId?: string | number;

  constructor(
    message: string,
    resourceType?: string,
    resourceId?: string | number,
  ) {
    super(message, ErrorCode.NOT_FOUND, { resourceType, resourceId });
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }

  /**
   * Create a NotFoundError for a specific resource
   */
  static resource(
    resourceType: string,
    resourceId: string | number,
  ): NotFoundError {
    return new NotFoundError(
      `${resourceType} with ID ${resourceId} not found`,
      resourceType,
      resourceId,
    );
  }

  /**
   * Create a NotFoundError with a custom message
   */
  static create(message: string): NotFoundError {
    return new NotFoundError(message);
  }
}

/**
 * Unauthorized error - used when authentication fails
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, ErrorCode.UNAUTHORIZED);
  }

  static create(message?: string): UnauthorizedError {
    return new UnauthorizedError(message);
  }
}

/**
 * Forbidden error - used when authorization fails
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, ErrorCode.FORBIDDEN);
  }

  static create(message?: string): ForbiddenError {
    return new ForbiddenError(message);
  }
}

/**
 * Error transformation utilities
 */

/**
 * Get user-friendly error message (Dutch translation)
 * Accepts AppError or plain error objects
 */
export function getUserMessage(
  error: AppError | { message?: string; error?: string } | string,
): string {
  try {
    // Handle string errors
    if (typeof error === "string") {
      return error;
    }

    // Handle null/undefined
    if (!error || typeof error !== "object") {
      return "Onbekende fout";
    }

    // Handle plain objects with error property (API responses)
    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }

    // Extract message from error object safely
    let message: string = "Onbekende fout";
    try {
      const errorObj = error as any;
      message = errorObj?.message || errorObj?.error || "Onbekende fout";

      // Ensure message is a string and not an object
      if (typeof message !== "string") {
        message = String(message);
      }
    } catch {
      // If extraction fails, use default
      message = "Onbekende fout";
    }

    // Check if message is already user-friendly (in Dutch or contains common Dutch words)
    const dutchKeywords = [
      "Ongeldig",
      "vereist",
      "verzoeken",
      "uur",
      "opnieuw",
      "gebruikt",
      "verlopen",
      "geconfigureerd",
      "beheerder",
      "niet gevonden",
      "geweigerd",
      "mislukt",
      "fout",
      "bestaat",
      "al",
      "nog",
      "kan",
      "moet",
      "zijn",
      "worden",
    ];

    const isUserFriendly =
      (message &&
        dutchKeywords.some((keyword) =>
          message.toLowerCase().includes(keyword.toLowerCase()),
        )) ||
      (message && message.match(/^[A-Za-z\s.,!?]+$/) !== null); // Only letters, spaces, and basic punctuation

    // If message is already user-friendly, return it directly
    if (isUserFriendly && message.length > 0) {
      return message;
    }

    // If it's not an AppError (no code property or code is not a string ErrorCode), return the message directly
    if (!("code" in error)) {
      return message;
    }

    const errorCode = (error as any).code;

    // Verify the code is a string and a valid ErrorCode enum value
    if (
      typeof errorCode !== "string" ||
      !Object.values(ErrorCode).includes(errorCode as ErrorCode)
    ) {
      return message;
    }

    const translations: Record<ErrorCode, string> = {
      [ErrorCode.VALIDATION_ERROR]: message || "Validatiefout",
      [ErrorCode.INVALID_INPUT]: "Ongeldige invoer",
      [ErrorCode.MISSING_REQUIRED_FIELD]: "Verplicht veld ontbreekt",
      [ErrorCode.INVALID_FORMAT]: "Ongeldig formaat",
      [ErrorCode.UNAUTHORIZED]: "Authenticatie vereist",
      [ErrorCode.FORBIDDEN]: "Toegang geweigerd",
      [ErrorCode.SESSION_EXPIRED]: "Sessie verlopen",
      [ErrorCode.NOT_FOUND]: "Niet gevonden",
      [ErrorCode.RESOURCE_NOT_FOUND]: "Bron niet gevonden",
      [ErrorCode.NETWORK_ERROR]: message || "Netwerkfout",
      [ErrorCode.CONNECTION_TIMEOUT]: "Verbinding timeout",
      [ErrorCode.REQUEST_FAILED]: "Verzoek mislukt",
      [ErrorCode.SERVER_ERROR]: "Serverfout",
      [ErrorCode.INTERNAL_ERROR]: "Interne fout",
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: "Externe service fout",
      [ErrorCode.BUSINESS_RULE_VIOLATION]: "Bedrijfsregel overtreding",
      [ErrorCode.OPERATION_FAILED]: "Operatie mislukt",
      [ErrorCode.CONFLICT]: "Conflict",
      [ErrorCode.VERSION_CONFLICT]:
        "Gegevens zijn gewijzigd door een andere gebruiker",
      [ErrorCode.UNKNOWN_ERROR]: "Onbekende fout",
    };

    // Return translated message if available, otherwise return original message
    return translations[errorCode as ErrorCode] || message;
  } catch (e) {
    // If anything goes wrong, return a safe default message
    console.error("Error in getUserMessage:", e);
    return "Er is een fout opgetreden";
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  return (
    error.code === ErrorCode.NETWORK_ERROR ||
    error.code === ErrorCode.CONNECTION_TIMEOUT ||
    error.code === ErrorCode.REQUEST_FAILED ||
    (error instanceof NetworkError &&
      error.statusCode != null &&
      error.statusCode >= 500)
  );
}

/**
 * Get error severity level
 */
export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export function getErrorSeverity(error: AppError): ErrorSeverity {
  if (
    error.code === ErrorCode.SERVER_ERROR ||
    error.code === ErrorCode.INTERNAL_ERROR ||
    error.code === ErrorCode.EXTERNAL_SERVICE_ERROR
  ) {
    return "critical";
  }

  if (
    error.code === ErrorCode.NETWORK_ERROR ||
    error.code === ErrorCode.UNAUTHORIZED ||
    error.code === ErrorCode.FORBIDDEN
  ) {
    return "high";
  }

  if (
    error.code === ErrorCode.VALIDATION_ERROR ||
    error.code === ErrorCode.NOT_FOUND ||
    error.code === ErrorCode.BUSINESS_RULE_VIOLATION
  ) {
    return "medium";
  }

  return "low";
}
