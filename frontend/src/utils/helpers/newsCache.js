/**
 * Cache tin tức trong localStorage.
 * Lưu theo thời gian thực khi API trả về (generatedAt) để fetch tăng dần (chỉ tin từ lần cuối đến nay).
 */
const CACHE_KEY = 'news_subsidence_cache';

/**
 * @typedef {Object} NewsCache
 * @property {string} fetchedAt - ISO string (thời điểm API trả về)
 * @property {Array} items - Danh sách tin
 */

/**
 * @returns {NewsCache | null}
 */
export function getNewsCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.fetchedAt || !Array.isArray(data?.items)) return null;
    return { fetchedAt: data.fetchedAt, items: data.items };
  } catch {
    return null;
  }
}

/**
 * @param {string} fetchedAt - ISO string
 * @param {Array} items
 */
export function setNewsCache(fetchedAt, items) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt, items }));
  } catch (e) {
    console.warn('newsCache set failed', e);
  }
}

/**
 * Gộp tin mới với tin cũ: tin mới lên trước, loại trùng id (giữ bản mới).
 * @param {Array} newItems
 * @param {Array} cachedItems
 * @returns {Array}
 */
export function mergeNewsItems(newItems, cachedItems) {
  const byId = new Map();
  for (const item of cachedItems) {
    if (item?.id) byId.set(item.id, item);
  }
  for (const item of newItems || []) {
    if (item?.id) byId.set(item.id, item);
  }
  const merged = Array.from(byId.values());
  merged.sort((a, b) => {
    const da = a.publishedAt || '';
    const db = b.publishedAt || '';
    return db.localeCompare(da);
  });
  return merged;
}
