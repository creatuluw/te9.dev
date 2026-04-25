/**
 * Formbricks service - Integration with Formbricks Management API
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 *
 * API Documentation: https://formbricks.com/docs/api-reference/rest-api
 */
import type { AppError } from "$lib/types/errors";
import {
  ValidationError,
  NetworkError,
  NotFoundError,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import { createApiClient } from "$lib/api/client";
import {
  ActionClassSchema,
  type ActionClass,
  CreateActionClassInputSchema,
  type CreateActionClassInput,
  AttributeClassSchema,
  type AttributeClass,
  CreateAttributeClassInputSchema,
  type CreateAttributeClassInput,
  MeSchema,
  type Me,
  PersonSchema,
  type Person,
  ResponseSchema,
  type Response,
  UpdateResponseInputSchema,
  type UpdateResponseInput,
  SurveySchema,
  type Survey,
  CreateSurveyInputSchema,
  type CreateSurveyInput,
  UpdateSurveyInputSchema,
  type UpdateSurveyInput,
  WebhookSchema,
  type Webhook,
  CreateWebhookInputSchema,
  type CreateWebhookInput,
  SendSurveyLinksInputSchema,
  type SendSurveyLinksInput,
} from "$lib/schemas/formbricks";
import * as employeeService from "./employeeService";
import * as messageService from "./messageService";

/**
 * Get Formbricks API base URL from environment
 *
 * On client-side, use the proxy to avoid CORS issues.
 * On server-side, use direct API access.
 *
 * Note: Formbricks Management API uses /api/v1/management/ prefix
 */
function getFormbricksBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: use local proxy to avoid CORS
    return "/api/formbricks/management";
  }
  // Server-side: use direct API access
  const directUrl =
    process.env.FORMBRICKS_URL ||
    import.meta.env.FORMBRICKS_URL ||
    "https://formbricks-production-f895.up.railway.app";
  return `${directUrl}/api/v1/management`;
}

/**
 * Get Formbricks API key from environment (server-side only)
 */
function getFormbricksApiKey(): string {
  if (typeof window !== "undefined") {
    // Client-side: no API key needed (proxy handles it)
    return "";
  }
  // Server-side: use private env var
  return (
    process.env.FORMBRICKS_API_KEY || import.meta.env.FORMBRICKS_API_KEY || ""
  );
}

/**
 * Create Formbricks API client with authentication
 */
function createFormbricksClient() {
  const baseURL = getFormbricksBaseUrl();
  const apiKey = getFormbricksApiKey();

  const client = createApiClient({
    baseURL,
    defaultTimeout: 30000,
    defaultRetries: 3,
    defaultRetryDelay: 1000,
  });

  // Add API key to all requests (server-side only)
  if (apiKey) {
    client.useRequestInterceptor((config) => {
      const headers = new Headers(config.headers);
      headers.set("x-api-key", apiKey);
      return {
        ...config,
        headers,
      };
    });
  }

  return client;
}

// Create singleton client instance
const formbricksClient = createFormbricksClient();

// ============================================================================
// Action Class API
// ============================================================================

/**
 * Get all action classes
 *
 * @returns Result containing array of action classes, or error if fetch fails
 */
export async function getAllActionClasses(): Promise<
  Result<ActionClass[], AppError>
> {
  try {
    const result = await formbricksClient.get<ActionClass[]>("/action-classes");

    if (!result.success) {
      return err(result.error);
    }

    const { data } = result.value;
    if (!data) {
      return ok([]);
    }

    // Validate each action class
    const validated: ActionClass[] = [];
    for (const item of Array.isArray(data) ? data : [data]) {
      const validation = ActionClassSchema.safeParse(item);
      if (validation.success) {
        validated.push(validation.data);
      } else if (import.meta.env.DEV) {
        console.warn(
          "[formbricksService] Action class validation failed:",
          validation.error,
        );
      }
    }

    return ok(validated);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Create an action class
 *
 * @param data - Action class input data
 * @returns Result containing created action class, or error if creation fails
 */
export async function createActionClass(
  data: CreateActionClassInput,
): Promise<Result<ActionClass, AppError>> {
  // Validate input
  const validation = validateSchema(CreateActionClassInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  try {
    const result = await formbricksClient.post<ActionClass>(
      "/action-classes",
      validation.value,
    );

    if (!result.success) {
      return err(result.error);
    }

    const validated = ActionClassSchema.safeParse(result.value);
    if (!validated.success) {
      return err(
        ValidationError.create(
          "Invalid action class response",
          "response",
          result.value,
        ),
      );
    }

    return ok(validated.data);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Delete an action class
 *
 * @param id - Action class ID
 * @returns Result containing success status, or error if deletion fails
 */
export async function deleteActionClass(
  id: string,
): Promise<Result<void, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(ValidationError.create("Action class ID is required", "id", id));
  }

  try {
    const result = await formbricksClient.delete(`/action-classes/${id}`);

    if (!result.success) {
      return err(result.error);
    }

    return ok(undefined);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

// ============================================================================
// Attribute Class API
// ============================================================================

/**
 * Get all attribute classes
 *
 * @returns Result containing array of attribute classes, or error if fetch fails
 */
export async function getAllAttributeClasses(): Promise<
  Result<AttributeClass[], AppError>
> {
  try {
    const result =
      await formbricksClient.get<AttributeClass[]>("/attribute-classes");

    if (!result.success) {
      return err(result.error);
    }

    const { data } = result.value;
    if (!data) {
      return ok([]);
    }

    // Validate each attribute class
    const validated: AttributeClass[] = [];
    for (const item of Array.isArray(data) ? data : [data]) {
      const validation = AttributeClassSchema.safeParse(item);
      if (validation.success) {
        validated.push(validation.data);
      } else if (import.meta.env.DEV) {
        console.warn(
          "[formbricksService] Attribute class validation failed:",
          validation.error,
        );
      }
    }

    return ok(validated);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Create an attribute class
 *
 * @param data - Attribute class input data
 * @returns Result containing created attribute class, or error if creation fails
 */
export async function createAttributeClass(
  data: CreateAttributeClassInput,
): Promise<Result<AttributeClass, AppError>> {
  // Validate input
  const validation = validateSchema(CreateAttributeClassInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  try {
    const result = await formbricksClient.post<AttributeClass>(
      "/attribute-classes",
      validation.value,
    );

    if (!result.success) {
      return err(result.error);
    }

    const validated = AttributeClassSchema.safeParse(result.value);
    if (!validated.success) {
      return err(
        ValidationError.create(
          "Invalid attribute class response",
          "response",
          result.value,
        ),
      );
    }

    return ok(validated.data);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Delete an attribute class
 *
 * @param id - Attribute class ID
 * @returns Result containing success status, or error if deletion fails
 */
export async function deleteAttributeClass(
  id: string,
): Promise<Result<void, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(
      ValidationError.create("Attribute class ID is required", "id", id),
    );
  }

  try {
    const result = await formbricksClient.delete(`/attribute-classes/${id}`);

    if (!result.success) {
      return err(result.error);
    }

    return ok(undefined);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

// ============================================================================
// Me API
// ============================================================================

/**
 * Get account information
 *
 * @returns Result containing account information, or error if fetch fails
 */
export async function getMe(): Promise<Result<Me, AppError>> {
  try {
    const result = await formbricksClient.get<Me>("/me");

    if (!result.success) {
      return err(result.error);
    }

    const { data } = result.value;
    if (!data) {
      return err(NotFoundError.create("Account information not found"));
    }

    const validated = MeSchema.safeParse(data);
    if (!validated.success) {
      return err(
        ValidationError.create(
          "Invalid account information response",
          "response",
          data,
        ),
      );
    }

    return ok(validated.data);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

// ============================================================================
// People API
// ============================================================================

/**
 * Get all people
 *
 * @returns Result containing array of people, or error if fetch fails
 */
export async function getAllPeople(): Promise<Result<Person[], AppError>> {
  try {
    const result = await formbricksClient.get<Person[]>("/people");

    if (!result.success) {
      return err(result.error);
    }

    const { data } = result.value;
    if (!data) {
      return ok([]);
    }

    // Validate each person
    const validated: Person[] = [];
    for (const item of Array.isArray(data) ? data : [data]) {
      const validation = PersonSchema.safeParse(item);
      if (validation.success) {
        validated.push(validation.data);
      } else if (import.meta.env.DEV) {
        console.warn(
          "[formbricksService] Person validation failed:",
          validation.error,
        );
      }
    }

    return ok(validated);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Delete a person
 *
 * @param id - Person ID
 * @returns Result containing success status, or error if deletion fails
 */
export async function deletePerson(
  id: string,
): Promise<Result<void, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(ValidationError.create("Person ID is required", "id", id));
  }

  try {
    const result = await formbricksClient.delete(`/people/${id}`);

    if (!result.success) {
      return err(result.error);
    }

    return ok(undefined);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

// ============================================================================
// Response API
// ============================================================================

/**
 * Get all survey responses
 *
 * @returns Result containing array of responses, or error if fetch fails
 */
export async function getAllResponses(): Promise<Result<Response[], AppError>> {
  try {
    const result = await formbricksClient.get<Response[]>("/responses");

    if (!result.success) {
      return err(result.error);
    }

    const { data } = result.value;
    if (!data) {
      return ok([]);
    }

    // Validate each response
    const validated: Response[] = [];
    for (const item of Array.isArray(data) ? data : [data]) {
      const validation = ResponseSchema.safeParse(item);
      if (validation.success) {
        validated.push(validation.data);
      } else if (import.meta.env.DEV) {
        console.warn(
          "[formbricksService] Response validation failed:",
          validation.error,
        );
      }
    }

    return ok(validated);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Get responses by survey ID
 *
 * @param surveyId - Survey ID
 * @param limit - Number of items to return (optional, default: 1000 for all)
 * @param skip - Number of items to skip (optional)
 * @returns Result containing array of responses sorted by date descending, or error if fetch fails
 */
export async function getResponsesBySurvey(
  surveyId: string,
  limit?: number,
  skip?: number,
): Promise<Result<Response[], AppError>> {
  if (!surveyId || surveyId.trim().length === 0) {
    return err(
      ValidationError.create("Survey ID is required", "surveyId", surveyId),
    );
  }

  try {
    // Build query params - use high limit to get all responses by default
    const queryParams = new URLSearchParams();
    queryParams.set("surveyId", surveyId);
    // Default to 1000 if no limit specified to get all responses
    if (limit !== undefined && limit > 0) {
      queryParams.set("limit", limit.toString());
    } else {
      queryParams.set("limit", "1000");
    }
    if (skip !== undefined && skip >= 0) {
      queryParams.set("skip", skip.toString());
    }

    if (import.meta.env.DEV) {
      console.log(
        "[formbricksService] Fetching responses with query:",
        queryParams.toString(),
      );
    }

    const result = await formbricksClient.get<unknown>(
      `/responses?${queryParams.toString()}`,
    );

    if (!result.success) {
      if (import.meta.env.DEV) {
        console.error("[formbricksService] API request failed:", result.error);
      }
      return err(result.error);
    }

    const response = result.value;

    if (import.meta.env.DEV) {
      console.log("[formbricksService] Raw API response:", response);
      console.log("[formbricksService] Response type:", typeof response);
      console.log(
        "[formbricksService] Response keys:",
        response && typeof response === "object"
          ? Object.keys(response)
          : "N/A",
      );
    }

    // Handle null/undefined response
    if (!response) {
      if (import.meta.env.DEV) {
        console.log(
          "[formbricksService] Empty response, returning empty array",
        );
      }
      return ok([]);
    }

    // Try to extract the array from various possible response structures
    let responses: unknown[] = [];

    if (Array.isArray(response)) {
      // Direct array response
      responses = response;
    } else if (typeof response === "object" && response !== null) {
      // Check for { data: [...] } structure
      const data = (response as Record<string, unknown>).data;
      if (Array.isArray(data)) {
        responses = data;
      } else if (data && typeof data === "object" && "data" in data) {
        // Nested { data: { data: [...] } } structure
        const nestedData = (data as Record<string, unknown>).data;
        if (Array.isArray(nestedData)) {
          responses = nestedData;
        }
      }
    }

    if (!Array.isArray(responses)) {
      if (import.meta.env.DEV) {
        console.error(
          "[formbricksService] Could not extract array from response:",
          response,
        );
      }
      return ok([]);
    }

    if (import.meta.env.DEV) {
      console.log(
        `[formbricksService] Found ${responses.length} responses to validate`,
      );
    }

    // Skip Zod validation due to schema initialization issues
    // Cast responses directly to Response type
    const validated: Response[] = responses.map((item) => item as Response);

    // Process file URLs in response data to use our proxy endpoint
    // This ensures all users can access files regardless of the URL format returned by Formbricks
    const processedResponses = await Promise.all(
      validated.map(async (resp) => {
        if (resp.data && typeof resp.data === "object") {
          const refreshedData = await refreshFileUrls(
            resp.data as Record<string, unknown>,
          );
          return { ...resp, data: refreshedData };
        }
        return resp;
      }),
    );

    if (import.meta.env.DEV) {
      console.log(
        `[formbricksService] Loaded ${processedResponses.length} responses for survey ${surveyId}`,
      );
    }

    // Sort by createdAt descending (newest first)
    const sorted = processedResponses.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return ok(sorted);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        "[formbricksService] Exception in getResponsesBySurvey:",
        error,
      );
    }

    // Safely create error without assuming error structure
    if (error instanceof Error) {
      return err(NetworkError.from(error));
    }

    return err(NetworkError.from(new Error(String(error))));
  }
}

/**
 * Get response by ID
 *
 * @param id - Response ID
 * @returns Result containing response, or error if not found
 */
export async function getResponseById(
  id: string,
): Promise<Result<Response, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(ValidationError.create("Response ID is required", "id", id));
  }

  try {
    if (import.meta.env.DEV) {
      console.log("[formbricksService] Getting response by ID:", id);
    }

    const result = await formbricksClient.get<{ data: Response } | Response>(
      `/responses/${id}`,
    );

    if (!result.success) {
      if (import.meta.env.DEV) {
        console.error("[formbricksService] API call failed:", result.error);
      }
      return err(result.error);
    }

    if (import.meta.env.DEV) {
      console.log("[formbricksService] Raw API response:", result.value);
      console.log("[formbricksService] Response type:", typeof result.value);
      console.log(
        "[formbricksService] Has data property:",
        "data" in (result.value as object),
      );
    }

    // The Formbricks API returns responses wrapped in { data: {...} }
    // Extract the actual response object
    let responseData: unknown = result.value;

    // Check if wrapped in data property
    if (
      responseData &&
      typeof responseData === "object" &&
      "data" in responseData
    ) {
      const wrapped = responseData as { data: unknown };
      responseData = wrapped.data;

      if (import.meta.env.DEV) {
        console.log(
          "[formbricksService] Unwrapped once, now checking again...",
        );
        console.log(
          "[formbricksService] Type after unwrap:",
          typeof responseData,
        );
        console.log(
          "[formbricksService] Has data property:",
          responseData &&
            typeof responseData === "object" &&
            "data" in responseData,
        );
      }

      // Check if double-wrapped (data.data)
      if (
        responseData &&
        typeof responseData === "object" &&
        "data" in responseData
      ) {
        const doubleWrapped = responseData as { data: unknown };
        responseData = doubleWrapped.data;

        if (import.meta.env.DEV) {
          console.log(
            "[formbricksService] Was double-wrapped, unwrapped twice",
          );
        }
      }
    }

    if (import.meta.env.DEV) {
      console.log(
        "[formbricksService] Final extracted response data:",
        responseData,
      );
    }

    // Skip Zod validation due to schema initialization issues
    // Cast response directly to Response type (same as getResponsesBySurvey)
    const response = responseData as Response;

    // Basic validation - ensure we have at minimum an id
    if (!response || typeof response !== "object" || !response.id) {
      if (import.meta.env.DEV) {
        console.error(
          "[formbricksService] Invalid response structure:",
          response,
        );
      }
      return err(
        ValidationError.create(
          "Invalid response data - missing id",
          "response",
          responseData,
        ),
      );
    }

    return ok(response);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[formbricksService] Exception in getResponseById:", error);
    }
    return err(NetworkError.from(error));
  }
}

/**
 * Update a response
 *
 * @param id - Response ID
 * @param data - Update data
 * @returns Result containing updated response, or error if update fails
 */
export async function updateResponse(
  id: string,
  data: UpdateResponseInput,
): Promise<Result<Response, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(ValidationError.create("Response ID is required", "id", id));
  }

  // Validate input
  const validation = validateSchema(UpdateResponseInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  try {
    const result = await formbricksClient.patch<{ data: Response } | Response>(
      `/responses/${id}`,
      validation.value,
    );

    if (!result.success) {
      return err(result.error);
    }

    // Handle both wrapped and unwrapped responses
    const responseData =
      result.value && typeof result.value === "object" && "data" in result.value
        ? result.value.data
        : result.value;

    const validated = ResponseSchema.safeParse(responseData);
    if (!validated.success) {
      return err(
        ValidationError.create(
          "Invalid response data",
          "response",
          responseData,
        ),
      );
    }

    return ok(validated.data);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Delete a response
 *
 * @param id - Response ID
 * @returns Result containing success status, or error if deletion fails
 */
export async function deleteResponse(
  id: string,
): Promise<Result<void, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(ValidationError.create("Response ID is required", "id", id));
  }

  try {
    const result = await formbricksClient.delete(`/responses/${id}`);

    if (!result.success) {
      return err(result.error);
    }

    return ok(undefined);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

// ============================================================================
// Survey API
// ============================================================================

/**
 * Get all surveys
 *
 * @returns Result containing array of surveys, or error if fetch fails
 */
export async function getAllSurveys(): Promise<Result<Survey[], AppError>> {
  try {
    const result = await formbricksClient.get<{ data: Survey[] }>("/surveys");

    if (!result.success) {
      return err(result.error);
    }

    const response = result.value;
    if (!response || !response.data) {
      return ok([]);
    }

    // Formbricks API wraps response in { data: [...] }
    const surveys = response.data.data || response.data;

    if (!Array.isArray(surveys)) {
      console.error(
        "[formbricksService] Expected array of surveys, got:",
        typeof surveys,
      );
      return ok([]);
    }

    // Validate each survey
    const validated: Survey[] = [];
    for (const item of surveys) {
      const validation = SurveySchema.safeParse(item);
      if (validation.success) {
        validated.push(validation.data);
      } else if (import.meta.env.DEV) {
        console.warn(
          "[formbricksService] Survey validation failed:",
          validation.error,
        );
        console.warn(
          "[formbricksService] Failed item keys:",
          Object.keys(item || {}),
        );
      }
    }

    if (import.meta.env.DEV) {
      console.log(
        `[formbricksService] Loaded ${validated.length} surveys successfully`,
      );
    }

    return ok(validated);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Get survey by ID
 *
 * @param id - Survey ID
 * @returns Result containing survey, or error if not found
 */
export async function getSurveyById(
  id: string,
): Promise<Result<Survey, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(ValidationError.create("Survey ID is required", "id", id));
  }

  try {
    const result = await formbricksClient.get<{ data: Survey }>(
      `/surveys/${id}`,
    );

    if (!result.success) {
      return err(result.error);
    }

    const response = result.value;
    if (!response || !response.data) {
      return err(NotFoundError.resource("Survey", id));
    }

    // Formbricks API wraps response in { data: {...} }
    const survey = response.data.data || response.data;

    const validated = SurveySchema.safeParse(survey);
    if (!validated.success) {
      return err(
        ValidationError.create("Invalid survey data", "survey", survey),
      );
    }

    return ok(validated.data);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Create a survey
 *
 * @param data - Survey input data
 * @returns Result containing created survey, or error if creation fails
 */
export async function createSurvey(
  data: CreateSurveyInput,
): Promise<Result<Survey, AppError>> {
  // Validate input
  const validation = validateSchema(CreateSurveyInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  try {
    const result = await formbricksClient.post<Survey>(
      "/surveys",
      validation.value,
    );

    if (!result.success) {
      return err(result.error);
    }

    const validated = SurveySchema.safeParse(result.value);
    if (!validated.success) {
      return err(
        ValidationError.create(
          "Invalid survey response",
          "response",
          result.value,
        ),
      );
    }

    return ok(validated.data);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Update a survey
 *
 * @param id - Survey ID
 * @param data - Update data
 * @returns Result containing updated survey, or error if update fails
 */
export async function updateSurvey(
  id: string,
  data: UpdateSurveyInput,
): Promise<Result<Survey, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(ValidationError.create("Survey ID is required", "id", id));
  }

  // Validate input
  const validation = validateSchema(UpdateSurveyInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  try {
    const result = await formbricksClient.patch<Survey>(
      `/surveys/${id}`,
      validation.value,
    );

    if (!result.success) {
      return err(result.error);
    }

    const validated = SurveySchema.safeParse(result.value);
    if (!validated.success) {
      return err(
        ValidationError.create("Invalid survey data", "survey", result.value),
      );
    }

    return ok(validated.data);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Generate multiple survey IDs (suId)
 *
 * @param surveyId - Survey ID
 * @param count - Number of IDs to generate
 * @returns Result containing array of generated IDs, or error if generation fails
 */
export async function generateSurveyIds(
  surveyId: string,
  count: number = 1,
): Promise<Result<string[], AppError>> {
  if (!surveyId || surveyId.trim().length === 0) {
    return err(
      ValidationError.create("Survey ID is required", "surveyId", surveyId),
    );
  }

  if (count < 1 || count > 100) {
    return err(
      ValidationError.create("Count must be between 1 and 100", "count", count),
    );
  }

  try {
    const result = await formbricksClient.post<{ suIds: string[] }>(
      `/surveys/${surveyId}/generate-suids`,
      { count },
    );

    if (!result.success) {
      return err(result.error);
    }

    return ok(result.value.suIds || []);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Delete a survey
 *
 * @param id - Survey ID
 * @returns Result containing success status, or error if deletion fails
 */
export async function deleteSurvey(
  id: string,
): Promise<Result<void, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(ValidationError.create("Survey ID is required", "id", id));
  }

  try {
    const result = await formbricksClient.delete(`/surveys/${id}`);

    if (!result.success) {
      return err(result.error);
    }

    return ok(undefined);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

// ============================================================================
// Webhook API
// ============================================================================

/**
 * Get all webhooks
 *
 * @returns Result containing array of webhooks, or error if fetch fails
 */
export async function getAllWebhooks(): Promise<Result<Webhook[], AppError>> {
  try {
    const result = await formbricksClient.get<Webhook[]>("/webhooks");

    if (!result.success) {
      return err(result.error);
    }

    const { data } = result.value;
    if (!data) {
      return ok([]);
    }

    // Validate each webhook
    const validated: Webhook[] = [];
    for (const item of Array.isArray(data) ? data : [data]) {
      const validation = WebhookSchema.safeParse(item);
      if (validation.success) {
        validated.push(validation.data);
      } else if (import.meta.env.DEV) {
        console.warn(
          "[formbricksService] Webhook validation failed:",
          validation.error,
        );
      }
    }

    return ok(validated);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Create a webhook
 *
 * @param data - Webhook input data
 * @returns Result containing created webhook, or error if creation fails
 */
export async function createWebhook(
  data: CreateWebhookInput,
): Promise<Result<Webhook, AppError>> {
  // Validate input
  const validation = validateSchema(CreateWebhookInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  try {
    const result = await formbricksClient.post<Webhook>(
      "/webhooks",
      validation.value,
    );

    if (!result.success) {
      return err(result.error);
    }

    const validated = WebhookSchema.safeParse(result.value);
    if (!validated.success) {
      return err(
        ValidationError.create(
          "Invalid webhook response",
          "response",
          result.value,
        ),
      );
    }

    return ok(validated.data);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Delete a webhook
 *
 * @param id - Webhook ID
 * @returns Result containing success status, or error if deletion fails
 */
export async function deleteWebhook(
  id: string,
): Promise<Result<void, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(ValidationError.create("Webhook ID is required", "id", id));
  }

  try {
    const result = await formbricksClient.delete(`/webhooks/${id}`);

    if (!result.success) {
      return err(result.error);
    }

    return ok(undefined);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

// ============================================================================
// Survey Link Sending
// ============================================================================

/**
 * Get the public Formbricks URL for survey links
 * (not the proxy - this is for actual survey access)
 */
function getPublicFormbricksUrl(): string {
  // Always use the actual Formbricks instance URL for public survey links
  if (typeof window !== "undefined") {
    return (
      import.meta.env.PUBLIC_FORMBRICKS_URL ||
      "https://formbricks-production-f895.up.railway.app"
    );
  }
  return (
    process.env.FORMBRICKS_URL ||
    import.meta.env.FORMBRICKS_URL ||
    "https://formbricks-production-f895.up.railway.app"
  );
}

/**
 * Generate Formbricks survey URL with email parameter
 *
 * @param surveyId - Survey ID
 * @param email - Employee email address
 * @param baseUrl - Base URL for Formbricks instance (defaults to environment URL)
 * @returns Generated URL
 */
export function generateSurveyUrl(
  surveyId: string,
  email: string,
  baseUrl?: string,
): string {
  const formbricksBaseUrl = baseUrl || getPublicFormbricksUrl();
  const url = new URL(`${formbricksBaseUrl}/s/${surveyId}`);
  url.searchParams.set("email", email);
  return url.toString();
}

/**
 * Send survey links to employees via email
 *
 * @param data - Send survey links input data
 * @returns Result containing send results, or error if sending fails
 */
export async function sendSurveyLinks(
  data: SendSurveyLinksInput,
): Promise<Result<{ sent: number; failed: number }, AppError>> {
  // Validate input
  const validation = validateSchema(SendSurveyLinksInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const validData = validation.value;

  // Get employees
  const employeeResults: Array<{ email: string; name: string }> = [];
  for (const employeeId of validData.employeeIds) {
    const result = await employeeService.getEmployeeByUserId(employeeId);
    if (result.success) {
      const employee = result.value;
      const email =
        employee.hoi_email || employee.email || employee.email_value;
      const name = employee.fullname || employee.name || "Medewerker";

      if (email) {
        employeeResults.push({ email, name });
      }
    }
  }

  // Add additional emails if provided
  if (validData.additionalEmails && validData.additionalEmails.length > 0) {
    for (const email of validData.additionalEmails) {
      employeeResults.push({ email, name: "Ontvanger" });
    }
  }

  if (employeeResults.length === 0) {
    return err(
      ValidationError.create(
        "No valid recipients found with email addresses",
        "recipients",
        validData,
      ),
    );
  }

  // Generate URLs and send emails
  let sent = 0;
  let failed = 0;
  const formbricksBaseUrl = getPublicFormbricksUrl();

  for (const employee of employeeResults) {
    const surveyUrl = generateSurveyUrl(
      validData.surveyId,
      employee.email,
      formbricksBaseUrl,
    );

    // Create HTML email with link
    const htmlMessage = `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #18181b;">
				${validData.message.replace(/\n/g, "<br>")}
				<br><br>
				<a href="${surveyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
					Open het formulier
				</a>
			</div>
		`;

    const plainText = `${validData.message}\n\nOpen het formulier: ${surveyUrl}`;

    // Send email via message service
    const emailResult = await messageService.sendEmailMessage({
      type: "formbricks_link",
      msg_type: "email",
      recipient_email: employee.email,
      subject: validData.subject,
      html: htmlMessage,
      body: plainText,
      message_text: plainText,
    });

    if (emailResult.success) {
      sent++;
    } else {
      failed++;
      // Always log individual email failures to help debug
      console.error(
        `[formbricksService] Failed to send email to ${employee.email}:`,
        {
          errorType: emailResult.error.code,
          errorMessage: emailResult.error.message,
          errorDetails: emailResult.error.details || "No additional details",
          recipient: employee.email,
          surveyId: validData.surveyId,
        },
      );
    }
  }

  return ok({ sent, failed });
}

/**
 * Get fresh presigned URL for a Formbricks file
 *
 * @param environmentId - Formbricks environment ID
 * @param fileName - File name (e.g., "private/filename.pdf")
 * @returns Result containing fresh presigned URL, or error if fetch fails
 */
export async function getFileUrl(
  environmentId: string,
  fileName: string,
): Promise<Result<string, AppError>> {
  try {
    const result = await formbricksClient.post<{ url: string }>(
      "/storage/file-url",
      {
        environmentId,
        fileName,
      },
    );

    if (!result.success) {
      return err(result.error);
    }

    const response = result.value;
    if (!response || !response.url) {
      return err(NotFoundError.resource("File URL", fileName));
    }

    return ok(response.url);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Extract file info from a Formbricks storage URL
 *
 * @param url - Formbricks storage URL
 * @returns Object with environmentId and fileName, or null if not a Formbricks URL
 */
export function extractFileInfo(
  url: string,
): { environmentId: string; fileName: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    // Pattern: /storage/{environmentId}/private/{fileName}
    // or: /formbricks/{environmentId}/private/{fileName}
    let envIndex = -1;
    if (pathParts[0] === "storage" || pathParts[0] === "formbricks") {
      envIndex = 0;
    }

    if (envIndex >= 0 && pathParts.length >= envIndex + 3) {
      const environmentId = pathParts[envIndex + 1];
      // Everything after environmentId is the file path
      const filePath = pathParts.slice(envIndex + 2).join("/");
      return { environmentId, fileName: filePath };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is a Formbricks storage URL that needs proxying
 * Matches both:
 * - Storage URLs: formbricks-production.../storage/{envId}/private/{file} (need auth)
 * - Presigned S3 URLs: bucket-production.../formbricks/{envId}/private/{file}?X-Amz-Algorithm=... (may expire)
 *
 * We proxy ALL Formbricks file URLs to ensure:
 * 1. Storage URLs work (they require server-side API key authentication)
 * 2. Pre-signed URLs don't expire (we get fresh ones via the proxy)
 */
export function isFormbricksStorageUrl(url: string): boolean {
  if (typeof url !== "string") return false;
  // Match any URL from Formbricks storage hosts - both bucket and storage URLs
  return (
    url.includes("bucket-production") || url.includes("formbricks-production")
  );
}

/**
 * Refresh file URLs in response data
 * Converts Formbricks storage URLs to proxy URLs for authenticated access
 *
 * @param responseData - Response data object
 * @returns Response data with proxy file URLs
 */
export async function refreshFileUrls(
  responseData: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const refreshed = { ...responseData };

  if (import.meta.env.DEV) {
    console.log("[refreshFileUrls] Input keys:", Object.keys(refreshed));
  }

  for (const [key, value] of Object.entries(refreshed)) {
    refreshed[key] = processValueForFileUrls(value, key);
  }

  return refreshed;
}

/**
 * Recursively process a value to replace Formbricks storage URLs with proxy URLs.
 * Handles strings, arrays, and nested objects.
 */
function processValueForFileUrls(value: unknown, debugKey?: string): unknown {
  if (typeof value === "string") {
    if (isFormbricksStorageUrl(value)) {
      const proxyUrl = `/api/formbricks/file-download?url=${encodeURIComponent(value)}`;
      if (import.meta.env.DEV) {
        console.log(
          `[refreshFileUrls] Replaced URL in key="${debugKey}":`,
          value.substring(0, 80),
          "→ proxy",
        );
      }
      return proxyUrl;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, i) =>
      processValueForFileUrls(item, `${debugKey}[${i}]`),
    );
  }

  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = processValueForFileUrls(v, `${debugKey}.${k}`);
    }
    return result;
  }

  return value;
}
