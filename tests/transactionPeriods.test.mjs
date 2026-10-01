import test from "node:test";
import assert from "node:assert/strict";
import { applyTransactionFilters, getTransactionPeriodSummary, getTransactionsForPeriod, groupTransactionsByMonth, sortTransactions } from "../src/app/utils/transactionPeriods.js";

const transaction = (id, date, amount = 10, type = "expense", tag = "food", description = id) => ({ id, date, amount, type, tag, description, accountId: "general" });
const records = [
    transaction("jan", "2026-01-01"),
    transaction("leap", "2024-02-29"),
    transaction("mar-1", "2026-03-01", 50, "expense", "food", "Lunch"),
    transaction("mar-2", "2026-03-31", 100, "income", "salary", "Salary"),
    transaction("dec", "2026-12-31"),
    transaction("next", "2027-01-01"),
];

test("filters exact calendar months including January, December, and leap February", () => {
    assert.deepEqual(getTransactionsForPeriod(records, "monthly", "2026-01", 2026).map(item => item.id), ["jan"]);
    assert.deepEqual(getTransactionsForPeriod(records, "monthly", "2026-12", 2026).map(item => item.id), ["dec"]);
    assert.deepEqual(getTransactionsForPeriod(records, "monthly", "2024-02", 2024).map(item => item.id), ["leap"]);
    assert.deepEqual(getTransactionsForPeriod(records, "monthly", "2025-09", 2025), []);
});

test("filters exact years and returns an empty year safely", () => {
    assert.deepEqual(getTransactionsForPeriod(records, "yearly", "2026-01", 2026).map(item => item.id), ["jan", "mar-1", "mar-2", "dec"]);
    assert.deepEqual(getTransactionsForPeriod(records, "yearly", "2026-01", 2025), []);
});

test("period summary calculates income, expenses, net, and count", () => {
    assert.deepEqual(getTransactionPeriodSummary([
        transaction("salary", "2026-09-01", 5000, "income"),
        transaction("freelance", "2026-09-02", 500, "income"),
        transaction("rent", "2026-09-03", 1500),
        transaction("food", "2026-09-04", 300),
    ]), { income: 5500, expenses: 1800, net: 3700, savingsRate: 67.27272727272727, count: 4, incomeCount: 2, expenseCount: 2 });
});

test("monthly summary excludes transactions from other months", () => {
    const transactions = [
        transaction("august", "2026-08-15", 10000, "income"),
        transaction("september-income", "2026-09-01", 1000, "income"),
        transaction("september-expense", "2026-09-02", 1717.6),
    ];
    const summary = getTransactionPeriodSummary(getTransactionsForPeriod(transactions, "monthly", "2026-09", 2026));
    assert.equal(summary.income, 1000);
    assert.equal(summary.expenses, 1717.6);
    assert.ok(Math.abs(summary.net + 717.6) < 1e-9);
    assert.equal(summary.count, 2);
});

test("yearly summary excludes transactions from other years", () => {
    const transactions = [
        transaction("2025-income", "2025-01-01", 100000, "income"),
        transaction("2026-income", "2026-01-01", 72000, "income"),
        transaction("2026-expense", "2026-12-31", 50000),
    ];
    const summary = getTransactionPeriodSummary(getTransactionsForPeriod(transactions, "yearly", "2026-09", 2026));
    assert.equal(summary.income, 72000);
    assert.equal(summary.expenses, 50000);
    assert.equal(summary.net, 22000);
});

test("history filters do not alter the period summary", () => {
    const transactions = [
        transaction("salary", "2026-09-01", 5000, "income", "salary", "Salary"),
        transaction("rent", "2026-09-02", 1900, "expense", "housing", "Rent"),
        transaction("netflix", "2026-09-03", 100, "expense", "subscriptions", "Netflix"),
    ];
    const period = getTransactionsForPeriod(transactions, "monthly", "2026-09", 2026);
    const summary = getTransactionPeriodSummary(period);
    const visible = applyTransactionFilters(period, { search: "Netflix" });
    assert.deepEqual({ income: summary.income, expenses: summary.expenses, net: summary.net }, { income: 5000, expenses: 2000, net: 3000 });
    assert.deepEqual(visible.map(item => item.id), ["netflix"]);
});

test("yearly grouping omits empty months and respects month direction", () => {
    const yearly = getTransactionsForPeriod(records, "yearly", "2026-01", 2026);
    assert.deepEqual(groupTransactionsByMonth(yearly, "newest").map(group => group.month), ["2026-12", "2026-03", "2026-01"]);
    assert.deepEqual(groupTransactionsByMonth(yearly, "oldest").map(group => group.month), ["2026-01", "2026-03", "2026-12"]);
});

test("search, type, category, account, and custom range apply within a period", () => {
    const period = getTransactionsForPeriod(records, "yearly", "2026-01", 2026);
    const filtered = applyTransactionFilters(period, { search: " lunch ", type: "expense", tag: "food", accountId: "general", startDate: "2026-03-01", endDate: "2026-05-31" });
    assert.deepEqual(filtered.map(item => item.id), ["mar-1"]);
    assert.deepEqual(applyTransactionFilters(period, { startDate: "2025-01-01", endDate: "2025-12-31" }), []);
});

test("date edits immediately remove a transaction from its former month", () => {
    const september = [transaction("moved", "2026-09-15")];
    assert.equal(getTransactionsForPeriod(september, "monthly", "2026-09", 2026).length, 1);
    const edited = [{ ...september[0], date: "2026-10-15" }];
    assert.equal(getTransactionsForPeriod(edited, "monthly", "2026-09", 2026).length, 0);
});

test("transaction sorting is stable within yearly groups", () => {
    const sorted = sortTransactions(records, "oldest");
    assert.equal(sorted[0].id, "leap");
    assert.equal(sorted.at(-1).id, "next");
});
