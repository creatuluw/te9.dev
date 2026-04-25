import { json, type RequestEvent } from "@sveltejs/kit";
import * as caseService from "$lib/services/caseService";
import { getUserMessage } from "$lib/types/errors";
import type { AppError } from "$lib/types/errors";

export async function DELETE({ params }: RequestEvent) {
  const { caseId, taskId } = params;
  const parsedCaseId = parseInt(caseId!, 10);
  const parsedTaskId = parseInt(taskId!, 10);

  if (isNaN(parsedCaseId) || isNaN(parsedTaskId)) {
    return json({ error: "Ongeldige case ID of taak ID" }, { status: 400 });
  }

  try {
    const result = await caseService.deleteCaseTask(parsedTaskId);
    if (!result.success) {
      return json({ error: getUserMessage(result.error) }, { status: 400 });
    }
    return json({ success: true });
  } catch (error) {
    console.error("Error deleting case task:", error);
    return json(
      { error: "Er is een fout opgetreden bij het verwijderen van de taak" },
      { status: 500 },
    );
  }
}

export async function POST({ params, request }: RequestEvent) {
  const { caseId, taskId } = params;
  const parsedCaseId = parseInt(caseId!, 10);
  const parsedTaskId = parseInt(taskId!, 10);

  if (isNaN(parsedCaseId) || isNaN(parsedTaskId)) {
    return json({ error: "Ongeldige case ID of taak ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "archive") {
      const result = await caseService.archiveCaseTask(parsedTaskId);
      if (!result.success) {
        return json({ error: getUserMessage(result.error) }, { status: 400 });
      }
      return json({ success: true });
    } else if (action === "unarchive") {
      const result = await caseService.unarchiveCaseTask(parsedTaskId);
      if (!result.success) {
        return json({ error: getUserMessage(result.error) }, { status: 400 });
      }
      return json({ success: true });
    } else {
      return json(
        { error: 'Ongeldige actie. Gebruik "archive" of "unarchive".' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error processing case task archive action:", error);
    return json(
      { error: "Er is een fout opgetreden bij het verwerken van het verzoek" },
      { status: 500 },
    );
  }
}
