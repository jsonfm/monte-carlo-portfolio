// Premium, modern fintech palette
export const ASSET_COLORS = [
  '#3b82f6', // Indigo Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber Orange
  '#8b5cf6', // Violet Purple
  '#06b6d4', // Cyan
  '#ec4899', // Rose Pink
  '#14b8a6', // Teal
  '#f43f5e', // Red
  '#6366f1', // Indigo Light
  '#a855f7', // Purple Light
];

export function getAssetColor(index: number): string {
  return ASSET_COLORS[index % ASSET_COLORS.length];
}
