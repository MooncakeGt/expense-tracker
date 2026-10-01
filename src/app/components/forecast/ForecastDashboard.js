import { useMemo, useState } from "react";
import { calculateAllAccountBalances, getAccountDisplayName, getAccountTotals } from "../../utils/accounts";
import { formatCurrency } from "../../utils/currency";
import { formatMonth } from "../../utils/dashboard";
import {
    buildForecastEvents,
    calculateRequiredContribution,
    estimateGoalCompletionDate,
    FIXED_FORECAST_MONTHS,
    getAggregateMonthlyForecast,
    getCurrentYearAverageSpending,
    getForecastEndDate,
    getLatestActualMonthlyIncome,
    getProjectedAvailableBalanceTrend,
    simulateGoalContributionScenario,
} from "../../utils/forecast";
import { ForecastBalanceChart, ForecastCashFlowChart } from "./ForecastCharts";

const formatDate = value => {
    if (!value) return "No completion estimate";
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
};
const etaLabel = result => result.status === "completed" ? "Completed" : result.status === "estimated" ? formatDate(result.date) : result.status === "beyond" ? "More than 30 years" : "No completion estimate";

export default function ForecastDashboard({ transactions, transfers, accounts, transactionRules, transferRules, goalRules, goals, contributions, today }) {
    const [scenario, setScenario] = useState({});
    const [dates, setDates] = useState({});
    const endDate = getForecastEndDate(today, FIXED_FORECAST_MONTHS);
    const events = useMemo(() => buildForecastEvents({ transactionRules, transferRules, goalContributionRules: goalRules, goals, today, endDate }), [transactionRules, transferRules, goalRules, goals, today, endDate]);
    const incomeBaseline = useMemo(() => getLatestActualMonthlyIncome(transactions, today), [transactions, today]);
    const spendingAverage = useMemo(() => getCurrentYearAverageSpending(transactions, today), [transactions, today]);
    const balanceForecast = useMemo(() => getAggregateMonthlyForecast(events, today, FIXED_FORECAST_MONTHS, incomeBaseline.total, spendingAverage.average), [events, today, incomeBaseline.total, spendingAverage.average]);
    const nextMonthCashFlow = useMemo(() => balanceForecast.slice(0, 1), [balanceForecast]);
    const startingAvailableBalance = useMemo(() => getAccountTotals(calculateAllAccountBalances(accounts, transactions, transfers, contributions)).available, [accounts, transactions, transfers, contributions]);
    const availableBalanceTrend = useMemo(() => getProjectedAvailableBalanceTrend(startingAvailableBalance, balanceForecast), [startingAvailableBalance, balanceForecast]);
    const hasBalanceForecastData = startingAvailableBalance !== 0 || transactions.length > 0 || events.some(event => event.kind === "transaction");
    const activeGoals = useMemo(() => goals.filter(goal => !goal.archived), [goals]);
    const hasGoalForecastData = useMemo(() => activeGoals.some(goal => estimateGoalCompletionDate(goal, contributions, goalRules.filter(rule => rule.goalId === goal.id), today).status !== "none"), [activeGoals, contributions, goalRules, today]);

    return <section aria-labelledby="forecast-heading">
        <div className="mb-3">
            <h2 id="forecast-heading" className="h4 mb-1">Forecast</h2>
            <p className="text-muted mb-0">A 12-month available balance outlook with next-month cash flow, recurring events, and savings goals.</p>
        </div>
        <div className="alert alert-info small">
            Projected income uses {incomeBaseline.month ? `${formatCurrency(incomeBaseline.total)} from ${formatMonth(incomeBaseline.month)}` : "RM 0.00 because no actual income is available"}. Projected expenses use {formatCurrency(spendingAverage.average)} averaged across {spendingAverage.activeMonths} current-year month{spendingAverage.activeMonths === 1 ? "" : "s"} with actual spending. Each month&apos;s net savings is carried into the available balance.<br />
            Actual through {formatDate(today)} · Projected through {formatDate(endDate)}.
        </div>
        <div className="row g-3 mb-4">
            <div className="col-12 col-lg-6">
                <div className="card h-100"><div className="card-body">
                    <h3 className="h5">Projected Balance Trend</h3>
                    <p className="small text-muted">Starting available balance: {formatCurrency(startingAvailableBalance)}</p>
                    {hasBalanceForecastData ? <ForecastBalanceChart trend={availableBalanceTrend} /> : <p className="text-muted mb-0 py-3">No projected balance data available yet. Add account activity or recurring income/expenses to generate a balance forecast.</p>}
                </div></div>
            </div>
            <div className="col-12 col-lg-6">
                <div className="card h-100"><div className="card-body">
                    <h3 className="h5">Cash-Flow Forecast</h3>
                    <p className="small text-muted">Projected income, expenses, and net savings for {nextMonthCashFlow.length ? formatMonth(nextMonthCashFlow[0].month) : "next month"}.</p>
                    <ForecastCashFlowChart monthly={nextMonthCashFlow} />
                </div></div>
            </div>
        </div>
        <section className="card mb-4"><div className="card-body">
            <h3 className="h5">Savings Goal Forecasts</h3>
            {!hasGoalForecastData && <p className="text-muted mb-3">No savings goal forecasts available yet. Add a savings goal and contribution plan to see an estimated completion timeline.</p>}
            <div className="row g-3">{activeGoals.map(goal => {
                const rules = goalRules.filter(rule => rule.goalId === goal.id);
                const eta = estimateGoalCompletionDate(goal, contributions, rules, today);
                const amount = Number(scenario[goal.id] || 0);
                const simulation = simulateGoalContributionScenario(goal, contributions, rules, today, amount);
                const required = calculateRequiredContribution(goal, contributions, rules, today, dates[goal.id]);
                return <div className="col-12 col-lg-6" key={goal.id}><article className="border rounded p-3 h-100">
                    <h4 className="h5">{goal.icon} {goal.name}</h4>
                    <p>Estimated completion: <strong>{etaLabel(eta)}</strong></p>
                    {goal.targetDate && <p className="small">Target date: {formatDate(goal.targetDate)}</p>}
                    <label className="form-label" htmlFor={`scenario-${goal.id}`}>What-if total monthly contribution</label>
                    <div className="input-group mb-2"><span className="input-group-text">RM</span><input id={`scenario-${goal.id}`} type="number" min="0" step="any" className="form-control" value={scenario[goal.id] || ""} onChange={event => setScenario({ ...scenario, [goal.id]: event.target.value })} /></div>
                    <div className="d-flex flex-wrap gap-1 mb-2">{[50, 100, 250, 500].map(value => <button type="button" className="btn btn-sm btn-outline-secondary" key={value} onClick={() => setScenario({ ...scenario, [goal.id]: value })}>RM{value}/month</button>)}</div>
                    {amount > 0 && <p className="small">Scenario completion: <strong>{etaLabel(simulation.scenario)}</strong>. This does not change your rules.</p>}
                    <label className="form-label" htmlFor={`reach-${goal.id}`}>Reach goal by</label>
                    <input id={`reach-${goal.id}`} type="date" className="form-control mb-2" value={dates[goal.id] || ""} onChange={event => setDates({ ...dates, [goal.id]: event.target.value })} />
                    {dates[goal.id] && (required.valid ? required.alreadySufficient ? <div className="alert alert-success small">Current scheduled contributions are projected to be sufficient.</div> : <div className="small"><div>Exact additional monthly contribution: <strong>{formatCurrency(required.exact)}</strong></div><div>Practical rounded amount: {formatCurrency(required.practical)}</div><div>{required.opportunities} monthly opportunities assumed.</div></div> : <div className="text-danger small">{required.error}</div>)}
                </article></div>;
            })}</div>
        </div></section>
        <section className="card"><div className="card-body">
            <h3 className="h5">Projected Timeline</h3>
            {events.length ? <div className="list-group list-group-flush">{events.slice(0, 50).map((event, index) => <div className="list-group-item px-0" key={`${event.sourceRuleId}-${event.date}-${index}`}><span className="badge text-bg-secondary me-2">Projected</span><strong>{event.date}</strong> · {event.kind === "transaction" ? `${event.subtype} ${event.description}` : event.kind === "transfer" ? `${getAccountDisplayName(event.fromAccountId, accounts)} → ${getAccountDisplayName(event.toAccountId, accounts)}` : "Savings goal contribution"} · {formatCurrency(event.amount)}</div>)}</div> : <p className="text-muted">No projected events.</p>}
        </div></section>
    </section>;
}
