"use client";

import { useState, useEffect } from "react";
import { inputSchema } from "@/lib/schema";
import { parseInput, ParsedResult } from "@/lib/parser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckSquare, StickyNote, Send, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface OmniBarProps {
  onAddItem: (parsed: ParsedResult) => void;
  allTags: string[];
}

export function OmniBar({ onAddItem, allTags }: OmniBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [parsedPreview, setParsedPreview] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
    setParsedPreview(parseInput(inputValue));
  }, [inputValue]);

  const handleSubmit = () => {
    // Strikte Validierung beim Absenden
    const validation = inputSchema.safeParse({ raw: inputValue });

    if (!validation.success) {
      return;
    }

    if (parsedPreview) {
      onAddItem(parsedPreview);
      setInputValue("");
      setParsedPreview(null);
      setError(null);
    }
  };

  const applySuggestion = (tag: string) => {
    const words = inputValue.split(" ");
    words.pop();
    setInputValue([...words, `#${tag} `].join(" "));
    // Refocus logic wäre hier gut
  };

  const getPrioColor = (prio: string) => {
    switch (prio) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-muted-foreground bg-secondary';
    }
  };

  return (
    <div className="relative z-20 space-y-2">
      <div className={`flex items-center gap-2 bg-background border rounded-md shadow-sm px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${error ? "border-red-500 ring-red-200" : ""}`}>
        <div className={`flex items-center justify-center w-6 h-6 rounded-sm shrink-0 transition-colors ${parsedPreview?.type === 'todo' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
          {parsedPreview?.type === 'todo' ? <CheckSquare size={14} /> : <StickyNote size={14} />}
        </div>
        <Input
          autoFocus
          className="flex-1 border-0 shadow-none focus-visible:ring-0 px-2 h-auto text-sm placeholder:text-muted-foreground"
          placeholder="Eingabe... (z.B. todo Design Review #projektA !hoch)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleSubmit}>
          <Send size={16} />
        </Button>
      </div>

      {/* Validation Error Message */}
      {error && <p className="text-xs text-red-500 px-1 animate-in slide-in-from-top-1">{error}</p>}

      {/* Preview Badges */}
      {parsedPreview && !error && (
        <div className="flex gap-2 ml-1 flex-wrap text-xs animate-in fade-in slide-in-from-top-1">
          {parsedPreview.tags.map(tag => (
            <Badge key={tag} variant="outline" className="border-primary/20 text-primary h-5 px-1.5 font-normal">#{tag}</Badge>
          ))}
          {parsedPreview.priority !== 'none' && (
            <Badge variant="outline" className={`${getPrioColor(parsedPreview.priority)} h-5 px-1.5 font-normal`}>!{parsedPreview.priority}</Badge>
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
            <button key={tag} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted" onClick={() => applySuggestion(tag)}>#{tag}</button>
          ))}
        </div>
      )}
    </div>
  );
}