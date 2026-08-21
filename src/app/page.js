'use client';

import React, { useState, useEffect } from 'react';

import AddTransaction from './components/AddTransaction';
import TransactionList from './components/TransactionList';
import ExportCSV from './components/ExportCSV';
import ImportCSV from './components/ImportCSV';

const ExpenseTracker = () => {

    const [expenses, setExpenses] = useState([]);

    const [description, setDescription] = useState("");
    const [tag, setTag] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("expense");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [sortBy, setSortBy] = useState("newlyAdded");

    const totalIncome = expenses
        .filter(expense => expense.type === "income")
        .reduce((sum, expense) => sum + expense.amount, 0);

    const totalExpense = expenses
        .filter(expense => expense.type === "expense")
        .reduce((sum, expense) => sum + expense.amount, 0);

    const balance = totalIncome - totalExpense;

	const sortedExpenses = [...expenses];

    switch (sortBy) {
        case "newlyAdded":
            break;

        case "newest":
            sortedExpenses.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            );
            break;

        case "oldest":
            sortedExpenses.sort(
                (a, b) => new Date(a.date) - new Date(b.date)
            );
            break;

        case "highest":
            sortedExpenses.sort(
                (a, b) => b.amount - a.amount
            );
            break;

        case "lowest":
            sortedExpenses.sort(
                (a, b) => a.amount - b.amount
            );
            break;

        default:
            break;
    }

    const addExpense = () => {

        if (!description.trim() || !amount.trim()) return;

        const today = new Date().toISOString().split("T")[0];

        const newExpense = {
            id: crypto.randomUUID(),
            description,
            tag,
            amount: Number(amount),
            type,
            date: date || today,
        };

        setExpenses(prev => [...prev, newExpense]);

        setDescription("");
        setTag("");
        setAmount("");
        setType("expense");
        setDate(today);
    };

    const removeExpense = (id) => {
        setExpenses(prev =>
            prev.filter(expense => expense.id !== id)
        );
    };

    const clearExpenses = () => {
        if (expenses.length === 0) {
            alert("There are no transactions to clear.");
            return;
        }

        if (window.confirm(`Delete all ${expenses.length} transactions?`)) {
            setExpenses([]);
        }
    };

    useEffect(() => {

        const saved = localStorage.getItem("expenses");

        if (saved) {
            const parsed = JSON.parse(saved);

            const migrated = parsed.map(expense => ({
                ...expense,
                tag: expense.tag || "Other",
                date: new Date(expense.date).toISOString().split("T")[0],
            }));

            setExpenses(migrated);
        }

    }, []);

    useEffect(() => {

        localStorage.setItem(
            "expenses",
            JSON.stringify(expenses)
        );

    }, [expenses]);

    return (
<div className="container-fluid mt-5">
    <div className="row justify-content-center">
        <div className="col-lg-8">
            <div className="card shadow p-4">

                <h1 className="text-center mb-4">
                    Expense Tracker
                </h1>

                        <AddTransaction
                        description={description}
                        setDescription={setDescription}

                        tag={tag}
                        setTag={setTag}

                        amount={amount}
                        setAmount={setAmount}

                        date={date}
                        setDate={setDate}

                        type={type}
                        setType={setType}

                        balance={balance}
                        totalIncome={totalIncome}
                        totalExpense={totalExpense}
                        expenses={sortedExpenses}

                        addExpense={addExpense}
                        />

                    <div className="row g-3 my-4 align-items-end">

                        <div className="col-md-3">
                            <ExportCSV expenses={sortedExpenses} />
                        </div>

                        <div className="col-md-3">
                            <ImportCSV setExpenses={setExpenses} />
                        </div>

                        <div className="col-md-3">
                            <button
                                className="btn btn-danger w-100"
                                onClick={clearExpenses}
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="col-md-3">
                            <select
                                className="form-select"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newlyAdded">None</option>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Highest Amount</option>
                                <option value="lowest">Lowest Amount</option>
                            </select>
                        </div>

                    </div>

                <TransactionList
                    expenses={sortedExpenses}
                    removeExpense={removeExpense}
                />

            </div>
        </div>
    </div>
</div>
    );
};

export default ExpenseTracker;