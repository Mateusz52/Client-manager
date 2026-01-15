// ============================================
// CUSTOM ALERTS - REPLACEMENT FOR window.alert()
// ============================================

let toastContainer = null;

// Tworzy kontener dla toastów jeśli nie istnieje
function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      gap: 16px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

// TOAST NOTIFICATION - Zamiennik dla alert()
export function showToast(message, type = 'info', duration = 4000) {
  const container = getToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.style.pointerEvents = 'auto';
  
  // Ikony dla różnych typów - proste symbole
  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i'
  };
  
  // Tytuły dla różnych typów
  const titles = {
    success: 'Sukces',
    error: 'Błąd',
    warning: 'Uwaga',
    info: 'Informacja'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-body">
      <div class="toast-content">
        <div class="toast-title">${titles[type] || titles.info}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Zamknij">×</button>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Zamknięcie przez kliknięcie X
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });
  
  // Auto-zamknięcie
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }
  
  return toast;
}

function removeToast(toast) {
  toast.style.animation = 'slideOutRight 0.3s ease-out';
  setTimeout(() => {
    toast.remove();
    // Usuń kontener jeśli nie ma już żadnych toastów
    if (toastContainer && toastContainer.children.length === 0) {
      toastContainer.remove();
      toastContainer = null;
    }
  }, 300);
}

// CUSTOM CONFIRM DIALOG - Zamiennik dla confirm()
export function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    const {
      confirmText = 'Potwierdź',
      cancelText = 'Anuluj',
      icon = '❓',
      type = 'confirm'
    } = options;
    
    // Tworzymy overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-confirm-overlay';
    
    overlay.innerHTML = `
      <div class="custom-confirm-box">
        <div class="custom-confirm-icon">${icon}</div>
        <div class="custom-confirm-message">${message}</div>
        <div class="custom-confirm-buttons">
          <button class="custom-confirm-btn custom-confirm-btn-cancel">${cancelText}</button>
          <button class="custom-confirm-btn custom-confirm-btn-confirm">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const cancelBtn = overlay.querySelector('.custom-confirm-btn-cancel');
    const confirmBtn = overlay.querySelector('.custom-confirm-btn-confirm');
    
    function cleanup(result) {
      overlay.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    }
    
    cancelBtn.addEventListener('click', () => cleanup(false));
    confirmBtn.addEventListener('click', () => cleanup(true));
    
    // Zamknięcie przez kliknięcie w overlay
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup(false);
      }
    });
  });
}

// CUSTOM PROMPT DIALOG - Zamiennik dla prompt()
export function showPrompt(message, defaultValue = '', options = {}) {
  return new Promise((resolve) => {
    const {
      confirmText = 'OK',
      cancelText = 'Anuluj',
      placeholder = 'Wpisz...',
      icon = '✏️'
    } = options;
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-confirm-overlay';
    
    overlay.innerHTML = `
      <div class="custom-confirm-box">
        <div class="custom-confirm-icon">${icon}</div>
        <div class="custom-confirm-message">${message}</div>
        <input 
          type="text" 
          class="custom-prompt-input" 
          value="${defaultValue}" 
          placeholder="${placeholder}"
          style="
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-family: 'Quicksand', sans-serif;
            font-size: 15px;
            margin-bottom: 20px;
            transition: border-color 0.3s;
          "
        />
        <div class="custom-confirm-buttons">
          <button class="custom-confirm-btn custom-confirm-btn-cancel">${cancelText}</button>
          <button class="custom-confirm-btn custom-confirm-btn-confirm">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const input = overlay.querySelector('.custom-prompt-input');
    const cancelBtn = overlay.querySelector('.custom-confirm-btn-cancel');
    const confirmBtn = overlay.querySelector('.custom-confirm-btn-confirm');
    
    // Focus na input
    setTimeout(() => input.focus(), 100);
    
    // Style dla focus
    input.addEventListener('focus', () => {
      input.style.borderColor = '#667eea';
      input.style.outline = 'none';
    });
    
    input.addEventListener('blur', () => {
      input.style.borderColor = '#e0e0e0';
    });
    
    function cleanup(result) {
      overlay.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    }
    
    cancelBtn.addEventListener('click', () => cleanup(null));
    confirmBtn.addEventListener('click', () => cleanup(input.value));
    
    // Enter = confirm
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        cleanup(input.value);
      }
    });
    
    // Escape = cancel
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cleanup(null);
      }
    });
  });
}

// Dodaj animację fadeOut i slideOutRight
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateX(400px) scale(0.9);
    }
  }
`;
document.head.appendChild(style);

// Export jako domyślny obiekt
export default {
  toast: showToast,
  confirm: showConfirm,
  prompt: showPrompt
};