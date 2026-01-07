"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes"; // Für Dark Mode
import {
  LayoutDashboard,
  KanbanSquare,
  Settings,
  Plus,
  Moon,
  Sun,
  Laptop,
  Hash,
  Search
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  // --- 1. Hotkey Listener (CMD+K) ---
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  // --- 2. Tags auslesen (Kleiner Hack für Client-Side Only) ---
  // Da wir keine globale Datenbank im Context haben (noch nicht), 
  // lesen wir die Tags einmalig beim Öffnen aus dem LocalStorage
  const [knownTags, setKnownTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      const saved = localStorage.getItem("klartext-data");
      if (saved) {
        try {
          const items = JSON.parse(saved);
          const tags = new Set<string>();
          items.forEach((i: any) => i.tags?.forEach((t: string) => tags.add(t)));
          setKnownTags(Array.from(tags).sort());
        } catch (e) { }
      }
    }
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Was möchtest du tun?" />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse.</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Gehe zu">
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Journal</span>
            <CommandShortcut>⌃J</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/projects"))}>
            <KanbanSquare className="mr-2 h-4 w-4" />
            <span>Projekte</span>
            <CommandShortcut>⌃P</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Aktionen */}
        <CommandGroup heading="Aktionen">
          <CommandItem onSelect={() => runCommand(() => {
            // Fokus auf OmniBar setzen (DOM Hack, aber effizient)
            const input = document.querySelector('input[placeholder*="Eingabe"]') as HTMLInputElement;
            if (input) {
              input.focus();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              // Wenn wir nicht auf der Home Page sind, geh erst hin
              router.push("/");
              setTimeout(() => {
                const inputAfterNav = document.querySelector('input[placeholder*="Eingabe"]') as HTMLInputElement;
                if (inputAfterNav) inputAfterNav.focus();
              }, 100);
            }
          })}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Neuen Eintrag erstellen...</span>
            <CommandShortcut>⌃N</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => {
            // Simulierter Klick auf Search Button (Filter löschen)
            // In einer echten App würden wir Global State nutzen
            router.push("/");
          })}>
            <Search className="mr-2 h-4 w-4" />
            <span>Alle Filter zurücksetzen</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Dynamische Projekte / Tags */}
        {knownTags.length > 0 && (
          <CommandGroup heading="Projekte filtern">
            {knownTags.map(tag => (
              <CommandItem key={tag} onSelect={() => runCommand(() => {
                // Da wir State nicht global haben, nutzen wir URL params oder simple Navigation
                // Wir navigieren zur Projektseite und könnten (theoretisch) filtern
                // Für jetzt: Einfach nur zur Projektseite
                router.push("/projects");
                // TODO: Implementiere URL Query Params für Filter (z.B. /projects?tag=arbeit)
              })}>
                <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{tag}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Theme Switcher */}
        <CommandGroup heading="Erscheinungsbild">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Hell</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dunkel</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>System</span>
          </CommandItem>
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
}