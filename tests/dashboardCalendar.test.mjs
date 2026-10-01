import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCalendarMonth, getMonthComparison, getYearComparison, getYearDashboard } from "../src/app/utils/dashboard.js";

const tx = (id, date, amount, type = "expense", tag = "food") => ({ id, date, amount, type, tag, description: id });

test("year dashboard includes all twelve months and calculates annual values", () => {
    const data = getYearDashboard([
        tx("salary", "2026-01-31", 6000, "income", "salary"),
        tx("rent", "2026-01-31", 1500, "expense", "housing"),
        tx("food", "2026-02-01", 500),
        tx("old", "2025-12-31", 999),
    ], 2026);
    assert.equal(data.months.length, 12);
    assert.equal(data.summary.income, 6000);
    assert.equal(data.summary.expenses, 2000);
    assert.equal(data.summary.net, 4000);
    assert.equal(data.summary.savingsRate, 4000 / 6000 * 100);
    assert.equal(data.averageIncome, 500);
    assert.equal(data.averageExpenses, 2000 / 12);
    assert.equal(data.highestSpendingMonth.month, "2026-01");
    assert.deepEqual(data.spending.map(item => item.tag), ["main:housing-home", "main:food-dining"]);
});

test("empty year is safe and still includes zero months", () => {
    const data = getYearDashboard([], 2026);
    assert.equal(data.summary.savingsRate, null);
    assert.equal(data.highestSpendingMonth, null);
    assert.ok(data.months.every(month => month.income === 0 && month.expenses === 0 && month.net === 0));
});

test("year comparisons require a usable prior-year baseline", () => {
    assert.equal(getYearComparison(5000, 0, "2025"), "No prior-year baseline");
    assert.equal(getYearComparison(0, 0, "2025"), "No prior-year baseline");
    assert.equal(getYearComparison(6000, 5000, "2025"), "↑ 20.0% vs 2025");
    assert.equal(getYearComparison(5000, 5000, "2025"), "No change vs 2025");
    assert.equal(getMonthComparison(0, 0, "September 2026"), "No change vs September 2026");
    assert.equal(getMonthComparison(100, 0, "September 2026"), "No prior-month baseline");
});

test("calendar aggregates each date in one summary", () => {
    const data = buildCalendarMonth([
        tx("salary", "2026-09-15", 5000, "income", "salary"),
        tx("lunch", "2026-09-15", 20),
        tx("groceries", "2026-09-15", 100, "expense", "groceries"),
    ], "2026-09");
    const day = data.days.find(item => item.date === "2026-09-15");
    assert.deepEqual({ income: day.income, expenses: day.expenses, net: day.net, count: day.count }, { income: 5000, expenses: 120, net: 4880, count: 3 });
    assert.equal(data.summary.count, 3);
});

test("calendar produces complete Sunday-first grids with adjacent dates", () => {
    const february = buildCalendarMonth([], "2024-02");
    assert.equal(february.days.length % 7, 0);
    assert.equal(february.days.filter(day => !day.outside).length, 29);
    assert.equal(february.days.find(day => day.date === "2024-02-29").day, 29);
    assert.ok(february.days.some(day => day.outside));
});
