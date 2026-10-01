import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../utils/currency";
import { getCategoryDisplay, getCategoryForTag } from "../utils/tags";
import { EMPTY_VALUE } from "../utils/display";
import { parseStoredBudgets } from "../utils/budgetSchema";
import {
    formatMonth,
    getCategorySpending,
    getMainCategorySpending,
    getCurrentMonth,
    getDailySpending,
    getMonthComparison,
    getMonthlySummary,
    getMonthlyTrend,
    getRecentTransactions,
    getTransactionsForMonth,
    shiftMonth,
} from "../utils/dashboard";
import SpendingByCategoryChart from "./charts/SpendingByCategoryChart";
import IncomeExpenseTrendChart from "./charts/IncomeExpenseTrendChart";
import MonthlySpendingChart from "./charts/MonthlySpendingChart";
import BudgetEditor from "./BudgetEditor";
import BudgetProgress from "./BudgetProgress";
import PeriodNavigator from "./PeriodNavigator";
import CategoryLabel from "./categories/CategoryIcon";

const loadBudgets = () => {
    if (typeof window === "undefined") return {};
    try {
        return parseStoredBudgets(localStorage.getItem("budgets"));
    } catch {
        return {};
    }
};

export default function MonthlyDashboard({ transactions, customCategories = [], onViewAll }) {
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
    const [budgets, setBudgets] = useState(loadBudgets);
    const initialBudgets = useRef(budgets);
    const [editorOpen, setEditorOpen] = useState(false);
    const manageButtonRef = useRef(null);
    const currentMonth = getCurrentMonth();
    const monthlyTransactions = getTransactionsForMonth(transactions, selectedMonth);
    const previousMonth = shiftMonth(selectedMonth, -1);
    const previousLabel = formatMonth(previousMonth);
    const previousTransactions = getTransactionsForMonth(transactions, previousMonth);
    const summary = getMonthlySummary(monthlyTransactions);
    const previousSummary = getMonthlySummary(previousTransactions);
    const spending = getCategorySpending(monthlyTransactions, customCategories);
    const mainSpending = getMainCategorySpending(monthlyTransactions, customCategories);
    const recent = getRecentTransactions(monthlyTransactions);
    const trend = getMonthlyTrend(transactions, selectedMonth);
    const daily = getDailySpending(transactions, selectedMonth);
    const budget = budgets[selectedMonth];
    const previousBudget = budgets[previousMonth];
    const unknownTags = spending.map(item => item.tag).filter(tag => !getCategoryForTag(tag, customCategories));

    useEffect(() => {
        if (budgets === initialBudgets.current) return;
        try {
            localStorage.setItem("budgets", JSON.stringify(budgets));
        } catch (error) {
            console.error("Unable to save budgets.", error);
        }
    }, [budgets]);

    const closeEditor = () => {
        setEditorOpen(false);
        manageButtonRef.current?.focus();
    };

    const saveBudget = value => {
        setBudgets(current => {
            const next = { ...current };
            if (value.total || Object.keys(value.categories).length) next[selectedMonth] = value;
            else delete next[selectedMonth];
            return next;
        });
        closeEditor();
    };

    const copyPreviousBudget = () => {
        if (!previousBudget) return;
        setBudgets(current => ({
            ...current,
            [selectedMonth]: { ...previousBudget, categories: { ...previousBudget.categories } },
        }));
    };

    return (
        <section aria-labelledby="dashboard-heading" className="mb-4">
            <h2 id="dashboard-heading" className="visually-hidden">Monthly Dashboard</h2>
            <PeriodNavigator mode="month" label={formatMonth(selectedMonth)} dateTime={selectedMonth} isCurrent={selectedMonth === currentMonth} onPrevious={() => setSelectedMonth(month => shiftMonth(month, -1))} onCurrent={() => setSelectedMonth(currentMonth)} onNext={() => setSelectedMonth(month => shiftMonth(month, 1))} actions={<button ref={manageButtonRef} type="button" className="btn btn-outline-primary" onClick={() => setEditorOpen(true)}>Manage Budget</button>} />

            <div className="row g-3 mb-3">
                {[
                    { label: "Income", value: formatCurrency(summary.income), detail: getMonthComparison(summary.income, previousSummary.income, previousLabel) },
                    { label: "Expenses", value: formatCurrency(summary.expenses), detail: getMonthComparison(summary.expenses, previousSummary.expenses, previousLabel) },
                    { label: "Net", value: formatCurrency(summary.net) },
                    { label: "Savings Rate", value: summary.savingsRate === null ? EMPTY_VALUE : `${summary.savingsRate.toFixed(1)}%` },
                ].map(card => (
                    <div key={card.label} className="col-12 col-sm-6 col-xl-3">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body">
                                <h3 className="h6 text-muted">{card.label}</h3>
                                <div className="h5 mb-1">{card.value}</div>
                                {card.detail && <small className="text-muted">{card.detail}</small>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <BudgetProgress month={selectedMonth} budget={budget} previousMonth={previousMonth}
                previousBudget={previousBudget} expenses={summary.expenses} spending={spending}
                customCategories={customCategories}
                onManage={() => setEditorOpen(true)} onCopy={copyPreviousBudget} />

            <div className="row g-3 mb-3">
                <div className="col-12 col-lg-6">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="h5">Spending by Category Chart</h3>
                            <SpendingByCategoryChart spending={mainSpending} customCategories={customCategories} />
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-6">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="h5">Income vs Expenses</h3>
                            <IncomeExpenseTrendChart trend={trend} />
                        </div>
                    </div>
                </div>
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h3 className="h5">Daily Spending — {formatMonth(selectedMonth)}</h3>
                            <MonthlySpendingChart daily={daily} month={selectedMonth} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                <div className="col-12 col-lg-6">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="h5">Spending by Category</h3>
                            {mainSpending.length === 0 ? <p className="text-muted mb-0">No expenses recorded for this month.</p> : (
                                <>
                                    <p className="small mb-3">
                                        Top spending category: <strong>{getCategoryDisplay(mainSpending[0].tag, customCategories)}</strong> · {formatCurrency(mainSpending[0].amount)}
                                    </p>
                                    {mainSpending.map(category => (
                                        <div key={category.tag} className="mb-3">
                                            <div className="d-flex flex-wrap justify-content-between gap-1 small mb-1">
                                                <span>{getCategoryDisplay(category.tag, customCategories)}</span>
                                                <span>{formatCurrency(category.amount)} · {category.percentage.toFixed(1)}%</span>
                                            </div>
                                            <div className="progress" role="progressbar" aria-label={`${getCategoryDisplay(category.tag, customCategories)} share of monthly expenses`}
                                                aria-valuenow={Math.round(category.percentage)} aria-valuemin="0" aria-valuemax="100">
                                                <div className="progress-bar" style={{ width: `${category.percentage}%` }} />
                                            </div>
                                            <div className="small text-muted mt-1 d-flex flex-wrap gap-2">
                                                {category.subcategories.map(item => <span className="d-inline-flex align-items-center gap-1" key={item.tag}><CategoryLabel tag={item.tag} customCategories={customCategories} size={18} /><span>{formatCurrency(item.amount)}</span></span>)}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-6">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="h5">Recent Transactions</h3>
                            <p className="small text-muted">
                                {summary.count} total · {summary.incomeCount} income · {summary.expenseCount} expenses
                            </p>
                            {recent.length === 0 ? <p className="text-muted">No transactions recorded for this month.</p> : (
                                <ul className="list-group list-group-flush mb-3">
                                    {recent.map(transaction => (
                                        <li key={transaction.id} className="list-group-item px-0 d-flex flex-wrap justify-content-between gap-2">
                                            <div className="text-break">
                                                <strong>{transaction.description}</strong>
                                                <div className="small text-muted d-flex flex-wrap align-items-center gap-1"><CategoryLabel tag={transaction.tag} customCategories={customCategories} size={18} /><span>· {transaction.date}</span></div>
                                            </div>
                                            <div className="text-sm-end">
                                                <div>{formatCurrency(transaction.amount)}</div>
                                                <small className="text-muted text-capitalize">{transaction.type}</small>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onViewAll}>
                                View All Transactions
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {editorOpen && <BudgetEditor key={selectedMonth} month={selectedMonth} budget={budget}
                extraTags={unknownTags} customCategories={customCategories} onSave={saveBudget} onClose={closeEditor} />}
        </section>
    );
}
