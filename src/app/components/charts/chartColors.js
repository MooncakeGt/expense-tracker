export const chartPalette = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef"];
export const incomeColor = "#16a34a";
export const expenseColor = "#ef4444";
export const accentColor = "#3b82f6";
export const neutralColor = "#64748b";

export const categoryColor = tag => {
    let hash = 0;
    for (const character of tag) hash = (hash * 31 + character.codePointAt(0)) >>> 0;
    return chartPalette[hash % chartPalette.length];
};
