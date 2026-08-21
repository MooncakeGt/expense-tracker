import React, { useState } from "react";
import { formatCurrency } from "../utils/currency";

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
    expenses,
    addExpense,
}) => {
    const [modalType, setModalType] = useState(null); // "income" | "expense" | null

    const getTagTotals = (filterType) => {
        const totals = {};

        expenses
            .filter(expense => expense.type === filterType)
            .forEach(expense => {
                const key = expense.tag || "Other";
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

                <div className="col-md-6 mb-3">
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

                <div className="col-md-6 mb-3">
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
                                                    <td>{tagName}</td>
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

            {/* Description / Tag */}
            <div className="row">

                <div className="col-md-8 mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="col-md-4 mb-3">
                    <select
                        className="form-select"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                    >
                        <option value="">Select Tag</option>
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Bills">Bills</option>
                        <option value="Rent">Rent</option>
                        <option value="Salary">Salary</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

            </div>

            {/* Amount / Date / Type */}
            <div className="row">

                <div className="col-md-4 mb-3">
                    <input
                        type="number"
                        className="form-control"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                <div className="col-md-4 mb-3">
                    <input
                        type="date"
                        className="form-control"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div className="col-md-4 mb-3">
                    <select
                        className="form-select"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                </div>

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