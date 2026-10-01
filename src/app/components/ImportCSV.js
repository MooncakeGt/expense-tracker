'use client';

import { useRef, useState } from "react";
import { formatCurrency } from "../utils/currency";
import { createErrorReport, downloadCsv, getImportSelection, parseCsvText } from "../utils/csv";
import CategoryLabel from "./categories/CategoryIcon";

export default function ImportCSV({ expenses, customCategories = [], accounts = [], categoryOverrides = {}, setExpenses, compact = false }) {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [mode, setMode] = useState("merge");
    const [duplicatePolicy, setDuplicatePolicy] = useState("skip");
    const [report, setReport] = useState(null);
    const [replaceConfirmed, setReplaceConfirmed] = useState(false);
    const resetPreview = () => { setPreview(null); setMode("merge"); setDuplicatePolicy("skip"); setReplaceConfirmed(false); if (fileInputRef.current) fileInputRef.current.value = ""; };
    const selectFile = async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        setReport(null); setReplaceConfirmed(false);
        try { setPreview({ ...parseCsvText(await file.text(), expenses, () => crypto.randomUUID(), customCategories, accounts, categoryOverrides), fileName: file.name }); }
        catch { setPreview({ error: "The CSV could not be read.", fileName: file.name, rows: [], valid: [], invalid: [] }); }
    };
    const selected = preview ? getImportSelection(preview, mode, duplicatePolicy, expenses, customCategories, categoryOverrides) : [];
    const duplicateFilteredSelection = preview ? getImportSelection(preview, mode, "skip", expenses, customCategories, categoryOverrides) : [];
    const duplicateEligibleIds = new Set(duplicateFilteredSelection.map(item => item.transaction.id));
    const relevantDuplicates = preview ? preview.valid.length - duplicateFilteredSelection.length : 0;
    const confirmImport = () => {
        if (!preview || !selected.length || (mode === "replace" && !replaceConfirmed)) return;
        const transactions = selected.map(item => item.transaction);
        setExpenses(current => mode === "replace" ? transactions : [
            ...current,
            ...getImportSelection(preview, "merge", duplicatePolicy, current, customCategories, categoryOverrides).map(item => item.transaction),
        ]);
        setReport(mode === "replace" ? { message: "Import complete", detail: `Transactions now stored: ${transactions.length}. Invalid rows excluded: ${preview.invalid.length}.` } : { message: "Import complete", detail: `Imported: ${transactions.length}. Skipped invalid: ${preview.invalid.length}. Skipped duplicates: ${duplicatePolicy === "skip" ? relevantDuplicates : 0}.` });
        resetPreview();
    };
    return <div className={compact ? "transaction-import-compact" : undefined}>
        <button type="button" className={`btn btn-primary${compact ? " btn-sm" : " w-100"}`} onClick={() => fileInputRef.current?.click()}>Import CSV</button>
        <input className="visually-hidden" type="file" accept=".csv,text/csv" ref={fileInputRef} onChange={selectFile} />
        {report && <div className="alert alert-success small mt-2 mb-0" role="status"><strong>{report.message}</strong><div>{report.detail}</div></div>}
        {preview && <section className="border rounded p-3 mt-3 text-start" aria-labelledby="csv-preview-heading">
            <div className="d-flex flex-wrap justify-content-between gap-2"><h3 id="csv-preview-heading" className="h5">Import preview</h3><span className="text-break small">{preview.fileName}</span></div>
            {preview.error ? <div className="alert alert-danger" role="alert">{preview.error}</div> : <>
                <dl className="row small mb-3"><dt className="col-7">Total rows detected</dt><dd className="col-5">{preview.rows.length}</dd><dt className="col-7">Valid rows</dt><dd className="col-5">{preview.valid.length}</dd><dt className="col-7">Invalid rows</dt><dd className="col-5">{preview.invalid.length}</dd><dt className="col-7">Likely duplicates</dt><dd className="col-5">{relevantDuplicates}</dd><dt className="col-7">Rows ready to import</dt><dd className="col-5">{selected.length}</dd></dl>
                {preview.valid.some(item => item.accountWarning) && <div className="alert alert-warning small">{preview.valid.filter(item => item.accountWarning).length} row(s) referenced an unknown or ambiguous account and will use General.</div>}
                <fieldset className="mb-3"><legend className="h6">Import mode</legend><div className="form-check"><input className="form-check-input" type="radio" id="csv-merge" checked={mode === "merge"} onChange={() => { setMode("merge"); setReplaceConfirmed(false); }} /><label className="form-check-label" htmlFor="csv-merge"><strong>Merge</strong> — add rows to the existing history.</label></div><div className="form-check"><input className="form-check-input" type="radio" id="csv-replace" checked={mode === "replace"} onChange={() => setMode("replace")} /><label className="form-check-label" htmlFor="csv-replace"><strong>Replace</strong> — use only valid rows from this CSV.</label></div></fieldset>
                <fieldset className="mb-3"><legend className="h6">Likely duplicates</legend><div className="form-check"><input className="form-check-input" type="radio" id="csv-skip" checked={duplicatePolicy === "skip"} onChange={() => setDuplicatePolicy("skip")} /><label className="form-check-label" htmlFor="csv-skip">Skip likely duplicates (recommended)</label></div><div className="form-check"><input className="form-check-input" type="radio" id="csv-all" checked={duplicatePolicy === "all"} onChange={() => setDuplicatePolicy("all")} /><label className="form-check-label" htmlFor="csv-all">Import all valid rows</label></div><div className="form-text">Merge compares existing history and earlier CSV rows. Replace compares only earlier CSV rows.</div></fieldset>
                {mode === "replace" && <div className="alert alert-warning"><p>This will replace your current transaction history with valid transactions from this CSV. {preview.invalid.length} invalid rows will be excluded. Budgets and recurring rules will not be deleted.</p><div className="form-check"><input id="confirm-replace" className="form-check-input" type="checkbox" checked={replaceConfirmed} onChange={event => setReplaceConfirmed(event.target.checked)} /><label className="form-check-label" htmlFor="confirm-replace">I understand and want to replace transaction history.</label></div></div>}
                {preview.valid.length > 0 && <><h4 className="h6">First {Math.min(10, preview.valid.length)} valid rows</h4><div className="table-responsive"><table className="table table-sm align-middle"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>{preview.valid.slice(0, 10).map((item, index) => <tr key={`${item.transaction.id}-${index}`}><td>{item.transaction.date}</td><td>{item.transaction.description}</td><td><CategoryLabel tag={item.transaction.tag} customCategories={customCategories} size={20} /></td><td>{item.transaction.type}</td><td>{formatCurrency(item.transaction.amount)}</td><td>{duplicateEligibleIds.has(item.transaction.id) ? "Ready" : "Likely duplicate"}</td></tr>)}</tbody></table></div></>}
                {preview.invalid.length > 0 && <div className="mt-3"><h4 className="h6">{preview.invalid.length} rows could not be imported</h4><ul className="small ps-3">{preview.invalid.slice(0, 10).map(error => <li key={error.rowNumber}>Row {error.rowNumber} — {error.error}</li>)}</ul>{preview.invalid.length > 10 && <p className="small">Showing the first 10 errors.</p>}<button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => downloadCsv(createErrorReport(preview.invalid), "expense-tracker-import-errors.csv")}>Download Error Report</button></div>}
                {!preview.valid.length && <div className="alert alert-danger mt-3" role="alert">No valid transactions were found. Existing transactions will not be changed.</div>}
            </>}
            <div className="d-flex flex-wrap gap-2 mt-3"><button type="button" className="btn btn-primary" disabled={!selected.length || Boolean(preview.error) || (mode === "replace" && !replaceConfirmed)} onClick={confirmImport}>{mode === "replace" ? "Replace Transactions" : "Merge Transactions"}</button><button type="button" className="btn btn-outline-secondary" onClick={resetPreview}>Cancel</button></div>
        </section>}
    </div>;
}


