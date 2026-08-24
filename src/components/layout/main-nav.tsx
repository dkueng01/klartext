"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CalendarCheck2, LayoutDashboard, ListTodo, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { stackClientApp } from "@/stack/client";

export function MainNav() {
  const user = stackClientApp.useUser();
  const pathname = usePathname();

  const navItems = [
    {
      title: "Heute",
      href: "/",
      icon: CalendarCheck2,
    },
    {
      title: "Journal",
      href: "/journal",
      icon: LayoutDashboard,
    },
    {
      title: "Aufgaben",
      href: "/tasks",
      icon: ListTodo,
    },
  ];

  const navigationLinks = navItems.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      aria-label={item.title}
      aria-current={pathname === item.href ? "page" : undefined}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted hover:text-foreground",
        pathname === item.href ? "text-foreground" : "text-foreground/60"
      )}
    >
      <item.icon size={16} />
      <span>{item.title}</span>
    </Link>
  ));

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">

        {/* Logo & Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">
              Klartext<span className="text-primary">.</span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-2 font-medium sm:flex" aria-label="Hauptnavigation">
          {navigationLinks}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground"
            onClick={() => document.dispatchEvent(new CustomEvent("klartext:open-command-menu"))}
            aria-label="Befehlsmenü öffnen"
            title="Befehlsmenü öffnen (⌘K)"
          >
            <Search size={15} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Benutzermenü öffnen">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl!} alt={user?.displayName ? `Profilbild von ${user.displayName}` : "Profilbild"} />
                  <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.primaryEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => stackClientApp.signOut()} className="text-red-500">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-3 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-20px_rgba(0,0,0,0.5)] backdrop-blur sm:hidden"
        aria-label="Mobile Hauptnavigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors",
              pathname === item.href ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("size-5", pathname === item.href && "text-primary")} />
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
