/**
 * Note service - CRUD operations for notes, checklist items, and reminders
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
  deleteRowsResult,
  filter,
} from "$lib/utils/postgrest";
import type { AppError } from "$lib/types/errors";
import { ValidationError, NotFoundError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  type Note,
  type CreateNoteInput,
  type UpdateNoteInput,
} from "$lib/schemas/note";
import {
  CreateNoteInputSchema,
  UpdateNoteInputSchema,
} from "$lib/schemas/note";
import { getCurrentUserId } from "$lib/utils/userUtils";

/**
 * Get notes by entity
 *
 * @param entity - Entity type ('project', 'case', 'task', 'process')
 * @param entityId - Entity ID
 * @param includeClosed - Whether to include closed/archived notes (default: false)
 * @returns Result containing array of notes, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getNotesByEntity('case', 126);
 * if (result.success) {
 *   console.log(result.value); // Note[]
 * }
 * ```
 */
export async function getNotesByEntity(
  entity: string,
  entityId: number,
  includeClosed: boolean = false,
): Promise<Result<Note[], AppError>> {
  if (!entity || !entityId) {
    return err(
      ValidationError.create("Entity and entity ID are required", "entity", {
        entity,
        entityId,
      }),
    );
  }

  const filters: Record<string, string> = {
    entity: `eq.${entity}`,
    entity_id: `eq.${entityId}`,
  };

  if (!includeClosed) {
    filters.closed = "eq.false";
  }

  const result = await queryTableResult<Note>("_bpm_notes", {
    filter: filters,
    order: "created_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Get notes by type for an entity
 *
 * @param entity - Entity type
 * @param entityId - Entity ID
 * @param type - Note type
 * @param includeClosed - Whether to include closed notes (default: false)
 * @returns Result containing array of notes, or error if query fails
 */
export async function getNotesByType(
  entity: string,
  entityId: number,
  type: string,
  includeClosed: boolean = false,
): Promise<Result<Note[], AppError>> {
  if (!entity || !entityId || !type) {
    return err(
      ValidationError.create(
        "Entity, entity ID, and type are required",
        "params",
        { entity, entityId, type },
      ),
    );
  }

  const filters: Record<string, string> = {
    entity: `eq.${entity}`,
    entity_id: `eq.${entityId}`,
    type: `eq.${type}`,
  };

  if (!includeClosed) {
    filters.closed = "eq.false";
  }

  const result = await queryTableResult<Note>("_bpm_notes", {
    filter: filters,
    order: "created_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Get all unique note types for an entity
 *
 * @param entity - Entity type
 * @param entityId - Entity ID
 * @returns Result containing array of unique note types, or error if query fails
 */
export async function getNoteTypes(
  entity: string,
  entityId: number,
): Promise<Result<string[], AppError>> {
  if (!entity || !entityId) {
    return err(
      ValidationError.create("Entity and entity ID are required", "entity", {
        entity,
        entityId,
      }),
    );
  }

  const filters: Record<string, string> = {
    entity: `eq.${entity}`,
    entity_id: `eq.${entityId}`,
    closed: "eq.false",
  };

  const result = await queryTableResult<Note>("_bpm_notes", {
    filter: filters,
    select: "type",
  });

  if (!result.success) {
    return err(result.error);
  }

  // Extract unique types
  const types = Array.from(new Set(result.value.data.map((note) => note.type)));
  return ok(types);
}

/**
 * Create a new note
 *
 * @param data - Note creation data
 * @returns Result containing created note, or error if creation fails
 *
 * @example
 * ```typescript
 * const result = await createNote({
 *   entity: 'case',
 *   entity_id: 126,
 *   type: 'note',
 *   text: 'This is a note',
 *   source_url: '/cases/126?tab=notities'
 * });
 * if (result.success) {
 *   console.log(result.value); // Note
 * }
 * ```
 */
export async function createNote(
  data: CreateNoteInput,
): Promise<Result<Note, AppError>> {
  // Validate input
  const validation = validateSchema(CreateNoteInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return err(
      ValidationError.create("User must be authenticated", "user", null),
    );
  }

  // Create note record
  const noteData = {
    ...validation.value,
    assignee_id: validation.value.assignee_id || [],
    checked: validation.value.checked || false,
    closed: false,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const result = await insertRowResult<Note>("_bpm_notes", noteData);

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value);
}

/**
 * Update a note
 *
 * @param id - Note ID
 * @param data - Note update data
 * @returns Result containing updated note, or error if update fails
 */
export async function updateNote(
  id: number,
  data: UpdateNoteInput,
): Promise<Result<Note, AppError>> {
  if (!id || id <= 0) {
    return err(ValidationError.create("Note ID is required", "id", id));
  }

  // Validate input
  const validation = validateSchema(UpdateNoteInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Check if note exists
  const existingResult = await queryTableResult<Note>("_bpm_notes", {
    filter: { id: `eq.${id}` },
    limit: 1,
  });

  if (!existingResult.success) {
    return err(existingResult.error);
  }

  if (existingResult.value.data.length === 0) {
    return err(NotFoundError.resource("Note", id));
  }

  // Update note
  const updateData = {
    ...validation.value,
    updated_at: new Date().toISOString(),
  };

  const result = await updateRowsResult<Note>(
    "_bpm_notes",
    { id: `eq.${id}` },
    updateData,
  );

  if (!result.success) {
    return err(result.error);
  }

  // updateRowsResult returns an array, get the first item
  if (result.value.length === 0) {
    return err(NotFoundError.resource("Note", id));
  }

  return ok(result.value[0]);
}

/**
 * Delete a note
 *
 * @param id - Note ID
 * @returns Result containing void, or error if deletion fails
 */
export async function deleteNote(id: number): Promise<Result<void, AppError>> {
  if (!id || id <= 0) {
    return err(ValidationError.create("Note ID is required", "id", id));
  }

  // Check if note exists
  const existingResult = await queryTableResult<Note>("_bpm_notes", {
    filter: { id: `eq.${id}` },
    limit: 1,
  });

  if (!existingResult.success) {
    return err(existingResult.error);
  }

  if (existingResult.value.data.length === 0) {
    return err(NotFoundError.resource("Note", id));
  }

  // Delete note
  const result = await deleteRowsResult(
    "_bpm_notes",
    filter().eq("id", id).build(),
  );

  if (!result.success) {
    return err(result.error);
  }

  return ok(undefined);
}

/**
 * Toggle checklist item checked status
 *
 * @param id - Note ID
 * @returns Result containing updated note, or error if update fails
 */
export async function toggleNoteChecked(
  id: number,
): Promise<Result<Note, AppError>> {
  if (!id || id <= 0) {
    return err(ValidationError.create("Note ID is required", "id", id));
  }

  // Get current note
  const existingResult = await queryTableResult<Note>("_bpm_notes", {
    filter: { id: `eq.${id}` },
    limit: 1,
  });

  if (!existingResult.success) {
    return err(existingResult.error);
  }

  if (existingResult.value.data.length === 0) {
    return err(NotFoundError.resource("Note", id));
  }

  const note = existingResult.value.data[0];

  // Toggle checked status and archive when checked
  const newCheckedStatus = !note.checked;
  const result = await updateNote(id, {
    checked: newCheckedStatus,
    closed: newCheckedStatus, // Archive when checked, unarchive when unchecked
  });

  return result;
}

/**
 * Close/archive a note
 *
 * @param id - Note ID
 * @returns Result containing updated note, or error if update fails
 */
export async function closeNote(id: number): Promise<Result<Note, AppError>> {
  if (!id || id <= 0) {
    return err(ValidationError.create("Note ID is required", "id", id));
  }

  return await updateNote(id, { closed: true });
}

/**
 * Reopen a closed note
 *
 * @param id - Note ID
 * @returns Result containing updated note, or error if update fails
 */
export async function reopenNote(id: number): Promise<Result<Note, AppError>> {
  if (!id || id <= 0) {
    return err(ValidationError.create("Note ID is required", "id", id));
  }

  return await updateNote(id, { closed: false });
}

/**
 * Reorder notes within an entity
 *
 * @param entity - Entity type ('project', 'case', 'task', 'process')
 * @param entityId - Entity ID
 * @param orders - Array of { id, order_index } for each note
 * @returns Result containing void, or error if update fails
 *
 * @example
 * ```typescript
 * const result = await reorderNotes('case', 126, [
 *   { id: 1, order_index: 0 },
 *   { id: 2, order_index: 1 },
 *   { id: 3, order_index: 2 }
 * ]);
 * if (result.success) {
 *   console.log('Notes reordered successfully');
 * }
 * ```
 */
export async function reorderNotes(
  entity: string,
  entityId: number,
  orders: { id: number; order_index: number }[],
): Promise<Result<void, AppError>> {
  if (!entity || !entityId) {
    return err(
      ValidationError.create("Entity and entity ID are required", "entity", {
        entity,
        entityId,
      }),
    );
  }

  if (!orders || orders.length === 0) {
    return ok(undefined); // Nothing to reorder
  }

  // Update each note's order_index
  const updates = orders.map(({ id, order_index }) => {
    return updateRowsResult<Note>(
      "_bpm_notes",
      { id: `eq.${id}`, entity: `eq.${entity}`, entity_id: `eq.${entityId}` },
      { order_index, updated_at: new Date().toISOString() } as Partial<Note> & {
        order_index: number;
      },
    );
  });

  try {
    const results = await Promise.all(updates);

    // Check if any update failed
    for (const result of results) {
      if (!result.success) {
        return err(result.error);
      }
    }

    return ok(undefined);
  } catch (error) {
    return err(
      ValidationError.create("Failed to reorder notes", "reorder", { error }),
    );
  }
}
