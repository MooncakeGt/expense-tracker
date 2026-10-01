import { useState } from "react";
import { formatCurrency } from "../utils/currency";
import { getCategoryForTag, normalizeTag } from "../utils/tags";
import CategorySelect from "./CategorySelect";
import AccountSelect from "./accounts/AccountSelect";
import CategoryLabel from "./categories/CategoryIcon";

const AddTransaction = ({
    description,
    setDescription,
    tag,
    setTag,
    amount,
    setAmount,
    date,
    setDate,
    type,
    setType,
    balance,
    totalIncome,
    totalExpense,
    transactionCount,
    expenses,
    addExpense,
    errors,
    clearError,
    customCategories = [],
    onCreateCategory,
    accountId, setAccountId, accounts = [],
}) => {
    const [modalType, setModalType] = useState(null); // "income" | "expense" | null

    const getTagTotals = (filterType) => {
        const totals = Object.create(null);

        expenses
            .filter(expense => expense.type === filterType)
            .forEach(expense => {
                const rawTag = normalizeTag(expense.tag);
                const key = getCategoryForTag(rawTag, customCategories)?.id || rawTag;
                totals[key] = (totals[key] || 0) + expense.amount;
            });

        return Object.entries(totals).sort((a, b) => b[1] - a[1]);
    };

    const tagTotals = modalType ? getTagTotals(modalType) : [];

    return (
        <>

            {/* Summary Cards */}
            <div className="row mb-4">

                <div className="col-12 mb-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <h6 className="text-muted">Balance</h6>
                            <h3>{formatCurrency(balance)}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div
                        className="card shadow-sm border-success text-center h-100"
                        style={{ cursor: "pointer" }}
                        onClick={() => setModalType("income")}
                    >
                        <div className="card-body">
                            <h6 className="text-success">Income</h6>
                            <h3 className="text-success">
                                {formatCurrency(totalIncome)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div
                        className="card shadow-sm border-danger text-center h-100"
                        style={{ cursor: "pointer" }}
                        onClick={() => setModalType("expense")}
                    >
                        <div className="card-body">
                            <h6 className="text-danger">Expense</h6>
                            <h3 className="text-danger">
                                {formatCurrency(totalExpense)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <h6 className="text-muted">Transactions</h6>
                            <h3>{transactionCount}</h3>
                        </div>
                    </div>
                </div>

            </div>

            {/* Tag Summary Modal */}
            {modalType && (
                <div
                    className="modal d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={() => setModalType(null)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title text-capitalize">
                                    {modalType} by Tag
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setModalType(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {tagTotals.length === 0 ? (
                                    <p className="text-muted mb-0">
                                        No {modalType} transactions yet.
                                    </p>
                                ) : (
                                    <table className="table table-striped mb-0">
                                        <thead>
                                            <tr>
                                                <th>Tag</th>
                                                <th className="text-end">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tagTotals.map(([tagName, total]) => (
                                                <tr key={tagName}>
                                                    <td><CategoryLabel tag={tagName} customCategories={customCategories} size={20} /></td>
                                                    <td className="text-end">
                                                        {formatCurrency(total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-3 mb-3">
                <div className="col-12">
                    <label className="form-label" htmlFor="add-description">Description</label>
                    <input
                        id="add-description"
                        type="text"
                        className="form-control"
                        placeholder="Description"
                        value={description}
                        onChange={(e) => { setDescription(e.target.value); clearError("description"); }}
                        aria-invalid={Boolean(errors.description)}
                    />
                    {errors.description && <div className="text-danger small" role="alert">{errors.description}</div>}
                </div>

                <div className="col-12">
                    <CategorySelect id="add-category" value={tag} onChange={value => { setTag(value); clearError("tag"); }} type={type}
                        customCategories={customCategories} onCreateCategory={onCreateCategory} columns />
                    {errors.tag && <div className="text-danger small" role="alert">{errors.tag}</div>}
                </div>
                <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="add-amount">Amount (RM)</label>
                    <input
                        id="add-amount"
                        type="number"
                        className="form-control"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value); clearError("amount"); }}
                        aria-invalid={Boolean(errors.amount)}
                    />
                    {errors.amount && <div className="text-danger small" role="alert">{errors.amount}</div>}
                </div>

                <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="add-type">Type</label>
                    <select id="add-type" className="form-select" value={type} onChange={(e) => { const nextType=e.target.value; const category=getCategoryForTag(tag,customCategories); if(category&&category.type!=="both"&&category.type!==nextType)setTag(""); setType(nextType); clearError("type"); }}><option value="expense">Expense</option><option value="income">Income</option></select>
                    {errors.type && <div className="text-danger small" role="alert">{errors.type}</div>}
                </div>
                <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="add-date">Date</label>
                    <input
                        id="add-date"
                        type="date"
                        className="form-control"
                        value={date}
                        onChange={(e) => { setDate(e.target.value); clearError("date"); }}
                        aria-invalid={Boolean(errors.date)}
                    />
                    {errors.date && <div className="text-danger small" role="alert">{errors.date}</div>}
                </div>

                <div className="col-12 col-md-6"><label className="form-label" htmlFor="add-account">Account</label><AccountSelect id="add-account" value={accountId} onChange={setAccountId} accounts={accounts} /></div>
            </div>

            {/* Button */}
            <div className="d-grid">
                <button
                    className="btn btn-primary btn-lg"
                    onClick={addExpense}
                >
                    Add Transaction
                </button>
            </div>

        </>
    );
};

export default AddTransaction;
