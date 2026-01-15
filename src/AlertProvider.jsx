import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import './AlertModal.css'

const AlertContext = createContext()

export function useAlert() {
	const context = useContext(AlertContext)
	if (!context) {
		throw new Error('useAlert must be used within AlertProvider')
	}
	return context
}

export function AlertProvider({ children }) {
	const [alertState, setAlertState] = useState({
		isOpen: false,
		type: 'info',
		title: '',
		message: '',
		confirmText: 'OK',
		cancelText: 'Anuluj',
		showCancel: false,
		onConfirm: null
	})

	// Zamknij alert
	const closeAlert = useCallback(() => {
		setAlertState(prev => ({ ...prev, isOpen: false }))
	}, [])

	// Uniwersalna funkcja do pokazywania alertu
	const showAlert = useCallback((config) => {
		setAlertState({
			isOpen: true,
			type: config.type || 'info',
			title: config.title || '',
			message: config.message || '',
			confirmText: config.confirmText || 'OK',
			cancelText: config.cancelText || 'Anuluj',
			showCancel: config.showCancel || false,
			onConfirm: config.onConfirm || null
		})
	}, [])

	// Alert - prosty alert informacyjny
	const alert = useCallback((message, title = '') => {
		showAlert({
			type: 'info',
			title,
			message,
			confirmText: 'OK',
			showCancel: false
		})
	}, [showAlert])

	// Confirm - pytanie tak/nie
	const confirm = useCallback((message, onConfirm, title = 'Potwierdzenie') => {
		showAlert({
			type: 'confirm',
			title,
			message,
			confirmText: 'Tak',
			cancelText: 'Nie',
			showCancel: true,
			onConfirm
		})
	}, [showAlert])

	// Success - sukces
	const success = useCallback((message, title = 'Sukces') => {
		showAlert({
			type: 'success',
			title,
			message,
			confirmText: 'OK',
			showCancel: false
		})
	}, [showAlert])

	// Error - błąd
	const error = useCallback((message, title = 'Błąd') => {
		showAlert({
			type: 'error',
			title,
			message,
			confirmText: 'OK',
			showCancel: false
		})
	}, [showAlert])

	// Warning - ostrzeżenie
	const warning = useCallback((message, title = 'Uwaga') => {
		showAlert({
			type: 'warning',
			title,
			message,
			confirmText: 'OK',
			showCancel: false
		})
	}, [showAlert])

	// Zamknij na ESC
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === 'Escape' && alertState.isOpen) {
				closeAlert()
			}
		}
		window.addEventListener('keydown', handleEsc)
		return () => window.removeEventListener('keydown', handleEsc)
	}, [alertState.isOpen, closeAlert])

	// Zablokuj scroll gdy modal otwarty
	useEffect(() => {
		if (alertState.isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}
		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [alertState.isOpen])

	// Ikony dla różnych typów
	const getIcon = (type) => {
		const icons = {
			info: '💡',
			success: '✅',
			error: '❌',
			warning: '⚠️',
			confirm: '❓'
		}
		return icons[type] || icons.info
	}

	return (
		<AlertContext.Provider value={{ alert, confirm, success, error, warning, showAlert, closeAlert }}>
			{children}
			
			{/* Alert Modal */}
			{alertState.isOpen && (
				<div className="alert-modal-overlay" onClick={closeAlert}>
					<div 
						className={`alert-modal-container alert-modal-${alertState.type}`} 
						onClick={(e) => e.stopPropagation()}>
						
						<div className={`alert-modal-icon alert-modal-icon-${alertState.type}`}>
							{getIcon(alertState.type)}
						</div>

						{alertState.title && (
							<h3 className="alert-modal-title">{alertState.title}</h3>
						)}

						<div className="alert-modal-message">
							{alertState.message}
						</div>

						<div className="alert-modal-actions">
							{alertState.showCancel && (
								<button 
									className="alert-modal-btn alert-modal-btn-cancel"
									onClick={closeAlert}>
									{alertState.cancelText}
								</button>
							)}
							<button 
								className={`alert-modal-btn alert-modal-btn-confirm alert-modal-btn-${alertState.type}`}
								onClick={() => {
									if (alertState.onConfirm) {
										alertState.onConfirm()
									}
									closeAlert()
								}}
								autoFocus>
								{alertState.confirmText}
							</button>
						</div>
					</div>
				</div>
			)}
		</AlertContext.Provider>
	)
}