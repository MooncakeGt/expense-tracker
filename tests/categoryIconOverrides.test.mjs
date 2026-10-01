import test from "node:test";
import assert from "node:assert/strict";
import { categories, getCategoriesForType, getCategoryForTag } from "../src/app/utils/tags.js";
import { parseStoredCategoryIconOverrides, resolveBuiltInCategory, resolveCategoryIconSource, setCategoryIconOverride, setCategoryOverride } from "../src/app/utils/categoryIconOverrides.js";

const firstImage = "data:image/webp;base64,UklGRg==";
const replacementImage = "data:image/png;base64,iVBORw==";

test("built-in image overrides persist without changing built-in metadata", () => {
    const food = categories.find(category => category.id === "food");
    const metadata = { ...food, keywords: [...food.keywords] };
    const overrides = setCategoryIconOverride({}, food.id, { iconType: "image", imageData: firstImage });
    const restored = parseStoredCategoryIconOverrides(JSON.stringify(overrides));

    assert.deepEqual(restored, overrides);
    assert.deepEqual(resolveCategoryIconSource(food, restored), { iconType: "image", imageData: firstImage, icon: food.icon });
    assert.deepEqual({ ...food, keywords: [...food.keywords] }, metadata);
});

test("built-in image overrides can be replaced and reverted to the default emoji", () => {
    const food = categories.find(category => category.id === "food");
    const initial = setCategoryIconOverride({}, food.id, { iconType: "image", imageData: firstImage });
    const replaced = setCategoryIconOverride(initial, food.id, { iconType: "image", imageData: replacementImage });
    assert.equal(resolveCategoryIconSource(food, replaced).imageData, replacementImage);

    const reverted = setCategoryIconOverride(replaced, food.id, null);
    assert.deepEqual(reverted, {});
    assert.deepEqual(resolveCategoryIconSource(food, reverted), { iconType: "emoji", icon: food.icon });
});

test("stored overrides recover valid built-in records and discard invalid entries", () => {
    const restored = parseStoredCategoryIconOverrides(JSON.stringify({
        food: { iconType: "image", imageData: firstImage },
        salary: { iconType: "image", imageData: "data:image/svg+xml;base64,PHN2Zz4=" },
        "not-a-built-in": { iconType: "image", imageData: firstImage },
    }));
    assert.deepEqual(Object.keys(restored), ["food"]);
    assert.deepEqual(parseStoredCategoryIconOverrides("{bad"), {});
});

test("preset renames persist, resolve by stable ID, and revert to the canonical name", () => {
    const food = categories.find(category => category.id === "food");
    const renamed = setCategoryOverride({}, food.id, { customName: "Eating Out" });
    const restored = parseStoredCategoryIconOverrides(JSON.stringify(renamed));
    assert.equal(getCategoryForTag(food.id, [], restored).name, "Eating Out");
    assert.equal(getCategoryForTag("Eating Out", [], restored).id, food.id);
    assert.equal(getCategoryForTag(food.name, [], restored).id, food.id);

    const reverted = setCategoryOverride(restored, food.id, { customName: undefined });
    assert.deepEqual(reverted, {});
    assert.equal(getCategoryForTag(food.id, [], reverted).name, food.name);
});

test("hidden presets leave new selectors while historical references still resolve and can be restored", () => {
    const food = categories.find(category => category.id === "food");
    const hidden = setCategoryOverride({}, food.id, { hidden: true });
    assert.equal(getCategoriesForType("expense", [], [], undefined, hidden).some(category => category.id === food.id), false);
    assert.equal(getCategoriesForType("expense", [], [food.id], undefined, hidden).some(category => category.id === food.id), true);
    assert.equal(getCategoryForTag(food.id, [], hidden).name, food.name);

    const restored = setCategoryOverride(hidden, food.id, { hidden: false });
    assert.deepEqual(restored, {});
    assert.equal(getCategoriesForType("expense", [], [], undefined, restored).some(category => category.id === food.id), true);
});

test("name, hidden state, and image coexist in one preset override", () => {
    const food = categories.find(category => category.id === "food");
    const overrides = setCategoryOverride({}, food.id, { customName: "Dining", hidden: true, iconType: "image", imageData: firstImage });
    assert.equal(resolveBuiltInCategory(food, overrides).name, "Dining");
    assert.equal(resolveBuiltInCategory(food, overrides).hidden, true);
    assert.equal(resolveCategoryIconSource(food, overrides).imageData, firstImage);
});
