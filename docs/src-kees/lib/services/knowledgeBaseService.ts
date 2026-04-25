/**
 * Knowledge Base Service
 *
 * Loads, chunks, and searches documentation for LLM context injection.
 * Documents are stored in /static/docs/ as markdown files with H2 chunk boundaries.
 *
 * Architecture:
 * 1. On first query, load all markdown docs from /static/docs/
 * 2. Parse each doc into chunks (split on H2 boundaries)
 * 3. Extract metadata from H1 + blockquote header
 * 4. Keyword search with Dutch + English term matching
 * 5. Return top-K chunks that fit within the token budget
 */

// ============================================
// Types
// ============================================

export interface DocChunk {
  /** Unique ID for this chunk (file-stem + heading slug) */
  id: string;
  /** Source file path relative to /static/docs/ */
  file: string;
  /** H2 heading text */
  heading: string;
  /** Primary route path from metadata */
  path: string;
  /** Auth requirement from metadata */
  auth: string;
  /** Related topic filenames from metadata */
  related: string[];
  /** The markdown content of this chunk */
  content: string;
  /** Extracted keywords for search */
  keywords: string[];
  /** Estimated token count */
  tokenEstimate: number;
}

export interface DocFile {
  /** Relative path from /static/docs/ */
  path: string;
  /** H1 heading */
  title: string;
  /** Metadata: primary route path */
  pathMeta: string;
  /** Metadata: auth requirement */
  auth: string;
  /** Metadata: role */
  role: string;
  /** Metadata: related topics */
  related: string[];
  /** Parsed chunks */
  chunks: DocChunk[];
}

export interface SearchResult {
  chunk: DocChunk;
  score: number;
}

export interface KnowledgeContext {
  /** The assembled context text */
  context: string;
  /** Which chunks were used */
  usedChunks: DocChunk[];
  /** Total estimated tokens */
  totalTokens: number;
  /** Whether the KB was loaded */
  loaded: boolean;
}

// ============================================
// Configuration
// ============================================

const DOCS_BASE_PATH = "/docs";

/** All doc files to load, organized by category */
const DOC_FILES = [
  // App documentation
  "app/overview.md",
  "app/authentication.md",
  "app/cases.md",
  "app/work.md",
  "app/processes.md",
  "app/projects.md",
  "app/messages.md",
  "app/account.md",
  "app/help.md",
  // End-to-end flows
  "flows/create-case.md",
  "flows/plan-work.md",
  "flows/invite-user.md",
  "flows/manage-project.md",
  "flows/share-externally.md",
  "flows/using-help.md",
  "flows/managing-tasks.md",
  // Route reference
  "routes/route-summary.md",
] as const;

/** Maximum tokens for retrieved chunks */
const MAX_CONTEXT_TOKENS = 1500;

/** Average characters per token (rough estimate for Dutch/English mixed text) */
const CHARS_PER_TOKEN = 3.5;

/** Minimum search score to include a chunk */
const MIN_SEARCH_SCORE = 0.5;

/** Maximum number of chunks to return */
const MAX_CHUNKS = 4;

// ============================================
// Dutch ↔ English keyword mappings
// ============================================

/** Common Dutch-English term pairs for search expansion */
const DUTCH_ENGLISH_MAP: Record<string, string[]> = {
  // Core concepts
  proces: ["process", "workflow", "template", "sjabloon"],
  zaak: ["case", "dossier", "matter", "instance"],
  werkitem: ["work item", "task", "taak", "opdracht"],
  project: ["project"],
  bericht: ["message", "notification", "melding"],
  case: ["zaak", "dossier", "matter"],
  task: ["taak", "werkitem", "opdracht"],
  // Actions
  aanmaken: ["create", "nieuw", "new", "add", "toevoegen"],
  bewerken: ["edit", "wijzigen", "change", "update", "aanpassen"],
  verwijderen: ["delete", "remove", "verwijder", "archive", "archiveren"],
  zoeken: ["search", "filter", "find", "vind", "filteren"],
  delen: ["share", "public", "extern", "delen"],
  afmaken: ["complete", "finish", "afgerond", "done", "voltooien"],
  plannen: ["plan", "schedule", "planning", "kalender"],
  toewijzen: ["assign", "toewijzing", "owner", "eigenaar"],
  // Views
  overzicht: ["list", "overview", "dashboard", "grid"],
  detail: ["detail", "detailpagina", "page"],
  kanban: ["board", "planning", "bord"],
  backlog: ["backlog", "niet-gepland", "unplanned"],
  heatmap: ["heatmap", "kalender", "calendar", "mijn werk", "my work"],
  // Navigation
  inloggen: ["login", "auth", "authenticate", "aanmelden"],
  registreren: ["register", "signup", "inschrijven", "uitnodiging", "invite"],
  wachtwoord: ["password", "reset", "vergeten", "forgot"],
  // Status
  nieuw: ["new", "open", "nieuw"],
  "mee bezig": ["in progress", "active", "mee_bezig"],
  review: ["review", "controle", "checked"],
  afgerond: ["completed", "done", "closed", "afgesloten", "voltooid"],
  // Entities
  stap: ["step", "fase", "phase"],
  eigenaar: ["owner", "verantwoordelijke"],
  deadline: ["deadline", "due date", "einddatum"],
  uren: ["hours", "time", "tijd"],
  permissie: ["permission", "recht", "role", "rol"],
  rol: ["role", "functie"],
  // Misc
  help: ["help", "ondersteuning", "support", "ticket"],
  rapport: ["report", "rapportage"],
  admin: ["admin", "beheer", "management", "sysadmin"],
  bestand: ["file", "bijlage", "attachment", "upload"],
  notitie: ["note", "comment", "opmerking"],
};

// ============================================
// State
// ============================================

let docFiles: DocFile[] = [];
let allChunks: DocChunk[] = [];
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

// ============================================
// Parsing
// ============================================

/**
 * Parse a markdown document into a DocFile with chunks.
 * Splits on H2 boundaries, extracts metadata from H1 + blockquote.
 */
function parseDocument(markdown: string, filePath: string): DocFile {
  const lines = markdown.split("\n");

  // Extract H1 title
  const h1Match = lines.find((l) => l.startsWith("# "));
  const title = h1Match ? h1Match.replace(/^#\s+/, "").trim() : filePath;

  // Extract metadata from blockquote lines
  let pathMeta = "";
  let auth = "protected";
  let role = "any authenticated user";
  const related: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(">")) break;

    const content = trimmed.replace(/^>\s*/, "");

    const pathMatch = content.match(/\*\*Path:\*\*\s*`?([^`*\n]+)`?/);
    if (pathMatch) pathMeta = pathMatch[1].trim();

    const authMatch = content.match(/\*\*Auth:\*\*\s*(\S+)/);
    if (authMatch) auth = authMatch[1];

    const roleMatch = content.match(/\*\*Role:\*\*\s*(.+?)(?:\s*$)/);
    if (roleMatch) role = roleMatch[1].trim();

    const relatedMatch = content.match(/\*\*Related:\*\*\s*(.+)/);
    if (relatedMatch) {
      relatedMatch[1].split(",").forEach((r: string) => {
        const cleaned = r.trim().replace(/\.md$/, "");
        if (cleaned) related.push(cleaned);
      });
    }
  }

  // Split into H2 chunks
  const chunks: DocChunk[] = [];
  let currentHeading = "";
  let currentContent: string[] = [];
  const fileStem = filePath.replace(/\.md$/, "").replace(/\//g, "-");

  const flushChunk = () => {
    if (currentHeading && currentContent.length > 0) {
      const content = currentContent.join("\n").trim();
      const keywords = extractKeywords(content);
      const tokenEstimate = Math.ceil(content.length / CHARS_PER_TOKEN);

      chunks.push({
        id: `${fileStem}--${slugify(currentHeading)}`,
        file: filePath,
        heading: currentHeading,
        path: pathMeta,
        auth,
        related: [...related],
        content,
        keywords,
        tokenEstimate,
      });
    }
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      // Flush previous chunk
      flushChunk();

      // Start new chunk
      currentHeading = line.replace(/^##\s+/, "").trim();
      currentContent = [line];
    } else if (currentHeading) {
      currentContent.push(line);
    }
  }

  // Flush last chunk
  flushChunk();

  return {
    path: filePath,
    title,
    pathMeta,
    auth,
    role,
    related,
    chunks,
  };
}

/**
 * Create a URL-friendly slug from a heading
 */
function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

/**
 * Extract searchable keywords from text content
 */
function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();

  // Split into words, normalize
  const words = text
    .toLowerCase()
    .replace(/[^\w\sÀ-ÿ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  for (const word of words) {
    keywords.add(word);

    // Expand with Dutch-English mappings
    const expanded = DUTCH_ENGLISH_MAP[word];
    if (expanded) {
      for (const term of expanded) {
        keywords.add(term.toLowerCase());
        // Also add individual words from multi-word terms
        term.split(/\s+/).forEach((t) => {
          if (t.length >= 2) keywords.add(t.toLowerCase());
        });
      }
    }
  }

  return Array.from(keywords);
}

// ============================================
// Loading
// ============================================

/**
 * Load all documentation files from the static docs directory.
 * Safe to call multiple times — will only load once.
 */
export async function loadKnowledgeBase(): Promise<void> {
  if (isLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const files: DocFile[] = [];
    const chunks: DocChunk[] = [];

    const results = await Promise.allSettled(
      DOC_FILES.map(async (filePath) => {
        const url = `${DOCS_BASE_PATH}/${filePath}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`[KB] Failed to load ${url}: ${response.status}`);
          return null;
        }

        const markdown = await response.text();
        const docFile = parseDocument(markdown, filePath);
        return docFile;
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        const docFile = result.value;
        files.push(docFile);
        chunks.push(...docFile.chunks);
      }
    }

    docFiles = files;
    allChunks = chunks;
    isLoaded = true;

    console.log(
      `[KB] Loaded ${files.length} files with ${chunks.length} chunks`,
    );
  })();

  return loadPromise;
}

/**
 * Check if the knowledge base is loaded
 */
export function isKnowledgeBaseLoaded(): boolean {
  return isLoaded;
}

/**
 * Get all loaded chunks (for debugging/inspection)
 */
export function getAllChunks(): DocChunk[] {
  return [...allChunks];
}

/**
 * Get all loaded doc files (for debugging/inspection)
 */
export function getDocFiles(): DocFile[] {
  return [...docFiles];
}

// ============================================
// Search
// ============================================

/**
 * Tokenize a query string into searchable terms
 */
function tokenizeQuery(query: string): string[] {
  const terms = new Set<string>();

  const words = query
    .toLowerCase()
    .replace(/[^\w\sÀ-ÿ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  for (const word of words) {
    terms.add(word);

    // Expand with Dutch-English mappings
    const expanded = DUTCH_ENGLISH_MAP[word];
    if (expanded) {
      for (const term of expanded) {
        terms.add(term.toLowerCase());
        term.split(/\s+/).forEach((t) => {
          if (t.length >= 2) terms.add(t.toLowerCase());
        });
      }
    }
  }

  return Array.from(terms);
}

/**
 * Calculate a search score for a chunk given query terms.
 * Uses a simplified TF-IDF-like approach:
 * - Term frequency in the chunk
 * - Bonus for matches in heading
 * - Bonus for matches in metadata keywords
 * - Bonus for exact heading match
 * - Penalty for very long chunks (prefer concise)
 */
function scoreChunk(chunk: DocChunk, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0;

  let score = 0;
  const headingLower = chunk.heading.toLowerCase();
  const contentLower = chunk.content.toLowerCase();

  for (const term of queryTerms) {
    // Count occurrences in content
    const contentMatches = (
      contentLower.match(new RegExp(escapeRegex(term), "g")) || []
    ).length;
    if (contentMatches > 0) {
      score += Math.min(contentMatches, 5); // Cap at 5 to avoid long chunks dominating
    }

    // Bonus for heading match (2x weight)
    if (headingLower.includes(term)) {
      score += 3;
    }

    // Bonus for keyword match
    if (chunk.keywords.includes(term)) {
      score += 2;
    }

    // Bonus for path match
    if (chunk.path.toLowerCase().includes(term)) {
      score += 2;
    }
  }

  // Exact heading match bonus
  const queryLower = queryTerms.join(" ");
  if (headingLower === queryLower) {
    score += 10;
  }

  // Partial heading match bonus
  if (queryTerms.every((t) => headingLower.includes(t))) {
    score += 5;
  }

  // Length penalty: prefer concise chunks (normalize by sqrt of token estimate)
  if (chunk.tokenEstimate > 0) {
    score = score / Math.sqrt(chunk.tokenEstimate / 100);
  }

  return score;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Search the knowledge base for chunks relevant to a query.
 * Returns scored results sorted by relevance.
 */
export async function searchKnowledgeBase(
  query: string,
  options?: {
    maxChunks?: number;
    maxTokens?: number;
    minScore?: number;
  },
): Promise<SearchResult[]> {
  await loadKnowledgeBase();

  if (allChunks.length === 0) {
    console.warn("[KB] No chunks loaded, search will return empty");
    return [];
  }

  const maxChunks = options?.maxChunks ?? MAX_CHUNKS;
  const maxTokens = options?.maxTokens ?? MAX_CONTEXT_TOKENS;
  const minScore = options?.minScore ?? MIN_SEARCH_SCORE;

  const queryTerms = tokenizeQuery(query);

  // Score all chunks
  const scored: SearchResult[] = allChunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, queryTerms),
    }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score);

  // Select chunks within token budget
  const selected: SearchResult[] = [];
  let usedTokens = 0;

  for (const result of scored) {
    if (selected.length >= maxChunks) break;
    if (usedTokens + result.chunk.tokenEstimate > maxTokens) break;

    selected.push(result);
    usedTokens += result.chunk.tokenEstimate;
  }

  return selected;
}

// ============================================
// Context Building
// ============================================

const SYSTEM_PERSONA = `Je bent Sjoerd, een behulpzame AI-assistent voor de applicatie Hoi Pippeloi. Je helpt gebruikers met vragen over hoe de applicatie werkt.

SCHRIJFSTIJL — spreek de taal van de gebruiker:
- Gebruik gewone mensentaal, geen technische termen.
- Beschrijf wat de gebruiker ZIET en DOET in de interface, niet wat er achter de schermen gebeurt.
- Gebruik knop- en labelnamen precies zoals ze in de interface staan (bijv. "Nieuwe Case", "Opslaan", "Alleen mijn taken").
- Geef korte, genummerde stappen die de gebruiker kan volgen.
- Vermeld pagina's als "Ga naar Cases" of "Open het Werkoverzicht" — geen URL's, geen routes.

REGELS:
1. Antwoord ALTIJD in het Nederlands.
2. Wees beknopt en helder. Geen onnodige details.
3. Gebruik ALLEEN informatie uit de verstrekte kennisbank. Verzin niets.
4. Als je het antwoord niet weet: "Dat weet ik niet zeker. Neem contact op met een beheerder of kijk in de applicatie."
5. Als een gebruiker vraagt hoe iets werkt, geef genummerde stappen.

NIET DELEN IN JE ANTWOORD:
- Geen servicenamen (caseService, taskService, etc.)
- Geen interne veldnamen (kanban_status, from_task_id, order_index, etc.)
- Geen URL-patronen met parameters (/cases/[id], /work/[id], etc.)
- Geen .md-bestandsverwijzingen (processes.md, cases.md, etc.)
- Geen localhost-URL's of volledige URL's
- Geen permissie-strings (requirePermission, etc.)
- Geen API-endpoints of technische implementatiedetails

WEL DELEN:
- Paginanamen zoals "Cases", "Werk", "Projecten", "Mijn werk"
- Zichtbare knoppen en labels zoals "Nieuwe Case", "Opslaan", "Filter"
- Korte stappen die de gebruiker direct kan volgen`;

/**
 * Build the full system prompt with knowledge base context for a given user query.
 *
 * This is the main entry point for the Sjoerd chat integration.
 * It loads the KB, searches for relevant chunks, and assembles
 * a system prompt with persona + retrieved context.
 */
export async function buildSystemPrompt(
  userQuery: string,
  conversationHistory: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>,
): Promise<KnowledgeContext> {
  await loadKnowledgeBase();

  // Search for relevant chunks
  const results = await searchKnowledgeBase(userQuery);

  // Also search for topics mentioned in recent conversation
  const recentMessages = conversationHistory.slice(-4);
  const recentContent = recentMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");

  let extraResults: SearchResult[] = [];
  if (recentContent && recentContent !== userQuery) {
    extraResults = await searchKnowledgeBase(recentContent, {
      maxChunks: 2,
      maxTokens: 500,
      minScore: 1.0,
    });
  }

  // Merge results, deduplicating by chunk ID
  const seenIds = new Set<string>();
  const allResults: SearchResult[] = [];

  for (const r of results) {
    if (!seenIds.has(r.chunk.id)) {
      seenIds.add(r.chunk.id);
      allResults.push(r);
    }
  }
  for (const r of extraResults) {
    if (!seenIds.has(r.chunk.id)) {
      seenIds.add(r.chunk.id);
      allResults.push(r);
    }
  }

  // Build context sections
  const contextSections: string[] = [];
  let totalTokens = 0;

  for (const result of allResults) {
    const chunk = result.chunk;
    // Sanitize chunk content: remove internal references the LLM should not repeat
    const sanitizedContent = chunk.content
      .replace(/\[`?\w+Service\.\w+`?\]/g, "") // Remove service calls like `caseService.getAllCases`
      .replace(/`?\w+Service\.\w+`?/g, "") // Remove standalone service calls
      .replace(/\[?\w+Service\.\w+\]?/g, "") // Remove service calls without backticks
      .replace(/requirePermission\([^)]+\)/g, "") // Remove permission strings
      .replace(/\/\w+\/\[\w+\]/g, (m) => m.replace(/\/\[\w+\]/g, "")) // Strip /[id] param from routes like /cases/[id]
      .replace(/\[.*?\]\(.*?\.md\)/g, "") // Remove .md cross-references like [processes](processes.md)
      .replace(/\b\w+\.md\b/g, "") // Remove standalone .md references like processes.md
      .replace(/`+\w+`+/g, (m) => {
        // Remove backtick-wrapped internal field names
        const knownInternal = [
          "kanban_status",
          "from_task_id",
          "order_index",
          "start_days_offset",
          "completion_days",
          "processId",
          "stepCount",
          "taskCount",
          "totalHours",
          "komt_van",
          "task_type",
          "kanban_order",
        ];
        const inner = m.replace(/`/g, "");
        return knownInternal.includes(inner) ? "" : m;
      })
      .replace(/\n{3,}/g, "\n\n") // Collapse excessive blank lines
      .trim();

    const section = `### ${chunk.heading}\n\n${sanitizedContent}`;

    const sectionTokens = Math.ceil(section.length / CHARS_PER_TOKEN);
    if (totalTokens + sectionTokens > MAX_CONTEXT_TOKENS) break;

    contextSections.push(section);
    totalTokens += sectionTokens;
  }

  const contextText =
    contextSections.length > 0
      ? `\n\n## Kennisbank\n\nDe volgende informatie is relevant voor de vraag. Beschrijf alleen wat de gebruiker ZIET en DOET in de interface. Geen interne details.\n\n${contextSections.join("\n\n---\n\n")}`
      : "";

  const fullSystemPrompt = SYSTEM_PERSONA + contextText;

  return {
    context: fullSystemPrompt,
    usedChunks: allResults.map((r) => r.chunk),
    totalTokens:
      totalTokens + Math.ceil(SYSTEM_PERSONA.length / CHARS_PER_TOKEN),
    loaded: isLoaded,
  };
}

/**
 * Quick check: does the knowledge base have any content about a topic?
 */
export async function hasKnowledgeAbout(topic: string): Promise<boolean> {
  const results = await searchKnowledgeBase(topic, {
    maxChunks: 1,
    maxTokens: 100,
    minScore: 1.0,
  });
  return results.length > 0;
}

/**
 * Get a summary of the knowledge base status for debugging
 */
export function getKnowledgeBaseStatus(): {
  loaded: boolean;
  fileCount: number;
  chunkCount: number;
  totalTokens: number;
  files: string[];
} {
  return {
    loaded: isLoaded,
    fileCount: docFiles.length,
    chunkCount: allChunks.length,
    totalTokens: allChunks.reduce((sum, c) => sum + c.tokenEstimate, 0),
    files: docFiles.map((f) => f.path),
  };
}
