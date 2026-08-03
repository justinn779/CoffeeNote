import { GROUPS } from './config.js';
import { setIdentity, getIdentity } from './identity.js';

const grid = document.getElementById('group-grid');
const nameInput = document.getElementById('name-input');
const startBtn = document.getElementById('start-btn');

let selectedGroup = null;

// 已經有身份的話直接帶過去 dashboard，不用重選
const existing = getIdentity();
if (existing) {
  window.location.href = 'dashboard.html';
}

GROUPS.forEach((g) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'group-btn';
  btn.textContent = `第 ${g} 組`;
  btn.addEventListener('click', () => {
    selectedGroup = g;
    [...grid.children].forEach((c) => c.classList.remove('selected'));
    btn.classList.add('selected');
    updateStartState();
  });
  grid.appendChild(btn);
});

function updateStartState() {
  startBtn.disabled = !(selectedGroup && nameInput.value.trim().length > 0);
}

nameInput.addEventListener('input', updateStartState);

startBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!selectedGroup || !name) return;
  setIdentity(selectedGroup, name);
  window.location.href = 'dashboard.html';
});
