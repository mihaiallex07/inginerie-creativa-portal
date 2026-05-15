import { cn } from "@/lib/utils";

// Fixed color palette used across the entire application
// No free color pickers — only these 7 predefined colors
export const PALETTE_COLORS = [
  "#3B82F6", // blue
  "#FFCB09", // yellow (IC brand)
  "#22C55E", // green
  "#EF4444", // red
  "#A855F7", // purple
  "#F97316", // orange
  "#EC4899", // pink
];

interface ColorPaletteProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPalette({ value, onChange, className }: ColorPaletteProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {PALETTE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "w-8 h-8 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none",
            value === color
              ? "ring-2 ring-offset-2 ring-black scale-110"
              : "ring-1 ring-transparent"
          )}
          style={{ backgroundColor: color }}
          title={color}
          aria-label={`Culoare ${color}`}
        />
      ))}
    </div>
  );
}
