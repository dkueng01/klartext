"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Filter,
  Flag,
  Calendar,
  Check,
  AlertCircle,
  Clock,
  ListFilter
} from "lucide-react";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  allTags: string[];
}

export function FilterBar({ allTags }: FilterBarProps) {
  const { activeTag, activePrio, activeDate, setFilter, clearFilters, hasFilters } = useUrlFilters();

  const countActive = [activePrio, activeDate].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full mask-fade-right">

        {/* 1. ADVANCED FILTER DROPDOWN */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn(
              "h-7 gap-1.5 px-2.5 shrink-0 border-dashed hover:border-solid hover:bg-muted/50 transition-all",
              countActive > 0 ? "bg-primary/5 border-primary/20 border-solid text-primary hover:bg-primary/10" : "text-muted-foreground"
            )}>
              <ListFilter size={14} />
              <span className="text-xs font-medium">Filter</span>
              {countActive > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-bold ml-0.5">
                  {countActive}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-1" align="start">

            {/* Section: Priority */}
            <div className="p-1">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground px-2 py-1.5 mb-0.5 flex items-center gap-1.5">
                <Flag size={10} /> Priorität
              </div>
              <div className="space-y-0.5">
                <FilterOption
                  label="Hoch"
                  icon={<Flag size={14} className="text-red-500 fill-red-500/10" />}
                  isActive={activePrio === 'high'}
                  onClick={() => setFilter('prio', activePrio === 'high' ? null : 'high')}
                />
                <FilterOption
                  label="Mittel"
                  icon={<Flag size={14} className="text-orange-500" />}
                  isActive={activePrio === 'medium'}
                  onClick={() => setFilter('prio', activePrio === 'medium' ? null : 'medium')}
                />
                <FilterOption
                  label="Niedrig"
                  icon={<Flag size={14} className="text-blue-500" />}
                  isActive={activePrio === 'low'}
                  onClick={() => setFilter('prio', activePrio === 'low' ? null : 'low')}
                />
              </div>
            </div>

            <Separator className="my-1" />

            {/* Section: Date */}
            <div className="p-1">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground px-2 py-1.5 mb-0.5 flex items-center gap-1.5">
                <Calendar size={10} /> Datum
              </div>
              <div className="space-y-0.5">
                <FilterOption
                  label="Überfällig"
                  icon={<AlertCircle size={14} className="text-destructive" />}
                  isActive={activeDate === 'overdue'}
                  onClick={() => setFilter('date', activeDate === 'overdue' ? null : 'overdue')}
                />
                <FilterOption
                  label="Heute fällig"
                  icon={<Clock size={14} className="text-green-600" />}
                  isActive={activeDate === 'today'}
                  onClick={() => setFilter('date', activeDate === 'today' ? null : 'today')}
                />
              </div>
            </div>

            {/* Footer: Clear */}
            {(activePrio || activeDate) && (
              <>
                <Separator className="my-1" />
                <div className="p-1">
                  <Button
                    variant="ghost"
                    className="w-full h-8 text-xs justify-center hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                    onClick={() => { setFilter('prio', null); setFilter('date', null); }}
                  >
                    Auswahl zurücksetzen
                  </Button>
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-5 shrink-0 mx-1" />

        {/* 2. TAGS LIST */}
        <Button
          variant={activeTag === null ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setFilter('tag', null)}
          className="rounded-full h-7 text-xs px-3 shrink-0"
        >
          Alle
        </Button>

        {allTags.map(tag => (
          <Button
            key={tag}
            variant={activeTag === tag ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('tag', activeTag === tag ? null : tag)}
            className={cn(
              "rounded-full h-7 text-xs px-3 shrink-0 transition-all",
              activeTag === tag ? "" : "border-dashed text-muted-foreground hover:text-foreground"
            )}
          >
            #{tag}
          </Button>
        ))}

        {/* 3. GLOBAL RESET */}
        {hasFilters && (
          <div className="pl-2 sticky right-0 bg-gradient-to-l from-background via-background to-transparent pl-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
              onClick={clearFilters}
            >
              <X size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-Component für eine einzelne Zeile im Dropdown (DRY Principle)
function FilterOption({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "w-full justify-start h-8 px-2 text-xs font-normal relative transition-colors",
        isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="mr-2.5 flex items-center justify-center w-4">
        {icon}
      </div>
      <span>{label}</span>
      {isActive && <Check size={12} className="ml-auto text-primary" />}
    </Button>
  )
}