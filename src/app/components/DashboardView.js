import { useState } from "react";
import MonthlyDashboard from "./MonthlyDashboard";
import YearlyDashboard from "./YearlyDashboard";
import AccountSummary from "./accounts/AccountSummary";
import SavingsGoalsSummary from "./savingsGoals/SavingsGoalsSummary";

export default function DashboardView({ transactions, customCategories = [], onViewAll, accounts = [], transfers = [], savingsGoals = [], savingsGoalContributions = [], onViewSavingsGoals }) {
    const [mode, setMode] = useState("monthly");
    return <section aria-labelledby="dashboard-view-heading">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><h2 id="dashboard-view-heading" className="h4 mb-0">Dashboard</h2><div className="btn-group period-mode-toggle" role="group" aria-label="Dashboard period"><button type="button" className={`btn btn-outline-primary${mode === "monthly" ? " active" : ""}`} aria-pressed={mode === "monthly"} onClick={() => setMode("monthly")}>Monthly</button><button type="button" className={`btn btn-outline-primary${mode === "yearly" ? " active" : ""}`} aria-pressed={mode === "yearly"} onClick={() => setMode("yearly")}>Yearly</button></div></div>
        <AccountSummary accounts={accounts} transactions={transactions} transfers={transfers} contributions={savingsGoalContributions} />
        <SavingsGoalsSummary goals={savingsGoals} contributions={savingsGoalContributions} onView={onViewSavingsGoals} />
        <div hidden={mode !== "monthly"}><MonthlyDashboard transactions={transactions} customCategories={customCategories} onViewAll={onViewAll} /></div>
        <div hidden={mode !== "yearly"}><YearlyDashboard transactions={transactions} customCategories={customCategories} /></div>
    </section>;
}
