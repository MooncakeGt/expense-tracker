import { useState } from "react";
import CategorySelect from "./CategorySelect";
import { formatCurrency } from "../utils/currency";
import { getCategoryForTag } from "../utils/tags";
import CategoryLabel from "./categories/CategoryIcon";
import { getFieldErrors } from "../utils/transactionSchema";
import { validateRecurringInput } from "../utils/recurringSchema";
import { getNextOccurrence } from "../utils/recurring";
import AccountSelect from "./accounts/AccountSelect";
import { getAccountDisplayName } from "../utils/accounts";
import { useAppDialog } from "./ConfirmationModal";

const emptyDraft = today => ({ description: "", amount: "", tag: "", accountId: "general", type: "expense", frequency: "monthly", interval: "1", startDate: today, endDate: "" });
const dateLabel = date => date ? new Intl.DateTimeFormat("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`)) : "Ended";

export default function RecurringManager({ rules, today, customCategories = [], onCreateCategory, onSave, onToggle, onDelete, accounts = [], embedded = false }) {
    const { confirm } = useAppDialog();
    const [draft, setDraft] = useState(null);
    const [errors, setErrors] = useState({});
    const [open, setOpen] = useState(false);
    const edit = rule => { setDraft({ ...rule, amount: String(rule.amount), interval: String(rule.interval), endDate: rule.endDate || "" }); setErrors({}); setOpen(true); };
    const close = () => { setOpen(false); setDraft(null); setErrors({}); };
    const update = (field, value) => { setDraft(current => ({ ...current, [field]: value })); setErrors(current => ({ ...current, [field]: undefined })); };
    const save = event => {
        event.preventDefault();
        const data = { ...draft, id: draft.id || crypto.randomUUID(), processedThrough: draft.processedThrough ?? null,
            active: draft.active ?? true, pausedAt: draft.pausedAt ?? null };
        const result = validateRecurringInput(data);
        const nextErrors = result.success ? {} : getFieldErrors(result.error);
        const category = getCategoryForTag(draft.tag, customCategories);
        if (!draft.tag) nextErrors.tag = "Choose a category.";
        if (category && category.type !== "both" && category.type !== draft.type) nextErrors.tag = "Choose a category compatible with this type.";
        if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
        onSave(result.data, Boolean(draft.id));
        close();
    };

    return <section className={embedded ? "" : "card mt-4"} aria-labelledby="recurring-heading">
        <div className={embedded ? "" : "card-body"}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 id="recurring-heading" className="h4 mb-0">Recurring Transactions</h2>
                <button type="button" className="btn btn-outline-primary" onClick={() => { setDraft(emptyDraft(today)); setOpen(true); }}>Add Recurring Transaction</button>
            </div>
            {open && <form onSubmit={save} noValidate className="border rounded p-3 mb-3">
                <h3 className="h5">{draft.id ? "Edit" : "New"} recurring rule</h3>
                <div className="row g-3">
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="rec-description">Description</label><input id="rec-description" className="form-control" value={draft.description} maxLength={160} onChange={e => update("description", e.target.value)} />{errors.description && <div className="text-danger small" role="alert">{errors.description}</div>}</div>
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="rec-amount">Amount (RM)</label><input id="rec-amount" type="number" min="0" step="any" className="form-control" value={draft.amount} onChange={e => update("amount", e.target.value)} />{errors.amount && <div className="text-danger small" role="alert">{errors.amount}</div>}</div>
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="rec-type">Type</label><select id="rec-type" className="form-select" value={draft.type} onChange={e => { const type = e.target.value; setDraft(current => ({ ...current, type, tag: getCategoryForTag(current.tag, customCategories)?.type === (type === "income" ? "expense" : "income") ? "" : current.tag })); }}><option value="expense">Expense</option><option value="income">Income</option></select></div>
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="rec-tag">Category</label><CategorySelect id="rec-tag" value={draft.tag} type={draft.type} extraTags={draft.tag ? [draft.tag] : []} customCategories={customCategories} onCreateCategory={onCreateCategory} onChange={value => update("tag", value)} />{errors.tag && <div className="text-danger small" role="alert">{errors.tag}</div>}</div>
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="rec-account">Account</label><AccountSelect id="rec-account" value={draft.accountId} onChange={value => update("accountId", value)} accounts={accounts} includeAccountId={draft.accountId} /></div>
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="rec-frequency">Frequency</label><select id="rec-frequency" className="form-select" value={draft.frequency} onChange={e => update("frequency", e.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="rec-interval">Repeat every (interval)</label><input id="rec-interval" type="number" min="1" max="100" step="1" className="form-control" value={draft.interval} onChange={e => update("interval", e.target.value)} />{errors.interval && <div className="text-danger small" role="alert">{errors.interval}</div>}</div>
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="rec-start">Start date</label><input id="rec-start" type="date" className="form-control" value={draft.startDate} disabled={Boolean(draft.id)} onChange={e => update("startDate", e.target.value)} />{errors.startDate && <div className="text-danger small" role="alert">{errors.startDate}</div>}</div>
                    <div className="col-12 col-md-6"><label className="form-label" htmlFor="rec-end">End date (optional)</label><input id="rec-end" type="date" className="form-control" value={draft.endDate} onChange={e => update("endDate", e.target.value)} />{errors.endDate && <div className="text-danger small" role="alert">{errors.endDate}</div>}</div>
                </div>
                <div className="d-flex flex-wrap gap-2 mt-3"><button type="submit" className="btn btn-primary">Save Rule</button><button type="button" className="btn btn-secondary" onClick={close}>Cancel</button></div>
            </form>}
            {!rules.length ? <p className="text-muted mb-0">No recurring rules yet.</p> : <div className="list-group">{rules.map(rule => {
                const next = getNextOccurrence(rule, today);
                return <div className="list-group-item" key={rule.id}><div className="d-flex flex-column flex-sm-row justify-content-between gap-2"><div><strong>{rule.description}</strong> · {formatCurrency(rule.amount)} <span className="badge text-bg-secondary">{rule.type === "income" ? "Income" : "Expense"}</span><div className="small text-muted d-flex flex-wrap align-items-center gap-1"><CategoryLabel tag={rule.tag} customCategories={customCategories} size={18} /><span>· {getAccountDisplayName(rule.accountId, accounts)} · Every {rule.interval > 1 ? `${rule.interval} ` : ""}{rule.frequency === "weekly" ? (rule.interval > 1 ? "weeks" : "week") : rule.frequency === "monthly" ? (rule.interval > 1 ? "months" : "month") : (rule.interval > 1 ? "years" : "year")}</span></div><div className="small">{rule.active ? next ? `Active · Next: ${dateLabel(next)}` : "Ended" : "Paused"}</div></div><div className="d-flex flex-wrap gap-2 align-self-start"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => edit(rule)}>Edit</button><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onToggle(rule.id)}>{rule.active ? "Pause" : "Resume"}</button><button type="button" className="btn btn-sm btn-outline-danger" onClick={async () => { if (await confirm({ title: "Delete Recurring Transaction?", message: "Future transactions from this rule will stop. Existing generated transactions will remain.", confirmLabel: "Delete" })) onDelete(rule.id); }}>Delete</button></div></div></div>;
            })}</div>}
        </div>
    </section>;
}

