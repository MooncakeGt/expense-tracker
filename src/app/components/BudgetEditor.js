import { useEffect, useRef, useState } from "react";
import CategorySelect from "./CategorySelect";
import { getCategoryDisplay } from "../utils/tags";
import { canonicalBudgetTag, getBudgetFieldErrors, validateBudgetInput } from "../utils/budgetSchema";
import { formatMonth } from "../utils/dashboard";
import CategoryLabel, { useCategoryOverrides } from "./categories/CategoryIcon";

export default function BudgetEditor({ month, budget, extraTags, customCategories = [], onSave, onClose }) {
    const categoryOverrides = useCategoryOverrides();
    const [total, setTotal] = useState(budget?.total == null ? "" : String(budget.total));
    const [categories, setCategories] = useState(() => Object.fromEntries(
        Object.entries(budget?.categories || {}).map(([tag, amount]) => [tag, String(amount)])
    ));
    const [errors, setErrors] = useState({});
    const dialogRef = useRef(null);
    const totalRef = useRef(null);

    useEffect(() => { totalRef.current?.focus(); }, []);

    const save = event => {
        event.preventDefault();
        const result = validateBudgetInput({ total, categories });
        if (!result.success) {
            setErrors(getBudgetFieldErrors(result.error));
            return;
        }
        onSave(result.data);
    };

    const handleKeys = event => {
        if (event.key === "Escape") {
            event.preventDefault();
            onClose();
        }
        if (event.key !== "Tab") return;
        const focusable = [...dialogRef.current.querySelectorAll("button, input, select")]
            .filter(element => !element.disabled && element.offsetParent !== null);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onMouseDown={event => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                <div ref={dialogRef} className="modal-content" role="dialog" aria-modal="true"
                    aria-labelledby="budget-editor-heading" onKeyDown={handleKeys}>
                    <form onSubmit={save} noValidate>
                        <div className="modal-header">
                            <h2 id="budget-editor-heading" className="modal-title h5">Manage Budget — {formatMonth(month)}</h2>
                            <button type="button" className="btn-close" aria-label="Close budget editor" onClick={onClose} />
                        </div>
                        <div className="modal-body">
                            <label className="form-label" htmlFor="budget-total">Overall Monthly Budget</label>
                            <div className="input-group">
                                <span className="input-group-text">RM</span>
                                <input ref={totalRef} id="budget-total" type="number" min="0" step="any" className="form-control"
                                    value={total} onChange={event => { setTotal(event.target.value); setErrors(current => ({ ...current, total: undefined })); }}
                                    aria-invalid={Boolean(errors.total)} placeholder="Optional" />
                                <button type="button" className="btn btn-outline-secondary" onClick={() => { setTotal(""); setErrors(current => ({ ...current, total: undefined })); }}>
                                    Clear
                                </button>
                            </div>
                            {errors.total && <div className="text-danger small" role="alert">{errors.total}</div>}
                            <p className="text-muted small mt-1">Leave blank to remove the overall budget.</p>

                            <h3 className="h6 mt-4">Category Budgets</h3>
                            {Object.entries(categories).length === 0 && <p className="text-muted small">No category budgets added.</p>}
                            {Object.entries(categories).map(([tag, amount], index) => (
                                <div key={tag} className="border rounded p-2 mb-2">
                                    <label className="form-label" htmlFor={`budget-category-${index}`}><CategoryLabel tag={tag} customCategories={customCategories} size={20} /></label>
                                    <div className="d-flex flex-wrap gap-2">
                                        <div className="input-group flex-grow-1 budget-amount-input">
                                            <span className="input-group-text">RM</span>
                                            <input id={`budget-category-${index}`} type="number" min="0" step="any" className="form-control"
                                                value={amount} onChange={event => {
                                                    setCategories(current => ({ ...current, [tag]: event.target.value }));
                                                    setErrors(current => ({ ...current, [tag]: undefined }));
                                                }} aria-invalid={Boolean(errors[tag])} />
                                        </div>
                                        <button type="button" className="btn btn-outline-danger" aria-label={`Remove ${getCategoryDisplay(tag, customCategories, categoryOverrides)} budget`}
                                            onClick={() => setCategories(current => Object.fromEntries(Object.entries(current).filter(([key]) => key !== tag)))}>
                                            Remove
                                        </button>
                                    </div>
                                    {errors[tag] && <div className="text-danger small" role="alert">{errors[tag]}</div>}
                                </div>
                            ))}
                            <label className="form-label mt-2" htmlFor="add-budget-category">Add Category Budget</label>
                            <CategorySelect id="add-budget-category" value="" type="expense" extraTags={extraTags}
                                customCategories={customCategories}
                                placeholder="Search and add a category" onChange={value => {
                                    const tag = canonicalBudgetTag(value);
                                    setCategories(current => Object.hasOwn(current, tag) ? current : { ...current, [tag]: "" });
                                }} />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Budget</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
