import { z } from "zod";

export const DEFAULT_PERCENTAGES = Object.freeze({ needs: 50, wants: 30, savings: 20 });
export const allocationGroupSchema = z.enum(["needs", "wants", "savings", "unassigned"]);
const percentageSchema = z.number().finite().min(0, "Percentage cannot be below 0.").max(100, "Percentage cannot exceed 100.");

export const percentagesSchema = z.object({
    needs: percentageSchema,
    wants: percentageSchema,
    savings: percentageSchema,
}).refine(value => Math.abs(value.needs + value.wants + value.savings - 100) < 0.000001, {
    message: "Needs, Wants, and Savings must total 100%.", path: ["total"],
});

export const plannerSettingsSchema = z.object({
    percentages: percentagesSchema,
    categoryOverrides: z.record(z.string().trim().min(1), allocationGroupSchema),
});

const parsePercentage = value => typeof value === "string" && /^(?:\d+\.?\d*|\.\d+)$/.test(value.trim())
    ? Number(value.trim()) : value;

export const validatePlannerSettingsInput = data => plannerSettingsSchema.safeParse({
    percentages: {
        needs: parsePercentage(data?.percentages?.needs),
        wants: parsePercentage(data?.percentages?.wants),
        savings: parsePercentage(data?.percentages?.savings),
    },
    categoryOverrides: data?.categoryOverrides ?? {},
});

export const parseStoredPlannerSettings = json => {
    const fallback = { percentages: { ...DEFAULT_PERCENTAGES }, categoryOverrides: {} };
    if (!json) return fallback;
    try {
        const raw = JSON.parse(json);
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
        const percentages = percentagesSchema.safeParse(raw.percentages);
        const categoryOverrides = {};
        if (raw.categoryOverrides && typeof raw.categoryOverrides === "object" && !Array.isArray(raw.categoryOverrides)) {
            for (const [tag, group] of Object.entries(raw.categoryOverrides)) {
                if (tag.trim() && allocationGroupSchema.safeParse(group).success) categoryOverrides[tag.trim()] = group;
            }
        }
        return { percentages: percentages.success ? percentages.data : fallback.percentages, categoryOverrides };
    } catch {
        return fallback;
    }
};
