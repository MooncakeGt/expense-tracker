import { z } from "zod";
import { isCalendarDate, parseDecimalAmount } from "./transactionSchema.js";

export const transferSchema = z.object({
    id: z.string().trim().min(1, "Transfer ID is required."),
    fromAccountId: z.string().trim().min(1, "Choose a source account."),
    toAccountId: z.string().trim().min(1, "Choose a destination account."),
    amount: z.number({ error: "Enter a valid amount." }).finite("Enter a valid amount.").positive("Amount must be greater than 0."),
    date: z.string().refine(isCalendarDate, "Please enter a valid date."),
    note: z.string().trim().max(160, "Note must be 160 characters or fewer.").optional().default(""),
    createdAt: z.string().datetime({ message: "Invalid creation date." }),
    recurringTransferRuleId: z.string().min(1).optional(),
    recurringOccurrenceDate: z.string().refine(isCalendarDate).optional(),
}).refine(item => item.fromAccountId !== item.toAccountId, { path: ["toAccountId"], message: "Source and destination must be different." });

export const validateTransferInput = data => transferSchema.safeParse({ ...data, amount: parseDecimalAmount(data?.amount), note: data?.note ?? "" });
export const parseStoredTransfers = json => {
    try {
        const value = JSON.parse(json);
        if (!Array.isArray(value)) return [];
        return value.flatMap(item => { const result = transferSchema.safeParse(item); return result.success ? [result.data] : []; });
    } catch { return []; }
};
export const getTransfersForDate = (transfers, date) => transfers.filter(item => item.date === date);
