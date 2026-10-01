import { useEffect, useState } from "react";
import { categories, categoryHasReferences, getCategoryReferenceCounts, getMainCategoryById } from "../../utils/tags";
import { getDefaultCategoryGroup } from "../../utils/fiftyThirtyTwenty";
import { parseStoredBudgets } from "../../utils/budgetSchema";
import { parseStoredPlannerSettings } from "../../utils/fiftyThirtyTwentySchema";
import CategoryForm from "./CategoryForm";
import CategoryLabel from "./CategoryIcon";
import BuiltInCategoryIconForm from "./BuiltInCategoryIconForm";
import { resolveBuiltInCategory } from "../../utils/categoryIconOverrides";
import { useAppDialog } from "../ConfirmationModal";

export default function CategoryManager({ customCategories, categoryIconOverrides = {}, transactions, recurringRules, onSaveCategory, onArchive, onDeleteCategory, onSaveBuiltInIcon, onClose }) {
    const { confirm, notify } = useAppDialog();
    const [editing, setEditing] = useState(null);
    const [adding, setAdding] = useState(false);
    const [editingBuiltIn, setEditingBuiltIn] = useState(null);
    const [query, setQuery] = useState("");
    const [type, setType] = useState("all");
    const [status, setStatus] = useState("active");
    useEffect(() => {
        const close = event => { if (event.key === "Escape") onClose(); };
        document.addEventListener("keydown", close);
        return () => document.removeEventListener("keydown", close);
    }, [onClose]);
    const matches = customCategories.filter(category => (!query.trim() || [category.name, ...category.keywords].some(value => value.toLowerCase().includes(query.trim().toLowerCase()))) && (type === "all" || category.type === type || category.type === "both") && (status === "all" || (status === "archived") === category.archived));
    const isNameTaken = (name, currentId) => [...categories.map(category => resolveBuiltInCategory(category, categoryIconOverrides)), ...customCategories]
        .some(category => category.id !== currentId && category.name.trim().toLowerCase() === name.trim().toLowerCase());
    const changeBuiltInVisibility = async (category, hidden) => {
        if (!hidden || await confirm({ title: "Hide Preset Category?", message: `Hide \u201C${category.name}\u201D from new category selections? Historical records will continue to display it, and you can restore it later.`, confirmLabel: "Hide" })) onSaveBuiltInIcon(category.id, { hidden });
    };
    const changeCustomArchive = async category => {
        const archived = !category.archived;
        if (!archived || await confirm({ title: "Archive Category?", message: `Archive \u201C${category.name}\u201D? It will be hidden from new category selections while historical records remain available.`, confirmLabel: "Archive" })) onArchive(category.id, archived);
    };
    const deleteCustomCategory = async category => {
        const budgets = parseStoredBudgets(localStorage.getItem("budgets"));
        const plannerSettings = parseStoredPlannerSettings(localStorage.getItem("fiftyThirtyTwentySettings"));
        const references = getCategoryReferenceCounts(category.id, { transactions, recurringRules, budgets, plannerSettings, customCategories });
        if (references.total > 0) {
            const locations = [
                references.transactions && `${references.transactions} transaction${references.transactions === 1 ? "" : "s"}`,
                references.recurringRules && `${references.recurringRules} recurring rule${references.recurringRules === 1 ? "" : "s"}`,
                references.budgets && `${references.budgets} budget month${references.budgets === 1 ? "" : "s"}`,
                references.plannerOverrides && `${references.plannerOverrides} 50/30/20 override${references.plannerOverrides === 1 ? "" : "s"}`,
            ].filter(Boolean).join(", ");
            await notify({ title: "Category Is Still In Use", message: `\u201C${category.name}\u201D cannot be deleted because it is referenced by ${locations}. Reassign or remove those references first.`, confirmLabel: "Close" });
            return;
        }
        const confirmed = await confirm({ title: "Delete Custom Category?", message: `Permanently delete \u201C${category.name}\u201D? Its uploaded icon and category settings will also be removed. This action cannot be undone.`, confirmLabel: "Delete" });
        if (confirmed) onDeleteCategory(category.id, references);
    };
    return <div className="planner-settings-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="card shadow planner-settings category-manager" role="dialog" aria-modal="true" aria-labelledby="category-manager-heading"><div className="card-body"><div className="d-flex justify-content-between"><h2 id="category-manager-heading" className="h4">Manage Categories</h2><button type="button" className="btn-close" aria-label="Close Category Manager" onClick={onClose} /></div>
        {(adding || editing || editingBuiltIn) ? editingBuiltIn ? <><h3 className="h5">Customize Preset Category</h3><BuiltInCategoryIconForm category={editingBuiltIn} override={categoryIconOverrides[editingBuiltIn.id]} isNameTaken={isNameTaken} onSave={override => { onSaveBuiltInIcon(editingBuiltIn.id, override); setEditingBuiltIn(null); }} onCancel={() => setEditingBuiltIn(null)} /></> : <><h3 className="h5">{editing ? "Edit Category" : "Add Category"}</h3><CategoryForm initial={editing} customCategories={customCategories} typeLocked={Boolean(editing && categoryHasReferences(editing.id, transactions, recurringRules))} onSave={category => { onSaveCategory(category); setAdding(false); setEditing(null); }} onCancel={() => { setAdding(false); setEditing(null); }} /></> : <>
            <section><h3 className="h5">Built-in Categories</h3><p className="small text-muted">Preset categories can be renamed, given a custom image, or hidden from new transaction forms. Existing records remain available.</p><div className="table-responsive category-manager-builtins"><table className="table table-sm align-middle"><thead><tr><th>Main Category</th><th>Subcategory</th><th>Type</th><th>50/30/20</th><th><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{categories.map(category => { const override=categoryIconOverrides[category.id],hidden=override?.hidden===true;return <tr key={category.id} className={hidden ? "text-muted" : undefined}><td>{getMainCategoryById(category.mainCategoryId)?.icon} {category.mainCategory}</td><td><CategoryLabel category={category} size={20} /> {hidden && <span className="badge text-bg-secondary">Hidden</span>}</td><td className="text-capitalize">{category.type}</td><td className="text-capitalize">{category.type === "income" ? "\u2014" : getDefaultCategoryGroup(category.id)}</td><td className="text-end"><div className="d-flex flex-wrap justify-content-end gap-1"><button type="button" className="btn btn-sm btn-outline-primary text-nowrap" onClick={() => setEditingBuiltIn(category)}>Customize</button><button type="button" className={`btn btn-sm text-nowrap ${hidden ? "btn-outline-success" : "btn-outline-secondary"}`} onClick={() => changeBuiltInVisibility(category, !hidden)}>{hidden ? "Restore" : "Hide"}</button></div></td></tr>;})}</tbody></table></div></section>
            <section className="mt-4"><h3 className="h5 mb-3">Your Categories</h3><div className="row g-2 align-items-end mb-3"><div className="col-12 col-lg"><label className="visually-hidden" htmlFor="category-manager-search">Search categories</label><input id="category-manager-search" type="search" className="form-control" placeholder="Search categories" value={query} onChange={event => setQuery(event.target.value)} /></div><div className="col-6 col-sm-4 col-lg-2"><select className="form-select" aria-label="Category type" value={type} onChange={event => setType(event.target.value)}><option value="all">All Types</option><option value="expense">Expense</option><option value="income">Income</option><option value="both">Both</option></select></div><div className="col-6 col-sm-4 col-lg-2"><select className="form-select" aria-label="Archive status" value={status} onChange={event => setStatus(event.target.value)}><option value="active">Active</option><option value="archived">Archived</option><option value="all">All</option></select></div><div className="col-12 col-sm-auto"><button type="button" className="btn btn-primary w-100" onClick={() => setAdding(true)}>Add Category</button></div></div>
                {!customCategories.length ? <p className="text-muted">You haven&apos;t created any custom categories yet.</p> : !matches.length ? <p className="text-muted">No categories match these filters.</p> : <div className="list-group">{matches.map(category => <div className="list-group-item" key={category.id}><div className="d-flex flex-column flex-sm-row justify-content-between gap-2"><div><strong><CategoryLabel category={category} /></strong><div className="small text-muted">{getMainCategoryById(category.mainCategoryId)?.name || "Other"} {"\u00B7"} <span className="text-capitalize">{category.type}{category.type !== "income" ? ` \u00B7 ${category.budgetGroup}` : ""}</span>{category.keywords.length ? ` \u00B7 ${category.keywords.join(", ")}` : ""}</div></div><div className="d-flex flex-wrap gap-2 align-self-start"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setEditing(category)}>Edit</button><button type="button" className={`btn btn-sm ${category.archived ? "btn-outline-success" : "btn-outline-secondary"}`} onClick={() => changeCustomArchive(category)}>{category.archived ? "Restore" : "Archive"}</button><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteCustomCategory(category)}>Delete</button></div></div></div>)}</div>}
            </section></>}
    </div></section></div>;
}

