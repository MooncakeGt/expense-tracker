import { GENERAL_ACCOUNT } from "./accounts.js";

export const APP_STORAGE_KEYS = Object.freeze([
    "expenses",
    "accounts",
    "transfers",
    "customCategories",
    "categoryIconOverrides",
    "budgets",
    "recurringRules",
    "recurringTransfers",
    "savingsGoals",
    "savingsGoalContributions",
    "recurringSavingsGoalContributions",
    "fiftyThirtyTwentySettings",
]);

export const resetAppStorage = storage => {
    for (const key of APP_STORAGE_KEYS) storage.removeItem(key);
    storage.setItem("accounts", JSON.stringify([GENERAL_ACCOUNT]));
};
