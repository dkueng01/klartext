"use client";

import { useState, useEffect, useId, useRef } from "react";
import { inputSchema, Item } from "@/lib/schema";
import { parseInput, ParsedResult } from "@/lib/parser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckSquare, StickyNote, Send, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface OmniBarProps {
  onAddItem: (parsed: ParsedResult) => void;
  allTags: string[];
  defaultType?: Item["type"];
}

export function OmniBar({ onAddItem, allTags, defaultType = "note" }: OmniBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [inputValue, setInputValue] = useState("");
  const [parsedPreview, setParsedPreview] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [entryType, setEntryType] = useState<Item["type"]>(defaultType);

  useEffect(() => {
    const selectEntryType = (event: Event) => {
      const type = (event as CustomEvent<Item["type"]>).detail;
      if (type !== "todo" && type !== "note") return;
      setEntryType(type);
      requestAnimationFrame(() => inputRef.current?.focus());
    };

    document.addEventListener("klartext:set-entry-type", selectEntryType);
    return () => document.removeEventListener("klartext:set-entry-type", selectEntryType);
  }, []);

  // Autocomplete Logic
  useEffect(() => {
    const words = inputValue.split(" ");
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("#")) {
      const search = lastWord.substring(1).toLowerCase();
      setSuggestions(allTags.filter(t => t.toLowerCase().startsWith(search) && t.toLowerCase() !== search));
    } else {
      setSuggestions([]);
    }
  }, [inputValue, allTags]);

  // Live Parsing & Validation
  useEffect(() => {
    setError(null);
    if (!inputValue.trim()) {
      setParsedPreview(null);
      return;
    }

    // 1. Zod Validation (Pre-Parse)
    const result = inputSchema.safeParse({ raw: inputValue });
    if (!result.success) {
      return;
    }

    // 2. Business Logic Parsing
    setParsedPreview(parseInput(inputValue, entryType));
  }, [inputValue, entryType]);

  const handleSubmit = () => {
    // Strikte Validierung beim Absenden
    const validation = inputSchema.safeParse({ raw: inputValue });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Bitte überprüfe deine Eingabe.");
      return;
    }

    onAddItem(parseInput(inputValue, entryType));
    setInputValue("");
    setParsedPreview(null);
    setError(null);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (/^(todo|task|aufgabe)\s+/i.test(value)) setEntryType("todo");
    if (/^(notiz|note)\s+/i.test(value)) setEntryType("note");
  };

  const applySuggestion = (tag: string) => {
    const words = inputValue.split(" ");
    words.pop();
    setInputValue([...words, `#${tag} `].join(" "));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const getPrioColor = (prio: string) => {
    switch (prio) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-muted-foreground bg-secondary';
    }
  };

  const getPrioLabel = (prio: ParsedResult["priority"]) => {
    switch (prio) {
      case "high": return "hoch";
      case "medium": return "mittel";
      case "low": return "niedrig";
      default: return "keine";
    }
  };

  return (
    <div className="relative z-20 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-muted p-1" role="group" aria-label="Art des neuen Eintrags">
          <Button
            type="button"
            variant={entryType === "todo" ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-7 px-2.5 text-xs", entryType === "todo" && "bg-background shadow-sm")}
            onClick={() => setEntryType("todo")}
            aria-pressed={entryType === "todo"}
          >
            <CheckSquare /> Aufgabe
          </Button>
          <Button
            type="button"
            variant={entryType === "note" ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-7 px-2.5 text-xs", entryType === "note" && "bg-background shadow-sm")}
            onClick={() => setEntryType("note")}
            aria-pressed={entryType === "note"}
          >
            <StickyNote /> Notiz
          </Button>
        </div>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">#Bereich · !Priorität · @Datum</span>
      </div>

      <div className={`flex items-center gap-2 bg-background border rounded-md shadow-sm px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${error ? "border-red-500 ring-red-200" : ""}`}>
        <div className={`flex items-center justify-center w-6 h-6 rounded-sm shrink-0 transition-colors ${(parsedPreview?.type ?? entryType) === 'todo' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
          {(parsedPreview?.type ?? entryType) === 'todo' ? <CheckSquare size={14} /> : <StickyNote size={14} />}
          <span className="sr-only">{(parsedPreview?.type ?? entryType) === "todo" ? "Aufgabe" : "Notiz"}</span>
        </div>
        <Input
          ref={inputRef}
          data-quick-capture="true"
          autoFocus
          className="flex-1 border-0 shadow-none focus-visible:ring-0 px-2 h-auto text-sm placeholder:text-muted-foreground"
          placeholder={entryType === "todo" ? "Was möchtest du erledigen?" : "Was möchtest du festhalten?"}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          aria-label={entryType === "todo" ? "Neue Aufgabe" : "Neue Notiz"}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={handleSubmit}
          aria-label={entryType === "todo" ? "Aufgabe speichern" : "Notiz speichern"}
        >
          <Send size={16} />
        </Button>
      </div>

      {/* Validation Error Message */}
      {error && <p id={errorId} role="alert" className="text-xs text-red-500 px-1 animate-in slide-in-from-top-1">{error}</p>}

      {/* Preview Badges */}
      {parsedPreview && !error && (
        <div className="flex gap-2 ml-1 flex-wrap text-xs animate-in fade-in slide-in-from-top-1">
          {parsedPreview.tags.map(tag => (
            <Badge key={tag} variant="outline" className="border-primary/20 text-primary h-5 px-1.5 font-normal">#{tag}</Badge>
          ))}
          {parsedPreview.priority !== 'none' && (
            <Badge variant="outline" className={`${getPrioColor(parsedPreview.priority)} h-5 px-1.5 font-normal`}>!{getPrioLabel(parsedPreview.priority)}</Badge>
          )}
          {parsedPreview.dueDate && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 h-5 px-1.5 font-normal">
              <Calendar size={10} className="mr-1" /> {format(parsedPreview.dueDate, "dd.MM.", { locale: de })}
            </Badge>
          )}
        </div>
      )}

      {/* Suggestions Popover */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-8 mt-1 w-48 bg-popover border rounded-md shadow-md py-1 z-50">
          {suggestions.map(tag => (
            <button type="button" key={tag} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted" onClick={() => applySuggestion(tag)}>#{tag}</button>
          ))}
        </div>
      )}
    </div>
  );
}
