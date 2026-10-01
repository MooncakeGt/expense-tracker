import { z } from "zod";
import { categoryImageDataSchema } from "./customCategorySchema.js";
import { categories } from "./tags.js";

export const categoryOverrideSchema = z.object({
    customName: z.string().trim().min(1, "Category name is required.").max(60, "Category name must be 60 characters or fewer.").optional(),
    hidden: z.boolean().optional(),
    iconType: z.literal("image").optional(),
    imageData: categoryImageDataSchema.optional(),
}).refine(override => Boolean(override.iconType) === Boolean(override.imageData), {
    path: ["imageData"], message: "An image type and image data must be provided together.",
});

// Retained for callers and backups created by the earlier image-only implementation.
export const categoryIconOverrideSchema = categoryOverrideSchema;
const builtInById = new Map(categories.map(category => [category.id, category]));

const normalizeOverride = (categoryId, override) => {
    const category = builtInById.get(categoryId);
    const parsed = categoryOverrideSchema.safeParse(override);
    if (!category || !parsed.success) return null;
    const normalized = {};
    if (parsed.data.customName && parsed.data.customName !== category.name) normalized.customName = parsed.data.customName;
    if (parsed.data.hidden === true) normalized.hidden = true;
    if (parsed.data.iconType === "image" && parsed.data.imageData) {
        normalized.iconType = "image";
        normalized.imageData = parsed.data.imageData;
    }
    return Object.keys(normalized).length ? normalized : null;
};

export const parseCategoryOverrides = value => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const result = {};
    for (const [categoryId, override] of Object.entries(value)) {
        const normalized = normalizeOverride(categoryId, override);
        if (normalized) result[categoryId] = normalized;
    }
    return result;
};

export const parseCategoryIconOverrides = parseCategoryOverrides;
export const parseStoredCategoryIconOverrides = json => {
    if (!json) return {};
    try {
        return parseCategoryOverrides(JSON.parse(json));
    } catch {
        return {};
    }
};

export const setCategoryOverride = (overrides, categoryId, changes) => {
    const next = { ...overrides };
    if (!changes) {
        delete next[categoryId];
        return next;
    }
    const normalized = normalizeOverride(categoryId, { ...(next[categoryId] || {}), ...changes });
    if (normalized) next[categoryId] = normalized;
    else delete next[categoryId];
    return next;
};

export const setCategoryIconOverride = setCategoryOverride;
export const resolveBuiltInCategory = (category, overrides = {}) => {
    if (!category || !builtInById.has(category.id)) return category;
    const override = overrides[category.id];
    return override ? { ...category, name: override.customName || category.name, hidden: override.hidden === true } : category;
};

export const resolveCategoryIconSource = (category, overrides = {}) => {
    const override = category?.id && builtInById.has(category.id) ? overrides[category.id] : null;
    if (override?.iconType === "image" && override.imageData) return { iconType: "image", imageData: override.imageData, icon: category.icon };
    if (category?.iconType === "image" && category.imageData) return { iconType: "image", imageData: category.imageData, icon: category.icon };
    return { iconType: "emoji", icon: category?.icon || "" };
};
