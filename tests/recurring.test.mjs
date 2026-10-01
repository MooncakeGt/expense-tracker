import { test } from "node:test";
import assert from "node:assert/strict";
import { occurrenceAt, generateRecurringTransactions, getDueOccurrences, getNextOccurrence } from "../src/app/utils/recurring.js";
import { parseStoredRules } from "../src/app/utils/recurringSchema.js";

const rule = (changes = {}) => ({ id: "r1", description: "Netflix", tag: "subscriptions", amount: 55,
    type: "expense", frequency: "monthly", interval: 1, startDate: "2026-09-10", endDate: null,
    processedThrough: null, active: true, pausedAt: null, ...changes });
let id = 0;
const createId = () => `generated-${++id}`;

test("generation is idempotent even after deleting a generated transaction", () => {
    const first = generateRecurringTransactions([rule()], [], "2026-09-20", createId);
    assert.equal(first.generatedCount, 1);
    assert.equal(generateRecurringTransactions(first.rules, first.transactions, "2026-09-20", createId).generatedCount, 0);
    assert.equal(generateRecurringTransactions(first.rules, [], "2026-09-20", createId).generatedCount, 0);
    const october = generateRecurringTransactions(first.rules, [], "2026-10-20", createId);
    assert.deepEqual(october.transactions.map(item => item.date), ["2026-10-10"]);
});

test("missed occurrences stop at today and respect intervals", () => {
    assert.deepEqual(getDueOccurrences(rule({ startDate: "2026-06-01", processedThrough: "2026-06-01" }), "2026-09-20"), ["2026-07-01", "2026-08-01", "2026-09-01"]);
    assert.deepEqual(getDueOccurrences(rule({ startDate: "2026-09-07", frequency: "weekly", interval: 2 }), "2026-10-06"), ["2026-09-07", "2026-09-21", "2026-10-05"]);
});

test("month ends and leap days clamp without drift", () => {
    assert.deepEqual([0, 1, 2, 3, 4].map(i => occurrenceAt(rule({ startDate: "2026-01-31" }), i)), ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31"]);
    assert.deepEqual([0, 1, 2, 3, 4].map(i => occurrenceAt(rule({ startDate: "2024-02-29", frequency: "yearly" }), i)), ["2024-02-29", "2025-02-28", "2026-02-28", "2027-02-28", "2028-02-29"]);
});

test("editing changes future amounts without touching historical entries", () => {
    const september = generateRecurringTransactions([rule()], [], "2026-09-20", createId);
    const october = generateRecurringTransactions([{ ...september.rules[0], amount: 65 }], september.transactions, "2026-10-20", createId);
    assert.deepEqual(october.transactions.map(item => item.amount), [55, 65]);
});

test("resume skips paused occurrences and finds the next future date", () => {
    const resumed = rule({ startDate: "2026-06-10", processedThrough: "2026-09-20" });
    assert.deepEqual(getDueOccurrences(resumed, "2026-09-20"), []);
    assert.equal(getNextOccurrence(resumed, "2026-09-20"), "2026-10-10");
});

test("corrupt storage recovers valid rules", () => {
    assert.deepEqual(parseStoredRules("{invalid"), []);
    assert.equal(parseStoredRules(JSON.stringify([rule(), { bad: true }])).length, 1);
});
