import { transactionSchema } from "./transactionSchema.js";

export const getToday = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const parts = value => value.split("-").map(Number);
const format = (year, month, day) => `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

// Every occurrence is anchored to the original day, so clamped dates never drift.
export const occurrenceAt = (rule, index) => {
    const [year, month, day] = parts(rule.startDate);
    if (rule.frequency === "weekly") {
        const date = new Date(Date.UTC(year, month - 1, day + index * rule.interval * 7));
        return format(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    }
    const target = rule.frequency === "monthly" ? year * 12 + month - 1 + index * rule.interval
        : (year + index * rule.interval) * 12 + month - 1;
    const targetYear = Math.floor(target / 12);
    const targetMonth = target % 12 + 1;
    return format(targetYear, targetMonth, Math.min(day, daysInMonth(targetYear, targetMonth)));
};

export const getDueOccurrences = (rule, today) => {
    if (!rule.active) return [];
    const limit = rule.endDate && rule.endDate < today ? rule.endDate : today;
    const due = [];
    // A generous finite cap protects against malformed or ancient external data.
    for (let index = 0; index < 20000; index += 1) {
        const date = occurrenceAt(rule, index);
        if (date > limit) break;
        if ((!rule.processedThrough || date > rule.processedThrough) && date >= rule.startDate) due.push(date);
    }
    return due;
};

export const getNextOccurrence = (rule, today) => {
    if (!rule.active) return null;
    for (let index = 0; index < 20000; index += 1) {
        const date = occurrenceAt(rule, index);
        if (rule.endDate && date > rule.endDate) return null;
        if (date > today && (!rule.processedThrough || date > rule.processedThrough)) return date;
    }
    return null;
};

export const getOccurrencesBetween = (rule, startExclusive, endInclusive) => {
    if (!rule.active) return [];
    const dates = [];
    for (let index = 0; index < 20000; index += 1) {
        const date = occurrenceAt(rule, index);
        if (rule.endDate && date > rule.endDate) break;
        if (date > endInclusive) break;
        if (date > startExclusive && (!rule.processedThrough || date > rule.processedThrough)) dates.push(date);
    }
    return dates;
};

export const generateRecurringTransactions = (rules, transactions, today, createId = () => crypto.randomUUID()) => {
    const existing = new Set(transactions.filter(item => item.recurringRuleId && item.recurringOccurrenceDate)
        .map(item => `${item.recurringRuleId}\u0000${item.recurringOccurrenceDate}`));
    const generated = [];
    let changed = false;
    const nextRules = rules.map(rule => {
        const due = getDueOccurrences(rule, today);
        if (!due.length) return rule;
        for (const date of due) {
            const key = `${rule.id}\u0000${date}`;
            if (existing.has(key)) continue;
            const result = transactionSchema.safeParse({
                id: createId(), description: rule.description, tag: rule.tag, amount: rule.amount,
                type: rule.type, date, accountId: rule.accountId, recurringRuleId: rule.id, recurringOccurrenceDate: date,
            });
            if (result.success) { generated.push(result.data); existing.add(key); }
        }
        changed = true;
        return { ...rule, processedThrough: due[due.length - 1] };
    });
    return { rules: changed ? nextRules : rules, transactions: generated.length ? [...transactions, ...generated] : transactions, generatedCount: generated.length, changed };
};
