"use client";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET, mediaUrl } from "@/lib/media";

export type MediaItem = {
  id: string; kind: "image" | "video"; storage_path: string; name: string; alt: string;
  mime_type: string; size_bytes: number; width: number | null; height: number | null; created_at: string; url: string;
};

const MAX_IMAGE_SIDE = 2000;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

/** Redimensionne et convertit en WebP pour des pages rapides, même en 3G. */
async function optimizeImage(file: File): Promise<{ blob: Blob; width: number; height: number; type: string }> {
  if (file.type === "image/gif") {
    const bmp = await createImageBitmap(file);
    return { blob: file, width: bmp.width, height: bmp.height, type: file.type };
  }
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.82));
  if (!blob || (blob.size > file.size && scale === 1 && file.type !== "image/heic")) return { blob: file, width: bmp.width, height: bmp.height, type: file.type };
  return { blob, width: w, height: h, type: "image/webp" };
}

function videoSize(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { resolve({ width: v.videoWidth || null, height: v.videoHeight || null }); URL.revokeObjectURL(v.src); };
    v.onerror = () => resolve({ width: null, height: null });
    v.src = URL.createObjectURL(file);
  });
}

export async function uploadMedia(files: File[], onProgress?: (done: number, total: number) => void): Promise<{ items: MediaItem[]; errors: string[] }> {
  const supabase = createClient();
  const items: MediaItem[] = [];
  const errors: string[] = [];
  let done = 0;
  for (const file of files) {
    try {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) throw new Error("format non pris en charge");
      if (isVideo && file.size > MAX_VIDEO_BYTES) throw new Error("vidéo trop lourde (200 Mo max)");
      let blob: Blob = file, type = file.type, width: number | null = null, height: number | null = null;
      if (isImage) ({ blob, width, height, type } = await optimizeImage(file));
      else ({ width, height } = await videoSize(file));
      const ext = type === "image/webp" ? "webp" : (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const d = new Date();
      const path = `${isVideo ? "videos" : "images"}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: type, cacheControl: "31536000", upsert: false });
      if (upErr) throw new Error(upErr.message);
      const name = file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "média";
      const { data, error } = await supabase.from("media").insert({
        kind: isVideo ? "video" : "image", storage_path: path, name, alt: "", mime_type: type, size_bytes: blob.size, width, height,
      }).select("*").single();
      if (error) {
        await supabase.storage.from(MEDIA_BUCKET).remove([path]);
        throw new Error(error.message);
      }
      items.push({ ...(data as Omit<MediaItem, "url">), url: mediaUrl(path)! });
    } catch (e) {
      errors.push(`${file.name} : ${e instanceof Error ? e.message : "échec de l'envoi"}`);
    }
    onProgress?.(++done, files.length);
  }
  return { items, errors };
}
