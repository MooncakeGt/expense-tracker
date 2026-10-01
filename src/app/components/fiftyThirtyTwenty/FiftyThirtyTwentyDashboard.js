import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../../utils/currency";
import { formatMonth, getCurrentMonth, shiftMonth } from "../../utils/dashboard";
import { getCategoryForTag, normalizeTag } from "../../utils/tags";
import { getPlannerData } from "../../utils/fiftyThirtyTwenty";
import { parseStoredPlannerSettings } from "../../utils/fiftyThirtyTwentySchema";
import AllocationChart from "./AllocationChart";
import AllocationSettings from "./AllocationSettings";
import PeriodNavigator from "../PeriodNavigator";
import CategoryLabel from "../categories/CategoryIcon";

const loadSettings = () => typeof window === "undefined" ? parseStoredPlannerSettings(null)
    : parseStoredPlannerSettings(localStorage.getItem("fiftyThirtyTwentySettings"));
const labels = { needs: "Needs", wants: "Wants", savings: "Savings" };

export default function FiftyThirtyTwentyDashboard({ transactions, customCategories = [] }) {
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
    const [settings, setSettings] = useState(loadSettings);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const initialSettings = useRef(settings);
    const currentMonth = getCurrentMonth();
    const data = getPlannerData(transactions, selectedMonth, settings.percentages, settings.categoryOverrides, customCategories);
    const unknownTags = [...new Set(transactions.map(item => normalizeTag(item.tag)).filter(tag => !getCategoryForTag(tag, customCategories)))];
    const unassignedCategoryCount = data.breakdown.unassigned.length;

    useEffect(() => {
        if (settings === initialSettings.current) return;
        try { localStorage.setItem("fiftyThirtyTwentySettings", JSON.stringify(settings)); }
        catch (error) { console.error("Unable to save 50/30/20 settings.", error); }
    }, [settings]);

    return <section aria-labelledby="planner-heading">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div><h2 id="planner-heading" className="h4 mb-1">Budget Planner</h2><p className="text-muted small mb-0">Compare actual monthly allocation with your preferred income targets.</p></div>
        </div>
        <PeriodNavigator mode="month" label={formatMonth(selectedMonth)} dateTime={selectedMonth} isCurrent={selectedMonth===currentMonth} onPrevious={() => setSelectedMonth(month => shiftMonth(month, -1))} onCurrent={() => setSelectedMonth(currentMonth)} onNext={() => setSelectedMonth(month => shiftMonth(month, 1))} actions={<button type="button" className="btn btn-primary" onClick={() => setSettingsOpen(true)}>Customize Categories & Targets</button>} />

        <div className="card shadow-sm mb-3"><div className="card-body"><span className="text-muted">Monthly Income</span><div className="h3 mb-0">{formatCurrency(data.income)}</div>{data.income === 0 && <p className="text-muted mb-0">No income recorded for this month. Actual expense totals are still shown.</p>}</div></div>
        {data.monthly.length === 0 && <div className="alert alert-light border">No financial activity recorded for {formatMonth(selectedMonth)}.</div>}
        {data.actuals.unassigned > 0 && <div className="alert alert-warning"><strong>{formatCurrency(data.actuals.unassigned)}</strong> of this month&apos;s spending has not been classified into Needs, Wants, or Savings. {unassignedCategoryCount} {unassignedCategoryCount === 1 ? "category needs" : "categories need"} classification. <button type="button" className="btn btn-sm btn-outline-dark ms-2" onClick={() => setSettingsOpen(true)}>Classify Categories</button></div>}

        <div className="row g-3 mb-3">{Object.keys(labels).map(group => {
            const difference = data.actuals[group] - data.targets[group];
            const share = data.shares[group];
            const targetStatus = difference > 0 ? "Above target" : difference < 0 ? "Below target" : "At target";
            return <div className="col-12 col-lg-4" key={group}><article className="card h-100 shadow-sm"><div className="card-body"><h3 className="h5">{labels[group]} — {settings.percentages[group]}%</h3><dl className="row mb-2"><dt className="col-6">Target</dt><dd className="col-6 text-end">{formatCurrency(data.targets[group])}</dd><dt className="col-6">Actual</dt><dd className="col-6 text-end">{formatCurrency(data.actuals[group])}</dd><dt className="col-6">Difference</dt><dd className="col-6"><div className="d-flex flex-wrap justify-content-end align-items-baseline gap-1 text-end"><strong>{formatCurrency(Math.abs(difference))}</strong><span className="small">{targetStatus}</span></div></dd><dt className="col-7">Actual share of income</dt><dd className="col-5 text-end">{share === null ? "—" : `${share.toFixed(1)}%`}</dd></dl><div className="progress" role="progressbar" aria-label={`${labels[group]} actual share of income`} aria-valuenow={share === null ? 0 : Math.round(share)} aria-valuemin="0" aria-valuemax="100"><div className="progress-bar" style={{ width: `${Math.min(100, Math.max(0, share ?? 0))}%` }} /></div><small className="text-muted">Target {settings.percentages[group]}% · Actual {share === null ? "—" : `${share.toFixed(1)}%`}</small></div></article></div>;
        })}</div>

        <div className="card shadow-sm mb-3"><div className="card-body"><h3 className="h5">Target vs Actual Allocation</h3><AllocationChart percentages={settings.percentages} shares={data.shares} /></div></div>

        <div className="row g-3">{["needs", "wants", "savings", "unassigned"].map(group => <div className="col-12 col-md-6" key={group}><section className="card h-100 shadow-sm"><div className="card-body"><h3 className="h5 text-capitalize">{group}</h3>{data.breakdown[group].length ? <ul className="list-group list-group-flush">{data.breakdown[group].map(item => <li className="list-group-item px-0 d-flex justify-content-between gap-2" key={item.tag}><CategoryLabel tag={item.tag} customCategories={customCategories} size={20} /><span>{formatCurrency(item.amount)}</span></li>)}</ul> : <p className="text-muted">No {group} expenses recorded.</p>}<div className="d-flex justify-content-between fw-semibold border-top pt-2"><span>Total</span><span>{formatCurrency(data.actuals[group])}</span></div></div></section></div>)}</div>
        {settingsOpen && <AllocationSettings settings={settings} unknownTags={unknownTags} customCategories={customCategories} onSave={value => { setSettings(value); setSettingsOpen(false); }} onClose={() => setSettingsOpen(false)} />}
    </section>;
}
