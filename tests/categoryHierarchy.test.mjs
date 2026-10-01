import { test } from "node:test";
import assert from "node:assert/strict";
import Papa from "papaparse";
import {
    categories,
    getCategoryForTag,
    getMainCategoryForTag,
    getCategoriesForType,
    searchCategories,
} from "../src/app/utils/tags.js";
import { getCategorySpending, getMainCategorySpending } from "../src/app/utils/dashboard.js";
import { createCsvExport, parseCsvText } from "../src/app/utils/csv.js";

const expectedParents = {
    food:"food-dining", groceries:"food-dining", transport:"transport", fuel:"transport", "parking-tolls":"transport", vehicle:"transport",
    housing:"housing-home", utilities:"utilities", "phone-internet":"utilities", shopping:"shopping", entertainment:"entertainment-leisure",
    outings:"entertainment-leisure", subscriptions:"subscriptions-memberships", fitness:"fitness-wellness", travel:"travel",
    healthcare:"health-medical", insurance:"insurance", education:"education", work:"work-professional", "business-expense":"business",
    technology:"technology", family:"family", pets:"pets", "gifts-donations":"gifts-donations", "debt-loans":"debt-loans",
    investments:"investments", savings:"savings", salary:"income", freelance:"income", "business-income":"income", bonus:"income",
    refund:"income", "investment-income":"income", "rental-income":"income", allowance:"income", "other-income":"income", other:"other",
    contribution:"savings",
};

test("every historical built-in ID keeps its stable identity and resolves a parent", () => {
    for (const [id, mainCategoryId] of Object.entries(expectedParents)) {
        const category = getCategoryForTag(id);
        assert.equal(category?.id, id, id);
        assert.equal(category?.mainCategoryId, mainCategoryId, id);
        assert.equal(getMainCategoryForTag(id).id, mainCategoryId, id);
    }
    assert.equal(new Set(categories.map(category => category.id)).size, categories.length);
});

test("type and parent filtering happen before keyword searching", () => {
    assert.equal(searchCategories("salary", "expense").length, 0);
    assert.equal(searchCategories("salary", "income").some(category => category.id === "salary"), true);
    assert.equal(searchCategories("coffee", "expense", [], [], [], "food-dining").some(category => category.name === "Cafes / Coffee"), true);
    assert.equal(getCategoriesForType("expense", [], [], "transport").every(category => category.mainCategoryId === "transport"), true);
});

test("unknown historical tags remain intact and group under Other", () => {
    assert.equal(getCategoryForTag("TouchGrass"), undefined);
    assert.equal(getMainCategoryForTag("TouchGrass").id, "other");
    const transaction = { id:"1", description:"Old item", tag:"TouchGrass", amount:10, type:"expense", date:"2026-09-01" };
    assert.equal(getCategorySpending([transaction])[0].tag, "TouchGrass");
    assert.equal(getMainCategorySpending([transaction])[0].tag, "main:other");
});

test("dashboard aggregation combines subcategories by main category without losing detail", () => {
    const transactions = [
        { id:"1", description:"Lunch", tag:"food", amount:20, type:"expense", date:"2026-09-01" },
        { id:"2", description:"Market", tag:"groceries", amount:80, type:"expense", date:"2026-09-02" },
    ];
    assert.deepEqual(getCategorySpending(transactions).map(item => item.tag), ["groceries", "food"]);
    assert.deepEqual(getMainCategorySpending(transactions).map(item => ({ tag:item.tag, amount:item.amount })), [{ tag:"main:food-dining", amount:100 }]);
});

test("transaction CSV exports hierarchy and imports new and legacy category columns", () => {
    const transaction = { id:"1", description:"Lunch", tag:"food", amount:20, type:"expense", date:"2026-09-01" };
    const exported = createCsvExport([transaction]);
    const row = Papa.parse(exported, { header:true }).data[0];
    assert.equal(row["Main Category"], "Food & Dining");
    assert.equal(row.Subcategory, "Restaurants");
    assert.equal(row.Tag, "Restaurants");
    assert.equal(parseCsvText(exported, [], () => "new").valid[0].transaction.tag, "food");
    assert.equal(parseCsvText("Description,Tag,Amount,Type,Date\nOld lunch,Food,12,expense,2026-09-01", [], () => "old").valid[0].transaction.tag, "food");
});

