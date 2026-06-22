/**
 * Platform-console UI shims. The shared kit (components/ui) is now the single
 * source of truth — these re-exports keep /sys imports stable while removing
 * the duplicated PlanBadge/Stat/SectionCard/ErrorNote implementations.
 */
export { Stat, SectionCard, ErrorNote, PlanBadge } from "@/components/ui";
