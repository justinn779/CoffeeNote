import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';
import { GROUPS } from './config.js';
import { requireIdentity } from './identity.js';

const identity = requireIdentity();
if (identity) {
  document.getElementById('identity-label').textContent = `第 ${identity.group} 組・${identity.name}`;
}

const listArea = document.getElementById('list-area');
const beanFilter = document.getElementById('filter-bean');
const groupFilter = document.getElementById('filter-group');
const mineFilter = document.getElementById('filter-mine');

GROUPS.forEach((g) => {
  const opt = document.createElement('option');
  opt.value = g;
  opt.textContent = `第 ${g} 組`;
  groupFilter.appendChild(opt);
});

let allRecords = [];

async function loadRecords() {
  try {
    const q = query(collection(db, 'records'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    allRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    populateBeanOptions();
    render();
  } catch (err) {
    console.error(err);
    listArea.innerHTML = '<p class="empty-state">載入失敗，請確認網路連線後重新整理頁面</p>';
  }
}

function populateBeanOptions() {
  const beans = [...new Set(allRecords.map((r) => r.beanName).filter(Boolean))].sort();
  beanFilter.innerHTML = '<option value="">全部豆子</option>';
  beans.forEach((b) => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    beanFilter.appendChild(opt);
  });
}

function badge(state, passText, failText) {
  if (state === undefined || state === null) return `<span class="badge neutral">-</span>`;
  return `<span class="badge ${state ? 'pass' : 'fail'}">${state ? passText : failText}</span>`;
}

function formatTime(ts) {
  if (!ts || !ts.toDate) return '';
  return ts.toDate().toLocaleString('zh-TW', { hour12: false });
}

function render() {
  const beanValue = beanFilter.value;
  const groupValue = groupFilter.value;
  const onlyMine = mineFilter.checked;

  const filtered = allRecords.filter((r) => {
    if (beanValue && r.beanName !== beanValue) return false;
    if (groupValue && r.group !== groupValue) return false;
    if (onlyMine && identity && !(r.group === identity.group && r.name === identity.name)) return false;
    return true;
  });

  if (filtered.length === 0) {
    listArea.innerHTML = '<p class="empty-state">沒有符合條件的紀錄</p>';
    return;
  }

  listArea.innerHTML = filtered
    .map((r) => {
      const detailRows = [
        ['豆子', r.beanName],
        ['產地', r.beanOrigin],
        ['烘焙度', r.roastLevel],
        ['水溫', r.waterTemp != null ? `${r.waterTemp} °C` : ''],
        ['粉重', r.doseWeight != null ? `${r.doseWeight} g` : ''],
        ['注水量', r.waterWeight != null ? `${r.waterWeight} g` : ''],
        ['研磨刻度', r.grindSize],
        ['沖煮時間', r.brewTime],
        ['備註', r.notes],
      ].filter(([, v]) => v);

      return `
        <details class="card record-card">
          <summary>
            <div class="record-head-main">
              <span class="who">第 ${escapeHtml(r.group)} 組・${escapeHtml(r.name)}</span>
              ${r.beanName ? `<span class="bean">${escapeHtml(r.beanName)}</span>` : ''}
              <span class="meta">${formatTime(r.createdAt)}</span>
            </div>
            <div class="record-metrics">
              <span>${r.concentration}%</span>
              <span>${r.liquidWeight}g</span>
              ${badge(r.passOverall, '✅ 過關', '❌ 未過關')}
            </div>
          </summary>
          <div class="record-detail">
            <div>濃度判定：${badge(r.passConcentration, '過關', '未過關')}　液體量判定：${badge(r.passLiquid, '過關', '未過關')}</div>
            ${detailRows.map(([k, v]) => `<div><strong>${k}：</strong>${escapeHtml(String(v))}</div>`).join('')}
          </div>
        </details>
      `;
    })
    .join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

beanFilter.addEventListener('change', render);
groupFilter.addEventListener('change', render);
mineFilter.addEventListener('change', render);

loadRecords();
