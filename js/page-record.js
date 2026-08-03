import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';
import { THRESHOLDS, evaluatePass } from './config.js';
import { requireIdentity } from './identity.js';

const identity = requireIdentity();
if (identity) {
  document.getElementById('identity-label').textContent = `第 ${identity.group} 組・${identity.name}`;
}

const concentrationInput = document.getElementById('concentration-input');
const liquidInput = document.getElementById('liquid-input');
const concentrationBadge = document.getElementById('concentration-badge');
const liquidBadge = document.getElementById('liquid-badge');
const overallBadge = document.getElementById('overall-badge');
const msgArea = document.getElementById('msg-area');
const form = document.getElementById('record-form');
const submitBtn = document.getElementById('submit-btn');

document.getElementById('concentration-hint').textContent =
  `合格範圍：${THRESHOLDS.concentration.min}% ~ ${THRESHOLDS.concentration.max}%`;
document.getElementById('liquid-hint').textContent =
  `合格範圍：${THRESHOLDS.liquidWeight.min}g ~ ${THRESHOLDS.liquidWeight.max}g`;

function setBadge(el, state, passText, failText) {
  if (state === null) {
    el.textContent = '尚未輸入';
    el.className = 'badge neutral';
    return;
  }
  el.textContent = state ? passText : failText;
  el.className = state ? 'badge pass' : 'badge fail';
}

function refreshBadges() {
  const concentration = concentrationInput.value === '' ? null : parseFloat(concentrationInput.value);
  const liquidWeight = liquidInput.value === '' ? null : parseFloat(liquidInput.value);

  if (concentration === null) {
    setBadge(concentrationBadge, null);
  } else {
    const passConcentration =
      concentration >= THRESHOLDS.concentration.min && concentration <= THRESHOLDS.concentration.max;
    setBadge(concentrationBadge, passConcentration, '過關', '未過關');
  }

  if (liquidWeight === null) {
    setBadge(liquidBadge, null);
  } else {
    const passLiquid =
      liquidWeight >= THRESHOLDS.liquidWeight.min && liquidWeight <= THRESHOLDS.liquidWeight.max;
    setBadge(liquidBadge, passLiquid, '過關', '未過關');
  }

  if (concentration === null || liquidWeight === null) {
    overallBadge.textContent = '—';
    overallBadge.className = 'badge neutral';
  } else {
    const { passOverall } = evaluatePass(concentration, liquidWeight);
    overallBadge.textContent = passOverall ? '✅ 過關' : '❌ 未過關';
    overallBadge.className = passOverall ? 'badge pass' : 'badge fail';
  }
}

concentrationInput.addEventListener('input', refreshBadges);
liquidInput.addEventListener('input', refreshBadges);

function showMsg(text, type) {
  msgArea.innerHTML = `<div class="msg ${type}">${text}</div>`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!identity) return;

  const concentration = parseFloat(concentrationInput.value);
  const liquidWeight = parseFloat(liquidInput.value);

  if (Number.isNaN(concentration) || Number.isNaN(liquidWeight)) {
    showMsg('請填寫濃度與液體量', 'error');
    return;
  }

  const { passConcentration, passLiquid, passOverall } = evaluatePass(concentration, liquidWeight);

  const record = {
    group: identity.group,
    name: identity.name,
    beanName: document.getElementById('bean-name').value.trim(),
    beanOrigin: document.getElementById('bean-origin').value.trim(),
    roastLevel: document.getElementById('roast-level').value,
    waterTemp: parseFloatOrNull(document.getElementById('water-temp').value),
    doseWeight: parseFloatOrNull(document.getElementById('dose-weight').value),
    waterWeight: parseFloatOrNull(document.getElementById('water-weight').value),
    brewTime: document.getElementById('brew-time').value.trim(),
    grindSize: document.getElementById('grind-size').value.trim(),
    concentration,
    liquidWeight,
    passConcentration,
    passLiquid,
    passOverall,
    notes: document.getElementById('notes').value.trim(),
    createdAt: serverTimestamp(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = '送出中...';

  try {
    await addDoc(collection(db, 'records'), record);
    showMsg('紀錄已送出！', 'success');
    form.reset();
    refreshBadges();
  } catch (err) {
    console.error(err);
    showMsg('送出失敗，請確認網路連線後再試一次', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '送出紀錄';
  }
});

function parseFloatOrNull(v) {
  if (v === '' || v === undefined || v === null) return null;
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
}
