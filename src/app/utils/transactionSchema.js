import { z } from "zod";
import { normalizeTag } from "./tags.js";

export const isCalendarDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const transactionSchema = z.object({
    id: z.string().min(1, "Transaction ID is required.").refine(value => value.trim().length > 0, "Transaction ID is required."),
    description: z.string({ error: "Description is required." }).trim().min(1, "Description is required.").max(160, "Description must be 160 characters or fewer."),
    tag: z.string().optional().transform(normalizeTag),
    amount: z.number({ error: "Enter a valid amount." }).finite("Enter a valid amount.").positive("Amount must be greater than 0."),
    type: z.enum(["expense", "income"], { error: "Choose Income or Expense." }),
    date: z.string({ error: "Please enter a valid date." }).refine(isCalendarDate, "Please enter a valid date."),
    accountId: z.string().trim().min(1).optional(),
    recurringRuleId: z.string().min(1).optional(),
    recurringOccurrenceDate: z.string().refine(isCalendarDate).optional(),
});

export const validateTransaction = data => transactionSchema.safeParse(data);

// Forms and CSV provide decimal text; stored JSON must already contain a number.
export const parseDecimalAmount = amount => typeof amount === "string" && /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(amount.trim())
    ? Number(amount.trim()) : amount;
export const validateTransactionInput = data => validateTransaction({ ...data, amount: parseDecimalAmount(data?.amount) });

export const validateTransactions = data => {
    if (!Array.isArray(data)) return { transactions: [], skipped: 0 };
    const transactions = [];
    let skipped = 0;
    for (const item of data) {
        const result = validateTransaction(item);
        if (result.success) transactions.push(result.data);
        else skipped += 1;
    }
    return { transactions, skipped };
};

export const parseStoredTransactions = json => {
    if (!json) return [];
    try {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) return [];
        // Older app versions accepted parseable date strings and saved them as YYYY-MM-DD.
        const migrated = parsed.map(item => {
            if (!item || typeof item !== "object" || typeof item.date !== "string" || isCalendarDate(item.date)) return item;
            const datePrefix = item.date.slice(0, 10);
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePrefix) && !isCalendarDate(datePrefix)) return item;
            const date = new Date(item.date);
            return Number.isNaN(date.getTime()) ? item : { ...item, date: date.toISOString().slice(0, 10) };
        });
        return validateTransactions(migrated).transactions;
    } catch {
        return [];
    }
};

export const getFieldErrors = error => {
    const errors = {};
    for (const issue of error.issues) {
        const field = issue.path[0];
        if (field && !errors[field]) errors[field] = issue.message;
    }
    return errors;
};
