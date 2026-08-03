import { collection, addDoc, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';
import { requireIdentity } from './identity.js';

const identity = requireIdentity();
if (identity) {
  document.getElementById('identity-label').textContent = `第 ${identity.group} 組・${identity.name}`;
}

const nameInput = document.getElementById('bean-name-input');
const originInput = document.getElementById('bean-origin-input');
const roastInput = document.getElementById('bean-roast-input');
const addBtn = document.getElementById('add-bean-btn');
const listEl = document.getElementById('bean-list');
const msgArea = document.getElementById('msg-area');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showMsg(text, type) {
  msgArea.innerHTML = `<div class="msg ${type}">${text}</div>`;
}

async function loadBeans() {
  listEl.innerHTML = '<p class="empty-state">載入中...</p>';
  try {
    const snap = await getDocs(query(collection(db, 'beans'), orderBy('name')));
    const beans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (beans.length === 0) {
      listEl.innerHTML = '<p class="empty-state">還沒有咖啡豆，新增一個吧！</p>';
      return;
    }

    listEl.innerHTML = beans
      .map((b) => {
        const meta = [b.origin, b.roastLevel].filter(Boolean).map(escapeHtml).join(' · ');
        return `
          <div class="card bean-item">
            <div class="bean-item-info">
              <div class="bean-item-name">${escapeHtml(b.name)}</div>
              ${meta ? `<div class="bean-item-meta">${meta}</div>` : ''}
            </div>
            <button type="button" class="bean-delete-btn" data-id="${b.id}">刪除</button>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    console.error(err);
    listEl.innerHTML = '<p class="empty-state">載入失敗，請確認網路連線後重新整理頁面</p>';
  }
}

addBtn.addEventListener('click', async () => {
  const name = nameInput.value.trim();
  if (!name) {
    showMsg('請輸入豆子名稱', 'error');
    return;
  }

  addBtn.disabled = true;
  try {
    await addDoc(collection(db, 'beans'), {
      name,
      origin: originInput.value.trim(),
      roastLevel: roastInput.value,
      createdAt: serverTimestamp(),
    });
    nameInput.value = '';
    originInput.value = '';
    roastInput.value = '';
    msgArea.innerHTML = '';
    await loadBeans();
  } catch (err) {
    console.error(err);
    showMsg('新增失敗，請確認網路連線後再試一次', 'error');
  } finally {
    addBtn.disabled = false;
  }
});

listEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('.bean-delete-btn');
  if (!btn) return;
  if (!confirm('確定要刪除這個咖啡豆嗎？')) return;

  btn.disabled = true;
  try {
    await deleteDoc(doc(db, 'beans', btn.dataset.id));
    await loadBeans();
  } catch (err) {
    console.error(err);
    showMsg('刪除失敗，請確認網路連線後再試一次', 'error');
    btn.disabled = false;
  }
});

loadBeans();
