export const GOAL_ICONS = ["💰", "🛟", "✈️", "💻", "🏠", "🚗", "🎓", "💍", "🎁"];
const LEGACY_GOAL_ICONS = new Map([
    ["\u00f0\u0178\u2019\u00b0", GOAL_ICONS[0]],
    ["\u00f0\u0178\u203a\u0178", GOAL_ICONS[1]],
    ["\u00e2\u0153\u02c6\u00ef\u00b8\u008f", GOAL_ICONS[2]],
    ["\u00f0\u0178\u2019\u00bb", GOAL_ICONS[3]],
    ["\u00f0\u0178\u008f\u00a0", GOAL_ICONS[4]],
    ["\u00f0\u0178\u0161\u2014", GOAL_ICONS[5]],
    ["\u00f0\u0178\u017d\u201c", GOAL_ICONS[6]],
    ["\u00f0\u0178\u2019\u008d", GOAL_ICONS[7]],
    ["\u00f0\u0178\u017d\u0081", GOAL_ICONS[8]],
]);
export const normalizeGoalIcon = icon => LEGACY_GOAL_ICONS.get(icon) || icon;
export const getGoalContributions = (goalId, contributions = []) => contributions.filter(item => item.goalId === goalId);
export const getGoalSavedAmount = (goalId, contributions = []) => getGoalContributions(goalId, contributions).reduce((sum, item) => sum + item.amount, 0);
export const getGoalRemainingAmount = (goal, contributions = []) => Math.max(goal.targetAmount - getGoalSavedAmount(goal.id, contributions), 0);
export const getGoalProgress = (goal, contributions = []) => getGoalSavedAmount(goal.id, contributions) / goal.targetAmount * 100;
export const getGoalStatus = (goal, contributions = []) => goal.archived ? "Archived" : getGoalSavedAmount(goal.id, contributions) >= goal.targetAmount ? "Completed" : getGoalSavedAmount(goal.id, contributions) > 0 ? "In Progress" : "Not Started";
export const getActiveGoals = goals => goals.filter(goal => !goal.archived);
export const getCompletedGoals = (goals, contributions) => goals.filter(goal => !goal.archived && getGoalSavedAmount(goal.id, contributions) >= goal.targetAmount);
export const getArchivedGoals = goals => goals.filter(goal => goal.archived);
export const getGoalsSummary = (goals = [], contributions = []) => {
    const active = getActiveGoals(goals);
    const goalIds = new Set(active.map(goal => goal.id));
    const totalTarget = active.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSaved = contributions.filter(item => goalIds.has(item.goalId)).reduce((sum, item) => sum + item.amount, 0);
    return { totalTarget, totalSaved, progress: totalTarget ? totalSaved / totalTarget * 100 : null, activeCount: active.length };
};
export const getContributionTotalForYear = (contributions, year) => contributions.filter(item => item.date.startsWith(`${year}-`)).reduce((sum, item) => sum + item.amount, 0);
export const getValidGoalContributions = (goals, contributions) => { const ids = new Set(goals.map(goal => goal.id)); return contributions.filter(item => ids.has(item.goalId)); };
export const deleteSavingsGoalData = ({ goals = [], contributions = [], recurringRules = [], transfers = [] }, goalId) => ({
    goals: goals.filter(goal => goal.id !== goalId),
    contributions: contributions.filter(contribution => contribution.goalId !== goalId),
    recurringRules: recurringRules.filter(rule => rule.goalId !== goalId),
    transfers,
});
export const getTargetDateState = (goal, today) => !goal.targetDate ? null : goal.targetDate < today ? "Target date passed" : `${Math.ceil((Date.UTC(...goal.targetDate.split("-").map((part,index)=>index===1?Number(part)-1:Number(part))) - Date.UTC(...today.split("-").map((part,index)=>index===1?Number(part)-1:Number(part)))) / 86400000)} days remaining`;
