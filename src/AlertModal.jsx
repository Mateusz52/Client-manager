import { useEffect } from 'react'
import './AlertModal.css'

export default function AlertModal({ 
	isOpen, 
	onClose, 
	onConfirm, 
	title, 
	message, 
	type = 'info', // 'info', 'success', 'error', 'warning', 'confirm'
	confirmText = 'OK',
	cancelText = 'Anuluj',
	showCancel = false
}) {
	// Zamknij na ESC
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === 'Escape' && isOpen) {
				onClose()
			}
		}
		window.addEventListener('keydown', handleEsc)
		return () => window.removeEventListener('keydown', handleEsc)
	}, [isOpen, onClose])

	// Zablokuj scroll gdy modal otwarty
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}
		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	if (!isOpen) return null

	// Ikony dla różnych typów
	const icons = {
		info: '💡',
		success: '✅',
		error: '❌',
		warning: '⚠️',
		confirm: '❓'
	}

	const handleConfirm = () => {
		if (onConfirm) {
			onConfirm()
		}
		onClose()
	}

	return (
		<div className="alert-modal-overlay" onClick={onClose}>
			<div 
				className={`alert-modal-container alert-modal-${type}`} 
				onClick={(e) => e.stopPropagation()}>
				
				{/* Ikona */}
				<div className={`alert-modal-icon alert-modal-icon-${type}`}>
					{icons[type] || icons.info}
				</div>

				{/* Tytuł */}
				{title && (
					<h3 className="alert-modal-title">{title}</h3>
				)}

				{/* Wiadomość */}
				<div className="alert-modal-message">
					{message}
				</div>

				{/* Przyciski */}
				<div className="alert-modal-actions">
					{showCancel && (
						<button 
							className="alert-modal-btn alert-modal-btn-cancel"
							onClick={onClose}>
							{cancelText}
						</button>
					)}
					<button 
						className={`alert-modal-btn alert-modal-btn-confirm alert-modal-btn-${type}`}
						onClick={handleConfirm}
						autoFocus>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	)
}