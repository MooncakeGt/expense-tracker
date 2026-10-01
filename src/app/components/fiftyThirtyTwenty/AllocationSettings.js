import { useEffect, useState } from "react";
import { searchCategories } from "../../utils/tags";
import { DEFAULT_PERCENTAGES, validatePlannerSettingsInput } from "../../utils/fiftyThirtyTwentySchema";
import { canonicalPlannerTag, getCategoryGroup, getDefaultCategoryGroup } from "../../utils/fiftyThirtyTwenty";
import CategoryLabel from "../categories/CategoryIcon";
import { useCategoryOverrides } from "../categories/CategoryIcon";

const groups = ["needs", "wants", "savings", "unassigned"];

export default function AllocationSettings({ settings, unknownTags, customCategories = [], onSave, onClose }) {
    const categoryOverrides = useCategoryOverrides();
    const [draft, setDraft] = useState({ percentages: { ...settings.percentages }, categoryOverrides: { ...settings.categoryOverrides } });
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");
    const available = searchCategories(query, "expense", unknownTags, customCategories, customCategories.map(category => category.id), undefined, categoryOverrides);
    const total = ["needs", "wants", "savings"].reduce((sum, key) => sum + (Number(draft.percentages[key]) || 0), 0);
    useEffect(() => {
        const closeOnEscape = event => { if (event.key === "Escape") onClose(); };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [onClose]);
    const setGroup = (tag, group) => setDraft(current => {
        const key = canonicalPlannerTag(tag, customCategories);
        const next = { ...current.categoryOverrides };
        if (group === getDefaultCategoryGroup(tag, customCategories)) delete next[key]; else next[key] = group;
        return { ...current, categoryOverrides: next };
    });
    const save = event => {
        event.preventDefault();
        const result = validatePlannerSettingsInput(draft);
        if (!result.success) { setError(result.error.issues[0]?.message || "Check the planner settings."); return; }
        onSave(result.data);
    };
    return <div className="planner-settings-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
        <section className="card shadow planner-settings" role="dialog" aria-modal="true" aria-labelledby="planner-settings-title">
            <form onSubmit={save} noValidate><div className="card-body">
                <div className="d-flex justify-content-between gap-2"><h2 id="planner-settings-title" className="h4">50/30/20 Settings</h2><button type="button" className="btn-close" aria-label="Close settings" onClick={onClose} /></div>
                <fieldset><legend className="h5">Allocation</legend><div className="row g-3">{["needs", "wants", "savings"].map(group => <div className="col-12 col-sm-4" key={group}><label className="form-label text-capitalize" htmlFor={`planner-${group}`}>{group}</label><div className="input-group"><input id={`planner-${group}`} className="form-control" type="number" min="0" max="100" step="any" value={draft.percentages[group]} onChange={event => { setDraft(current => ({ ...current, percentages: { ...current.percentages, [group]: event.target.value } })); setError(""); }} /><span className="input-group-text">%</span></div></div>)}</div><p className={`mt-2 ${total === 100 ? "text-muted" : "text-danger"}`}>Total: {total}%</p></fieldset>
                <button type="button" className="btn btn-sm btn-outline-secondary mb-3" onClick={() => setDraft(current => ({ ...current, percentages: { ...DEFAULT_PERCENTAGES } }))}>Reset to 50 / 30 / 20</button>
                <fieldset><legend className="h5">Category Classifications</legend><label className="form-label" htmlFor="classification-search">Search categories</label><input id="classification-search" type="search" className="form-control mb-3" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search names and keywords" />
                    <div className="planner-classification-list">{available.map(category => {
                        const key = canonicalPlannerTag(category.id, customCategories); const customized = Object.hasOwn(draft.categoryOverrides, key);
                        return <div className="border rounded p-2 mb-2" key={category.id}><div className="row g-2 align-items-center"><div className="col-12 col-sm"><label htmlFor={`group-${category.id}`} className="form-label mb-0"><CategoryLabel category={category} customCategories={customCategories} size={20} /> <small className="text-muted">({customized ? "Customized" : "Default"})</small></label></div><div className="col-8 col-sm-4"><select id={`group-${category.id}`} className="form-select" value={getCategoryGroup(category.id, draft.categoryOverrides, customCategories)} onChange={event => setGroup(category.id, event.target.value)}>{groups.map(group => <option value={group} key={group}>{group[0].toUpperCase() + group.slice(1)}</option>)}</select></div><div className="col-4 col-sm-auto"><button type="button" className="btn btn-sm btn-outline-secondary w-100" disabled={!customized} onClick={() => setGroup(category.id, getDefaultCategoryGroup(category.id, customCategories))}>Use Default</button></div></div></div>;
                    })}{!available.length && <p className="text-muted">No categories found.</p>}</div>
                </fieldset>
                {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
                <div className="d-flex flex-wrap gap-2 mt-3"><button className="btn btn-primary" type="submit">Save Settings</button><button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button></div>
            </div></form>
        </section>
    </div>;
}
