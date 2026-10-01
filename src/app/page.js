'use client';

import { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import AddTransaction from './components/AddTransaction';
import TransactionList from './components/TransactionList';
import DashboardView from './components/DashboardView';
import RecurringActivityManager from './components/recurring/RecurringActivityManager';
import FiftyThirtyTwentyDashboard from './components/fiftyThirtyTwenty/FiftyThirtyTwentyDashboard';
import FinanceCalendar from './components/FinanceCalendar';
import CategoryManager from './components/categories/CategoryManager';
import CategoryForm from './components/categories/CategoryForm';
import { CategoryIconOverridesProvider } from './components/categories/CategoryIcon';
import { getAllCategories, getCategoryDisplay, getCategoryForTag, mainCategories, normalizeTag } from './utils/tags';
import { deleteCustomCategoryRecord, parseStoredCustomCategories } from './utils/customCategorySchema';
import { parseStoredCategoryIconOverrides, setCategoryIconOverride } from './utils/categoryIconOverrides';
import { getFieldErrors, parseStoredTransactions, validateTransactionInput } from './utils/transactionSchema';
import { parseStoredRules } from './utils/recurringSchema';
import { generateRecurringTransactions, getToday } from './utils/recurring';
import { parseStoredAccounts } from './utils/accountSchema';
import { parseStoredTransfers } from './utils/transferSchema';
import { canonicalAccountId, getAllAccounts } from './utils/accounts';
import { resetAppStorage } from './utils/appStorage';
import SettingsView from './components/SettingsView';
import SavingsGoalsDashboard from './components/savingsGoals/SavingsGoalsDashboard';
import { parseStoredSavingsGoals } from './utils/savingsGoalSchema';
import { parseStoredSavingsGoalContributions } from './utils/savingsGoalContributionSchema';
import { deleteSavingsGoalData } from './utils/savingsGoals';
import { parseStoredRecurringGoalContributions, parseStoredRecurringTransfers } from './utils/recurringMoneySchema';
import { generateRecurringGoalContributions, generateRecurringTransfers } from './utils/recurringMoney';
import ForecastDashboard from './components/forecast/ForecastDashboard';
import DataManagement from './components/data/DataManagement';
import TransactionPeriodHeader from './components/TransactionPeriodHeader';
import YearlyTransactionList from './components/YearlyTransactionList';
import { formatMonth, getCurrentMonth } from './utils/dashboard';
import { getTransactionPeriodSummary, getTransactionsForPeriod } from './utils/transactionPeriods';
import { applyActivityFilters, createFinancialActivities, getActivitiesForPeriod, groupActivitiesByMonth, sortActivities } from './utils/financialActivity';
import { useAppDialog } from './components/ConfirmationModal';

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const TOP_LEVEL_TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "transactions", label: "Transactions" },
    { id: "calendar", label: "Calendar" },
    { id: "savingsGoals", label: "Savings" },
    { id: "fiftyThirtyTwenty", label: "Budget" },
    { id: "forecast", label: "Forecast" },
    { id: "data", label: "Data" },
    { id: "settings", label: "Settings" },
];

const loadData = () => {
    if (typeof window === "undefined") return { expenses: [], rules: [], recurringTransfers: [], recurringGoalContributions: [], customCategories: [], categoryIconOverrides: {}, accounts: [], transfers: [], savingsGoals: [], savingsGoalContributions: [], needsPersistence: false };
    try {
        const expenses = parseStoredTransactions(localStorage.getItem("expenses"));
        const rules = parseStoredRules(localStorage.getItem("recurringRules"));
        const customCategories = parseStoredCustomCategories(localStorage.getItem("customCategories"));
        const categoryIconOverrides = parseStoredCategoryIconOverrides(localStorage.getItem("categoryIconOverrides"));
        const accounts = parseStoredAccounts(localStorage.getItem("accounts"));
        const transfers = parseStoredTransfers(localStorage.getItem("transfers"));
        const savingsGoals = parseStoredSavingsGoals(localStorage.getItem("savingsGoals"));
        const savingsGoalContributions = parseStoredSavingsGoalContributions(localStorage.getItem("savingsGoalContributions"));
        const recurringTransfers = parseStoredRecurringTransfers(localStorage.getItem("recurringTransfers"));
        const recurringGoalContributions = parseStoredRecurringGoalContributions(localStorage.getItem("recurringSavingsGoalContributions"));
        const result = generateRecurringTransactions(rules, expenses, getToday());
        const transferResult = generateRecurringTransfers(recurringTransfers, transfers, getToday());
        const goalResult = generateRecurringGoalContributions(recurringGoalContributions, savingsGoals, savingsGoalContributions, transferResult.transfers, getToday());
        return { expenses: result.transactions, rules: result.rules, recurringTransfers: transferResult.rules, recurringGoalContributions: goalResult.rules, customCategories, categoryIconOverrides, accounts, transfers: goalResult.transfers, savingsGoals, savingsGoalContributions: goalResult.contributions, needsPersistence: result.changed || transferResult.changed || goalResult.changed };
    } catch {
        return { expenses: [], rules: [], recurringTransfers: [], recurringGoalContributions: [], customCategories: [], categoryIconOverrides: {}, accounts: [], transfers: [], savingsGoals: [], savingsGoalContributions: [], needsPersistence: false };
    }
};

const ExpenseTracker = () => {
    const { confirm, notify } = useAppDialog();

    const hydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
    const [data, setData] = useState(loadData);
    const initialData = useRef(data);
    const { expenses, rules, recurringTransfers, recurringGoalContributions, customCategories, categoryIconOverrides, accounts, transfers, savingsGoals, savingsGoalContributions } = data;
    const setExpenses = updater => setData(current => ({ ...current, expenses: typeof updater === "function" ? updater(current.expenses) : updater }));

    const [description, setDescription] = useState("");
    const [tag, setTag] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("expense");
    const [accountId, setAccountId] = useState("general");
    const [date, setDate] = useState(getToday);
	const [sortBy, setSortBy] = useState("newest");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [tagFilter, setTagFilter] = useState("");
    const [accountFilter, setAccountFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [transactionPeriodMode, setTransactionPeriodMode] = useState("monthly");
    const [transactionSelectedMonth, setTransactionSelectedMonth] = useState(getCurrentMonth);
    const [transactionSelectedYear, setTransactionSelectedYear] = useState(() => Number(getCurrentMonth().slice(0, 4)));
    const [transactionYearWasSelected, setTransactionYearWasSelected] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [addErrors, setAddErrors] = useState({});
    const [activeView, setActiveView] = useState("dashboard");
    const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
    const [categoryRequest, setCategoryRequest] = useState(null);
    const clearAddError = field => setAddErrors(current => ({ ...current, [field]: undefined }));

    const unknownTags = [...new Set(expenses.map(expense => normalizeTag(expense.tag)))]
        .filter(tag => !getCategoryForTag(tag, customCategories));

    const periodExpenses = useMemo(() => getTransactionsForPeriod(expenses, transactionPeriodMode, transactionSelectedMonth, transactionSelectedYear), [expenses, transactionPeriodMode, transactionSelectedMonth, transactionSelectedYear]);
    const periodSummary = useMemo(() => getTransactionPeriodSummary(periodExpenses), [periodExpenses]);
    const activities = useMemo(() => createFinancialActivities(expenses, savingsGoalContributions, savingsGoals, accounts), [expenses, savingsGoalContributions, savingsGoals, accounts]);
    const periodActivities = useMemo(() => getActivitiesForPeriod(activities, transactionPeriodMode, transactionSelectedMonth, transactionSelectedYear), [activities, transactionPeriodMode, transactionSelectedMonth, transactionSelectedYear]);
    const filteredActivities = useMemo(() => applyActivityFilters(periodActivities, { search, type: typeFilter, tag: tagFilter, accountId: accountFilter, startDate, endDate }, customCategories), [periodActivities, search, typeFilter, tagFilter, accountFilter, startDate, endDate, customCategories]);
    const sortedActivities = useMemo(() => sortActivities(filteredActivities, sortBy), [filteredActivities, sortBy]);
    const yearlyGroups = useMemo(() => transactionPeriodMode === "yearly" ? groupActivitiesByMonth(sortedActivities, sortBy) : [], [transactionPeriodMode, sortedActivities, sortBy]);
    const transactionPeriodLabel = transactionPeriodMode === "monthly" ? formatMonth(transactionSelectedMonth) : String(transactionSelectedYear);
    const filtersActive = Boolean(search || typeFilter || tagFilter || accountFilter || startDate || endDate);
    const activeFilterCount = Number(Boolean(typeFilter)) + Number(Boolean(tagFilter)) + Number(Boolean(accountFilter)) + Number(Boolean(startDate || endDate));
    const clearFilters = () => {
        setSearch("");
        setTypeFilter("");
        setTagFilter("");
        setAccountFilter("");
        setStartDate("");
        setEndDate("");
    };
    const changeTransactionPeriodMode = mode => {
        if (mode === "yearly" && !transactionYearWasSelected) setTransactionSelectedYear(Number(transactionSelectedMonth.slice(0, 4)));
        setTransactionPeriodMode(mode);
    };
    const changeTransactionYear = year => {
        setTransactionSelectedYear(year);
        setTransactionYearWasSelected(true);
    };
    const handleTabKeyDown = (event, tabId) => {
        const currentIndex = TOP_LEVEL_TABS.findIndex(tab => tab.id === tabId);
        let nextIndex;
        if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % TOP_LEVEL_TABS.length;
        else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + TOP_LEVEL_TABS.length) % TOP_LEVEL_TABS.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = TOP_LEVEL_TABS.length - 1;
        else return;
        event.preventDefault();
        const nextId = TOP_LEVEL_TABS[nextIndex].id;
        setActiveView(nextId);
        requestAnimationFrame(() => document.getElementById(`${nextId}-tab`)?.focus());
    };

    const addExpense = () => {
        const today = getToday();
        const result = validateTransactionInput({
            id: crypto.randomUUID(),
            description,
            tag,
            amount,
            type,
            date,
            accountId,
        });
        const errors = result.success ? {} : getFieldErrors(result.error);
        if (!tag) errors.tag = "Choose a category.";
        if (Object.keys(errors).length) {
            setAddErrors(errors);
            return;
        }

        setExpenses(prev => [...prev, result.data]);
        setAddErrors({});

        setDescription("");
        setTag("");
        setAmount("");
        setType("expense");
        setAccountId("general");
        setDate(today);
    };

    const removeExpense = (id) => {
        setExpenses(prev =>
            prev.filter(expense => expense.id !== id)
        );
    };

    const updateExpense = (updatedExpense) => {
        setExpenses(prev => prev.map(expense =>
            expense.id === updatedExpense.id ? updatedExpense : expense
        ));
    };

    const resetApplication = async () => {
        const confirmed = await confirm({
            title: "Reset Entire App?",
            message: "This permanently deletes all transactions, accounts, transfers, categories and preset customizations, budgets, recurring activity, savings goals, contributions, and planner settings. This action cannot be undone.",
            confirmLabel: "Reset App",
        });
        if (!confirmed) return;
        try {
            resetAppStorage(localStorage);
            window.location.reload();
        } catch {
            await notify({ title: "Reset Failed", message: "The app could not be reset because browser storage is unavailable." });
        }
    };

    const saveRule = (rule, editing) => {
        setData(current => {
            // Edits change the template from now on; historical transactions stay as they were.
            const nextRule = editing ? { ...rule, processedThrough: getToday() } : rule;
            const nextRules = editing ? current.rules.map(item => item.id === rule.id ? nextRule : item) : [...current.rules, nextRule];
            const generated = generateRecurringTransactions(nextRules, current.expenses, getToday());
            return { ...current, expenses: generated.transactions, rules: generated.rules, needsPersistence: true };
        });
    };
    const toggleRule = id => setData(current => ({ ...current, needsPersistence: true,
        rules: current.rules.map(rule => rule.id !== id ? rule : rule.active
            ? { ...rule, active: false, pausedAt: getToday() }
            : { ...rule, active: true, pausedAt: null, processedThrough: getToday() }),
    }));
    const deleteRule = id => setData(current => ({ ...current, needsPersistence: true,
        rules: current.rules.filter(rule => rule.id !== id),
    }));
    const saveAccount = account => setData(current => ({ ...current, needsPersistence: true, accounts: current.accounts.some(item => item.id === account.id) ? current.accounts.map(item => item.id === account.id ? account : item) : [...current.accounts, account] }));
    const archiveAccount = (id, archived) => { if (id === "general") return; setData(current => ({ ...current, needsPersistence: true, accounts: current.accounts.map(item => item.id === id ? { ...item, archived } : item) })); };
    const saveTransfer = transfer => setData(current => ({ ...current, needsPersistence: true, transfers: current.transfers.some(item => item.id === transfer.id) ? current.transfers.map(item => item.id === transfer.id ? transfer : item) : [...current.transfers, transfer] }));
    const deleteTransfer = id => setData(current => ({ ...current, needsPersistence: true, transfers: current.transfers.filter(item => item.id !== id) }));
    const saveSavingsGoal = goal => setData(current => ({ ...current, needsPersistence: true, savingsGoals: current.savingsGoals.some(item => item.id === goal.id) ? current.savingsGoals.map(item => item.id === goal.id ? goal : item) : [...current.savingsGoals, goal] }));
    const archiveSavingsGoal = (id, archived) => setData(current => ({ ...current, needsPersistence: true, savingsGoals: current.savingsGoals.map(item => item.id === id ? { ...item, archived } : item), recurringGoalContributions: archived ? current.recurringGoalContributions.map(rule => rule.goalId === id ? { ...rule, active:false,pausedAt:getToday(),processedThrough:getToday() } : rule) : current.recurringGoalContributions }));
    const deleteSavingsGoal = id => setData(current => {
        const next = deleteSavingsGoalData({ goals: current.savingsGoals, contributions: current.savingsGoalContributions, recurringRules: current.recurringGoalContributions, transfers: current.transfers }, id);
        return { ...current, needsPersistence: true, savingsGoals: next.goals, savingsGoalContributions: next.contributions, recurringGoalContributions: next.recurringRules, transfers: next.transfers };
    });
    const saveSavingsGoalContribution = (contribution, linkedTransfer) => setData(current => ({ ...current, needsPersistence: true,
        savingsGoalContributions: current.savingsGoalContributions.some(item => item.id === contribution.id) ? current.savingsGoalContributions.map(item => item.id === contribution.id ? contribution : item) : [...current.savingsGoalContributions, contribution],
        transfers: linkedTransfer ? (current.transfers.some(item => item.id === linkedTransfer.id) ? current.transfers.map(item => item.id === linkedTransfer.id ? linkedTransfer : item) : [...current.transfers, linkedTransfer]) : current.transfers,
    }));
    const deleteSavingsGoalContribution = id => setData(current => ({ ...current, needsPersistence: true, savingsGoalContributions: current.savingsGoalContributions.filter(item => item.id !== id) }));
    const importDataset = (dataset, records, mode) => setData(current => {
        if (mode === "replace") return { ...current, [dataset]: records, needsPersistence: true };
        const existing = current[dataset] || [];
        const nameBased = dataset === "accounts" || dataset === "customCategories";
        const transferKey = item => `${item.date}\0${item.fromAccountId}\0${item.toAccountId}\0${item.amount}\0${String(item.note || "").trim().toLowerCase()}`;
        const keys = new Set(existing.map(item => nameBased ? item.name.trim().toLowerCase() : dataset === "transfers" ? transferKey(item) : item.id));
        const added = records.filter(item => { const key = nameBased ? item.name.trim().toLowerCase() : dataset === "transfers" ? transferKey(item) : item.id; if (keys.has(key)) return false; keys.add(key); return true; });
        return { ...current, [dataset]: [...existing, ...added], needsPersistence: true };
    });
    const restoreFullData = restored => {
        const storage = { expenses: restored.transactions, accounts: restored.accounts, transfers: restored.transfers, customCategories: restored.customCategories, categoryIconOverrides: restored.categoryIconOverrides, recurringRules: restored.recurringRules, recurringTransfers: restored.recurringTransfers, savingsGoals: restored.savingsGoals, savingsGoalContributions: restored.savingsGoalContributions, recurringSavingsGoalContributions: restored.recurringSavingsGoalContributions, budgets: restored.budgets, fiftyThirtyTwentySettings: restored.fiftyThirtyTwentySettings };
        try { for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, JSON.stringify(value)); window.location.reload(); }
        catch { notify({ title: "Restore Failed", message: "The restore could not be saved. Browser storage may be unavailable or full." }); }
    };
    const saveRecurringTransfer = (rule, editing) => setData(current => { const nextRule=editing?{...rule,processedThrough:getToday()}:rule;const nextRules=editing?current.recurringTransfers.map(item=>item.id===rule.id?nextRule:item):[...current.recurringTransfers,nextRule];const generated=generateRecurringTransfers(nextRules,current.transfers,getToday());return{...current,needsPersistence:true,recurringTransfers:generated.rules,transfers:generated.transfers};});
    const toggleRecurringTransfer = id => setData(current => ({ ...current, needsPersistence: true, recurringTransfers: current.recurringTransfers.map(rule => rule.id !== id ? rule : rule.active ? { ...rule, active:false, pausedAt:getToday() } : { ...rule, active:true, pausedAt:null,processedThrough:getToday() }) }));
    const deleteRecurringTransfer = id => setData(current => ({ ...current, needsPersistence: true, recurringTransfers: current.recurringTransfers.filter(rule => rule.id !== id) }));
    const saveRecurringGoalContribution = (rule, editing) => setData(current => { const nextRule=editing?{...rule,processedThrough:getToday()}:rule;const nextRules=editing?current.recurringGoalContributions.map(item=>item.id===rule.id?nextRule:item):[...current.recurringGoalContributions,nextRule];const generated=generateRecurringGoalContributions(nextRules,current.savingsGoals,current.savingsGoalContributions,current.transfers,getToday());return{...current,needsPersistence:true,recurringGoalContributions:generated.rules,savingsGoalContributions:generated.contributions,transfers:generated.transfers};});
    const toggleRecurringGoalContribution = id => setData(current => ({ ...current, needsPersistence: true, recurringGoalContributions: current.recurringGoalContributions.map(rule => rule.id !== id ? rule : rule.active ? { ...rule, active:false,pausedAt:getToday() } : { ...rule,active:true,pausedAt:null,processedThrough:getToday() }) }));
    const deleteRecurringGoalContribution = id => setData(current => ({ ...current, needsPersistence: true, recurringGoalContributions: current.recurringGoalContributions.filter(rule => rule.id !== id) }));
    const saveCategory = category => setData(current => ({ ...current, needsPersistence: true,
        customCategories: current.customCategories.some(item => item.id === category.id)
            ? current.customCategories.map(item => item.id === category.id ? category : item)
            : [...current.customCategories, category],
    }));
    const archiveCategory = (id, archived) => setData(current => ({ ...current, needsPersistence: true,
        customCategories: current.customCategories.map(category => category.id === id ? { ...category, archived } : category),
    }));
    const deleteCategory = (id, references) => setData(current => {
        const result = deleteCustomCategoryRecord(current.customCategories, id, { confirmed: true, referenceCount: references.total });
        return result.deleted ? { ...current, needsPersistence: true, customCategories: result.categories } : current;
    });
    const saveBuiltInCategoryIcon = (categoryId, override) => setData(current => ({ ...current, needsPersistence: true,
        categoryIconOverrides: setCategoryIconOverride(current.categoryIconOverrides, categoryId, override),
    }));
    const requestCategoryCreation = (name, categoryType, mainCategoryId, onCreated) => setCategoryRequest({ name, type: categoryType, mainCategoryId, onCreated });

    useEffect(() => {
        const catchUp = () => {
            if (document.visibilityState !== "visible") return;
            setData(current => {
                const generated = generateRecurringTransactions(current.rules, current.expenses, getToday());
                const transferGenerated = generateRecurringTransfers(current.recurringTransfers, current.transfers, getToday());
                const goalGenerated = generateRecurringGoalContributions(current.recurringGoalContributions, current.savingsGoals, current.savingsGoalContributions, transferGenerated.transfers, getToday());
                return generated.changed || transferGenerated.changed || goalGenerated.changed ? { ...current, expenses: generated.transactions, rules: generated.rules, recurringTransfers: transferGenerated.rules, recurringGoalContributions: goalGenerated.rules, transfers: goalGenerated.transfers, savingsGoalContributions: goalGenerated.contributions, needsPersistence: true } : current;
            });
        };
        document.addEventListener("visibilitychange", catchUp);
        return () => document.removeEventListener("visibilitychange", catchUp);
    }, []);

    useEffect(() => {
        if (!hydrated || (data === initialData.current && !data.needsPersistence)) return;
        try {
            // Write transactions first. If this fails, never advance rule checkpoints.
            localStorage.setItem("expenses", JSON.stringify(expenses));
            localStorage.setItem("recurringRules", JSON.stringify(rules));
            localStorage.setItem("customCategories", JSON.stringify(customCategories));
            localStorage.setItem("categoryIconOverrides", JSON.stringify(categoryIconOverrides));
            localStorage.setItem("accounts", JSON.stringify(accounts));
            localStorage.setItem("transfers", JSON.stringify(transfers));
            localStorage.setItem("savingsGoals", JSON.stringify(savingsGoals));
            localStorage.setItem("savingsGoalContributions", JSON.stringify(savingsGoalContributions));
            localStorage.setItem("recurringTransfers", JSON.stringify(recurringTransfers));
            localStorage.setItem("recurringSavingsGoalContributions", JSON.stringify(recurringGoalContributions));
        } catch {
            // Browser storage can be unavailable or full; keep in-memory data usable.
        }
    }, [data, expenses, rules, recurringTransfers, recurringGoalContributions, customCategories, categoryIconOverrides, accounts, transfers, savingsGoals, savingsGoalContributions, hydrated]);

    if (!hydrated) return null;

    return (
<CategoryIconOverridesProvider overrides={categoryIconOverrides}>
<div className="container-fluid app-shell">
    <div className="row justify-content-center app-frame">
        <div className="col-lg-8 app-column">
            <div className="card shadow app-card">

                <h1 className="text-center app-title">
                    Expense Tracker
                </h1>

                <nav className="nav nav-tabs flex-nowrap overflow-x-auto app-nav" role="tablist" aria-label="Application views">
                    {TOP_LEVEL_TABS.map(tab => <button key={tab.id} id={`${tab.id}-tab`} type="button" role="tab"
                        className={`nav-link text-nowrap${activeView === tab.id ? " active" : ""}`}
                        aria-selected={activeView === tab.id} aria-controls={`${tab.id}-panel`}
                        tabIndex={activeView === tab.id ? 0 : -1} onClick={() => setActiveView(tab.id)}
                        onKeyDown={event => handleTabKeyDown(event, tab.id)}>{tab.label}</button>)}
                </nav>

                <main className="app-content">
                <div className="app-panel" id="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab" hidden={activeView !== "dashboard"}>
                    <DashboardView transactions={expenses} customCategories={customCategories} accounts={accounts} transfers={transfers} savingsGoals={savingsGoals} savingsGoalContributions={savingsGoalContributions} onViewAll={() => setActiveView("transactions")} onViewSavingsGoals={() => setActiveView("savingsGoals")} />
                </div>

                <div className="app-panel" id="transactions-panel" role="tabpanel" aria-labelledby="transactions-tab" hidden={activeView !== "transactions"}>
                    <TransactionPeriodHeader mode={transactionPeriodMode} onModeChange={changeTransactionPeriodMode}
                        selectedMonth={transactionSelectedMonth} onMonthChange={setTransactionSelectedMonth}
                        selectedYear={transactionSelectedYear} onYearChange={changeTransactionYear} />

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
                        accountId={accountId}
                        setAccountId={setAccountId}
                        accounts={accounts}

                        balance={periodSummary.net}
                        totalIncome={periodSummary.income}
                        totalExpense={periodSummary.expenses}
                        transactionCount={periodSummary.count}
                        expenses={periodExpenses}

                        addExpense={addExpense}
                        errors={addErrors}
                        clearError={clearAddError}
                        customCategories={customCategories}
                        onCreateCategory={requestCategoryCreation}
                        />

                    <RecurringActivityManager transactionProps={{rules,today:getToday(),customCategories,accounts,onCreateCategory:requestCategoryCreation,onSave:saveRule,onToggle:toggleRule,onDelete:deleteRule}} moneyProps={{transferRules:recurringTransfers,goalRules:recurringGoalContributions,accounts,goals:savingsGoals,contributions:savingsGoalContributions,today:getToday(),onSaveTransfer:saveRecurringTransfer,onToggleTransfer:toggleRecurringTransfer,onDeleteTransfer:deleteRecurringTransfer,onSaveGoal:saveRecurringGoalContribution,onToggleGoal:toggleRecurringGoalContribution,onDeleteGoal:deleteRecurringGoalContribution}} />

                    <section aria-label="Transaction history" className="mt-4">
                    <h3 className="h5 mb-3">Transaction History</h3>
                    <section aria-label="Transaction filters" className="border rounded p-3">
                        <div className="row g-3 align-items-end">
                            <div className="col-12 col-sm">
                                <label className="form-label" htmlFor="transaction-search">Search description</label>
                                <input id="transaction-search" type="search" className="form-control" value={search}
                                    onChange={e => setSearch(e.target.value)} placeholder="Search transactions" />
                            </div>
                            <div className="col-12 col-sm-auto">
                                <button type="button" className="btn btn-outline-primary w-100"
                                    aria-expanded={filtersOpen} aria-controls="transaction-filter-panel"
                                    onClick={() => setFiltersOpen(open => !open)}>
                                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""} {filtersOpen ? "▲" : "▼"}
                                </button>
                            </div>
                        </div>
                        <div id="transaction-filter-panel" className={`filter-panel${filtersOpen ? " filter-panel-open" : ""}`}
                            inert={!filtersOpen} aria-hidden={!filtersOpen}>
                          <div className="filter-panel-content">
                           <div className="row g-3 align-items-end pt-3">
                            <div className="col-6 col-md-3">
                                <label className="form-label" htmlFor="type-filter">Type</label>
                                <select id="type-filter" className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                                    <option value="">All</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                    <option value="savings-contribution">Savings Contribution</option>
                                </select>
                            </div>
                            <div className="col-6 col-md-3">
                                <label className="form-label" htmlFor="tag-filter">Tag</label>
                                <select id="tag-filter" className="form-select" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
                                    <option value="">All Tags</option>
                                    <optgroup label="Main Categories">{mainCategories.filter(main => main.id !== "transfers-internal").map(main => <option key={`main:${main.id}`} value={`main:${main.id}`}>{main.icon} {main.name}</option>)}</optgroup>
                                    <optgroup label="Subcategories">{getAllCategories(customCategories, categoryIconOverrides).filter(category => (!category.systemOnly || category.id === "contribution") && (!category.archived || expenses.some(expense => expense.tag === category.id)) && (!category.hidden || expenses.some(expense => expense.tag === category.id))).map(category => (
                                        <option key={category.id} value={category.id}>{getCategoryDisplay(category.id, customCategories, categoryIconOverrides)}</option>
                                    ))}</optgroup>
                                    {unknownTags.map(tagName => (
                                        <option key={tagName} value={tagName}>{tagName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-6 col-md-3"><label className="form-label" htmlFor="account-filter">Account</label><select id="account-filter" className="form-select" value={accountFilter} onChange={e=>setAccountFilter(e.target.value)}><option value="">All Accounts</option>{getAllAccounts(accounts).filter(account=>!account.archived||expenses.some(expense=>canonicalAccountId(expense.accountId)===account.id)).map(account=><option key={account.id} value={account.id}>{account.name}{account.archived ? " (Archived)" : ""}</option>)}</select></div>
                            <div className="col-6 col-md-3">
                                <label className="form-label" htmlFor="sort-by">Sort</label>
                                <select id="sort-by" className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                    <option value="newlyAdded">None</option>
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="highest">Highest Amount</option>
                                    <option value="lowest">Lowest Amount</option>
                                </select>
                            </div>
                           </div>
                           <div className="row g-3 align-items-end mt-0">
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className="form-label" htmlFor="start-date">From <span className="text-muted">(optional)</span></label>
                                <input id="start-date" type="date" className="form-control" value={startDate}
                                    max={endDate || undefined} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="col-12 col-sm-6 col-lg-3">
                                <label className="form-label" htmlFor="end-date">To <span className="text-muted">(optional)</span></label>
                                <input id="end-date" type="date" className="form-control" value={endDate}
                                    min={startDate || undefined} onChange={e => setEndDate(e.target.value)} />
                            </div>
                            {filtersActive && (
                                <div className="col-12 col-sm-auto">
                                    <button type="button" className="btn btn-outline-secondary w-100" onClick={clearFilters}>Clear Filters</button>
                                </div>
                            )}
                           </div>
                           <p className="small text-muted mt-2 mb-0">Custom dates are applied within {transactionPeriodLabel}.</p>
                          </div>
                        </div>
                        <div className="mt-3">
                            <span aria-live="polite">Showing {filteredActivities.length} of {periodActivities.length} activities in {transactionPeriodLabel}</span>
                        </div>
                    </section>

                {sortedActivities.length ? transactionPeriodMode === "yearly" ? <YearlyTransactionList groups={yearlyGroups}
                    removeExpense={removeExpense} updateExpense={updateExpense} customCategories={customCategories}
                    accounts={accounts} onCreateCategory={requestCategoryCreation} onViewSavingsGoal={() => setActiveView("savingsGoals")} /> : <TransactionList
                        activities={sortedActivities} removeExpense={removeExpense} updateExpense={updateExpense}
                        customCategories={customCategories} accounts={accounts} onCreateCategory={requestCategoryCreation}
                        onViewSavingsGoal={() => setActiveView("savingsGoals")} /> : <div className="border rounded text-center p-4 mt-3 text-muted">
                        {periodActivities.length ? `No activities match your filters in ${transactionPeriodLabel}.` : `No transactions or savings contributions in ${transactionPeriodLabel}.`}
                    </div>}
                    </section>
                </div>

                <div className="app-panel" id="calendar-panel" role="tabpanel" aria-labelledby="calendar-tab" hidden={activeView !== "calendar"}>
                    <FinanceCalendar transactions={expenses} transfers={transfers} accounts={accounts} customCategories={customCategories} savingsGoals={savingsGoals} savingsGoalContributions={savingsGoalContributions} />
                </div>

                <div className="app-panel" id="savingsGoals-panel" role="tabpanel" aria-labelledby="savingsGoals-tab" hidden={activeView !== "savingsGoals"}>
                    <SavingsGoalsDashboard goals={savingsGoals} contributions={savingsGoalContributions} accounts={accounts} transfers={transfers} transactions={expenses} today={getToday()} recurringGoalRules={recurringGoalContributions} onSaveGoal={saveSavingsGoal} onArchiveGoal={archiveSavingsGoal} onDeleteGoal={deleteSavingsGoal} onSaveContribution={saveSavingsGoalContribution} onDeleteContribution={deleteSavingsGoalContribution} />
                </div>

                <div className="app-panel" id="forecast-panel" role="tabpanel" aria-labelledby="forecast-tab" hidden={activeView !== "forecast"}>
                    <ForecastDashboard transactions={expenses} transfers={transfers} accounts={accounts} transactionRules={rules} transferRules={recurringTransfers} goalRules={recurringGoalContributions} goals={savingsGoals} contributions={savingsGoalContributions} today={getToday()} />
                </div>

                <div className="app-panel" id="data-panel" role="tabpanel" aria-labelledby="data-tab" hidden={activeView !== "data"}>
                    <DataManagement data={data} setExpenses={setExpenses} onDatasetImport={importDataset} onFullRestore={restoreFullData} />
                </div>

                <div className="app-panel" id="fiftyThirtyTwenty-panel" role="tabpanel" aria-labelledby="fiftyThirtyTwenty-tab" hidden={activeView !== "fiftyThirtyTwenty"}>
                    <FiftyThirtyTwentyDashboard transactions={expenses} customCategories={customCategories} />
                </div>

                <div className="app-panel" id="settings-panel" role="tabpanel" aria-labelledby="settings-tab" hidden={activeView !== "settings"}>
                    <SettingsView accounts={accounts} transactions={expenses} transfers={transfers} contributions={savingsGoalContributions} rules={rules} today={getToday()}
                        onSaveAccount={saveAccount} onArchiveAccount={archiveAccount} onSaveTransfer={saveTransfer} onDeleteTransfer={deleteTransfer}
                        onManageCategories={() => setCategoryManagerOpen(true)} onOpenData={() => setActiveView("data")} onResetApplication={resetApplication} />
                </div>
                </main>

                {categoryManagerOpen && <CategoryManager customCategories={customCategories} categoryIconOverrides={categoryIconOverrides} transactions={expenses} recurringRules={rules}
                    onSaveCategory={saveCategory} onArchive={archiveCategory} onDeleteCategory={deleteCategory} onSaveBuiltInIcon={saveBuiltInCategoryIcon} onClose={() => setCategoryManagerOpen(false)} />}
                {categoryRequest && <div className="planner-settings-backdrop" role="presentation"><section className="card shadow planner-settings" role="dialog" aria-modal="true" aria-labelledby="quick-category-heading"><div className="card-body"><h2 id="quick-category-heading" className="h4">Create Category</h2><CategoryForm initialName={categoryRequest.name} initialType={categoryRequest.type} initialMainCategoryId={categoryRequest.mainCategoryId} customCategories={customCategories} onSave={category => { saveCategory(category); categoryRequest.onCreated(category.id); setCategoryRequest(null); }} onCancel={() => setCategoryRequest(null)} /></div></section></div>}

            </div>
        </div>
    </div>
</div>
</CategoryIconOverridesProvider>
    );
};

export default ExpenseTracker;
