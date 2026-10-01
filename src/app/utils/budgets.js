export const getBudgetStatus = percentage => {
    if (percentage > 100) return { label: "Over Budget", color: "danger" };
    if (percentage >= 90) return { label: "Near Limit", color: "warning" };
    if (percentage >= 75) return { label: "Watch", color: "info" };
    return { label: "On Track", color: "success" };
};

export const calculateBudgetProgress = (spent, budget) => {
    const percentage = (spent / budget) * 100;
    return { spent, budget, remaining: budget - spent, percentage, status: getBudgetStatus(percentage) };
};

export const calculateCategoryBudgetProgress = (categorySpending, categoryBudgets) => {
    const spentByTag = new Map(categorySpending.map(item => [item.tag, item.amount]));
    return Object.entries(categoryBudgets).map(([tag, budget]) => ({
        tag,
        ...calculateBudgetProgress(spentByTag.get(tag) || 0, budget),
    }));
};
