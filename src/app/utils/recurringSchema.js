import { z } from "zod";
import { isCalendarDate, parseDecimalAmount, transactionSchema } from "./transactionSchema.js";

const date = z.string().refine(isCalendarDate, "Please enter a valid date.");

export const recurringRuleSchema = transactionSchema.pick({ id: true, description: true, tag: true, amount: true, type: true, accountId: true }).extend({
    frequency: z.enum(["weekly", "monthly", "yearly"]),
    interval: z.number().int().min(1, "Interval must be at least 1.").max(100, "Interval must be 100 or less."),
    startDate: date,
    endDate: date.nullable(),
    processedThrough: date.nullable(),
    active: z.boolean(),
    pausedAt: date.nullable(),
}).refine(rule => !rule.endDate || rule.endDate >= rule.startDate, {
    path: ["endDate"], message: "End date must be on or after the start date.",
});

export const validateRecurringInput = data => recurringRuleSchema.safeParse({
    ...data,
    amount: parseDecimalAmount(data?.amount),
    interval: typeof data?.interval === "string" && /^\d+$/.test(data.interval.trim())
        ? Number(data.interval.trim()) : data?.interval,
    endDate: data?.endDate || null,
});

export const parseStoredRules = json => {
    try {
        const raw = JSON.parse(json);
        if (!Array.isArray(raw)) return [];
        return raw.flatMap(item => {
            const result = recurringRuleSchema.safeParse(item);
            return result.success ? [result.data] : [];
        });
    } catch {
        return [];
    }
};
