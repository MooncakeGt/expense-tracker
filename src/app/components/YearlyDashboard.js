import { useState } from "react";
import { formatCurrency } from "../utils/currency";
import { formatMonth, getYearComparison, getYearDashboard } from "../utils/dashboard";
import { getCategoryDisplay } from "../utils/tags";
import SpendingByCategoryChart from "./charts/SpendingByCategoryChart";
import { YearlyIncomeExpenseChart, YearlyNetChart } from "./charts/YearlyCharts";
import { EMPTY_VALUE } from "../utils/display";
import PeriodNavigator from "./PeriodNavigator";
import CategoryLabel from "./categories/CategoryIcon";

export default function YearlyDashboard({ transactions, customCategories = [] }) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const data = getYearDashboard(transactions, selectedYear, customCategories);
    const previous = getYearDashboard(transactions, selectedYear - 1, customCategories);
    const { summary } = data;
    return <section aria-labelledby="yearly-dashboard-heading">
        <h2 id="yearly-dashboard-heading" className="visually-hidden">Yearly Dashboard</h2>
        <PeriodNavigator mode="year" label={String(selectedYear)} dateTime={String(selectedYear)} isCurrent={selectedYear === currentYear} onPrevious={() => setSelectedYear(year => year - 1)} onCurrent={() => setSelectedYear(currentYear)} onNext={() => setSelectedYear(year => year + 1)} />
        <div className="row g-3 mb-3">{[
            ["Total Income", summary.income, getYearComparison(summary.income, previous.summary.income, String(selectedYear - 1))],
            ["Total Expenses", summary.expenses, getYearComparison(summary.expenses, previous.summary.expenses, String(selectedYear - 1))],
            ["Net", summary.net],
            ["Savings Rate", summary.savingsRate === null ? null : summary.savingsRate],
        ].map(([label, value, detail]) => <div className="col-12 col-sm-6 col-xl-3" key={label}><div className="card h-100 shadow-sm"><div className="card-body"><h3 className="h6 text-muted">{label}</h3><div className="h5">{label === "Savings Rate" ? value === null ? EMPTY_VALUE : `${value.toFixed(1)}%` : formatCurrency(value)}</div>{detail && <small className="text-muted">{detail}</small>}</div></div></div>)}</div>
        <div className="row g-3 mb-3"><div className="col-12 col-md-4"><div className="card h-100"><div className="card-body"><span className="text-muted">Average Monthly Income</span><div className="h5">{formatCurrency(data.averageIncome)}</div></div></div></div><div className="col-12 col-md-4"><div className="card h-100"><div className="card-body"><span className="text-muted">Average Monthly Expenses</span><div className="h5">{formatCurrency(data.averageExpenses)}</div></div></div></div><div className="col-12 col-md-4"><div className="card h-100"><div className="card-body"><span className="text-muted">Highest Spending Month</span><div className="h5">{data.highestSpendingMonth ? formatMonth(data.highestSpendingMonth.month) : "—"}</div>{data.highestSpendingMonth && <span>{formatCurrency(data.highestSpendingMonth.expenses)}</span>}</div></div></div></div>
        <div className="row g-3 mb-3"><div className="col-12 col-lg-6"><div className="card h-100 shadow-sm"><div className="card-body"><h3 className="h5">Income vs Expenses by Month</h3><YearlyIncomeExpenseChart months={data.months} year={selectedYear} /></div></div></div><div className="col-12 col-lg-6"><div className="card h-100 shadow-sm"><div className="card-body"><h3 className="h5">Monthly Net</h3><YearlyNetChart months={data.months} year={selectedYear} /></div></div></div></div>
        <div className="row g-3 mb-3"><div className="col-12 col-lg-6"><div className="card h-100 shadow-sm"><div className="card-body"><h3 className="h5">Yearly Spending by Category</h3><SpendingByCategoryChart spending={data.spending} customCategories={customCategories} /></div></div></div><div className="col-12 col-lg-6"><div className="card h-100 shadow-sm"><div className="card-body"><h3 className="h5">Category Totals</h3>{data.spending.length ? data.spending.map(item => <div className="border-bottom py-2" key={item.tag}><div className="d-flex justify-content-between gap-2"><span>{getCategoryDisplay(item.tag, customCategories)}</span><span>{formatCurrency(item.amount)} · {item.percentage.toFixed(1)}%</span></div><div className="small text-muted mt-1 d-flex flex-wrap gap-2">{item.subcategories.map(category => <span className="d-inline-flex align-items-center gap-1" key={category.tag}><CategoryLabel tag={category.tag} customCategories={customCategories} size={18} /><span>{formatCurrency(category.amount)}</span></span>)}</div></div>) : <p className="text-muted">No expenses recorded in this year.</p>}</div></div></div></div>
        <div className="card shadow-sm"><div className="card-body"><h3 className="h5">12-Month Breakdown</h3><div className="table-responsive"><table className="table table-sm"><thead><tr><th>Month</th><th className="text-end">Income</th><th className="text-end">Expenses</th><th className="text-end">Net</th></tr></thead><tbody>{data.months.map(month => <tr key={month.month}><th>{formatMonth(month.month).split(" ")[0]}</th><td className="text-end">{formatCurrency(month.income)}</td><td className="text-end">{formatCurrency(month.expenses)}</td><td className="text-end">{formatCurrency(month.net)}</td></tr>)}</tbody></table></div></div></div>
    </section>;
}
