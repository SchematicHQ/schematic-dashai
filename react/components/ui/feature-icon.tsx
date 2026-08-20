"use client";

import {
  Box,
  Coins,
  Database,
  FileText,
  Flag,
  Folder,
  Gauge,
  Globe,
  Key,
  Mail,
  MessageSquare,
  Puzzle,
  Server,
  Sparkles,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Best-effort mapping from Schematic icon names to lucide icons; anything
 * unmapped falls back to a generic box.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  box: Box,
  coins: Coins,
  credit: Coins,
  database: Database,
  document: FileText,
  file: FileText,
  flag: Flag,
  folder: Folder,
  gauge: Gauge,
  globe: Globe,
  key: Key,
  mail: Mail,
  message: MessageSquare,
  puzzle: Puzzle,
  server: Server,
  sparkles: Sparkles,
  ai: Sparkles,
  team: Users,
  user: Users,
  users: Users,
  zap: Zap,
};

export function FeatureIcon({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) {
  const Icon = (icon && ICON_MAP[icon.toLowerCase()]) || Box;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  );
}
