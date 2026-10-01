import { test } from "node:test";
import assert from "node:assert/strict";
import { getCategoryGroup, getPlannerData } from "../src/app/utils/fiftyThirtyTwenty.js";
import { DEFAULT_PERCENTAGES, parseStoredPlannerSettings, validatePlannerSettingsInput } from "../src/app/utils/fiftyThirtyTwentySchema.js";
import { getCategoryById, searchCategories } from "../src/app/utils/tags.js";

const tx = (id, description, tag, amount, type = "expense", date = "2026-09-10") => ({ id, description, tag, amount, type, date });
const scenario = [
    tx("1", "Salary", "salary", 5000, "income"), tx("2", "Freelance", "freelance", 1000, "income"),
    tx("3", "Rent", "housing", 1500), tx("4", "Groceries", "groceries", 600), tx("5", "Utilities", "utilities", 250),
    tx("6", "Transport", "transport", 200), tx("7", "Phone", "phone-internet", 100),
    tx("8", "Dining", "food", 500), tx("9", "Fun", "entertainment", 200), tx("10", "Shopping", "shopping", 300), tx("11", "Netflix", "subscriptions", 100),
    tx("12", "Savings", "savings", 700), tx("13", "Investments", "investments", 200), tx("14", "Camera", "Photography", 150),
];

test("calculates default targets, actuals, shares, and unassigned spending", () => {
    const data = getPlannerData(scenario, "2026-09", DEFAULT_PERCENTAGES);
    assert.equal(data.income, 6000);
    assert.deepEqual(data.targets, { needs: 3000, wants: 1800, savings: 1200 });
    assert.deepEqual(data.actuals, { needs: 2650, wants: 1250, savings: 900, unassigned: 0 });
    assert.equal(data.shares.needs.toFixed(1), "44.2");
    assert.equal(data.shares.wants.toFixed(1), "20.8");
    assert.equal(data.shares.savings, 15);
});

test("custom percentages change targets while overrides move actual spending", () => {
    const data = getPlannerData(scenario, "2026-09", { needs: 60, wants: 20, savings: 20 }, { Photography: "wants" });
    assert.deepEqual(data.targets, { needs: 3600, wants: 1200, savings: 1200 });
    assert.equal(data.actuals.wants, 1250);
    assert.equal(data.actuals.unassigned, 0);
});

test("legacy aliases share their canonical classification", () => {
    assert.equal(getCategoryGroup("Food"), "wants");
    assert.equal(getCategoryGroup("food"), "wants");
    assert.equal(getCategoryGroup("Bills"), "needs");
    assert.equal(getCategoryGroup("utilities"), "needs");
    assert.equal(getCategoryGroup("Medical"), "unassigned");
});

test("Outings is an expense category searchable by its configured keywords", () => {
    const category = getCategoryById("outings");
    assert.deepEqual(
        { name: category?.name, type: category?.type, icon: category?.icon },
        { name: "Outings", type: "expense", icon: "🌆" },
    );
    for (const query of ["outing", "hangout", "day out", "social", "friends", "gathering", "meetup"]) {
        assert.equal(searchCategories(query, "expense").some(item => item.id === "outings"), true);
    }
    assert.equal(searchCategories("outing", "income").some(item => item.id === "outings"), false);
    assert.equal(getCategoryGroup("outings"), "wants");
});

test("zero income retains actual amounts without invalid percentages", () => {
    const data = getPlannerData([tx("1", "Rent", "housing", 500)], "2026-09", DEFAULT_PERCENTAGES);
    assert.equal(data.actuals.needs, 500);
    assert.equal(data.shares.needs, null);
    assert.equal(data.targets.needs, 0);
});

test("validates custom totals and rejects totals other than 100", () => {
    assert.equal(validatePlannerSettingsInput({ percentages: { needs: "60", wants: "20", savings: "20" }, categoryOverrides: {} }).success, true);
    assert.equal(validatePlannerSettingsInput({ percentages: { needs: 60, wants: 30, savings: 20 }, categoryOverrides: {} }).success, false);
    assert.equal(validatePlannerSettingsInput({ percentages: { needs: -1, wants: 81, savings: 20 }, categoryOverrides: {} }).success, false);
});

test("storage parsing recovers valid overrides and falls back invalid percentages", () => {
    const settings = parseStoredPlannerSettings(JSON.stringify({ percentages: { needs: 50, wants: 30, savings: 30 }, categoryOverrides: { Photography: "wants", Broken: "other", "": "needs" } }));
    assert.deepEqual(settings.percentages, DEFAULT_PERCENTAGES);
    assert.deepEqual(settings.categoryOverrides, { Photography: "wants" });
    assert.deepEqual(parseStoredPlannerSettings("{invalid").percentages, DEFAULT_PERCENTAGES);
});
