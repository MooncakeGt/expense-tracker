import { useState } from 'react';
import { formatCurrency } from "../utils/currency";
import { getCategoryDisplay, getCategoryForTag, normalizeTag } from "../utils/tags";
import CategoryLabel, { useCategoryOverrides } from "./categories/CategoryIcon";
import CategorySelect from "./CategorySelect";
import { getFieldErrors, validateTransactionInput } from "../utils/transactionSchema";
import AccountSelect from "./accounts/AccountSelect";
import { getAccountDisplayName } from "../utils/accounts";
import { useAppDialog } from "./ConfirmationModal";

const TransactionList = ({ expenses = [], activities, removeExpense, updateExpense, customCategories = [], onCreateCategory, accounts = [], onViewSavingsGoal }) => {
    const { confirm } = useAppDialog();
    const categoryOverrides = useCategoryOverrides();
    const [draft, setDraft] = useState(null);
    const [errors, setErrors] = useState({});

    const startEditing = (expense) => {
        setDraft({ ...expense, tag: normalizeTag(expense.tag), accountId: expense.accountId || "general", amount: String(expense.amount) });
        setErrors({});
    };

    const changeDraft = (field, value) => {
        setDraft(current => ({ ...current, [field]: value }));
        setErrors(current => ({ ...current, [field]: undefined }));
    };

    const saveEdit = (event) => {
        event.preventDefault();
        const result = validateTransactionInput(draft);
        const nextErrors = result.success ? {} : getFieldErrors(result.error);
        const category = getCategoryForTag(draft.tag, customCategories);
        if (!draft.tag) nextErrors.tag = "Choose a category.";
        if (category && category.type !== "both" && category.type !== draft.type) {
            nextErrors.tag = "Choose a category compatible with this type.";
        }
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        updateExpense(result.data);
        setDraft(null);
        setErrors({});
    };

    return (
        <ul className="list-group mt-3">
            {(activities || expenses).map(expense => expense.activityKind === "savings-contribution" ? (
                <li key={expense.id} className="list-group-item">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                        <div><h4 className="h5 mb-1">{expense.goalIcon} {expense.description}</h4><span className="badge text-bg-primary me-2">{getCategoryDisplay(expense.tag, customCategories, categoryOverrides)}</span><small className="text-muted">{expense.accountName} · {expense.date}{expense.linkedTransfer ? " · Linked transfer" : ""}{expense.note ? ` · ${expense.note}` : ""}</small></div>
                        <div className="d-flex align-items-center gap-2"><strong className="text-primary">−{formatCurrency(expense.amount)}</strong><button type="button" className="btn btn-primary" onClick={() => onViewSavingsGoal?.(expense.goalId)}>View Goal</button></div>
                    </div>
                </li>
            ) : (
                <li key={expense.id} className={`list-group-item ${expense.type === 'expense' ? 'text-danger' : 'text-success'}`}>
                    {draft?.id === expense.id ? (
                        <form onSubmit={saveEdit} className="text-body" noValidate>
                            <div className="row g-2 mb-2">
                                <div className="col-12">
                                    <label className="form-label" htmlFor={`description-${expense.id}`}>Description</label>
                                    <input id={`description-${expense.id}`} className="form-control" type="text" required
                                        value={draft.description} onChange={e => changeDraft("description", e.target.value)} />
                                    {errors.description && <div className="text-danger small" role="alert">{errors.description}</div>}
                                </div>
                                <div className="col-12">
                                    <CategorySelect id={`tag-${expense.id}`} value={draft.tag} onChange={value => changeDraft("tag", value)} type={draft.type} customCategories={customCategories} extraTags={draft.tag ? [draft.tag] : []} onCreateCategory={onCreateCategory} columns />
                                    {errors.tag && <div className="text-danger small" role="alert">{errors.tag}</div>}
                                </div>
                                <div className="col-12 col-md-6"><label className="form-label" htmlFor={`amount-${expense.id}`}>Amount (RM)</label><input id={`amount-${expense.id}`} className="form-control" type="number" min="0" step="any" required value={draft.amount} onChange={e => changeDraft("amount", e.target.value)} />{errors.amount && <div className="text-danger small" role="alert">{errors.amount}</div>}</div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor={`type-${expense.id}`}>Type</label>
                                    <select id={`type-${expense.id}`} className="form-select" value={draft.type}
                                        onChange={e => {
                                            const nextType = e.target.value;
                                            const category = getCategoryForTag(draft.tag, customCategories);
                                            setDraft(current => ({
                                                ...current,
                                                type: nextType,
                                                tag: category && category.type !== "both" && category.type !== nextType ? "" : current.tag,
                                            }));
                                            setErrors({});
                                        }}>
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                    {errors.type && <div className="text-danger small" role="alert">{errors.type}</div>}
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor={`date-${expense.id}`}>Date</label>
                                    <input id={`date-${expense.id}`} className="form-control" type="date" required
                                        value={draft.date || ""} onChange={e => changeDraft("date", e.target.value)} />
                                    {errors.date && <div className="text-danger small" role="alert">{errors.date}</div>}
                                </div>
                                <div className="col-12 col-md-6"><label className="form-label" htmlFor={`account-${expense.id}`}>Account</label><AccountSelect id={`account-${expense.id}`} value={draft.accountId} onChange={value => changeDraft("accountId", value)} accounts={accounts} includeAccountId={draft.accountId} /></div>
                            </div>
                            <div className="d-grid d-sm-flex gap-2">
                                <button type="submit" className="btn btn-primary">Save</button>
                                <button type="button" className="btn btn-secondary" onClick={() => { setDraft(null); setErrors({}); }}>Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                            <div>
                                <h4>
                                    {expense.description} - {formatCurrency(expense.amount)}
                                    <span className="badge bg-secondary ms-2"><CategoryLabel tag={expense.tag} customCategories={customCategories} size={16} /></span>
                                </h4>
                                <small className="text-muted">{expense.date} · {getAccountDisplayName(expense.accountId, accounts)}</small>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-outline-primary" onClick={() => startEditing(expense)}>Edit</button>
                                <button type="button" className="btn btn-danger" onClick={async () => { if (await confirm({ title: "Delete Transaction?", message: `Delete “${expense.description}”? This transaction will be permanently removed.`, confirmLabel: "Delete" })) removeExpense(expense.id); }}>Remove</button>
                            </div>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
};

export default TransactionList;
