import { ACCOUNT_TYPE_META, calculateAllAccountBalances, getAccountTotals, isLiabilityAccount } from "../../utils/accounts";
import { formatCurrency } from "../../utils/currency";

export default function AccountSummary({ accounts, transactions, transfers, contributions = [] }) {
    const balances = calculateAllAccountBalances(accounts, transactions, transfers, contributions);
    const { available, totalDebt } = getAccountTotals(balances);

    return <section className="card mb-4"><div className="card-body">
        <h3 className="h5 mb-3">Accounts</h3>
        <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6"><div className="account-summary-row h-100"><span className="account-summary-label">Available Balance</span><strong>{formatCurrency(available)}</strong></div></div>
            <div className="col-12 col-sm-6"><div className="account-summary-row h-100"><span className="account-summary-label">Total Debt</span><strong className="text-danger">{formatCurrency(totalDebt)}</strong></div></div>
        </div>
        <div className="row g-3">{balances.map(({ account, balance }) => <div className="col-12 col-sm-6" key={account.id}><div className="account-summary-row"><span className="account-summary-label">{ACCOUNT_TYPE_META[account.type].icon} {account.name}</span><strong className={isLiabilityAccount(account) ? "text-danger" : ""}>{formatCurrency(balance)}{isLiabilityAccount(account) ? " owed" : ""}</strong></div></div>)}</div>
    </div></section>;
}
