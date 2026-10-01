import { canonicalAccountId, getAccountDisplayName } from "./accounts.js";
import { getCategoryForTag, getMainCategoryForTag, normalizeTag } from "./tags.js";

export const createFinancialActivities = (transactions = [], contributions = [], goals = [], accounts = []) => {
    const goalMap = new Map(goals.map(goal => [goal.id, goal]));
    return [
        ...transactions.map(transaction => ({ ...transaction, activityKind: "transaction", sourceId: transaction.id })),
        ...contributions.flatMap(contribution => {
            const goal = goalMap.get(contribution.goalId);
            if (!goal) return [];
            return [{
                ...contribution,
                id: `savings:${contribution.id}`,
                sourceId: contribution.id,
                activityKind: "savings-contribution",
                type: "savings-contribution",
                tag: "contribution",
                description: `${goal.name} Contribution`,
                goalName: goal.name,
                goalIcon: goal.icon,
                accountName: getAccountDisplayName(contribution.accountId, accounts),
                linkedTransfer: Boolean(contribution.transferId),
            }];
        }),
    ];
};

export const getActivitiesForPeriod = (activities, mode, selectedMonth, selectedYear) => activities.filter(activity =>
    mode === "yearly" ? activity.date.slice(0, 4) === String(selectedYear) : activity.date.slice(0, 7) === selectedMonth
);

export const applyActivityFilters = (activities, filters = {}, customCategories = []) => {
    const query = String(filters.search || "").trim().toLocaleLowerCase();
    return activities.filter(activity => {
        if (query && ![activity.description, activity.goalName, activity.note, activity.accountName].some(value => String(value || "").toLocaleLowerCase().includes(query))) return false;
        if (filters.type && activity.type !== filters.type) return false;
        if (filters.tag) {
            const mainId = filters.tag.startsWith("main:") ? filters.tag.slice(5) : null;
            const selected = mainId ? null : getCategoryForTag(filters.tag, customCategories);
            const matches = mainId ? getMainCategoryForTag(activity.tag, customCategories).id === mainId : selected ? getCategoryForTag(activity.tag, customCategories)?.id === selected.id : normalizeTag(activity.tag) === normalizeTag(filters.tag);
            if (!matches) return false;
        }
        if (filters.accountId && canonicalAccountId(activity.accountId) !== filters.accountId) return false;
        if (filters.startDate && activity.date < filters.startDate) return false;
        if (filters.endDate && activity.date > filters.endDate) return false;
        return true;
    });
};

export const sortActivities = (activities, sortBy = "newest") => activities.map((activity,index)=>({activity,index})).sort((left,right)=>{
    if(sortBy==="newest")return right.activity.date.localeCompare(left.activity.date)||right.index-left.index;
    if(sortBy==="oldest")return left.activity.date.localeCompare(right.activity.date)||left.index-right.index;
    if(sortBy==="highest")return right.activity.amount-left.activity.amount||right.activity.date.localeCompare(left.activity.date);
    if(sortBy==="lowest")return left.activity.amount-right.activity.amount||right.activity.date.localeCompare(left.activity.date);
    return left.index-right.index;
}).map(item=>item.activity);

export const groupActivitiesByMonth = (activities, sortBy = "newest") => {
    const groups = new Map();
    for (const activity of activities) { const month=activity.date.slice(0,7); if(!groups.has(month))groups.set(month,[]); groups.get(month).push(activity); }
    const direction=sortBy==="oldest"?1:-1;
    return [...groups.entries()].sort(([a],[b])=>a.localeCompare(b)*direction).map(([month,items])=>({month,activities:items}));
};
