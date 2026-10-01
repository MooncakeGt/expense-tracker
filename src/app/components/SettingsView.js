import AccountManager from "./accounts/AccountManager";
import TransferManager from "./accounts/TransferManager";
import { getActiveAccounts } from "../utils/accounts";

export default function SettingsView({ accounts, transactions, transfers, contributions = [], rules, today, onSaveAccount, onArchiveAccount, onSaveTransfer, onDeleteTransfer, onManageCategories, onOpenData, onResetApplication }) {
    const showTransfers = transfers.length > 0 || getActiveAccounts(accounts).length >= 2;
    return <section aria-labelledby="settings-heading">
        <div className="mb-4"><h2 id="settings-heading" className="h4">Settings</h2><p className="text-muted mb-0">Manage categories, accounts, transfers, and application data.</p></div>
        <section className="card mb-4"><div className="card-body"><h3 className="h5">Categories</h3><p className="text-muted">Customize preset names and icons, hide or restore presets, and manage custom categories.</p><button type="button" className="btn btn-outline-primary" onClick={onManageCategories}>Manage Categories</button></div></section>
        <AccountManager accounts={accounts} transactions={transactions} transfers={transfers} contributions={contributions} rules={rules} onSave={onSaveAccount} onArchive={onArchiveAccount} />
        {showTransfers && <TransferManager accounts={accounts} transactions={transactions} transfers={transfers} contributions={contributions} today={today} onSave={onSaveTransfer} onDelete={onDeleteTransfer} />}
        <section className="card my-4"><div className="card-body"><h3 className="h5">Application Data</h3><p className="text-muted">Back up, restore, import, or export your data from the dedicated data page.</p><button type="button" className="btn btn-outline-primary" onClick={onOpenData}>Open Import / Export</button></div></section>
        <section className="card border-danger"><div className="card-body"><h3 className="h5 text-danger">Danger Zone</h3><p className="mb-3">Permanently reset the entire app, including transactions, accounts, transfers, categories and preset customizations, budgets, recurring activity, savings goals, and planner settings.</p><button type="button" className="btn btn-danger" onClick={onResetApplication}>Reset Entire App</button></div></section>
    </section>;
}


