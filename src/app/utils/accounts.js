export const GENERAL_ACCOUNT_ID = "general";
export const GENERAL_ACCOUNT = Object.freeze({ id: GENERAL_ACCOUNT_ID, name: "General", type: "other", openingBalance: 0, archived: false, createdAt: "1970-01-01T00:00:00.000Z", system: true });

export const ACCOUNT_TYPE_META = Object.freeze({
    cash: { label: "Cash", icon: "\u{1F4B5}" }, bank: { label: "Bank Account", icon: "\u{1F3E6}" },
    savings: { label: "Savings Account", icon: "\u{1F437}" }, ewallet: { label: "E-Wallet", icon: "\u{1F4F1}" },
    "credit-card": { label: "Credit Card", icon: "\u{1F4B3}" },
    "personal-loan": { label: "Personal Loan", icon: "\u{1F4B8}" },
    "student-loan": { label: "Student Loan", icon: "\u{1F393}" },
    "vehicle-loan": { label: "Vehicle Loan", icon: "\u{1F697}" },
    mortgage: { label: "Mortgage", icon: "\u{1F3E0}" },
    "other-debt": { label: "Other Debt", icon: "\u{1F4C9}" },
    other: { label: "Other", icon: "\u{1F4B0}" },
});

export const LIABILITY_ACCOUNT_TYPES = Object.freeze(["credit-card", "personal-loan", "student-loan", "vehicle-loan", "mortgage", "other-debt"]);
export const isLiabilityAccount = accountOrType => LIABILITY_ACCOUNT_TYPES.includes(typeof accountOrType === "string" ? accountOrType : accountOrType?.type);

export const getGeneralAccount = (accounts = []) => {
    const override = accounts.find(account => account.id === GENERAL_ACCOUNT_ID);
    return override ? { ...override, id: GENERAL_ACCOUNT_ID, archived: false, system: true } : GENERAL_ACCOUNT;
};
export const getAllAccounts = (accounts = []) => [getGeneralAccount(accounts), ...accounts.filter(account => account.id !== GENERAL_ACCOUNT_ID)];
export const getActiveAccounts = (accounts = []) => getAllAccounts(accounts).filter(account => !account.archived);
export const getAccountById = (id, accounts = []) => getAllAccounts(accounts).find(account => account.id === (id || GENERAL_ACCOUNT_ID));
export const resolveAccount = (id, accounts = []) => getAccountById(id, accounts) || GENERAL_ACCOUNT;
export const getAccountDisplayName = (id, accounts = []) => resolveAccount(id, accounts).name;
export const canonicalAccountId = id => id || GENERAL_ACCOUNT_ID;

export const calculateAccountBalance = (account, transactions = [], transfers = [], contributions = []) => {
    let balance = account.openingBalance;
    for (const transaction of transactions) {
        if (canonicalAccountId(transaction.accountId) !== account.id) continue;
        if (isLiabilityAccount(account)) balance += transaction.type === "expense" ? transaction.amount : -transaction.amount;
        else balance += transaction.type === "income" ? transaction.amount : -transaction.amount;
    }
    for (const transfer of transfers) {
        if (transfer.fromAccountId === account.id) balance += isLiabilityAccount(account) ? transfer.amount : -transfer.amount;
        if (transfer.toAccountId === account.id) balance += isLiabilityAccount(account) ? -transfer.amount : transfer.amount;
    }
    for (const contribution of contributions) {
        const hasLinkedTransfer = contribution.transferId && transfers.some(transfer => transfer.id === contribution.transferId);
        if (hasLinkedTransfer || canonicalAccountId(contribution.accountId) !== account.id) continue;
        balance += isLiabilityAccount(account) ? contribution.amount : -contribution.amount;
    }
    return balance;
};

export const calculateAllAccountBalances = (accounts = [], transactions = [], transfers = [], contributions = []) => getAllAccounts(accounts).map(account => ({
    account, balance: calculateAccountBalance(account, transactions, transfers, contributions),
}));
export const getAccountTotals = balances => ({
    available: balances.filter(item => !isLiabilityAccount(item.account)).reduce((sum, item) => sum + item.balance, 0),
    creditOwed: balances.filter(item => item.account.type === "credit-card").reduce((sum, item) => sum + item.balance, 0),
    totalDebt: balances.filter(item => isLiabilityAccount(item.account)).reduce((sum, item) => sum + Math.max(item.balance, 0), 0),
});
export const accountHasReferences = (id, transactions = [], transfers = [], rules = []) =>
    transactions.some(item => canonicalAccountId(item.accountId) === id) || transfers.some(item => item.fromAccountId === id || item.toAccountId === id) || rules.some(item => canonicalAccountId(item.accountId) === id);
