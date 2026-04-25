/**
 * Task by Chat service - Create tasks from AI chat conversations
 *
 * This service analyzes chat conversations using AI to extract task information
 * and create one or multiple tasks based on the user's natural language input.
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import type { AppError } from "$lib/types/errors";
import { ValidationError, NetworkError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import * as tinyTalkService from "./tinyTalkService";
import type { ChatMessage } from "./tinyTalkService";
import * as taskService from "./taskService";
import type {
  CreateManualTaskInput,
  CreateHelpTaskInput,
  Task,
} from "$lib/schemas/task";
import { getCurrentUserId } from "$lib/utils/userUtils";

/**
 * Extracted task data from chat conversation
 */
export interface ExtractedTask {
  subject: string;
  voor_wie_is_het?: string | null;
  wat_ga_je_doen?: string | null;
  waarom_doe_je_het?: string | null;
  due_date?: string | null; // YYYY-MM-DD format
  uren?: number | null;
  tags?: string[];
  relevantie?: number | null; // 1-5
  status?: "backlog" | "gepland" | "ad-hoc";
  kanban_status?:
    | "backlog"
    | "gepland"
    | "mee_bezig"
    | "in_review"
    | "afgerond"
    | "overdue";
  project_id?: number | null;
  assignee_id?: string[];
}

/**
 * Result of task extraction from chat
 */
export interface TaskExtractionResult {
  tasks: ExtractedTask[];
  confidence: "high" | "medium" | "low";
  needsClarification: boolean;
  clarificationQuestions?: string[];
  // Deletion request
  deleteRequest?: {
    taskSubject?: string; // Subject of task to delete (for reference)
    taskId?: number; // ID of task to delete (if known)
    needsConfirmation: boolean; // Whether user confirmation is needed
  };
}

/**
 * Get system prompt with current date
 */
function getTaskExtractionSystemPrompt(): string {
  const today = new Date();
  const todayFormatted = today.toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const todayISO = today.toISOString().split("T")[0]; // YYYY-MM-DD format

  return `Je bent een intelligente AI-assistent die taken (tasks) extraheert uit natuurlijke taal conversaties.

BELANGRIJK: Vandaag is ${todayFormatted} (${todayISO}). Gebruik deze datum als referentiepunt voor het interpreteren van datums zoals "komende vrijdag", "volgende week", "over 2 dagen", etc.

Je taak is om uit een chat conversatie één of meerdere taken te identificeren en de relevante informatie te extraheren.

BELANGRIJK: Je MOET je output altijd in JSON formaat geven met deze exacte structuur:
{
  "tasks": [
    {
      "subject": "Korte titel van de taak (max 255 karakters, verplicht)",
      "voor_wie_is_het": "Voor wie is deze taak (optioneel, max 500 karakters)",
      "wat_ga_je_doen": "Gedetailleerde beschrijving van wat er gedaan moet worden (optioneel, max 1000 karakters)",
      "waarom_doe_je_het": "Reden waarom deze taak belangrijk is (optioneel, max 1000 karakters)",
      "due_date": "YYYY-MM-DD formaat (optioneel)",
      "uren": 8.5 (optioneel, nummer >= 0),
      "tags": ["tag1", "tag2"] (optioneel, array van strings),
      "relevantie": 3 (optioneel, 1-5),
      "status": "backlog" | "gepland" | "ad-hoc" (optioneel, default: "backlog"),
      "kanban_status": "backlog" | "gepland" | "mee_bezig" | "in_review" | "afgerond" | "overdue" (optioneel, default: "gepland"),
      "project_id": null (optioneel, nummer of null),
      "assignee_id": [] (optioneel, array van user IDs)
    }
  ],
  "confidence": "high" | "medium" | "low",
  "needsClarification": false,
  "clarificationQuestions": [] (alleen als needsClarification true is),
  "deleteRequest": {
    "taskSubject": "Onderwerp van de taak die verwijderd moet worden (optioneel, voor referentie)",
    "taskId": null (optioneel, ID van de taak als bekend),
    "needsConfirmation": true (altijd true - altijd bevestiging vragen)
  } (alleen als gebruiker vraagt om een taak te verwijderen)
}

REGELS:
1. Subject is ALTIJD verplicht - genereer een korte, duidelijke titel (max 255 karakters)
2. Als er meerdere taken in één bericht staan, maak meerdere task objecten
3. Extract datums en converteer naar YYYY-MM-DD formaat (gebruik vandaag als referentie)
4. Extract uren als nummers (bijv. "8 uur" -> 8, "2.5 uur" -> 2.5)
5. Extract tags uit keywords en thema's in de tekst
6. Infer relevantie (1-5) uit urgentie/prioriteit woorden
7. **BELANGRIJK - Clarification Questions:**
   - Als belangrijke informatie ontbreekt, zet needsClarification op true
   - Stel vragen per ontbrekend veld - vraag naar het belangrijkste eerst
   - Gebruik clarificationQuestions array om specifieke vragen te stellen (max 3 vragen per keer)
   - Prioriteit van vragen (vraag in deze volgorde):
     1. Subject (altijd verplicht, maar vraag alleen als echt niet te infereren)
     2. Wat ga je doen (belangrijk voor begrip van de taak)
     3. Voor wie is het (belangrijk voor context)
     4. Deadline (belangrijk voor planning)
     5. Waarom doe je het (optioneel maar nuttig)
     6. Uren (optioneel maar nuttig voor planning)
   - Voorbeelden van goede vragen:
     * "Kun je beschrijven wat er precies gedaan moet worden?" (als wat_ga_je_doen ontbreekt)
     * "Voor wie is deze taak bedoeld?" (als voor_wie_is_het ontbreekt)
     * "Wat is de deadline voor deze taak?" (als due_date ontbreekt)
     * "Waarom is deze taak belangrijk?" (als waarom_doe_je_het ontbreekt)
   - Als alle belangrijke velden zijn ingevuld, zet needsClarification op false
8. Spreek altijd Nederlands in je responses
9. Geef ALTIJD geldige JSON - geen extra tekst voor of na de JSON
10. **Wanneer task compleet is:** Zet needsClarification op false en bevestig dat de taak compleet is
11. **Taak verwijdering (BELANGRIJK):**
    - Als de gebruiker vraagt om een taak te verwijderen, MOET je ALTIJD een deleteRequest toevoegen
    - Herken verwijdering verzoeken: "verwijder", "delete", "wissen", "verwijder de taak", "delete taak", "wissen taak", "verwijder taak X", "verwijder de taak", etc.
    - Extract de taak naam/onderwerp uit het verzoek indien mogelijk (bijv. "verwijder de test taak" → taskSubject: "test taak" of "testtaak")
    - Als er geen specifieke taak naam wordt genoemd (bijv. "verwijder de taak"), laat taskSubject leeg of gebruik een lege string - het systeem zal dan de enige taak verwijderen of vragen welke taak
    - Zet needsConfirmation altijd op true - vraag ALTIJD om bevestiging
    - Als de context duidelijk is welke taak verwijderd moet worden, gebruik de exacte subject of een deel ervan
    - Als er geen specifieke taak wordt genoemd, laat taskSubject leeg - het systeem handelt dit af
    - VOORBEELDEN:
      * "verwijder de test taak" → deleteRequest: { taskSubject: "test taak", needsConfirmation: true }
      * "verwijder de taak" → deleteRequest: { taskSubject: "", needsConfirmation: true }
      * "delete taak" → deleteRequest: { taskSubject: "", needsConfirmation: true }

VOORBEELDEN:

Input: "Ik moet een nieuwe login pagina bouwen voor klanten omdat de huidige verouderd is. Deadline is 15 februari 2025."
Output:
{
  "tasks": [
    {
      "subject": "Nieuwe login pagina bouwen",
      "voor_wie_is_het": "Klanten",
      "wat_ga_je_doen": "Bouwen van een nieuwe login pagina ter vervanging van de verouderde versie",
      "waarom_doe_je_het": "De huidige login pagina is verouderd en moet vervangen worden",
      "due_date": "2025-02-15",
      "tags": ["frontend", "authentication"],
      "relevantie": 4,
      "status": "gepland",
      "kanban_status": "gepland"
    }
  ],
  "confidence": "high",
  "needsClarification": false,
  "clarificationQuestions": []
}

Input: "Maak 3 taken: 1) Dashboard updaten voor management, 2) API integratie met externe service, 3) Bug fixen in checkout proces"
Output:
{
  "tasks": [
    {
      "subject": "Dashboard updaten",
      "voor_wie_is_het": "Management",
      "wat_ga_je_doen": "Dashboard updaten voor management",
      "status": "backlog",
      "kanban_status": "gepland"
    },
    {
      "subject": "API integratie externe service",
      "wat_ga_je_doen": "API integratie bouwen met externe service",
      "tags": ["api", "integratie"],
      "status": "backlog",
      "kanban_status": "gepland"
    },
    {
      "subject": "Bug fixen checkout proces",
      "wat_ga_je_doen": "Bug fixen in het checkout proces",
      "tags": ["bugfix", "checkout"],
      "relevantie": 5,
      "status": "ad-hoc",
      "kanban_status": "gepland"
    }
  ],
  "confidence": "high",
  "needsClarification": false,
  "clarificationQuestions": []
}`;
}

/**
 * Extract task information from chat conversation using AI
 *
 * @param messages - Array of chat messages (conversation history)
 * @param botId - TinyTalk bot ID (optional, uses env if not provided)
 * @returns Result containing extracted tasks and metadata, or error
 *
 * @example
 * ```typescript
 * const messages: ChatMessage[] = [
 *   { role: 'user', content: 'Ik moet een nieuwe login pagina bouwen voor klanten' }
 * ];
 *
 * const result = await extractTasksFromChat(messages);
 * if (result.success) {
 *   console.log('Extracted tasks:', result.value.tasks);
 *   console.log('Confidence:', result.value.confidence);
 * }
 * ```
 */
export async function extractTasksFromChat(
  messages: ChatMessage[],
  botId?: string,
): Promise<Result<TaskExtractionResult, AppError>> {
  // Validate input
  if (!Array.isArray(messages) || messages.length === 0) {
    return err(
      ValidationError.create(
        "Messages array is required and cannot be empty",
        "messages",
        messages,
      ),
    );
  }

  // Get bot ID from parameter or environment
  const tinyBotId = botId || import.meta.env.PUBLIC_TINYTALK_BOT_ID || "";
  if (!tinyBotId) {
    return err(
      ValidationError.create(
        "TinyTalk bot ID not configured. Set PUBLIC_TINYTALK_BOT_ID in .env or provide botId parameter",
        "botId",
        tinyBotId,
      ),
    );
  }

  // Prepare conversation with system prompt (includes current date)
  const conversationMessages: ChatMessage[] = [
    { role: "system", content: getTaskExtractionSystemPrompt() },
    ...messages,
  ];

  try {
    // Send non-streaming request to get complete response
    const chatResult = await tinyTalkService.sendChatCompletionNonStreaming({
      botId: tinyBotId,
      messages: conversationMessages,
      temperature: 0.1, // Lower temperature for more consistent JSON output
    });

    if (!chatResult.success) {
      return err(chatResult.error);
    }

    // Parse JSON response
    const responseContent = chatResult.value.content.trim();

    // Try to extract JSON from response (might have markdown code blocks)
    let jsonString = responseContent;

    // Remove markdown code blocks if present
    const jsonMatch = responseContent.match(
      /```(?:json)?\s*(\{[\s\S]*\})\s*```/,
    );
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    } else {
      // Try to find JSON object in the response
      const jsonObjectMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonString = jsonObjectMatch[0];
      }
    }

    // Parse JSON
    let parsedResult: TaskExtractionResult;
    try {
      parsedResult = JSON.parse(jsonString);
    } catch (parseError) {
      return err(
        ValidationError.create(
          `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}. Response: ${responseContent.substring(0, 200)}`,
          "response",
          responseContent,
        ),
      );
    }

    // Validate extracted result structure
    if (!parsedResult.tasks || !Array.isArray(parsedResult.tasks)) {
      return err(
        ValidationError.create(
          "AI response missing tasks array",
          "response",
          parsedResult,
        ),
      );
    }

    // Validate each task has required subject
    for (const task of parsedResult.tasks) {
      if (!task.subject || task.subject.trim() === "") {
        return err(
          ValidationError.create(
            "Extracted task missing required subject field",
            "task",
            task,
          ),
        );
      }

      // Ensure subject is within max length
      if (task.subject.length > 255) {
        task.subject = task.subject.substring(0, 252) + "...";
      }
    }

    // Set defaults
    parsedResult.confidence = parsedResult.confidence || "medium";
    parsedResult.needsClarification = parsedResult.needsClarification || false;
    parsedResult.clarificationQuestions =
      parsedResult.clarificationQuestions || [];
    parsedResult.deleteRequest = parsedResult.deleteRequest || undefined;

    return ok(parsedResult);
  } catch (error) {
    return err(NetworkError.from(error, "TinyTalk API"));
  }
}

/**
 * Create tasks from extracted task data
 *
 * @param tasks - Array of extracted task data
 * @param defaultProjectId - Optional default project ID to assign to tasks
 * @returns Result containing array of created work items, or error
 *
 * @example
 * ```typescript
 * const extractedTasks: ExtractedTask[] = [
 *   {
 *     subject: 'Nieuwe login pagina bouwen',
 *     voor_wie_is_het: 'Klanten',
 *     wat_ga_je_doen: 'Bouwen van nieuwe login pagina',
 *     due_date: '2025-02-15'
 *   }
 * ];
 *
 * const result = await createTasksFromExtracted(extractedTasks);
 * if (result.success) {
 *   console.log('Created tasks:', result.value);
 * }
 * ```
 */
export async function createTasksFromExtracted(
  tasks: ExtractedTask[],
  defaultProjectId?: number | null,
): Promise<Result<Task[], AppError>> {
  // Validate input
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return err(
      ValidationError.create(
        "Tasks array is required and cannot be empty",
        "tasks",
        tasks,
      ),
    );
  }

  const createdTasks: Task[] = [];
  const errors: AppError[] = [];

  // Get current user ID for default assignee
  const currentUserId = getCurrentUserId();

  // Create each task
  for (const extractedTask of tasks) {
    // Build CreateManualTaskInput from extracted task
    // Add "task-ai" tag to all AI-created tasks
    const existingTags = extractedTask.tags || [];
    const aiTag = "task-ai";
    const tags = existingTags.includes(aiTag)
      ? existingTags
      : [...existingTags, aiTag];

    // Convert due_date (YYYY-MM-DD) to deadline (ISO datetime) if provided
    const deadline = extractedTask.due_date
      ? extractedTask.due_date.includes("T")
        ? extractedTask.due_date
        : `${extractedTask.due_date}T12:00:00Z`
      : null;

    const createInput: CreateManualTaskInput = {
      subject: extractedTask.subject,
      voor_wie_is_het: extractedTask.voor_wie_is_het || null,
      wat_ga_je_doen: extractedTask.wat_ga_je_doen || null,
      waarom_doe_je_het: extractedTask.waarom_doe_je_het || null,
      deadline: deadline,
      uren: extractedTask.uren || null,
      tags: tags,
      relevantie: extractedTask.relevantie || null,
      status: extractedTask.status || "backlog",
      kanban_status: extractedTask.kanban_status || "gepland",
      project_id: extractedTask.project_id ?? defaultProjectId ?? null,
      assignee_id:
        extractedTask.assignee_id || (currentUserId ? [currentUserId] : []),
      bijlagen: [],
      priority: "normaal" as const,
      source: "chat", // Mark tasks created from chat
    };

    // Create the work item
    const createResult = await taskService.createWorkItem(createInput);

    if (createResult.success) {
      createdTasks.push(createResult.value);
    } else {
      errors.push(createResult.error);
    }
  }

  // If all tasks failed, return first error
  if (createdTasks.length === 0 && errors.length > 0) {
    return err(errors[0]);
  }

  // If some tasks failed, log errors but return successful ones
  if (errors.length > 0) {
    console.warn("[taskByChatService] Some tasks failed to create:", errors);
  }

  return ok(createdTasks);
}

/**
 * Extract tasks from chat and create them in one operation
 *
 * This is a convenience function that combines extraction and creation.
 *
 * @param messages - Array of chat messages (conversation history)
 * @param botId - TinyTalk bot ID (optional, uses env if not provided)
 * @param defaultProjectId - Optional default project ID to assign to tasks
 * @param autoCreate - If true, automatically create tasks without asking for confirmation (default: false)
 * @returns Result containing extraction result and created tasks, or error
 *
 * @example
 * ```typescript
 * const messages: ChatMessage[] = [
 *   { role: 'user', content: 'Ik moet een nieuwe login pagina bouwen voor klanten' }
 * ];
 *
 * const result = await extractAndCreateTasks(messages, undefined, undefined, true);
 * if (result.success) {
 *   console.log('Extracted:', result.value.extraction);
 *   console.log('Created tasks:', result.value.createdTasks);
 * }
 * ```
 */
export async function extractAndCreateTasks(
  messages: ChatMessage[],
  botId?: string,
  defaultProjectId?: number | null,
  autoCreate: boolean = false,
): Promise<
  Result<
    {
      extraction: TaskExtractionResult;
      createdTasks: Task[];
    },
    AppError
  >
> {
  // Extract tasks from chat
  const extractionResult = await extractTasksFromChat(messages, botId);
  if (!extractionResult.success) {
    return err(extractionResult.error);
  }

  const extraction = extractionResult.value;

  // If clarification is needed and auto-create is false, return extraction without creating
  if (extraction.needsClarification && !autoCreate) {
    return ok({
      extraction,
      createdTasks: [],
    });
  }

  // Create tasks from extraction
  const createResult = await createTasksFromExtracted(
    extraction.tasks,
    defaultProjectId,
  );
  if (!createResult.success) {
    return err(createResult.error);
  }

  return ok({
    extraction,
    createdTasks: createResult.value,
  });
}
