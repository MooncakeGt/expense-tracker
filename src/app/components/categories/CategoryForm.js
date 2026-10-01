import { useState } from "react";
import { createCustomCategoryId, getCustomCategoryErrors, validateCustomCategory } from "../../utils/customCategorySchema";
import { getAllCategories, getMainCategoriesForType, mainCategories } from "../../utils/tags";
import CategoryImagePicker from "./CategoryImagePicker";
import { useCategoryOverrides } from "./CategoryIcon";

const icons = ["📦", "🎮", "🎨", "📷", "🎵", "🏡", "🚲", "🍽️", "💼", "💰", "❤️", "⭐"];
export default function CategoryForm({ initial, initialName = "", initialType = "expense", initialMainCategoryId = "", customCategories, typeLocked = false, onSave, onCancel }) {
    const categoryOverrides = useCategoryOverrides();
    const [draft, setDraft] = useState(initial ? { ...initial, iconType: initial.iconType || (initial.imageData ? "image" : "emoji"), imageData: initial.imageData || null, keywords: initial.keywords.join(", ") } : {
        name: initialName, type: initialType, icon: "📦", iconType: "emoji", imageData: null, keywords: "", mainCategoryId: initialMainCategoryId || (initialType === "income" ? "income" : "other"), budgetGroup: initialType === "income" ? null : "unassigned",
    });
    const [errors, setErrors] = useState({});
    const change = (field, value) => { setDraft(current => ({ ...current, [field]: value })); setErrors(current => ({ ...current, [field]: undefined })); };
    const submit = event => {
        event.preventDefault();
        const nameKey = draft.name.trim().toLocaleLowerCase();
        const duplicate = getAllCategories(customCategories, categoryOverrides).some(category => category.id !== initial?.id && category.name.trim().toLocaleLowerCase() === nameKey)
            || mainCategories.some(category => category.name.toLocaleLowerCase() === nameKey);
        const data = { ...draft, id: initial?.id || createCustomCategoryId(), name: draft.name,
            keywords: draft.keywords.split(",").map(value => value.trim().toLowerCase()).filter(Boolean),
            budgetGroup: draft.type === "income" ? null : draft.budgetGroup || "unassigned",
            archived: initial?.archived ?? false, createdAt: initial?.createdAt || new Date().toISOString() };
        const result = validateCustomCategory(data);
        const nextErrors = result.success ? {} : getCustomCategoryErrors(result.error);
        if (duplicate) nextErrors.name = "A built-in or custom category already uses this name.";
        if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
        onSave(result.data);
    };
    return <form onSubmit={submit} noValidate>
        <div className="row g-3"><div className="col-12 col-sm-8"><label className="form-label" htmlFor="custom-category-name">Name</label><input autoFocus id="custom-category-name" className="form-control" maxLength="60" value={draft.name} onChange={event => change("name", event.target.value)} aria-invalid={Boolean(errors.name)} />{errors.name && <div className="text-danger small" role="alert">{errors.name}</div>}</div><div className="col-12 col-sm-4"><label className="form-label" htmlFor="custom-category-type">Type</label><select id="custom-category-type" className="form-select" value={draft.type} disabled={typeLocked} onChange={event => { const type = event.target.value; const options = getMainCategoriesForType(type); setDraft(current => ({ ...current, type, mainCategoryId: options.some(main => main.id === current.mainCategoryId) ? current.mainCategoryId : options[0]?.id || "other", budgetGroup: type === "income" ? null : current.budgetGroup || "unassigned" })); }}><option value="expense">Expense</option><option value="income">Income</option><option value="both">Both</option></select>{typeLocked && <div className="form-text">Type is locked because this category is in use.</div>}</div>
            <div className="col-12 col-sm-6"><label className="form-label" htmlFor="custom-category-main">Main Category</label><select id="custom-category-main" className="form-select" value={draft.mainCategoryId || "other"} onChange={event => change("mainCategoryId", event.target.value)}>{getMainCategoriesForType(draft.type).map(main => <option key={main.id} value={main.id}>{main.icon} {main.name}</option>)}</select>{errors.mainCategoryId && <div className="text-danger small" role="alert">{errors.mainCategoryId}</div>}</div>
            <div className="col-12"><fieldset><legend className="form-label">Category Icon</legend><div className="btn-group mb-3" role="group" aria-label="Category icon type"><button type="button" className={`btn btn-outline-primary${draft.iconType === "emoji" ? " active" : ""}`} aria-pressed={draft.iconType === "emoji"} onClick={() => setDraft(current => ({ ...current, iconType: "emoji", imageData: null }))}>Emoji</button><button type="button" className={`btn btn-outline-primary${draft.iconType === "image" ? " active" : ""}`} aria-pressed={draft.iconType === "image"} onClick={() => setDraft(current => ({ ...current, iconType: "image" }))}>Image</button></div>
                {draft.iconType === "emoji" ? <div className="d-flex flex-wrap gap-2">{icons.map(icon => <button key={icon} type="button" className={`btn ${draft.icon === icon ? "btn-primary" : "btn-outline-secondary"}`} aria-label={`Use ${icon} icon`} aria-pressed={draft.icon === icon} onClick={() => change("icon", icon)}>{icon}</button>)}</div> : <CategoryImagePicker id="custom-category-image" imageData={draft.imageData} fallbackIcon={draft.icon} validationError={errors.imageData} onChange={imageData => { setErrors(current => ({ ...current, imageData: undefined })); setDraft(current => ({ ...current, iconType: imageData ? "image" : "emoji", imageData })); }} />}
                {errors.icon && <div className="text-danger small" role="alert">{errors.icon}</div>}</fieldset></div>
            {draft.type !== "income" && <div className="col-12 col-sm-6"><label className="form-label" htmlFor="custom-category-group">50/30/20 Classification</label><select id="custom-category-group" className="form-select" value={draft.budgetGroup || "unassigned"} onChange={event => change("budgetGroup", event.target.value)}><option value="needs">Needs</option><option value="wants">Wants</option><option value="savings">Savings</option><option value="unassigned">Unassigned</option></select></div>}
            <div className="col-12"><label className="form-label" htmlFor="custom-category-keywords">Keywords <span className="text-muted">(optional, comma separated)</span></label><input id="custom-category-keywords" className="form-control" value={draft.keywords} onChange={event => change("keywords", event.target.value)} placeholder="console, steam, games" />{errors.keywords && <div className="text-danger small" role="alert">{errors.keywords}</div>}</div>
        </div><div className="d-flex gap-2 mt-3"><button className="btn btn-primary" type="submit">Save Category</button><button className="btn btn-secondary" type="button" onClick={onCancel}>Cancel</button></div>
    </form>;
}
