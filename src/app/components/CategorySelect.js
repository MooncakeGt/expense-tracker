import { useEffect, useId, useRef, useState } from "react";
import { getCategoryForTag, getMainCategoriesForType, searchCategories } from "../utils/tags";
import CategoryLabel, { useCategoryOverrides } from "./categories/CategoryIcon";

export default function CategorySelect({ id, value, onChange, type, extraTags = [], customCategories = [], onCreateCategory, placeholder = "Select Category", disabled = false, columns = false }) {
    const categoryOverrides = useCategoryOverrides();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [highlight, setHighlight] = useState(0);
    const [placement, setPlacement] = useState("below");
    const [selectedMainCategoryId, setSelectedMainCategoryId] = useState("");
    const rootRef = useRef(null);
    const inputRef = useRef(null);
    const buttonRef = useRef(null);
    const optionRefs = useRef([]);
    const listId = useId();
    const mainOptions = getMainCategoriesForType(type);
    const valueCategory = value ? getCategoryForTag(value, customCategories, categoryOverrides) : null;
    const valueMainCategoryId = valueCategory?.mainCategoryId || (value ? "other" : "");
    const mainCategoryId = valueMainCategoryId || (mainOptions.some(main => main.id === selectedMainCategoryId) ? selectedMainCategoryId : "");
    const results = searchCategories(query, type, extraTags, customCategories, value ? [value] : [], mainCategoryId, categoryOverrides);

    useEffect(() => {
        if (!open) return;
        inputRef.current?.focus();
        const closeOutside = event => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener("pointerdown", closeOutside);
        document.addEventListener("focusin", closeOutside);
        return () => {
            document.removeEventListener("pointerdown", closeOutside);
            document.removeEventListener("focusin", closeOutside);
        };
    }, [open]);

    useEffect(() => {
        if (open) optionRefs.current[highlight]?.scrollIntoView({ block: "nearest" });
    }, [highlight, open]);

    const openList = () => {
        if (disabled) return;
        const bounds = buttonRef.current?.getBoundingClientRect();
        if (bounds) {
            const spaceBelow = window.innerHeight - bounds.bottom;
            setPlacement(spaceBelow < Math.min(360, window.innerHeight * .5) && bounds.top > spaceBelow ? "above" : "below");
        }
        setQuery("");
        setHighlight(0);
        setOpen(true);
    };

    const choose = category => {
        onChange(category.id);
        setOpen(false);
        buttonRef.current?.focus();
    };

    const onSearchKeyDown = event => {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            buttonRef.current?.focus();
        } else if (event.key === "ArrowDown" && results.length) {
            event.preventDefault();
            setHighlight(index => (index + 1) % results.length);
        } else if (event.key === "ArrowUp" && results.length) {
            event.preventDefault();
            setHighlight(index => (index - 1 + results.length) % results.length);
        } else if (event.key === "Enter") {
            event.preventDefault();
            if (results[highlight]) choose(results[highlight]);
        }
    };

    return (
        <div className={`category-select${open ? " category-select-open" : ""}`} ref={rootRef}>
            <div className={columns ? "row g-3" : undefined}>
                <div className={columns ? "col-12 col-md-6" : "mb-2"}>
                    <label className={`form-label${columns ? "" : " small"}`} htmlFor={`${id}-main`}>Main Category</label>
                    <select id={`${id}-main`} className="form-select" value={mainCategoryId} disabled={disabled} onChange={event => {
                        const next = event.target.value;
                        setSelectedMainCategoryId(next);
                        const selected = getCategoryForTag(value, customCategories, categoryOverrides);
                        if (selected && selected.mainCategoryId !== next) onChange("");
                        setOpen(false);
                    }}>
                        <option value="">Select Main Category</option>
                        {mainOptions.map(main => <option key={main.id} value={main.id}>{main.icon} {main.name}</option>)}
                    </select>
                </div>
                <div className={`${columns ? "col-12 col-md-6 " : ""}category-select-subcategory`}>
                    <label className={`form-label${columns ? "" : " small"}`} htmlFor={id}>Subcategory</label>
                    <button id={id} ref={buttonRef} type="button" className="form-select text-start category-select-button"
                        aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
                        disabled={disabled || !mainCategoryId}
                        onClick={() => open ? setOpen(false) : openList()}
                        onKeyDown={event => {
                            if (!open && event.key === "ArrowDown") {
                                event.preventDefault();
                                openList();
                            }
                        }}>
                        {value ? <CategoryLabel tag={value} customCategories={customCategories} /> : placeholder}
                    </button>
                    {open && (
                        <div className={`category-select-popup category-select-popup-${placement} border shadow bg-body p-2`}>
                            <input ref={inputRef} type="search" className="form-control mb-2" placeholder="Search categories..."
                                role="combobox" aria-label="Search categories" aria-expanded="true"
                                aria-controls={listId}
                                aria-activedescendant={results[highlight] ? `${listId}-${results[highlight].id}` : undefined}
                                value={query} onChange={event => { setQuery(event.target.value); setHighlight(0); }}
                                onKeyDown={onSearchKeyDown} />
                            <div id={listId} role="listbox" aria-label="Categories" className="category-select-results">
                                {results.length ? results.map((category, index) => (
                                    <div key={category.id} id={`${listId}-${category.id}`} role="option"
                                        ref={element => { optionRefs.current[index] = element; }}
                                        aria-selected={index === highlight} className={`category-select-option rounded px-3 py-2${index === highlight ? " bg-primary-subtle" : ""}`}
                                        onMouseEnter={() => setHighlight(index)} onClick={() => choose(category)}>
                                        <CategoryLabel category={category} />
                                    </div>
                                )) : <p className="text-muted mb-0 px-2 py-2">No categories found.</p>}
                                {query.trim() && onCreateCategory && !results.some(category => category.name.toLowerCase() === query.trim().toLowerCase()) && <button type="button" className="btn btn-link text-start w-100" onClick={() => onCreateCategory(query.trim(), type, mainCategoryId, categoryId => { onChange(categoryId); setOpen(false); })}>+ Create &quot;{query.trim()}&quot;</button>}
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </div>
    );
}
