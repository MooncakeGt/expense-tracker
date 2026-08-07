// AddTransaction.js

import React from "react";
import { formatCurrency } from "../utils/currency";

const AddTransaction = ({
    description,
    setDescription,
    amount,
    setAmount,
    date,
    setDate,
    type,
    setType,
    balance,
    totalIncome,
    totalExpense,
    addExpense,
}) => {
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
                    <div className="card shadow-sm border-success text-center h-100">
                        <div className="card-body">
                            <h6 className="text-success">Income</h6>
                            <h3 className="text-success">
                                {formatCurrency(totalIncome)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-3">
                    <div className="card shadow-sm border-danger text-center h-100">
                        <div className="card-body">
                            <h6 className="text-danger">Expense</h6>
                            <h3 className="text-danger">
                                {formatCurrency(totalExpense)}
                            </h3>
                        </div>
                    </div>
                </div>

            </div>

            {/* Description */}
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
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