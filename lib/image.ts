export type CompressedImageResult = {
  blob: Blob;
  contentType: string;
  extension: string;
  width: number;
  height: number;
};

function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败"));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("图片编码失败"));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

function getExtensionFromMime(mime: string) {
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "bin";
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export async function compressImageToMaxBytes(
  file: File,
  options?: {
    maxBytes?: number;
    maxWidth?: number;
    maxHeight?: number;
    preferredType?: "image/webp" | "image/jpeg";
  }
): Promise<CompressedImageResult> {
  const maxBytes = options?.maxBytes ?? 300 * 1024;
  const maxWidth = options?.maxWidth ?? 1920;
  const maxHeight = options?.maxHeight ?? 1920;
  const preferredType = options?.preferredType ?? "image/webp";

  const img = await createImageFromFile(file);

  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;
  if (!originalWidth || !originalHeight) {
    throw new Error("图片尺寸读取失败");
  }

  let width = originalWidth;
  let height = originalHeight;

  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 初始化失败");

  const type = preferredType;

  const tryEncode = async (w: number, h: number, mime: string) => {
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    for (let q = 0.92; q >= 0.5; q -= 0.07) {
      const quality = clamp(q, 0.5, 0.92);
      const blob = await canvasToBlob(canvas, mime, quality);

      if (blob.size <= maxBytes) return blob;
    }

    return null;
  };

  const sizeReduceAttempts = 6;
  for (let i = 0; i <= sizeReduceAttempts; i++) {
    const attemptWidth = Math.max(1, Math.round(width * Math.pow(0.9, i)));
    const attemptHeight = Math.max(1, Math.round(height * Math.pow(0.9, i)));

    const blob = await tryEncode(attemptWidth, attemptHeight, type);
    if (blob) {
      return {
        blob,
        contentType: type,
        extension: getExtensionFromMime(type),
        width: attemptWidth,
        height: attemptHeight,
      };
    }

    if (type !== "image/jpeg") {
      const jpegBlob = await tryEncode(attemptWidth, attemptHeight, "image/jpeg");
      if (jpegBlob) {
        return {
          blob: jpegBlob,
          contentType: "image/jpeg",
          extension: "jpg",
          width: attemptWidth,
          height: attemptHeight,
        };
      }
    }
  }

  throw new Error("压缩后仍超过限制，请裁剪后再试");
}
