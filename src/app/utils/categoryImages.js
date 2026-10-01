import { MAX_CATEGORY_IMAGE_DATA_URL_LENGTH, getCategoryImageFileError } from "./customCategorySchema.js";

export const CATEGORY_ICON_PIXELS = 128;

export const resizeCategoryImage = file => new Promise((resolve, reject) => {
    const fileError = getCategoryImageFileError(file);
    if (fileError) {
        reject(new Error(fileError));
        return;
    }
    const source = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = CATEGORY_ICON_PIXELS;
            canvas.height = CATEGORY_ICON_PIXELS;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Image processing is unavailable.");
            const side = Math.min(image.naturalWidth, image.naturalHeight);
            const sourceX = (image.naturalWidth - side) / 2;
            const sourceY = (image.naturalHeight - side) / 2;
            context.drawImage(image, sourceX, sourceY, side, side, 0, 0, CATEGORY_ICON_PIXELS, CATEGORY_ICON_PIXELS);
            const dataUrl = canvas.toDataURL("image/webp", 0.82);
            if (dataUrl.length > MAX_CATEGORY_IMAGE_DATA_URL_LENGTH) throw new Error("The resized image is still too large. Choose a simpler image.");
            resolve(dataUrl);
        } catch (error) {
            reject(error);
        } finally {
            URL.revokeObjectURL(source);
        }
    };
    image.onerror = () => {
        URL.revokeObjectURL(source);
        reject(new Error("The selected image could not be read."));
    };
    image.src = source;
});
