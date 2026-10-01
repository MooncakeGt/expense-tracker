import { test } from "node:test";
import assert from "node:assert/strict";
import { APP_STORAGE_KEYS, resetAppStorage } from "../src/app/utils/appStorage.js";
import { parseStoredAccounts } from "../src/app/utils/accountSchema.js";
import { GENERAL_ACCOUNT_ID } from "../src/app/utils/accounts.js";

const createStorage = entries => {
    const values = new Map(entries);
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key),
        values,
    };
};

test("app reset deletes every persisted dataset and recreates only the General account", () => {
    assert.equal(APP_STORAGE_KEYS.includes("categoryIconOverrides"), true);
    const storage = createStorage([
        ...APP_STORAGE_KEYS.map(key => [key, JSON.stringify({ populated: key })]),
        ["unrelated-origin-key", "preserved"],
    ]);

    resetAppStorage(storage);

    for (const key of APP_STORAGE_KEYS) {
        if (key !== "accounts") assert.equal(storage.getItem(key), null, `${key} should be deleted`);
    }
    const accounts = parseStoredAccounts(storage.getItem("accounts"));
    assert.equal(accounts.length, 1);
    assert.equal(accounts[0].id, GENERAL_ACCOUNT_ID);
    assert.equal(storage.getItem("unrelated-origin-key"), "preserved");
});
