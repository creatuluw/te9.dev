/**
 * Public work item page - Server-side load
 * Validates public token and loads work item data
 * Bypasses authentication/permission checks
 */
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as publicSharingService from "$lib/services/publicSharingService";
import * as taskService from "$lib/services/taskService";
import { queryTableResult } from "$lib/utils/postgrest";
import { filter } from "$lib/utils/postgrest";

export const load: PageServerLoad = async ({ params }) => {
  const workItemId = parseInt(params.id);
  const token = params.token;

  if (isNaN(workItemId) || !token) {
    throw error(404, "Not found");
  }

  // Validate public token
  const tokenResult = await publicSharingService.validatePublicToken(
    "work_item",
    token,
  );
  if (!tokenResult.success) {
    throw error(404, "Not found");
  }

  // Get public entity to verify it matches the ID
  const entityResult = await publicSharingService.getPublicEntity(
    "work_item",
    token,
  );
  if (!entityResult.success) {
    throw error(404, "Not found");
  }

  const publicEntity = entityResult.value;
  if (publicEntity.id !== workItemId) {
    throw error(404, "Not found");
  }

  // Load work item data
  const workItemResult = await taskService.getWorkItemById(workItemId);
  if (!workItemResult.success) {
    throw error(404, "Not found");
  }

  const workItem = workItemResult.value;

  // Fetch user name if assignee_id exists
  let assigneeName: string | null = null;
  if (workItem.assignee_id && workItem.assignee_id.length > 0) {
    const userResult = await queryTableResult<any>("_auth_users", {
      filter: filter().eq("id", workItem.assignee_id[0]).build(),
      select: "id,name,email,username",
      limit: 1,
    });
    if (userResult.success && userResult.value.data.length > 0) {
      const user = userResult.value.data[0];
      assigneeName = user.name || user.username || user.email || null;
    }
  }

  // Fetch project name if project_id exists
  let projectName: string | null = null;
  if (workItem.project_id) {
    const projectResult = await queryTableResult<any>("_bpm_projects", {
      filter: filter().eq("id", workItem.project_id).build(),
      select: "id,name",
      limit: 1,
    });
    if (projectResult.success && projectResult.value.data.length > 0) {
      projectName = projectResult.value.data[0].name || null;
    }
  }

  return {
    workItem: workItemResult.value,
    assigneeName,
    projectName,
    isPublic: true,
  };
};
