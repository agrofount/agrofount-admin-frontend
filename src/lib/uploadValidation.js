export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const DEFAULT_IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;

const hasAllowedExtension = (fileName = "") =>
  IMAGE_EXTENSIONS.some((extension) =>
    fileName.toLowerCase().endsWith(extension)
  );

export const validateImageFiles = (
  files,
  { min = 1, max = 1, maxSize = DEFAULT_IMAGE_SIZE_LIMIT } = {}
) => {
  const selectedFiles = Array.from(files || []);

  if (selectedFiles.length < min) {
    return `Please select at least ${min} image${min === 1 ? "" : "s"}.`;
  }

  if (selectedFiles.length > max) {
    return `Please select no more than ${max} image${max === 1 ? "" : "s"}.`;
  }

  const invalidFile = selectedFiles.find(
    (file) =>
      !IMAGE_MIME_TYPES.includes(file.type) || !hasAllowedExtension(file.name)
  );

  if (invalidFile) {
    return `${invalidFile.name} is not a supported image. Use JPG, PNG, or WebP.`;
  }

  const oversizedFile = selectedFiles.find((file) => file.size > maxSize);

  if (oversizedFile) {
    return `${oversizedFile.name} is too large. Maximum size is ${Math.round(
      maxSize / 1024 / 1024
    )}MB.`;
  }

  return "";
};
