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
