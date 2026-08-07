import { requireIdentity, clearIdentity } from './identity.js';

const identity = requireIdentity();
if (identity) {
  document.getElementById('identity-label').textContent = `第 ${identity.group} 組・${identity.name}`;
}

document.getElementById('logout-link').addEventListener('click', (e) => {
  e.preventDefault();
  clearIdentity();
  window.location.href = 'index.html';
});

// ---- QR Code：讓其他人掃碼進到首頁（未選過身份的話會先導去選組別/暱稱） ----
const qrBtn = document.getElementById('qr-btn');
const qrModal = document.getElementById('qr-modal');
const qrClose = document.getElementById('qr-close');
const qrImage = document.getElementById('qr-image');
const qrUrlText = document.getElementById('qr-url');

function closeQrModal() {
  qrModal.hidden = true;
}

qrBtn.addEventListener('click', () => {
  const url = `${window.location.origin}/dashboard.html`;
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;
  qrUrlText.textContent = url;
  qrModal.hidden = false;
});

qrClose.addEventListener('click', closeQrModal);
qrModal.addEventListener('click', (e) => {
  if (e.target === qrModal) closeQrModal();
});
