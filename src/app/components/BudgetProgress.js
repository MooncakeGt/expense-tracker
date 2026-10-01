import { formatCurrency } from "../utils/currency";
import { getCategoryDisplay } from "../utils/tags";
import CategoryLabel, { useCategoryOverrides } from "./categories/CategoryIcon";
import { calculateBudgetProgress, calculateCategoryBudgetProgress } from "../utils/budgets";
import { formatMonth } from "../utils/dashboard";

const ProgressDetails = ({ progress, label }) => (
    <>
        <div className="d-flex flex-wrap justify-content-between gap-1 small">
            <span>{formatCurrency(progress.spent)} spent of {formatCurrency(progress.budget)}</span>
            <strong>{progress.percentage.toFixed(1)}% used</strong>
        </div>
        <div className="progress my-2" role="progressbar" aria-label={`${label}: ${progress.percentage.toFixed(1)}% used`}
            aria-valuenow={Math.min(100, Math.round(progress.percentage))} aria-valuemin="0" aria-valuemax="100">
            <div className={`progress-bar bg-${progress.status.color}`} style={{ width: `${Math.min(100, progress.percentage)}%` }} />
        </div>
        <div className="d-flex flex-wrap justify-content-between gap-1 small">
            <span>{progress.remaining < 0
                ? `${formatCurrency(-progress.remaining)} over budget`
                : `${formatCurrency(progress.remaining)} remaining`}</span>
            <span className="fw-semibold">{progress.status.label}</span>
        </div>
    </>
);

export default function BudgetProgress({ month, budget, previousMonth, previousBudget, expenses, spending, customCategories = [], onManage, onCopy }) {
    const categoryOverrides = useCategoryOverrides();
    const hasBudget = Boolean(budget?.total || Object.keys(budget?.categories || {}).length);
    if (!hasBudget) return (
        <div className="card shadow-sm mb-3">
            <div className="card-body">
                <h3 className="h5">Monthly Budget</h3>
                <p className="text-muted">No budget set for {formatMonth(month)}.</p>
                <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={onManage}>Set Monthly Budget</button>
                    {previousBudget && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCopy}>
                        Copy {formatMonth(previousMonth)} Budget
                    </button>}
                </div>
            </div>
        </div>
    );

    const categories = calculateCategoryBudgetProgress(spending, budget.categories).sort((a, b) => b.percentage - a.percentage);
    return (
        <div className="row g-3 mb-3">
            {budget.total && (
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h3 className="h5">Monthly Budget</h3>
                            <ProgressDetails progress={calculateBudgetProgress(expenses, budget.total)} label="Overall monthly budget" />
                        </div>
                    </div>
                </div>
            )}
            {categories.length > 0 && (
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h3 className="h5">Category Budgets</h3>
                            <div className="row g-3">
                                {categories.map(category => (
                                    <div key={category.tag} className="col-12 col-md-6">
                                        <div className="border rounded p-3 h-100">
                                            <h4 className="h6 text-break"><CategoryLabel tag={category.tag} customCategories={customCategories} size={20} /></h4>
                                            <ProgressDetails progress={category} label={getCategoryDisplay(category.tag, customCategories, categoryOverrides)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
