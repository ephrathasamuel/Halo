/*
 * Images chosen from the provider's phone or computer.
 *
 * For now an upload becomes a resized JPEG data URL stored with the record, so it
 * works without a backend. When Supabase is connected, only uploadImage changes:
 * it uploads the resized blob to a Storage bucket and returns the public URL.
 * Everything else (forms, cards, logos) already treats photos as plain URLs.
 */

/** Largest width/height kept, per kind of image. */
export const IMAGE_SIZES = {
  photo: 1600,
  logo: 512,
  avatar: 320,
};

/**
 * Load an image element from a URL or data URL.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That image could not be read'));
    img.src = src;
  });
}

/**
 * Resize an image file and return a JPEG (or PNG for logos, to keep transparency)
 * data URL. Rejects anything that is not an image.
 * @param {File} file
 * @param {'photo' | 'logo' | 'avatar'} [kind='photo']
 * @returns {Promise<string>}
 */
export async function uploadImage(file, kind = 'photo') {
  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('Choose an image file (JPG, PNG or WebP)');
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const max = IMAGE_SIZES[kind] || IMAGE_SIZES.photo;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return kind === 'logo' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const colourCache = new Map();

/**
 * Main colour of an image, ignoring near-white and near-black pixels so a
 * white studio wall or a black background doesn't win. Returns null if the image
 * can't be read (for example a remote image without CORS headers).
 * @param {string} src
 * @returns {Promise<string|null>} hex colour like "#a3542b"
 */
export async function dominantColor(src) {
  if (!src) return null;
  if (colourCache.has(src)) return colourCache.get(src);
  try {
    const img = await loadImage(src);
    const size = 40;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    // Bucket colours, weight by saturation so a colourful accent beats grey
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 128) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max > 235 || max < 28) continue; // near white or near black
      const saturation = max === 0 ? 0 : (max - min) / max;
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0, w: 0 };
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.n += 1;
      bucket.w += 1 + saturation * 3;
      buckets.set(key, bucket);
    }
    let best = null;
    for (const bucket of buckets.values()) if (!best || bucket.w > best.w) best = bucket;
    const hex = best
      ? `#${[best.r, best.g, best.b].map((v) => Math.round(v / best.n).toString(16).padStart(2, '0')).join('')}`
      : null;
    colourCache.set(src, hex);
    return hex;
  } catch {
    colourCache.set(src, null);
    return null;
  }
}

/**
 * Darken a colour until white text on it is readable (contrast 4.5:1 or more).
 * @param {string} hex
 * @returns {string}
 */
export function readableBackground(hex) {
  const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lum = ([r, g, b]) => {
    const f = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return '#16181d';
  let rgb = parse(hex);
  for (let i = 0; i < 12 && 1.05 / (lum(rgb) + 0.05) < 4.5; i++) {
    rgb = rgb.map((c) => Math.round(c * 0.85));
  }
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
