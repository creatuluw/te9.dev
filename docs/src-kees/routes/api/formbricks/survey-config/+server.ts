/**
 * Formbricks Survey Config API
 *
 * Server-side endpoint to generate/update survey-config.json
 * with question mappings from Formbricks surveys
 */

import { json } from "@sveltejs/kit";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { RequestHandler } from "./$types";

/**
 * Get the path to survey-config.json
 */
function getConfigPath(): string {
  return join(
    process.cwd(),
    "src",
    "routes",
    "tools",
    "formbricks",
    "survey-config.json",
  );
}

/**
 * Generate a column name (slug) from question text
 * Converts text to lowercase, replaces spaces/special chars with hyphens
 */
function generateColumnName(questionText: string): string {
  return questionText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 100);
}

/**
 * Extract question headline from question object
 * Handles both string headline and object with 'default' property
 */
function extractQuestionHeadline(question: any): string {
  if (!question) return "";

  const headline = question.headline;

  if (typeof headline === "string") {
    return headline;
  }

  if (headline && typeof headline === "object" && "default" in headline) {
    return String(headline.default || "");
  }

  return "";
}

/**
 * Generate question mappings from a survey
 */
function generateQuestionMappings(
  survey: any,
): Array<{ id: string; question: string; columnName: string }> {
  const questions: any[] = [];

  if (survey.questions && Array.isArray(survey.questions)) {
    questions.push(...survey.questions);
  }

  return questions
    .filter((q) => q && typeof q === "object" && q.id)
    .map((q) => {
      const questionText = extractQuestionHeadline(q);
      return {
        id: q.id,
        question: questionText,
        columnName: generateColumnName(questionText),
      };
    });
}

/**
 * Read and parse survey-config.json
 */
function loadSurveyConfig(): any {
  const configPath = getConfigPath();
  try {
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to read survey-config.json:", error);
    return { surveys: {} };
  }
}

/**
 * Write updated survey-config.json
 */
function saveSurveyConfig(config: any): void {
  const configPath = getConfigPath();
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  console.log("✓ Saved survey-config.json");
}

/**
 * Generate or update survey configuration from Formbricks API data
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { survey, surveys } = body as { survey?: any; surveys?: any[] };

    // Load existing config
    const config = loadSurveyConfig();

    // Initialize surveys object if not exists
    if (!config.surveys) {
      config.surveys = {};
    }

    // Process single survey
    if (survey && survey.id && survey.name) {
      const questionMappings = generateQuestionMappings(survey);

      // Update or create survey entry (preserve emailSubject/emailMessage)
      config.surveys[survey.id] = {
        name: survey.name,
        emailSubject: config.surveys[survey.id]?.emailSubject || survey.name,
        emailMessage:
          config.surveys[survey.id]?.emailMessage ||
          `Beste collega,\n\nHierbij de link naar het formulier voor ${survey.name}. Vul dit formulier zo snel mogelijk in.\n\nKlik op deze knop "open het formulier" om het formulier te openen.\n\nAlvast bedankt voor het invullen!\n\nMet vriendelijke groet,\n\nTeam Hoi Pippeloi`,
        questions: questionMappings,
      };

      saveSurveyConfig(config);

      return json({
        success: true,
        message: `Survey "${survey.name}" configuration updated`,
        questionsCount: questionMappings.length,
      });
    }

    // Process all surveys
    if (surveys && Array.isArray(surveys)) {
      for (const s of surveys) {
        if (!s.id || !s.name) {
          console.warn("Skipping survey missing id or name");
          continue;
        }

        const questionMappings = generateQuestionMappings(s);

        // Update or create survey entry (preserve emailSubject/emailMessage)
        config.surveys[s.id] = {
          name: s.name,
          emailSubject: s.name,
          emailMessage: `Beste collega,\n\nHierbij de link naar het formulier voor ${s.name}. Vul dit formulier zo snel mogelijk in.\n\nKlik op deze knop "open het formulier" om het formulier te openen.\n\nAlvast bedankt voor het invullen!\n\nMet vriendelijke groet,\n\nTeam Hoi Pippeloi`,
          questions: questionMappings,
        };
      }

      saveSurveyConfig(config);

      return json({
        success: true,
        message: `Survey configuration updated for ${surveys.length} surveys`,
        totalSurveys: surveys.length,
        totalQuestions: Object.values(config.surveys).reduce(
          (sum, s) => sum + ((s as any).questions?.length || 0),
          0,
        ),
      });
    }

    return json(
      {
        success: false,
        message: "No valid survey data provided",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Survey config API error:", error);
    return json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};
