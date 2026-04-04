const KB = 1024;
const MB = 1024 * KB;

export const MAX_PROFILE_MEDIA_BYTES = 8 * MB;
export const MAX_PORTFOLIO_ITEMS = 8;

type ImageVariant = "avatar" | "coverImage" | "portfolio";

const IMAGE_PRESETS: Record<
  ImageVariant,
  {
    label: string;
    maxWidth: number;
    maxHeight: number;
    maxBytes: number;
  }
> = {
  avatar: {
    label: "profile photo",
    maxWidth: 512,
    maxHeight: 512,
    maxBytes: 450 * KB,
  },
  coverImage: {
    label: "cover image",
    maxWidth: 1600,
    maxHeight: 900,
    maxBytes: 900 * KB,
  },
  portfolio: {
    label: "portfolio image",
    maxWidth: 1280,
    maxHeight: 1280,
    maxBytes: 700 * KB,
  },
};

const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.52, 0.42];
const SCALE_STEPS = [1, 0.9, 0.8, 0.7, 0.6];

const isDataUrl = (value: string) => value.startsWith("data:");

export const getStoredStringSize = (value?: string | null) => {
  if (!value) {
    return 0;
  }

  if (!isDataUrl(value)) {
    return new Blob([value]).size;
  }

  const base64 = value.split(",")[1] || "";
  const padding = base64.match(/=*$/)?.[0].length ?? 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

export const getProfileMediaSize = (profile: {
  avatar?: string;
  coverImage?: string;
  portfolio?: string[];
}) => {
  const portfolio = Array.isArray(profile.portfolio) ? profile.portfolio : [];

  return (
    getStoredStringSize(profile.avatar) +
    getStoredStringSize(profile.coverImage) +
    portfolio.reduce((total, item) => total + getStoredStringSize(item), 0)
  );
};

export const assertProfileMediaWithinLimit = (profile: {
  avatar?: string;
  coverImage?: string;
  portfolio?: string[];
}) => {
  const portfolio = Array.isArray(profile.portfolio) ? profile.portfolio : [];

  if (portfolio.length > MAX_PORTFOLIO_ITEMS) {
    throw new Error(`You can upload up to ${MAX_PORTFOLIO_ITEMS} portfolio images.`);
  }

  const totalBytes = getProfileMediaSize(profile);
  if (totalBytes > MAX_PROFILE_MEDIA_BYTES) {
    throw new Error(
      "Your profile images are too large to save together. Use fewer portfolio images or smaller files."
    );
  }
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image."));
    };

    image.src = objectUrl;
  });

const canvasToDataUrl = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
) => {
  const encoded = canvas.toDataURL(mimeType, quality);

  if (mimeType === "image/webp" && !encoded.startsWith("data:image/webp")) {
    return canvas.toDataURL("image/jpeg", quality);
  }

  return encoded;
};

export const optimizeProfileImage = async (
  file: File,
  variant: ImageVariant
) => {
  const preset = IMAGE_PRESETS[variant];
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image processing is not available in this browser.");
  }

  const baseScale = Math.min(
    1,
    preset.maxWidth / image.width,
    preset.maxHeight / image.height
  );

  for (const scaleStep of SCALE_STEPS) {
    const width = Math.max(1, Math.round(image.width * baseScale * scaleStep));
    const height = Math.max(1, Math.round(image.height * baseScale * scaleStep));

    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      const dataUrl = canvasToDataUrl(canvas, "image/webp", quality);
      if (getStoredStringSize(dataUrl) <= preset.maxBytes) {
        return dataUrl;
      }
    }
  }

  throw new Error(
    `The selected ${preset.label} is too large. Please choose a smaller image.`
  );
};
