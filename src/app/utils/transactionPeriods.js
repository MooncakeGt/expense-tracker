import { canonicalAccountId } from "./accounts.js";
import { getMonthlySummary, getTransactionsForMonth, getTransactionsForYear } from "./dashboard.js";
import { getCategoryForTag, normalizeTag } from "./tags.js";

export const getTransactionsForPeriod = (transactions, mode, selectedMonth, selectedYear) =>
    mode === "yearly"
        ? getTransactionsForYear(transactions, selectedYear)
        : getTransactionsForMonth(transactions, selectedMonth);

export const getTransactionPeriodSummary = transactions => getMonthlySummary(transactions);

export const applyTransactionFilters = (transactions, filters = {}, customCategories = []) => {
    const query = String(filters.search || "").trim().toLowerCase();
    return transactions.filter(transaction => {
        if (query && !String(transaction.description || "").toLowerCase().includes(query)) return false;
        if (filters.type && transaction.type !== filters.type) return false;
        if (filters.tag) {
            const selectedCategory = getCategoryForTag(filters.tag, customCategories);
            const matches = selectedCategory
                ? getCategoryForTag(transaction.tag, customCategories)?.id === selectedCategory.id
                : normalizeTag(transaction.tag) === normalizeTag(filters.tag);
            if (!matches) return false;
        }
        if (filters.accountId && canonicalAccountId(transaction.accountId) !== filters.accountId) return false;
        if (filters.startDate && transaction.date < filters.startDate) return false;
        if (filters.endDate && transaction.date > filters.endDate) return false;
        return true;
    });
};

export const sortTransactions = (transactions, sortBy = "newest") => {
    const indexed = transactions.map((transaction, index) => ({ transaction, index }));
    indexed.sort((left, right) => {
        if (sortBy === "newest") return right.transaction.date.localeCompare(left.transaction.date) || right.index - left.index;
        if (sortBy === "oldest") return left.transaction.date.localeCompare(right.transaction.date) || left.index - right.index;
        if (sortBy === "highest") return right.transaction.amount - left.transaction.amount || right.transaction.date.localeCompare(left.transaction.date);
        if (sortBy === "lowest") return left.transaction.amount - right.transaction.amount || right.transaction.date.localeCompare(left.transaction.date);
        return left.index - right.index;
    });
    return indexed.map(item => item.transaction);
};

export const groupTransactionsByMonth = (transactions, sortBy = "newest") => {
    const grouped = new Map();
    for (const transaction of transactions) {
        const month = transaction.date.slice(0, 7);
        if (!grouped.has(month)) grouped.set(month, []);
        grouped.get(month).push(transaction);
    }
    const direction = sortBy === "oldest" ? 1 : -1;
    return [...grouped.entries()]
        .sort(([left], [right]) => left.localeCompare(right) * direction)
        .map(([month, monthTransactions]) => ({
            month,
            transactions: monthTransactions,
            summary: getTransactionPeriodSummary(monthTransactions),
        }));
};
