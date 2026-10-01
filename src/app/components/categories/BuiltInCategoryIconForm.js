import { useState } from "react";
import CategoryImagePicker from "./CategoryImagePicker";

export default function BuiltInCategoryIconForm({ category, override, isNameTaken, onSave, onCancel }) {
    const [name, setName] = useState(override?.customName || category.name);
    const [imageData, setImageData] = useState(override?.imageData || null);
    const [error, setError] = useState("");

    const save = event => {
        event.preventDefault();
        const customName = name.trim();
        if (!customName) { setError("Category name is required."); return; }
        if (customName.length > 60) { setError("Category name must be 60 characters or fewer."); return; }
        if (isNameTaken(customName, category.id)) { setError("Another category already uses this name."); return; }
        onSave({
            ...override,
            customName: customName === category.name ? undefined : customName,
            iconType: imageData ? "image" : undefined,
            imageData: imageData || undefined,
        });
    };

    return <form onSubmit={save} noValidate>
        <p className="text-muted">Customize the display name and icon for this preset. Its stable ID, hierarchy, type, keywords, and financial behavior will not change.</p>
        <div className="mb-3">
            <label className="form-label" htmlFor={`built-in-category-name-${category.id}`}>Display Name</label>
            <div className="d-flex flex-column flex-sm-row gap-2">
                <input id={`built-in-category-name-${category.id}`} className="form-control" maxLength="60" value={name} onChange={event => { setName(event.target.value); setError(""); }} aria-invalid={Boolean(error)} />
                <button type="button" className="btn btn-outline-secondary text-nowrap" disabled={name === category.name} onClick={() => { setName(category.name); setError(""); }}>Revert Name</button>
            </div>
            {error && <div className="text-danger small" role="alert">{error}</div>}
            {override?.customName && <div className="form-text">Default name: {category.name}</div>}
        </div>
        <CategoryImagePicker id={`built-in-category-image-${category.id}`} imageData={imageData} fallbackIcon={category.icon} onChange={setImageData} removeLabel="Revert Icon" />
        <div className="d-flex flex-wrap gap-2 mt-3">
            <button type="submit" className="btn btn-primary">Save Changes</button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
    </form>;
}
