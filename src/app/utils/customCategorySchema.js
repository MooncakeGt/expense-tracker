import { z } from "zod";
import { mainCategories } from "./tags.js";

export const categoryGroupSchema = z.enum(["needs", "wants", "savings", "unassigned"]);
export const MAX_CATEGORY_IMAGE_DATA_URL_LENGTH = 150000;
export const MAX_CATEGORY_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const CATEGORY_IMAGE_MIME_TYPES = Object.freeze(["image/png", "image/jpeg", "image/webp"]);
export const getCategoryImageFileError = file => {
    if (!CATEGORY_IMAGE_MIME_TYPES.includes(file?.type)) return "Choose a PNG, JPEG, or WebP image.";
    if (!Number.isFinite(file?.size) || file.size > MAX_CATEGORY_IMAGE_UPLOAD_BYTES) return "Choose an image smaller than 5 MB.";
    return null;
};
export const categoryImageDataSchema = z.string().max(MAX_CATEGORY_IMAGE_DATA_URL_LENGTH, "Category image is too large.")
    .regex(/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+=*$/i, "Use a PNG, JPEG, or WebP image.");
export const customCategorySchema = z.object({
    id: z.string().regex(/^custom-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, "Invalid category ID."),
    name: z.string().trim().min(1, "Category name is required.").max(60, "Category name must be 60 characters or fewer."),
    type: z.enum(["income", "expense", "both"]),
    icon: z.string().trim().min(1, "Choose an icon.").max(8, "Choose one short icon."),
    iconType: z.enum(["emoji", "image"]).optional(),
    imageData: categoryImageDataSchema.nullable().optional(),
    keywords: z.array(z.string().trim().min(1).max(30)).max(10, "Use no more than 10 keywords."),
    mainCategoryId: z.string().default("other"),
    budgetGroup: categoryGroupSchema.nullable(),
    archived: z.boolean(),
    createdAt: z.string().datetime(),
}).refine(category => category.type !== "income" || category.budgetGroup === null, {
    path: ["budgetGroup"], message: "Income-only categories do not use a spending classification.",
}).refine(category => mainCategories.some(main => main.id === category.mainCategoryId && (main.type === category.type || main.type === "both" || category.type === "both")), {
    path: ["mainCategoryId"], message: "Choose a main category compatible with this category type.",
}).refine(category => category.iconType !== "image" || Boolean(category.imageData), {
    path: ["imageData"], message: "Upload an image or switch back to an emoji icon.",
});

export const validateCustomCategory = data => customCategorySchema.safeParse(data);
export const createCustomCategoryId = (createUuid = () => crypto.randomUUID()) => `custom-${createUuid()}`;

export const parseStoredCustomCategories = json => {
    if (!json) return [];
    try {
        const raw = JSON.parse(json);
        if (!Array.isArray(raw)) return [];
        const categories = [];
        const ids = new Set();
        // Existing custom names remain valid when a later app release adds a built-in
        // subcategory with the same name. New duplicates are prevented by the editor.
        const names = new Set();
        for (const item of raw) {
            const result = customCategorySchema.safeParse(item);
            if (!result.success) continue;
            const name = result.data.name.toLocaleLowerCase();
            if (ids.has(result.data.id) || names.has(name)) continue;
            ids.add(result.data.id); names.add(name); categories.push(result.data);
        }
        return categories;
    } catch {
        return [];
    }
};

export const getCustomCategoryErrors = error => Object.fromEntries(error.issues.map(issue => [issue.path[0], issue.message]));

export const deleteCustomCategoryRecord = (categories, id, { confirmed = false, referenceCount = 0 } = {}) => {
    if (!confirmed || referenceCount > 0) return { deleted: false, categories };
    const next = categories.filter(category => category.id !== id);
    return { deleted: next.length !== categories.length, categories: next };
};
