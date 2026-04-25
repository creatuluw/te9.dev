/**
 * Survey Config Manager
 *
 * Utility to discover Formbricks surveys and generate question mappings
 * for survey-config.json with columnName support
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Generate a column name (slug) from question text
 * Converts text to lowercase, replaces spaces/special chars with hyphens
 */
function generateColumnName(questionText: string): string {
  return (
    questionText
      .toLowerCase()
      // Replace non-alphanumeric characters (except hyphens and underscores) with hyphens
      .normalize("NFD") // Normalize accented characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, "") // Keep only alphanumeric, spaces, and hyphens
      .trim()
      .replace(/\s+/g, "-")
  ); // Replace spaces with hyphens
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
  const configPath = join(
    process.cwd(),
    "src",
    "routes",
    "tools",
    "formbricks",
    "survey-config.json",
  );
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
  const configPath = join(
    process.cwd(),
    "src",
    "routes",
    "tools",
    "formbricks",
    "survey-config.json",
  );
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  console.log("✓ Saved survey-config.json");
}

/**
 * Update or add survey configuration
 */
export function updateSurveyConfig(survey: any): void {
  const config = loadSurveyConfig();

  if (!survey.id || !survey.name) {
    console.error("Survey missing id or name:", survey);
    return;
  }

  const questionMappings = generateQuestionMappings(survey);

  // Initialize surveys object if not exists
  if (!config.surveys) {
    config.surveys = {};
  }

  // Update or create survey entry
  config.surveys[survey.id] = {
    name: survey.name,
    emailSubject: config.surveys[survey.id]?.emailSubject || survey.name,
    emailMessage:
      config.surveys[survey.id]?.emailMessage ||
      `Beste collega,\n\nHierbij de link naar het formulier voor ${survey.name}. Vul dit formulier zo snel mogelijk in.\n\nKlik op deze knop "open het formulier" om het formulier te openen.\n\nAlvast bedankt voor het invullen!\n\nMet vriendelijke groet,\n\nTeam Hoi Pippeloi`,
    questions: questionMappings,
  };

  saveSurveyConfig(config);
}

/**
 * Generate config for all surveys
 */
export async function generateAllSurveysConfig(surveys: any[]): Promise<void> {
  const config: { surveys: Record<string, any> } = { surveys: {} };

  for (const survey of surveys) {
    if (!survey.id || !survey.name) {
      console.warn("Skipping survey missing id or name");
      continue;
    }

    const questionMappings = generateQuestionMappings(survey);

    // Merge with existing config (preserve emailSubject/emailMessage)
    config.surveys[survey.id] = {
      name: survey.name,
      emailSubject: survey.name,
      emailMessage: `Beste collega,\n\nHierbij de link naar het formulier voor ${survey.name}. Vul dit formulier zo snel mogelijk in.\n\nKlik op deze knop "open het formulier" om het formulier te openen.\n\nAlvast bedankt voor het invullen!\n\nMet vriendelijke groet,\n\nTeam Hoi Pippeloi`,
      questions: questionMappings,
    };
  }

  saveSurveyConfig(config);
}
