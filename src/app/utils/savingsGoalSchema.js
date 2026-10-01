import { z } from "zod";
import { isCalendarDate, parseDecimalAmount } from "./transactionSchema.js";
import { normalizeGoalIcon } from "./savingsGoals.js";

const goalId = z.string().regex(/^goal-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, "Invalid goal ID.");

export const savingsGoalSchema = z.object({
    id: goalId,
    name: z.string().trim().min(1, "Goal name is required.").max(80, "Goal name must be 80 characters or fewer."),
    targetAmount: z.number({ error: "Enter a valid target amount." }).finite().positive("Target amount must be greater than 0."),
    targetDate: z.string().refine(isCalendarDate, "Please enter a valid target date.").nullable(),
    linkedAccountId: z.string().trim().min(1).nullable(),
    icon: z.preprocess(normalizeGoalIcon, z.string().trim().min(1).max(16, "Choose a shorter icon.")),
    note: z.string().trim().max(300, "Note must be 300 characters or fewer."),
    archived: z.boolean(),
    createdAt: z.string().datetime({ message: "Invalid creation date." }),
});

export const validateSavingsGoalInput = data => savingsGoalSchema.safeParse({
    ...data,
    targetAmount: parseDecimalAmount(data?.targetAmount),
    targetDate: data?.targetDate || null,
    linkedAccountId: data?.linkedAccountId || null,
    note: data?.note ?? "",
});

export const parseStoredSavingsGoals = json => {
    try {
        const value = JSON.parse(json);
        if (!Array.isArray(value)) return [];
        return value.flatMap(item => { const result = savingsGoalSchema.safeParse(item); return result.success ? [result.data] : []; });
    } catch { return []; }
};
