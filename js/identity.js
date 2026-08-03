const STORAGE_KEY = 'coffeenote_identity';

export function getIdentity() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.group || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setIdentity(group, name) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ group, name }));
}

export function clearIdentity() {
  localStorage.removeItem(STORAGE_KEY);
}

// 頁面守門：沒有身份就導回選組別頁，回傳 null 讓呼叫端提早 return
export function requireIdentity() {
  const identity = getIdentity();
  if (!identity) {
    window.location.href = 'index.html';
    return null;
  }
  return identity;
}
