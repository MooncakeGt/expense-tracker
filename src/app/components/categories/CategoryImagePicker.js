import { useState } from "react";
import { resizeCategoryImage } from "../../utils/categoryImages";
import { CategoryIcon } from "./CategoryIcon";

export default function CategoryImagePicker({ id, imageData, fallbackIcon, onChange, validationError, removeLabel = "Remove Image" }) {
    const [processing, setProcessing] = useState(false);
    const [fileError, setFileError] = useState("");

    const upload = async event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setProcessing(true);
        setFileError("");
        try {
            onChange(await resizeCategoryImage(file));
        } catch (error) {
            setFileError(error.message || "The image could not be processed.");
        } finally {
            setProcessing(false);
        }
    };

    return <div className="d-flex flex-wrap align-items-center gap-3">
        <div className="category-icon-preview border rounded-circle d-flex align-items-center justify-content-center bg-body-tertiary">
            <CategoryIcon category={imageData ? { iconType: "image", imageData, icon: fallbackIcon } : { icon: fallbackIcon }} size={64} />
        </div>
        <div>
            <label className="btn btn-outline-primary mb-2" htmlFor={id}>{imageData ? "Replace Image" : "Upload Image"}</label>
            <input id={id} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={processing} />
            {imageData && <button type="button" className="btn btn-outline-danger ms-2 mb-2" onClick={() => { setFileError(""); onChange(null); }}>{removeLabel}</button>}
            <div className="form-text">PNG, JPEG, or WebP. Images are cropped and resized to 128 × 128 pixels.</div>
            {processing && <div className="small text-muted" role="status">Processing image…</div>}
            {(fileError || validationError) && <div className="text-danger small" role="alert">{fileError || validationError}</div>}
        </div>
    </div>;
}
