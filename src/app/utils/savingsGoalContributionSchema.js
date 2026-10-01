import { z } from "zod";
import { isCalendarDate, parseDecimalAmount } from "./transactionSchema.js";

export const savingsGoalContributionSchema = z.object({
    id: z.string().regex(/^goal-contribution-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, "Invalid contribution ID."),
    goalId: z.string().trim().min(1, "Goal is required."),
    amount: z.number({ error: "Enter a valid amount." }).finite().positive("Amount must be greater than 0."),
    date: z.string().refine(isCalendarDate, "Please enter a valid date."),
    accountId: z.string().trim().min(1, "Choose an account."),
    transferId: z.string().trim().min(1).optional(),
    note: z.string().trim().max(200, "Note must be 200 characters or fewer."),
    createdAt: z.string().datetime({ message: "Invalid creation date." }),
    recurringGoalContributionRuleId: z.string().min(1).optional(),
    recurringOccurrenceDate: z.string().refine(isCalendarDate).optional(),
});

export const validateSavingsGoalContributionInput = data => savingsGoalContributionSchema.safeParse({
    ...data, amount: parseDecimalAmount(data?.amount), note: data?.note ?? "",
    transferId: data?.transferId || undefined,
});

export const parseStoredSavingsGoalContributions = json => {
    try {
        const value = JSON.parse(json);
        if (!Array.isArray(value)) return [];
        return value.flatMap(item => { const result = savingsGoalContributionSchema.safeParse(item); return result.success ? [result.data] : []; });
    } catch { return []; }
};
