"use client";

import Image from "next/image";
import { createContext, useContext, useState } from "react";
import { getCategoryForTag, getCategoryName, getMainCategoryById } from "../../utils/tags";
import { resolveBuiltInCategory, resolveCategoryIconSource } from "../../utils/categoryIconOverrides";

const CategoryIconOverridesContext = createContext({});
export const useCategoryOverrides = () => useContext(CategoryIconOverridesContext);

export function CategoryIconOverridesProvider({ overrides, children }) {
    return <CategoryIconOverridesContext.Provider value={overrides}>{children}</CategoryIconOverridesContext.Provider>;
}

export function CategoryIcon({ tag, category, customCategories = [], size = 24 }) {
    const resolved = category || getCategoryForTag(tag, customCategories);
    const overrides = useCategoryOverrides();
    const source = resolveCategoryIconSource(resolved, overrides);
    const [failedImage, setFailedImage] = useState(null);
    if (source.iconType === "image" && source.imageData && failedImage !== source.imageData) {
        return <Image src={source.imageData} width={size} height={size} style={{ width: size, height: size }} unoptimized alt="" aria-hidden="true" className="category-icon-image" onError={() => setFailedImage(source.imageData)} />;
    }
    const main = String(tag).startsWith("main:") ? getMainCategoryById(String(tag).slice(5)) : null;
    const icon = source.icon || main?.icon;
    return icon ? <span className="category-icon-emoji" aria-hidden="true">{icon}</span> : null;
}

export default function CategoryLabel({ tag, category, customCategories = [], className = "", size = 24 }) {
    const overrides = useCategoryOverrides();
    const resolvedCategory = resolveBuiltInCategory(category, overrides);
    return <span className={`category-label${className ? ` ${className}` : ""}`}>
        <CategoryIcon tag={tag} category={category} customCategories={customCategories} size={size} />
        <span>{resolvedCategory ? `${resolvedCategory.name}${resolvedCategory.archived ? " (Archived)" : ""}` : getCategoryName(tag, customCategories, overrides)}</span>
    </span>;
}
