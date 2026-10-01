import { getCategoryForTag, normalizeTag } from "./tags.js";
import { getTransactionsForMonth } from "./dashboard.js";

export const DEFAULT_CATEGORY_GROUPS = Object.freeze({
    groceries: "needs", transport: "needs", fuel: "needs", "parking-tolls": "needs", vehicle: "needs",
    housing: "needs", utilities: "needs", "phone-internet": "needs", healthcare: "needs", insurance: "needs",
    education: "needs", work: "needs", "business-expense": "needs", technology: "needs", family: "needs", pets: "needs",
    food: "wants", shopping: "wants", entertainment: "wants", outings: "wants", subscriptions: "wants", fitness: "wants",
    travel: "wants", "gifts-donations": "wants",
    "debt-loans": "savings", investments: "savings", savings: "savings", other: "unassigned",
});

export const canonicalPlannerTag = (tag, customCategories = []) => getCategoryForTag(tag, customCategories)?.id ?? normalizeTag(tag);
export const getDefaultCategoryGroup = (tag, customCategories = []) => {
    const category = getCategoryForTag(tag, customCategories);
    return category?.id.startsWith("custom-") ? category.budgetGroup ?? "unassigned" : DEFAULT_CATEGORY_GROUPS[category?.id] ?? category?.budgetGroup ?? "unassigned";
};
export const getCategoryGroup = (tag, overrides = {}, customCategories = []) => {
    const key = canonicalPlannerTag(tag, customCategories);
    return overrides[key] ?? overrides[normalizeTag(tag)] ?? getDefaultCategoryGroup(tag, customCategories);
};

export const getPlannerData = (transactions, month, percentages, overrides = {}, customCategories = []) => {
    const monthly = getTransactionsForMonth(transactions, month);
    const income = monthly.filter(item => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const actuals = { needs: 0, wants: 0, savings: 0, unassigned: 0 };
    const breakdownMaps = { needs: new Map(), wants: new Map(), savings: new Map(), unassigned: new Map() };
    for (const transaction of monthly) {
        if (transaction.type !== "expense") continue;
        const tag = canonicalPlannerTag(transaction.tag, customCategories);
        const group = getCategoryGroup(transaction.tag, overrides, customCategories);
        actuals[group] += transaction.amount;
        breakdownMaps[group].set(tag, (breakdownMaps[group].get(tag) || 0) + transaction.amount);
    }
    const targets = Object.fromEntries(["needs", "wants", "savings"].map(group => [group, income * percentages[group] / 100]));
    const shares = Object.fromEntries(Object.entries(actuals).map(([group, amount]) => [group, income === 0 ? null : amount / income * 100]));
    const breakdown = Object.fromEntries(Object.entries(breakdownMaps).map(([group, totals]) => [group,
        [...totals].map(([tag, amount]) => ({ tag, amount })).sort((a, b) => b.amount - a.amount)]));
    return { monthly, income, actuals, targets, shares, breakdown };
};
