import { addDays, nextFriday, nextMonday, set, startOfDay } from "date-fns";

export type Priority = "low" | "medium" | "high" | "none";

export interface ParsedResult {
  content: string; // Der bereinigte Text (ohne Metadaten-Schnipsel)
  type: "todo" | "note";
  tags: string[];
  priority: Priority;
  dueDate: Date | null;
}

export function parseInput(text: string): ParsedResult {
  let content = text;
  let type: "todo" | "note" = "note";
  const tags: string[] = [];
  let priority: Priority = "none";
  let dueDate: Date | null = null;

  // 1. Typ erkennen (Todo oder Note?)
  // Entfernt "todo", "task", "aufgabe" am Anfang (case insensitive)
  const todoRegex = /^(todo|task|aufgabe)\s+/i;
  if (todoRegex.test(content)) {
    type = "todo";
    content = content.replace(todoRegex, "");
  }

  // 2. Tags extrahieren (#projekt)
  const tagRegex = /#([\wäöüÄÖÜß-]+)/g;
  const foundTags = content.match(tagRegex);
  if (foundTags) {
    tags.push(...foundTags.map(t => t.substring(1))); // # entfernen
    // Wir entfernen die Tags NICHT aus dem Content, damit man den Kontext behält?
    // User Wunsch: "überall angeben". Meistens liest es sich besser, wenn sie weg sind, 
    // aber wir probieren mal: Wir entfernen sie für die saubere Ansicht.
    content = content.replace(tagRegex, "").trim();
  }

  // 3. Priorität extrahieren (!hoch, !wichtig)
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

  // 4. Datum extrahieren (@morgen, @freitag)
  // Das ist ein einfacher Parser. Für komplexe Dinge bräuchte man Libraries wie 'chrono-node'.
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