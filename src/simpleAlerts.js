import { useEffect } from 'react';

let toastId = 0;

export function showToast(message, type = 'success') {
  const id = ++toastId;
  
  // Znajdź lub stwórz kontener
  let container = document.getElementById('simple-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'simple-toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    document.body.appendChild(container);
  }
  
  // Kolory dla typów
  const colors = {
    success: { bg: '#94c11e', light: 'rgba(148, 193, 30, 0.1)' },
    error: { bg: '#dc3545', light: 'rgba(220, 53, 69, 0.1)' },
    warning: { bg: '#ffc107', light: 'rgba(255, 193, 7, 0.1)' },
    info: { bg: '#667eea', light: 'rgba(102, 126, 234, 0.1)' }
  };
  
  const color = colors[type] || colors.success;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i'
  };
  
  const titles = {
    success: 'Sukces',
    error: 'Błąd',
    warning: 'Uwaga',
    info: 'Informacja'
  };
  
  // Stwórz toast
  const toast = document.createElement('div');
  toast.id = `toast-${id}`;
  toast.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    min-width: 320px;
    max-width: 400px;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
    border-left: 4px solid ${color.bg};
    background: linear-gradient(to right, ${color.light}, white);
  `;
  
  toast.innerHTML = `
    <div style="
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${color.bg};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      flex-shrink: 0;
    ">${icons[type]}</div>
    <div style="flex: 1;">
      <div style="
        font-weight: 700;
        font-size: 14px;
        color: #2d3748;
        margin-bottom: 2px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">${titles[type]}</div>
      <div style="
        font-size: 13px;
        color: #718096;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">${message}</div>
    </div>
    <button style="
      background: none;
      border: none;
      color: #a0aec0;
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      line-height: 1;
      flex-shrink: 0;
    " onclick="this.parentElement.remove()">×</button>
  `;
  
  // Dodaj animację
  const style = document.getElementById('toast-animations');
  if (!style) {
    const s = document.createElement('style');
    s.id = 'toast-animations';
    s.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
  
  container.appendChild(toast);
  
  // Auto usuń po 4s
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export async function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999999;
      animation: fadeIn 0.2s;
    `;
    
    overlay.innerHTML = `
      <div style="
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
      ">
        <div style="font-size: 16px; margin-bottom: 20px; color: #2d3748; text-align: center;">${message}</div>
        <div style="display: flex; gap: 12px;">
          <button class="cancel-btn" style="
            flex: 1;
            padding: 10px;
            border: 2px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Anuluj</button>
          <button class="confirm-btn" style="
            flex: 1;
            padding: 10px;
            border: none;
            background: #667eea;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Potwierdź</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };
    
    overlay.querySelector('.cancel-btn').onclick = () => cleanup(false);
    overlay.querySelector('.confirm-btn').onclick = () => cleanup(true);
    overlay.onclick = (e) => { if (e.target === overlay) cleanup(false); };
  });
}

export async function showPrompt(message, defaultValue = '') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999999;
    `;
    
    overlay.innerHTML = `
      <div style="
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
      ">
        <div style="font-size: 16px; margin-bottom: 16px; color: #2d3748;">${message}</div>
        <input type="text" value="${defaultValue}" style="
          width: 100%;
          padding: 10px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        " />
        <div style="display: flex; gap: 12px;">
          <button class="cancel-btn" style="
            flex: 1;
            padding: 10px;
            border: 2px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Anuluj</button>
          <button class="ok-btn" style="
            flex: 1;
            padding: 10px;
            border: none;
            background: #667eea;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">OK</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const input = overlay.querySelector('input');
    input.focus();
    
    const cleanup = (result) => {
      overlay.remove();
      resolve(result);
    };
    
    overlay.querySelector('.cancel-btn').onclick = () => cleanup(null);
    overlay.querySelector('.ok-btn').onclick = () => cleanup(input.value);
    input.onkeypress = (e) => { if (e.key === 'Enter') cleanup(input.value); };
  });
}

export default { showToast, showConfirm, showPrompt };
