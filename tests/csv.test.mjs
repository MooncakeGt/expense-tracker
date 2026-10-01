import { test } from "node:test";
import assert from "node:assert/strict";
import Papa from "papaparse";
import { createCsvExport, createTransactionFingerprint, escapeSpreadsheetCell, getImportSelection, parseCsvText, resolveCsvAccount } from "../src/app/utils/csv.js";

let id = 0;
const createId = () => `import-${++id}`;
const transaction = changes => ({ id: "existing", description: "Netflix", tag: "subscriptions", amount: 55, type: "expense", date: "2026-09-10", ...changes });

test("round trips standard, unknown, quoted, multiline, and Unicode values", () => {
    const source = [
        transaction({ description: "Dinner, drinks & dessert", tag: "Food" }),
        transaction({ id: "2", description: 'He said "hello"', tag: "Medical", date: "2026-09-11" }),
        transaction({ id: "3", description: "Line one\n第二行", tag: "TouchGrass", date: "2026-09-12" }),
    ];
    const result = parseCsvText(createCsvExport(source), [], createId);
    assert.equal(result.invalid.length, 0);
    assert.deepEqual(result.valid.map(item => item.transaction.description), source.map(item => item.description));
    assert.deepEqual(result.valid.map(item => item.transaction.tag), ["food", "Medical", "TouchGrass"]);
    assert.ok(result.valid.every(item => typeof item.transaction.amount === "number"));
});

test("round trips the built-in Outings category with its stable ID", () => {
    const source = [transaction({ description: "Friends meetup", tag: "outings" })];
    const result = parseCsvText(createCsvExport(source), [], createId);
    assert.equal(result.invalid.length, 0);
    assert.equal(result.valid[0].transaction.tag, "outings");
});

test("CSV uses renamed preset labels while importing both renamed and canonical labels", () => {
    const overrides = { food: { customName: "Eating Out" } };
    const source = [transaction({ description: "Dinner", tag: "food" })];
    const exported = createCsvExport(source, [], [], overrides);
    const row = Papa.parse(exported, { header: true }).data[0];
    assert.equal(row.Subcategory, "Eating Out");
    assert.equal(parseCsvText(exported, [], createId, [], [], overrides).valid[0].transaction.tag, "food");
    const canonical = "Description,Main Category,Subcategory,Amount,Type,Date\nDinner,Food & Dining,Restaurants,20,expense,2026-09-10";
    assert.equal(parseCsvText(canonical, [], createId, [], [], overrides).valid[0].transaction.tag, "food");
});

test("formula-like text is made spreadsheet safe without mutating input", () => {
    for (const value of ["=SUM(1,1)", "+cmd", "-danger", "@formula", "  =hidden"]) assert.equal(escapeSpreadsheetCell(value), `'${value}`);
    const source = transaction({ description: "=HYPERLINK()", tag: "+tag" });
    const csv = createCsvExport([source]);
    assert.equal(source.description, "=HYPERLINK()");
    const row = Papa.parse(csv, { header: true }).data[0];
    assert.equal(row.Description, "'=HYPERLINK()");
    assert.equal(row.Tag, "'+tag");
});

test("fingerprints canonicalize aliases and normalize description whitespace", () => {
    assert.equal(createTransactionFingerprint(transaction({ description: "  Lunch   Deal ", tag: "Food" })), createTransactionFingerprint(transaction({ description: "lunch deal", tag: "food" })));
    assert.notEqual(createTransactionFingerprint(transaction({ amount: 65 })), createTransactionFingerprint(transaction({ amount: 55 })));
    assert.notEqual(createTransactionFingerprint(transaction({ date: "2026-10-10" })), createTransactionFingerprint(transaction({ date: "2026-09-10" })));
});

test("CSV accounts resolve stable IDs before unique names and warn on ambiguous names", () => {
    const accounts = [
        { id: "wallet-1", name: "Daily Wallet" },
        { id: "shared-1", name: "Shared" },
        { id: "shared-2", name: "Shared" },
    ];
    assert.deepEqual(resolveCsvAccount("wallet-1", accounts), { accountId: "wallet-1", warning: "" });
    assert.deepEqual(resolveCsvAccount(" daily wallet ", accounts), { accountId: "wallet-1", warning: "" });
    assert.deepEqual(resolveCsvAccount("Shared", accounts), {
        accountId: "general",
        warning: "Account \u201CShared\u201D was mapped to General.",
    });
    const parsed = parseCsvText("Description,Tag,Amount,Type,Date,Account\nCoffee,food,10,expense,2026-09-10,wallet-1", [], createId, [], accounts);
    assert.equal(parsed.valid[0].transaction.accountId, "wallet-1");
});

test("fingerprints resolve renamed preset categories to their canonical IDs", () => {
    const overrides = { food: { customName: "Eating Out" } };
    assert.equal(
        createTransactionFingerprint(transaction({ tag: "Eating Out" }), [], overrides),
        createTransactionFingerprint(transaction({ tag: "food" }), [], overrides),
    );
});

test("detects existing and internal duplicates with mode-specific selection", () => {
    const csv = "Description,Tag,Amount,Type,Date\nNetflix,subscriptions,55,expense,2026-09-10\nNetflix,subscriptions,55,expense,2026-09-10\n";
    const preview = parseCsvText(csv, [transaction({})], createId);
    assert.equal(preview.valid[0].duplicateExisting, true);
    assert.equal(preview.valid[0].duplicateInternal, false);
    assert.equal(preview.valid[1].duplicateInternal, true);
    assert.equal(getImportSelection(preview, "merge", "skip").length, 0);
    assert.equal(getImportSelection(preview, "merge", "all").length, 2);
    assert.equal(getImportSelection(preview, "replace", "skip").length, 1);
});

test("merge selection rechecks stale previews against current transactions", () => {
    const csv = "Description,Tag,Amount,Type,Date\nNetflix,subscriptions,55,expense,2026-09-10";
    const preview = parseCsvText(csv, [], createId);
    assert.equal(preview.valid[0].duplicateExisting, false);
    assert.equal(getImportSelection(preview, "merge", "skip").length, 1);
    assert.equal(getImportSelection(preview, "merge", "skip", [transaction({})]).length, 0);
    assert.equal(getImportSelection(preview, "merge", "all", [transaction({})]).length, 1);
});

test("unknown account warnings use valid Unicode quotation marks", () => {
    const csv = "Description,Tag,Amount,Type,Date,Account\nCoffee,food,10,expense,2026-09-10,Missing Account";
    const preview = parseCsvText(csv, [], createId);
    assert.equal(preview.valid[0].transaction.accountId, "general");
    assert.equal(preview.valid[0].accountWarning, "Account \u201CMissing Account\u201D was mapped to General.");
});

test("normalizes headers, preserves unknown tags, and reports invalid rows", () => {
    const csv = " description , TAG , amount , TYPE , DATE \nDoctor,Medical,80,EXPENSE,2026-09-20\nBad,Food,0,expense,not-a-date\nBlank,,25.50,expense,2026-09-21";
    const preview = parseCsvText(csv, [], createId);
    assert.equal(preview.valid.length, 2);
    assert.equal(preview.invalid.length, 1);
    assert.equal(preview.valid[0].transaction.tag, "Medical");
    assert.equal(preview.valid[1].transaction.tag, "other");
    assert.equal(preview.valid[1].transaction.amount, 25.5);
    assert.equal(preview.invalid[0].rowNumber, 3);
});

test("transaction import rejects empty files and missing required columns", () => {
    assert.match(parseCsvText("", [], createId).error, /empty/i);
    assert.match(parseCsvText("Description,Amount\nLunch,12", [], createId).error, /Missing required columns/i);
});
