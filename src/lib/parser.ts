import { addDays, nextFriday, nextMonday, startOfDay } from "date-fns";

export type Priority = "low" | "medium" | "high" | "none";

export interface ParsedResult {
  content: string; // Der bereinigte Text (ohne Metadaten-Schnipsel)
  type: "todo" | "note";
  tags: string[];
  priority: Priority;
  dueDate: Date | null;
}

export function parseInput(text: string, defaultType: ParsedResult["type"] = "note"): ParsedResult {
  let content = text;
  let type: "todo" | "note" = defaultType;
  const tags: string[] = [];
  let priority: Priority = "none";
  let dueDate: Date | null = null;

  // 1. Typ erkennen (Todo oder Note?)
  // Entfernt "todo", "task", "aufgabe" am Anfang (case insensitive)
  const todoRegex = /^(todo|task|aufgabe)\s+/i;
  if (todoRegex.test(content)) {
    type = "todo";
    content = content.replace(todoRegex, "");
  } else {
    const noteRegex = /^(notiz|note)\s+/i;
    if (noteRegex.test(content)) {
      type = "note";
      content = content.replace(noteRegex, "");
    }
  }

  // 2. Bereiche extrahieren (#bereich)
  const tagRegex = /#([\wäöüÄÖÜß-]+)/g;
  const foundTags = content.match(tagRegex);
  if (foundTags) {
    tags.push(...foundTags.map(t => t.substring(1)));
    content = content.replace(tagRegex, "").trim();
  }

  // Priorität und Fälligkeit gehören nur zum Aufgabenmodell.
  if (type === "todo") {
    const prioHighRegex = /!(hoch|wichtig|high|1)/i;
    const prioMedRegex = /!(mittel|medium|2)/i;
    const prioLowRegex = /!(niedrig|low|3)/i;

    if (prioHighRegex.test(content)) {
      priority = "high";
      content = content.replace(prioHighRegex, "");
    } else if (prioMedRegex.test(content)) {
      priority = "medium";
      content = content.replace(prioMedRegex, "");
    } else if (prioLowRegex.test(content)) {
      priority = "low";
      content = content.replace(prioLowRegex, "");
    }

    const today = startOfDay(new Date());

    if (/@(heute|today)/i.test(content)) {
      dueDate = today;
      content = content.replace(/@(heute|today)/i, "");
    } else if (/@(morgen|tomorrow)/i.test(content)) {
      dueDate = addDays(today, 1);
      content = content.replace(/@(morgen|tomorrow)/i, "");
    } else if (/@(montag|monday)/i.test(content)) {
      dueDate = nextMonday(today);
      content = content.replace(/@(montag|monday)/i, "");
    } else if (/@(freitag|friday)/i.test(content)) {
      dueDate = nextFriday(today);
      content = content.replace(/@(freitag|friday)/i, "");
    }
  }

  // Clean up multiple spaces
  content = content.replace(/\s+/g, " ").trim();

  return {
    content,
    type,
    tags,
    priority,
    dueDate
  };
}
