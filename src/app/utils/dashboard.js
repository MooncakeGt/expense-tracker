import { getCategoryForTag, getMainCategoryForTag, normalizeTag } from "./tags.js";

export const getCurrentMonth = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const shiftMonth = (month, offset) => {
    const [year, number] = month.split("-").map(Number);
    return getCurrentMonth(new Date(year, number - 1 + offset, 1));
};

export const formatMonth = month => {
    const [year, number] = month.split("-").map(Number);
    return new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" })
        .format(new Date(year, number - 1, 1));
};

export const getTransactionsForMonth = (transactions, month) =>
    transactions.filter(transaction => transaction.date.slice(0, 7) === month);

export const getMonthlySummary = transactions => {
    const incomeTransactions = transactions.filter(transaction => transaction.type === "income");
    const expenseTransactions = transactions.filter(transaction => transaction.type === "expense");
    const income = incomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = expenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const net = income - expenses;
    return {
        income,
        expenses,
        net,
        savingsRate: income === 0 ? null : (net / income) * 100,
        count: transactions.length,
        incomeCount: incomeTransactions.length,
        expenseCount: expenseTransactions.length,
    };
};

export const getMonthComparison = (current, previous, previousLabel = "prior month") => {
    if (previous === 0) return current === 0 ? `No change vs ${previousLabel}` : "No prior-month baseline";
    const change = ((current - previous) / previous) * 100;
    if (change === 0) return `No change vs ${previousLabel}`;
    return `${change > 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}% vs ${previousLabel}`;
};

export const getYearComparison = (current, previous, previousLabel = "prior year") => {
    if (!Number.isFinite(previous) || previous === 0) return "No prior-year baseline";
    const change = ((current - previous) / previous) * 100;
    if (!Number.isFinite(change)) return "No prior-year baseline";
    if (change === 0) return `No change vs ${previousLabel}`;
    return `${change > 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)}% vs ${previousLabel}`;
};

export const getCategorySpending = (transactions, customCategories = []) => {
    const totals = new Map();
    let totalExpenses = 0;
    for (const transaction of transactions) {
        if (transaction.type !== "expense") continue;
        const tag = normalizeTag(transaction.tag);
        const key = getCategoryForTag(tag, customCategories)?.id || tag;
        totals.set(key, (totals.get(key) || 0) + transaction.amount);
        totalExpenses += transaction.amount;
    }
    return [...totals].map(([tag, amount]) => ({
        tag,
        amount,
        percentage: totalExpenses === 0 ? 0 : (amount / totalExpenses) * 100,
    })).sort((a, b) => b.amount - a.amount);
};

export const getMainCategorySpending = (transactions, customCategories = []) => {
    const totals = new Map();
    let totalExpenses = 0;
    for (const transaction of transactions) {
        if (transaction.type !== "expense") continue;
        const main = getMainCategoryForTag(transaction.tag, customCategories);
        totals.set(main.id, (totals.get(main.id) || 0) + transaction.amount);
        totalExpenses += transaction.amount;
    }
    const subcategories = getCategorySpending(transactions, customCategories);
    return [...totals].map(([id, amount]) => ({
        tag:`main:${id}`,
        amount,
        percentage:totalExpenses ? amount / totalExpenses * 100 : 0,
        subcategories: subcategories.filter(item => getMainCategoryForTag(item.tag, customCategories).id === id),
    })).sort((a,b) => b.amount-a.amount);
};

export const getRecentTransactions = (transactions, limit = 5) =>
    transactions.map((transaction, index) => ({ transaction, index }))
        .sort((a, b) => b.transaction.date.localeCompare(a.transaction.date) || b.index - a.index)
        .slice(0, limit)
        .map(({ transaction }) => transaction);

export const getMonthsInRange = (endingMonth, count = 6) =>
    Array.from({ length: count }, (_, index) => shiftMonth(endingMonth, index - count + 1));

export const getMonthlyTrend = (transactions, endingMonth) =>
    getMonthsInRange(endingMonth).map(month => {
        const summary = getMonthlySummary(getTransactionsForMonth(transactions, month));
        return { month, income: summary.income, expenses: summary.expenses };
    });

export const getDailySpending = (transactions, month) => {
    const [year, number] = month.split("-").map(Number);
    const daysInMonth = new Date(year, number, 0).getDate();
    const totals = Array(daysInMonth).fill(0);
    for (const transaction of getTransactionsForMonth(transactions, month)) {
        if (transaction.type === "expense") {
            totals[Number(transaction.date.slice(8, 10)) - 1] += transaction.amount;
        }
    }
    return totals.map((amount, index) => ({ day: index + 1, amount }));
};

export const getTransactionsForYear = (transactions, year) =>
    transactions.filter(transaction => transaction.date.startsWith(`${year}-`));

export const getYearBreakdown = (transactions, year) => Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    return { month, ...getMonthlySummary(getTransactionsForMonth(transactions, month)) };
});

export const getYearDashboard = (transactions, year, customCategories = []) => {
    const yearlyTransactions = getTransactionsForYear(transactions, year);
    const summary = getMonthlySummary(yearlyTransactions);
    const months = getYearBreakdown(transactions, year);
    const highestSpendingMonth = summary.expenses === 0 ? null
        : months.reduce((highest, month) => month.expenses > highest.expenses ? month : highest, months[0]);
    const highestNetMonth = months.reduce((highest, month) => month.net > highest.net ? month : highest, months[0]);
    return {
        transactions: yearlyTransactions,
        summary,
        months,
        spending: getMainCategorySpending(yearlyTransactions, customCategories),
        averageIncome: summary.income / 12,
        averageExpenses: summary.expenses / 12,
        highestSpendingMonth,
        highestNetMonth,
    };
};

export const buildCalendarMonth = (transactions, month, transfers = [], savingsGoalContributions = []) => {
    const [year, monthNumber] = month.split("-").map(Number);
    const byDate = new Map();
    for (const transaction of transactions) {
        const current = byDate.get(transaction.date) || { income: 0, expenses: 0, transactions: [], transfers: [], savingsGoalContributions: [] };
        if (transaction.type === "income") current.income += transaction.amount;
        else current.expenses += transaction.amount;
        current.transactions.push(transaction);
        byDate.set(transaction.date, current);
    }
    for (const transfer of transfers) { const current = byDate.get(transfer.date) || { income: 0, expenses: 0, transactions: [], transfers: [], savingsGoalContributions: [] }; current.transfers.push(transfer); byDate.set(transfer.date, current); }
    for (const contribution of savingsGoalContributions) { const current = byDate.get(contribution.date) || { income: 0, expenses: 0, transactions: [], transfers: [], savingsGoalContributions: [] }; current.savingsGoalContributions.push(contribution); byDate.set(contribution.date, current); }
    const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    const days = Array.from({ length: cellCount }, (_, index) => {
        const date = new Date(Date.UTC(year, monthNumber - 1, index - firstWeekday + 1));
        const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
        const activity = byDate.get(dateKey) || { income: 0, expenses: 0, transactions: [], transfers: [], savingsGoalContributions: [] };
        return { date: dateKey, day: date.getUTCDate(), outside: dateKey.slice(0, 7) !== month,
            ...activity, net: activity.income - activity.expenses, count: activity.transactions.length };
    });
    const monthTransactions = getTransactionsForMonth(transactions, month);
    return { days, summary: getMonthlySummary(monthTransactions), byDate };
};
