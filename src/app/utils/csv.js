import Papa from "papaparse";
import { getCategoryByName, getCategoryForTag, getMainCategoryForTag, isCategoryCompatible, mainCategories, normalizeTag } from "./tags.js";
import { getFieldErrors, validateTransactionInput } from "./transactionSchema.js";
import { canonicalAccountId, getAccountDisplayName, getAllAccounts } from "./accounts.js";

export const CSV_COLUMNS = ["Description", "Main Category", "Subcategory", "Tag", "Amount", "Type", "Date", "Account"];

export const normalizeCsvHeader = header => String(header).replace(/^\uFEFF/, "").trim().toLowerCase();

export const canonicalCategory = (tag, customCategories = [], categoryOverrides = {}) => getCategoryForTag(tag, customCategories, categoryOverrides)?.id ?? normalizeTag(tag).toLocaleLowerCase();
const normalizedDescription = description => String(description).trim().replace(/\s+/g, " ").toLocaleLowerCase();

export const createTransactionFingerprint = (transaction, customCategories = [], categoryOverrides = {}) => [
    transaction.date,
    transaction.type,
    Number(transaction.amount).toString(),
    normalizedDescription(transaction.description),
    canonicalCategory(transaction.tag, customCategories, categoryOverrides),
    canonicalAccountId(transaction.accountId),
].join("\u001F");

export const resolveCsvAccount = (value, accounts = []) => {
    const input = typeof value === "string" ? value.trim() : "";
    if (!input) return { accountId: "general", warning: "" };
    const available = getAllAccounts(accounts);
    const idMatch = available.find(account => account.id === input);
    if (idMatch) return { accountId: idMatch.id, warning: "" };
    const nameMatches = available.filter(account => account.name.toLocaleLowerCase() === input.toLocaleLowerCase());
    if (nameMatches.length === 1) return { accountId: nameMatches[0].id, warning: "" };
    return { accountId: "general", warning: `Account \u201C${input}\u201D was mapped to General.` };
};

const firstError = error => Object.values(getFieldErrors(error))[0] || "Invalid row.";

export const parseCsvText = (text, existingTransactions = [], createId = () => crypto.randomUUID(), customCategories = [], accounts = [], categoryOverrides = {}) => {
    if (!String(text).trim()) return { error: "The CSV file is empty.", rows: [], valid: [], invalid: [] };
    const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: normalizeCsvHeader,
    });
    const required = ["description", "amount", "type", "date"];
    const missing = required.filter(column => !(parsed.meta.fields ?? []).includes(column));
    if (!(parsed.meta.fields ?? []).some(column => column === "tag" || column === "subcategory")) missing.push("tag or subcategory");
    if (missing.length) return { error: `Missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`, rows: parsed.data, valid: [], invalid: [] };
    const fatal = parsed.errors.find(error => error.code === "UndetectableDelimiter" || error.type === "Quotes");
    if (fatal) return { error: fatal.message, rows: [], valid: [], invalid: [] };

    const existing = new Set(existingTransactions.map(transaction => createTransactionFingerprint(transaction, customCategories, categoryOverrides)));
    const withinFile = new Set();
    const valid = [];
    const invalid = [];

    parsed.data.forEach((row, index) => {
        const normalizedType = typeof row.type === "string" ? row.type.trim().toLowerCase() : row.type;
        const rawCategory = String(row.subcategory || row.tag || "").trim();
        const mainInput = String(row["main category"] || "").trim().toLowerCase();
        const main = mainCategories.find(item => item.id === mainInput || item.name.toLowerCase() === mainInput);
        const resolvedCategory = (main && getCategoryByName(rawCategory, customCategories, main.id, categoryOverrides)) || getCategoryForTag(rawCategory, customCategories, categoryOverrides);
        const account = resolveCsvAccount(row.account, accounts);
        const result = validateTransactionInput({
            id: createId(),
            description: row.description,
            tag: resolvedCategory && isCategoryCompatible(resolvedCategory, normalizedType) ? resolvedCategory.id : rawCategory,
            amount: row.amount,
            type: normalizedType,
            date: typeof row.date === "string" ? row.date.trim() : row.date,
            accountId: account.accountId,
        });
        if (!result.success) {
            invalid.push({ rowNumber: index + 2, description: row.description ?? "", error: firstError(result.error),
                originalDate: row.date ?? "", originalAmount: row.amount ?? "", originalType: row.type ?? "", originalTag: rawCategory });
            return;
        }
        const fingerprint = createTransactionFingerprint(result.data, customCategories, categoryOverrides);
        const duplicateExisting = existing.has(fingerprint);
        const duplicateInternal = withinFile.has(fingerprint);
        withinFile.add(fingerprint);
        valid.push({ transaction: result.data, duplicateExisting, duplicateInternal, accountWarning: account.warning });
    });

    return { rows: parsed.data, valid, invalid, parseWarnings: parsed.errors.length };
};

export const getImportSelection = (preview, mode, duplicatePolicy, currentTransactions = null, customCategories = [], categoryOverrides = {}) => {
    if (duplicatePolicy === "all") return preview.valid;
    if (mode === "replace") return preview.valid.filter(item => !item.duplicateInternal);
    const currentFingerprints = Array.isArray(currentTransactions)
        ? new Set(currentTransactions.map(transaction => createTransactionFingerprint(transaction, customCategories, categoryOverrides)))
        : null;
    return preview.valid.filter(item => !item.duplicateInternal && !(currentFingerprints
        ? currentFingerprints.has(createTransactionFingerprint(item.transaction, customCategories, categoryOverrides))
        : item.duplicateExisting));
};

// A leading apostrophe forces common spreadsheet applications to treat risky text as text.
export const escapeSpreadsheetCell = value => {
    const text = String(value ?? "");
    return /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
};

export const createCsvExport = (transactions, customCategories = [], accounts = [], categoryOverrides = {}) => {
    const rows = transactions.map(transaction => {
        const category = getCategoryForTag(transaction.tag, customCategories, categoryOverrides);
        const main = getMainCategoryForTag(transaction.tag, customCategories);
        const subcategory = category?.name ?? normalizeTag(transaction.tag);
        return ({
        Description: escapeSpreadsheetCell(transaction.description),
        "Main Category": escapeSpreadsheetCell(main.name),
        Subcategory: escapeSpreadsheetCell(subcategory),
        Tag: escapeSpreadsheetCell(subcategory),
        Amount: transaction.amount,
        Type: transaction.type,
        Date: transaction.date,
        Account: escapeSpreadsheetCell(getAccountDisplayName(transaction.accountId, accounts)),
    }); });
    return `\uFEFF${Papa.unparse(rows, { columns: CSV_COLUMNS, newline: "\r\n" })}`;
};

export const createErrorReport = errors => `\uFEFF${Papa.unparse(errors.map(item => ({
    row_number: item.rowNumber,
    description: escapeSpreadsheetCell(item.description),
    error: escapeSpreadsheetCell(item.error),
    original_date: escapeSpreadsheetCell(item.originalDate),
    original_amount: escapeSpreadsheetCell(item.originalAmount),
    original_type: escapeSpreadsheetCell(item.originalType),
    original_tag: escapeSpreadsheetCell(item.originalTag),
})), { newline: "\r\n" })}`;

export const downloadCsv = (csv, filename) => {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
