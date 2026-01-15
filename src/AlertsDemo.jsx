import React from 'react';
import { showToast, showConfirm, showPrompt } from './customAlerts';

// ============================================
// PRZYKŁADOWY KOMPONENT - DEMO CUSTOM ALERTS
// ============================================

function AlertsDemo() {
  // Toast Examples
  const handleSuccessToast = () => {
    showToast('Operacja zakończona sukcesem!', 'success');
  };

  const handleErrorToast = () => {
    showToast('Wystąpił błąd podczas przetwarzania', 'error');
  };

  const handleWarningToast = () => {
    showToast('Sprawdź wprowadzone dane', 'warning');
  };

  const handleInfoToast = () => {
    showToast('To jest informacja dla użytkownika', 'info');
  };

  const handleLongToast = () => {
    showToast('Ten toast będzie widoczny przez 10 sekund', 'info', 10000);
  };

  // Confirm Example
  const handleConfirm = async () => {
    const result = await showConfirm(
      'Czy na pewno chcesz kontynuować?',
      {
        confirmText: 'Tak, kontynuuj',
        cancelText: 'Nie, anuluj',
        icon: '❓'
      }
    );

    if (result) {
      showToast('Potwierdzono!', 'success');
    } else {
      showToast('Anulowano', 'info');
    }
  };

  // Delete Confirm Example
  const handleDeleteConfirm = async () => {
    const result = await showConfirm(
      'Czy na pewno chcesz usunąć ten element? Tej operacji nie można cofnąć.',
      {
        confirmText: 'Usuń',
        cancelText: 'Anuluj',
        icon: '🗑️'
      }
    );

    if (result) {
      showToast('Element został usunięty', 'success');
    }
  };

  // Prompt Example
  const handlePrompt = async () => {
    const name = await showPrompt(
      'Podaj swoją nazwę:',
      '',
      {
        placeholder: 'np. Jan Kowalski',
        icon: '✏️'
      }
    );

    if (name) {
      showToast(`Witaj, ${name}!`, 'success');
    } else {
      showToast('Nie podano nazwy', 'warning');
    }
  };

  // Organization Prompt Example
  const handleOrgPrompt = async () => {
    const orgName = await showPrompt(
      'Podaj nazwę nowej organizacji:',
      '',
      {
        confirmText: 'Utwórz',
        cancelText: 'Anuluj',
        placeholder: 'np. Moja Firma Sp. z o.o.',
        icon: '🏢'
      }
    );

    if (orgName) {
      showToast(`Utworzono organizację: ${orgName}`, 'success');
    }
  };

  return (
    <div style={{
      padding: '40px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Quicksand, sans-serif'
    }}>
      <h1 style={{
        color: '#243c4c',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        🎨 Custom Alerts Demo
      </h1>

      {/* TOAST NOTIFICATIONS */}
      <section style={{
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#243c4c', marginBottom: '20px' }}>
          📢 Toast Notifications
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <button
            onClick={handleSuccessToast}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #94c11e 0%, #7ea518 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ✅ Success Toast
          </button>

          <button
            onClick={handleErrorToast}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ❌ Error Toast
          </button>

          <button
            onClick={handleWarningToast}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
              color: '#243c4c',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ⚠️ Warning Toast
          </button>

          <button
            onClick={handleInfoToast}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ℹ️ Info Toast
          </button>

          <button
            onClick={handleLongToast}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ⏱️ Long Toast (10s)
          </button>
        </div>
      </section>

      {/* CONFIRM DIALOGS */}
      <section style={{
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#243c4c', marginBottom: '20px' }}>
          ❓ Confirm Dialogs
        </h2>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleConfirm}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ❓ Basic Confirm
          </button>

          <button
            onClick={handleDeleteConfirm}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            🗑️ Delete Confirm
          </button>
        </div>
      </section>

      {/* PROMPT DIALOGS */}
      <section style={{
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#243c4c', marginBottom: '20px' }}>
          ✏️ Prompt Dialogs
        </h2>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handlePrompt}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ✏️ Basic Prompt
          </button>

          <button
            onClick={handleOrgPrompt}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #94c11e 0%, #7ea518 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            🏢 Create Organization
          </button>
        </div>
      </section>

      {/* INFO */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '12px',
        borderLeft: '4px solid #667eea'
      }}>
        <h3 style={{ color: '#243c4c', marginTop: 0 }}>ℹ️ Informacja</h3>
        <p style={{ margin: 0, color: '#6c757d', lineHeight: '1.6' }}>
          To są profesjonalne zamienniki dla natywnych <code>alert()</code>, 
          <code>confirm()</code> i <code>prompt()</code>. 
          Są w pełni responsywne, animowane i dostosowane do stylu Twojej aplikacji.
        </p>
      </div>
    </div>
  );
}

export default AlertsDemo;
