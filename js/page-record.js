import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase-init.js';
import { THRESHOLDS, evaluatePass, DOSE_OPTIONS, FIELD_DEFAULTS, computeWaterWeight, computeLiquidWeight } from './config.js';
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

const waterTempInput = document.getElementById('water-temp');
const doseSelect = document.getElementById('dose-weight');
const waterWeightInput = document.getElementById('water-weight');
const brewMinutesInput = document.getElementById('brew-minutes');
const brewSecondsInput = document.getElementById('brew-seconds');
const grindSizeInput = document.getElementById('grind-size');
const beanSelect = document.getElementById('bean-select');

function pad2(n) {
  return String(n).padStart(2, '0');
}

document.getElementById('concentration-hint').textContent =
  `合格範圍：${THRESHOLDS.concentration.min}% ~ ${THRESHOLDS.concentration.max}%`;
document.getElementById('liquid-hint').textContent =
  `合格範圍：${THRESHOLDS.liquidWeight.min}g ~ ${THRESHOLDS.liquidWeight.max}g`;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- 預設值 ----
doseSelect.innerHTML = DOSE_OPTIONS.map((g) => `<option value="${g}">${g}</option>`).join('');
doseSelect.value = String(FIELD_DEFAULTS.doseWeight);
waterTempInput.value = FIELD_DEFAULTS.waterTemp.toFixed(1);
grindSizeInput.value = FIELD_DEFAULTS.grindSize.toFixed(1);
concentrationInput.value = FIELD_DEFAULTS.concentration.toFixed(2);
brewMinutesInput.value = FIELD_DEFAULTS.brewMinutes;
brewSecondsInput.value = FIELD_DEFAULTS.brewSeconds;
applyDoseDefaults();

function applyDoseDefaults() {
  const dose = parseFloat(doseSelect.value);
  waterWeightInput.value = computeWaterWeight(dose);
  liquidInput.value = computeLiquidWeight(dose);
  liquidInput.dispatchEvent(new Event('input', { bubbles: true }));
}

doseSelect.addEventListener('change', applyDoseDefaults);

// ---- 數字加減按鈕 ----
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.stepper-btn');
  if (!btn) return;

  const wrapper = btn.closest('.stepper');
  const input = wrapper.querySelector('.stepper-input');
  const decimals = parseInt(wrapper.dataset.decimals || '0', 10);
  const delta = parseFloat(btn.dataset.delta);

  let value = parseFloat(input.value);
  if (Number.isNaN(value)) value = 0;
  value += delta;

  const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
  const max = input.max !== '' ? parseFloat(input.max) : Infinity;
  value = Math.min(max, Math.max(min, value));

  input.value = value.toFixed(decimals);
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

// ---- 咖啡豆下拉選單 ----
let beansCache = [];

async function loadBeans() {
  try {
    const snap = await getDocs(query(collection(db, 'beans'), orderBy('name')));
    beansCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    beanSelect.innerHTML =
      '<option value="">尚未選擇</option>' +
      beansCache.map((b) => `<option value="${escapeHtml(b.name)}">${escapeHtml(b.name)}</option>`).join('');
  } catch (err) {
    console.error(err);
  }
}

loadBeans();

// ---- 濃度 / 液體量過關判定 ----
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
refreshBadges();

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

  const selectedBeanName = beanSelect.value;
  const selectedBean = beansCache.find((b) => b.name === selectedBeanName);

  const record = {
    group: identity.group,
    name: identity.name,
    beanName: selectedBeanName,
    beanOrigin: selectedBean ? selectedBean.origin || '' : '',
    roastLevel: selectedBean ? selectedBean.roastLevel || '' : '',
    waterTemp: parseFloatOrNull(waterTempInput.value),
    doseWeight: parseFloatOrNull(doseSelect.value),
    waterWeight: parseFloatOrNull(waterWeightInput.value),
    brewTime: `${pad2(brewMinutesInput.value)}:${pad2(brewSecondsInput.value)}`,
    grindSize: parseFloatOrNull(grindSizeInput.value),
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
    doseSelect.value = String(FIELD_DEFAULTS.doseWeight);
    waterTempInput.value = FIELD_DEFAULTS.waterTemp.toFixed(1);
    grindSizeInput.value = FIELD_DEFAULTS.grindSize.toFixed(1);
    concentrationInput.value = FIELD_DEFAULTS.concentration.toFixed(2);
    brewMinutesInput.value = FIELD_DEFAULTS.brewMinutes;
    brewSecondsInput.value = FIELD_DEFAULTS.brewSeconds;
    applyDoseDefaults();
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
