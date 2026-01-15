// ============================================
// PROFESSIONAL ALERTS SYSTEM - ALL IN ONE
// ============================================

class ToastSystem {
  constructor() {
    this.container = null;
    this.injectStyles();
  }

  injectStyles() {
    // Usuń stare style jeśli istnieją
    const oldStyle = document.getElementById('toast-system-styles');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.id = 'toast-system-styles';
    style.textContent = `
      /* Toast Container */
      #toast-system-container {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      }

      /* Toast Base */
      .toast-pro {
        pointer-events: auto;
        background: white;
        border-radius: 16px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        min-width: 360px;
        max-width: 480px;
        display: flex;
        overflow: hidden;
        animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        border: 1px solid rgba(255, 255, 255, 0.8);
      }

      .toast-pro.removing {
        animation: slideOut 0.3s ease-out forwards;
      }

      /* Animations */
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(400px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateX(400px) scale(0.9);
        }
      }

      /* Colored Bar */
      .toast-pro::before {
        content: '';
        width: 6px;
        flex-shrink: 0;
      }

      .toast-pro.success::before {
        background: linear-gradient(180deg, #94c11e 0%, #7ea518 100%);
      }

      .toast-pro.error::before {
        background: linear-gradient(180deg, #dc3545 0%, #c82333 100%);
      }

      .toast-pro.warning::before {
        background: linear-gradient(180deg, #ffc107 0%, #ff9800 100%);
      }

      .toast-pro.info::before {
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      }

      /* Gradient Backgrounds */
      .toast-pro.success {
        background: linear-gradient(135deg, rgba(148, 193, 30, 0.05) 0%, rgba(255, 255, 255, 1) 100%);
      }

      .toast-pro.error {
        background: linear-gradient(135deg, rgba(220, 53, 69, 0.05) 0%, rgba(255, 255, 255, 1) 100%);
      }

      .toast-pro.warning {
        background: linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, rgba(255, 255, 255, 1) 100%);
      }

      .toast-pro.info {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(255, 255, 255, 1) 100%);
      }

      /* Icon Box */
      .toast-icon-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 24px;
        margin: 16px 0 16px 16px;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .toast-pro.success .toast-icon-box {
        background: linear-gradient(135deg, #94c11e 0%, #7ea518 100%);
      }

      .toast-pro.error .toast-icon-box {
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      }

      .toast-pro.warning .toast-icon-box {
        background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
        color: #243c4c;
      }

      .toast-pro.info .toast-icon-box {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      /* Content */
      .toast-body-pro {
        display: flex;
        flex: 1;
        align-items: center;
        padding: 16px;
        gap: 12px;
      }

      .toast-content-pro {
        flex: 1;
        min-width: 0;
      }

      .toast-title-pro {
        font-weight: 700;
        font-size: 15px;
        color: #243c4c;
        margin: 0 0 4px 0;
        letter-spacing: 0.3px;
      }

      .toast-message-pro {
        font-size: 14px;
        color: #6c757d;
        margin: 0;
        line-height: 1.5;
        word-wrap: break-word;
      }

      /* Close Button */
      .toast-close-pro {
        background: rgba(108, 117, 125, 0.1);
        border: none;
        font-size: 20px;
        color: #6c757d;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
        font-weight: 500;
      }

      .toast-close-pro:hover {
        background: rgba(108, 117, 125, 0.2);
        color: #243c4c;
        transform: scale(1.1);
      }

      /* Mobile */
      @media (max-width: 768px) {
        #toast-system-container {
          top: 10px;
          right: 10px;
          left: 10px;
        }

        .toast-pro {
          min-width: auto;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  getContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-system-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  show(message, type = 'info', duration = 4000) {
    const container = this.getContainer();
    
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
    
    const toast = document.createElement('div');
    toast.className = `toast-pro ${type}`;
    
    toast.innerHTML = `
      <div class="toast-icon-box">${icons[type] || icons.info}</div>
      <div class="toast-body-pro">
        <div class="toast-content-pro">
          <div class="toast-title-pro">${titles[type] || titles.info}</div>
          <div class="toast-message-pro">${message}</div>
        </div>
        <button class="toast-close-pro" aria-label="Zamknij">×</button>
      </div>
    `;
    
    container.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close-pro');
    closeBtn.addEventListener('click', () => {
      this.remove(toast);
    });
    
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }
    
    return toast;
  }

  remove(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
      toast.remove();
      if (this.container && this.container.children.length === 0) {
        this.container.remove();
        this.container = null;
      }
    }, 300);
  }

  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const {
        confirmText = 'Potwierdź',
        cancelText = 'Anuluj',
        icon = '❓'
      } = options;
      
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.2s ease-out;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, sans-serif;
      `;
      
      overlay.innerHTML = `
        <div style="
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: scaleIn 0.3s ease-out;
        ">
          <div style="font-size: 48px; text-align: center; margin-bottom: 16px;">${icon}</div>
          <div style="
            font-size: 16px;
            color: #243c4c;
            text-align: center;
            margin-bottom: 24px;
            line-height: 1.6;
          ">${message}</div>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="confirm-cancel" style="
              padding: 12px 24px;
              border-radius: 10px;
              font-size: 15px;
              font-weight: 700;
              cursor: pointer;
              border: 2px solid #667eea;
              background: white;
              color: #667eea;
              min-width: 100px;
              transition: all 0.3s;
            ">${cancelText}</button>
            <button class="confirm-ok" style="
              padding: 12px 24px;
              border-radius: 10px;
              font-size: 15px;
              font-weight: 700;
              cursor: pointer;
              border: none;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-width: 100px;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
              transition: all 0.3s;
            ">${confirmText}</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      const styleTag = document.createElement('style');
      styleTag.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .confirm-cancel:hover {
          background: #f8f9fa;
          transform: translateY(-2px);
        }
        .confirm-ok:hover {
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          transform: translateY(-2px);
        }
      `;
      document.head.appendChild(styleTag);
      
      function cleanup(result) {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => {
          overlay.remove();
          styleTag.remove();
          resolve(result);
        }, 200);
      }
      
      overlay.querySelector('.confirm-cancel').addEventListener('click', () => cleanup(false));
      overlay.querySelector('.confirm-ok').addEventListener('click', () => cleanup(true));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cleanup(false);
      });
    });
  }

  prompt(message, defaultValue = '', options = {}) {
    return new Promise((resolve) => {
      const {
        confirmText = 'OK',
        cancelText = 'Anuluj',
        placeholder = 'Wpisz...',
        icon = '✏️'
      } = options;
      
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.2s ease-out;
        font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, sans-serif;
      `;
      
      overlay.innerHTML = `
        <div style="
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: scaleIn 0.3s ease-out;
        ">
          <div style="font-size: 48px; text-align: center; margin-bottom: 16px;">${icon}</div>
          <div style="
            font-size: 16px;
            color: #243c4c;
            text-align: center;
            margin-bottom: 20px;
            line-height: 1.6;
          ">${message}</div>
          <input type="text" class="prompt-input" value="${defaultValue}" placeholder="${placeholder}" style="
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-family: 'Quicksand', sans-serif;
            font-size: 15px;
            margin-bottom: 20px;
            transition: border-color 0.3s;
          " />
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="prompt-cancel" style="
              padding: 12px 24px;
              border-radius: 10px;
              font-size: 15px;
              font-weight: 700;
              cursor: pointer;
              border: 2px solid #667eea;
              background: white;
              color: #667eea;
              min-width: 100px;
              transition: all 0.3s;
            ">${cancelText}</button>
            <button class="prompt-ok" style="
              padding: 12px 24px;
              border-radius: 10px;
              font-size: 15px;
              font-weight: 700;
              cursor: pointer;
              border: none;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-width: 100px;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
              transition: all 0.3s;
            ">${confirmText}</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      const input = overlay.querySelector('.prompt-input');
      setTimeout(() => input.focus(), 100);
      
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
      
      overlay.querySelector('.prompt-cancel').addEventListener('click', () => cleanup(null));
      overlay.querySelector('.prompt-ok').addEventListener('click', () => cleanup(input.value));
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') cleanup(input.value);
      });
      
      overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cleanup(null);
      });
    });
  }
}

// Stwórz globalną instancję
const toastSystem = new ToastSystem();

// Export funkcji
export function showToast(message, type, duration) {
  return toastSystem.show(message, type, duration);
}

export function showConfirm(message, options) {
  return toastSystem.confirm(message, options);
}

export function showPrompt(message, defaultValue, options) {
  return toastSystem.prompt(message, defaultValue, options);
}

export default {
  toast: showToast,
  confirm: showConfirm,
  prompt: showPrompt
};
