import { ACCOUNT_TYPE_META, getActiveAccounts, getAllAccounts } from "../../utils/accounts";

export default function AccountSelect({ id, value, onChange, accounts = [], includeAccountId, disabled = false }) {
    const options = getAllAccounts(accounts).filter(account => !account.archived || account.id === includeAccountId);
    const active = new Set(getActiveAccounts(accounts).map(account => account.id));
    return <select id={id} className="form-select" value={value || "general"} disabled={disabled} onChange={event => onChange(event.target.value)}>
        {options.map(account => <option key={account.id} value={account.id}>{ACCOUNT_TYPE_META[account.type].icon} {account.name}{!active.has(account.id) ? " (Archived)" : ""}</option>)}
    </select>;
}
