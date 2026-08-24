"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CalendarCheck2,
  LayoutDashboard,
  KanbanSquare,
  Plus,
  Moon,
  Sun,
  Laptop,
  Search,
  LogOut
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useStackApp } from "@stackframe/stack";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const app = useStackApp(); // Für Logout

  React.useEffect(() => {
    const openMenu = () => setOpen(true);
    document.addEventListener("klartext:open-command-menu", openMenu);
    return () => document.removeEventListener("klartext:open-command-menu", openMenu);
  }, []);

  // --- ACTIONS ---

  const actions = React.useMemo(() => ({
    gotoToday: () => router.push("/"),
    gotoJournal: () => router.push("/journal"),
    gotoProjects: () => router.push("/projects"),
    newItem: () => {
      // Die Schnellablage liegt auf der Heute-Seite.
      if (window.location.pathname !== "/") {
        router.push("/");
        // Kleines Timeout damit React Zeit hat zu rendern
        setTimeout(() => focusInput(), 100);
      } else {
        focusInput();
      }
    },
    resetFilter: () => router.push(pathname),
    logout: () => app.signOut(),
  }), [router, app, pathname]);

  // Helper um Input zu finden
  const focusInput = () => {
    const input = document.querySelector('input[placeholder*="Eingabe"]') as HTMLInputElement;
    if (input) {
      input.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);


  // --- GLOBAL SHORTCUTS REGISTRATION ---

  // Toggle Menu: CMD+K
  useHotkeys("k", () => setOpen((open) => !open));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Suche nach Befehlen..." />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(actions.gotoToday)}>
            <CalendarCheck2 className="mr-2 h-4 w-4" />
            <span>Heute</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(actions.gotoJournal)}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Journal</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(actions.gotoProjects)}>
            <KanbanSquare className="mr-2 h-4 w-4" />
            <span>Projekte</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Aktionen">
          <CommandItem onSelect={() => runCommand(actions.newItem)}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Neuer Eintrag...</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(actions.resetFilter)}>
            <Search className="mr-2 h-4 w-4" />
            <span>Filter zurücksetzen</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

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

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => runCommand(actions.logout)}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Abmelden</span>
          </CommandItem>
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
}
