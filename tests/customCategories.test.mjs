import { test } from "node:test";
import assert from "node:assert/strict";
import Papa from "papaparse";
import { MAX_CATEGORY_IMAGE_DATA_URL_LENGTH, createCustomCategoryId, deleteCustomCategoryRecord, getCategoryImageFileError, parseStoredCustomCategories, validateCustomCategory } from "../src/app/utils/customCategorySchema.js";
import { categoryHasReferences, getCategoryDisplay, getCategoryForTag, getCategoriesForType, getCategoryReferenceCounts, isCategoryCompatible } from "../src/app/utils/tags.js";
import { getCategoryGroup, getPlannerData } from "../src/app/utils/fiftyThirtyTwenty.js";
import { createCsvExport, createTransactionFingerprint, parseCsvText } from "../src/app/utils/csv.js";

const gaming = { id: "custom-550e8400-e29b-41d4-a716-446655440000", name: "Gaming", type: "expense", icon: "🎮", keywords: ["steam"], budgetGroup: "wants", archived: false, createdAt: "2026-09-28T00:00:00.000Z" };
const transaction = { id: "t1", description: "Steam purchase", tag: gaming.id, amount: 120, type: "expense", date: "2026-09-28" };
const imageData = "data:image/webp;base64,UklGRg==";

test("validates stable custom category records", () => {
    assert.equal(createCustomCategoryId(() => "550e8400-e29b-41d4-a716-446655440000"), gaming.id);
    assert.equal(validateCustomCategory(gaming).success, true);
    assert.equal(validateCustomCategory({ ...gaming, id: "Gaming" }).success, false);
    assert.equal(validateCustomCategory({ ...gaming, name: " " }).success, false);
    assert.equal(validateCustomCategory({ ...gaming, type: "income", budgetGroup: "wants" }).success, false);
});

test("legacy categories and image metadata remain backward compatible", () => {
    const legacy = validateCustomCategory(gaming);
    assert.equal(legacy.success, true);
    assert.equal(legacy.data.iconType, undefined);
    assert.equal(legacy.data.imageData, undefined);

    const withImage = validateCustomCategory({ ...gaming, iconType: "image", imageData });
    assert.equal(withImage.success, true);
    assert.equal(withImage.data.imageData, imageData);
    assert.equal(validateCustomCategory({ ...gaming, iconType: "image", imageData: null }).success, false);
    assert.equal(validateCustomCategory({ ...gaming, iconType: "image", imageData: "data:image/svg+xml;base64,PHN2Zz4=" }).success, false);
});

test("removing an image restores the emoji fallback", () => {
    const removed = { ...gaming, iconType: "emoji", imageData: null };
    assert.equal(validateCustomCategory(removed).success, true);
    assert.equal(getCategoryDisplay(removed.id, [removed]), `${removed.icon} ${removed.name}`);
});

test("image file validation rejects unsupported and excessive uploads", () => {
    assert.equal(getCategoryImageFileError({ type: "image/png", size: 1024 }), null);
    assert.match(getCategoryImageFileError({ type: "image/gif", size: 1024 }), /PNG, JPEG, or WebP/);
    assert.match(getCategoryImageFileError({ type: "image/jpeg", size: 5 * 1024 * 1024 + 1 }), /smaller than 5 MB/);
    const oversizedData = `data:image/png;base64,${"A".repeat(MAX_CATEGORY_IMAGE_DATA_URL_LENGTH)}`;
    assert.equal(validateCustomCategory({ ...gaming, iconType: "image", imageData: oversizedData }).success, false);
});

test("resolves IDs and names case-insensitively while preserving renamed IDs", () => {
    assert.equal(getCategoryForTag(gaming.id, [gaming]).id, gaming.id);
    assert.equal(getCategoryForTag("gaming", [gaming]).id, gaming.id);
    const renamed = { ...gaming, name: "Video Games" };
    assert.equal(getCategoryDisplay(transaction.tag, [renamed]), "🎮 Video Games");
    assert.equal(transaction.tag, gaming.id);
});

test("archived categories resolve historically but are excluded from normal selection", () => {
    const archived = { ...gaming, archived: true };
    assert.equal(getCategoryForTag(gaming.id, [archived]).id, gaming.id);
    assert.equal(getCategoriesForType("expense", [archived]).some(item => item.id === gaming.id), false);
    assert.equal(getCategoriesForType("expense", [archived], [gaming.id]).some(item => item.id === gaming.id), true);
    assert.equal(isCategoryCompatible(archived, "expense"), true);
});

test("storage recovers valid records, including names introduced later as built-ins", () => {
    const recovered = parseStoredCustomCategories(JSON.stringify([gaming, { ...gaming, name: "Another" }, { ...gaming, id: "custom-650e8400-e29b-41d4-a716-446655440000", name: "gaming" }, { ...gaming, id: "custom-750e8400-e29b-41d4-a716-446655440000", name: "Groceries" }, { bad: true }]));
    assert.deepEqual(recovered, [
        { ...gaming, mainCategoryId: "other" },
        { ...gaming, id: "custom-750e8400-e29b-41d4-a716-446655440000", name: "Groceries", mainCategoryId: "other" },
    ]);
    assert.deepEqual(parseStoredCustomCategories("{bad"), []);
});

test("custom budget groups and explicit overrides use stable IDs", () => {
    assert.equal(getCategoryGroup(gaming.id, {}, [gaming]), "wants");
    assert.equal(getCategoryGroup(gaming.id, { [gaming.id]: "needs" }, [gaming]), "needs");
    const data = getPlannerData([transaction], "2026-09", { needs: 50, wants: 30, savings: 20 }, {}, [gaming]);
    assert.equal(data.actuals.wants, 120);
});

test("CSV resolves custom names, fingerprints IDs consistently, and exports names", () => {
    let number = 0;
    const parsed = parseCsvText("Description,Tag,Amount,Type,Date\nSteam purchase,video games,120,expense,2026-09-28", [], () => `id-${++number}`, [{ ...gaming, name: "Video Games" }]);
    assert.equal(parsed.valid[0].transaction.tag, gaming.id);
    assert.equal(createTransactionFingerprint(transaction, [gaming]), createTransactionFingerprint({ ...transaction, tag: "Gaming" }, [gaming]));
    const row = Papa.parse(createCsvExport([transaction], [gaming]), { header: true }).data[0];
    assert.equal(row.Tag, "Gaming");
    assert.equal(getCategoryForTag("Photography", [gaming]).mainCategoryId, "entertainment-leisure");
});

test("reference detection includes transactions, recurring rules, and budgets", () => {
    assert.equal(categoryHasReferences(gaming.id, [transaction], [], {}), true);
    assert.equal(categoryHasReferences(gaming.id, [], [{ tag: gaming.id }], {}), true);
    assert.equal(categoryHasReferences(gaming.id, [], [], { "2026-09": { categories: { [gaming.id]: 100 } } }), true);
});

test("reference detection includes 50/30/20 overrides and reports every persisted source", () => {
    const counts = getCategoryReferenceCounts(gaming.id, {
        transactions: [transaction],
        recurringRules: [{ tag: gaming.id }],
        budgets: { "2026-09": { categories: { [gaming.id]: 100 } } },
        plannerSettings: { categoryOverrides: { [gaming.id]: "wants" } },
        customCategories: [gaming],
    });
    assert.deepEqual(counts, { transactions: 1, recurringRules: 1, budgets: 1, plannerOverrides: 1, total: 4 });
});

test("deletes an unused custom category and its embedded image metadata", () => {
    const withImage = { ...gaming, iconType: "image", imageData };
    const result = deleteCustomCategoryRecord([withImage], gaming.id, { confirmed: true, referenceCount: 0 });
    assert.equal(result.deleted, true);
    assert.deepEqual(result.categories, []);
    assert.equal(result.categories.some(category => category.imageData === imageData), false);
});

test("confirmation cancellation keeps the custom category", () => {
    const categories = [gaming];
    const result = deleteCustomCategoryRecord(categories, gaming.id, { confirmed: false, referenceCount: 0 });
    assert.equal(result.deleted, false);
    assert.equal(result.categories, categories);
});

test("referenced custom categories cannot be deleted and leave no orphaned references", () => {
    const references = getCategoryReferenceCounts(gaming.id, { transactions: [transaction], customCategories: [gaming] });
    const result = deleteCustomCategoryRecord([gaming], gaming.id, { confirmed: true, referenceCount: references.total });
    assert.equal(result.deleted, false);
    assert.deepEqual(result.categories, [gaming]);
    assert.equal(result.categories.some(category => category.id === transaction.tag), true);
});
