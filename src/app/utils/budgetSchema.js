import { z } from "zod";
import { getCategoryForTag, normalizeTag } from "./tags.js";

export const budgetMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose a valid month.");
export const budgetAmountSchema = z.number({ error: "Enter a valid amount." })
    .finite("Enter a valid amount.").positive("Budget must be greater than 0.");

export const monthBudgetSchema = z.object({
    total: budgetAmountSchema.optional(),
    categories: z.record(z.string().trim().min(1), budgetAmountSchema),
});

const parseDecimal = value => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return value;
    const number = Number(trimmed);
    return number === 0 ? undefined : number;
};

const inputAmountSchema = z.preprocess(parseDecimal, budgetAmountSchema.optional());
const monthBudgetInputSchema = z.object({
    total: inputAmountSchema,
    categories: z.record(z.string().trim().min(1), inputAmountSchema)
        .transform(values => Object.fromEntries(Object.entries(values).filter(([, amount]) => amount !== undefined))),
});

export const validateBudgetInput = data => monthBudgetInputSchema.safeParse(data);

export const canonicalBudgetTag = tag => getCategoryForTag(tag)?.id || normalizeTag(tag);

export const parseStoredBudgets = json => {
    if (!json) return {};
    try {
        const parsed = JSON.parse(json);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
        const budgets = {};
        for (const [month, value] of Object.entries(parsed)) {
            if (!budgetMonthSchema.safeParse(month).success || !value || typeof value !== "object" || Array.isArray(value)) continue;
            const total = budgetAmountSchema.safeParse(value.total);
            const categories = Object.create(null);
            if (value.categories && typeof value.categories === "object" && !Array.isArray(value.categories)) {
                for (const [rawTag, amount] of Object.entries(value.categories)) {
                    if (!rawTag.trim() || !budgetAmountSchema.safeParse(amount).success) continue;
                    const tag = canonicalBudgetTag(rawTag);
                    const category = getCategoryForTag(tag);
                    if (category?.type === "income") continue;
                    if (tag) categories[tag] = amount;
                }
            }
            const budget = { ...(total.success ? { total: total.data } : {}), categories };
            if (budget.total || Object.keys(categories).length) budgets[month] = budget;
        }
        return budgets;
    } catch {
        return {};
    }
};

export const getBudgetFieldErrors = error => {
    const errors = {};
    for (const issue of error.issues) {
        const key = issue.path[0] === "categories" ? issue.path[1] : issue.path[0];
        if (key && !errors[key]) errors[key] = issue.message;
    }
    return errors;
};
