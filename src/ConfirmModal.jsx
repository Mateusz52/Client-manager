import { useState } from 'react'
import './ConfirmModal.css'

export default function ConfirmModal({ 
	isOpen, 
	onClose, 
	onConfirm, 
	title, 
	message, 
	confirmText = 'Potwierdź',
	cancelText = 'Anuluj',
	type = 'warning',
	requirePassword = false,
	requireTextConfirm = null,
	loading = false
}) {
	const [password, setPassword] = useState('')
	const [textConfirm, setTextConfirm] = useState('')
	const [error, setError] = useState('')

	if (!isOpen) return null

	// Porównanie case-insensitive i trim
	const isTextMatch = !requireTextConfirm || 
		textConfirm.trim().toLowerCase() === requireTextConfirm.trim().toLowerCase()

	const handleConfirm = () => {
		setError('')

		if (requireTextConfirm && !isTextMatch) {
			setError('Wpisany tekst nie zgadza się')
			return
		}

		if (requirePassword && !password) {
			setError('Wpisz hasło')
			return
		}

		onConfirm({ password, textConfirm })
	}

	const handleClose = () => {
		setPassword('')
		setTextConfirm('')
		setError('')
		onClose()
	}

	const getIcon = () => {
		switch (type) {
			case 'danger': return '🗑️'
			case 'warning': return '⚠️'
			case 'success': return '✅'
			case 'info': return 'ℹ️'
			default: return '❓'
		}
	}

	return (
		<div className="confirm-modal-overlay" onClick={handleClose}>
			<div className={`confirm-modal confirm-modal-${type}`} onClick={e => e.stopPropagation()}>
				<div className="confirm-modal-icon">{getIcon()}</div>
				
				<h2 className="confirm-modal-title">{title}</h2>
				
				<p className="confirm-modal-message">{message}</p>

				{requireTextConfirm && (
					<div className="confirm-modal-input-group">
						<label>Wpisz <strong>"{requireTextConfirm}"</strong> aby potwierdzić:</label>
						<input
							type="text"
							value={textConfirm}
							onChange={(e) => setTextConfirm(e.target.value)}
							placeholder={requireTextConfirm}
							className="confirm-modal-input"
							autoFocus
						/>
						{textConfirm && isTextMatch && (
							<div className="confirm-modal-match">✓ Nazwa się zgadza</div>
						)}
					</div>
				)}

				{requirePassword && (
					<div className="confirm-modal-input-group">
						<label>🔒 Potwierdź swoim hasłem:</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Twoje hasło"
							className="confirm-modal-input"
							autoFocus={!requireTextConfirm}
						/>
					</div>
				)}

				{error && (
					<div className="confirm-modal-error">
						❌ {error}
					</div>
				)}

				<div className="confirm-modal-actions">
					<button 
						className="confirm-modal-btn confirm-modal-btn-cancel"
						onClick={handleClose}
						disabled={loading}>
						{cancelText}
					</button>
					<button 
						className={`confirm-modal-btn confirm-modal-btn-${type}`}
						onClick={handleConfirm}
						disabled={loading || !isTextMatch || (requirePassword && !password)}>
						{loading ? 'Przetwarzanie...' : confirmText}
					</button>
				</div>
			</div>
		</div>
	)
}

export function AlertModal({ isOpen, onClose, title, message, type = 'info' }) {
	if (!isOpen) return null

	const getIcon = () => {
		switch (type) {
			case 'error': return '❌'
			case 'success': return '✅'
			case 'warning': return '⚠️'
			case 'info': return 'ℹ️'
			default: return '💬'
		}
	}

	return (
		<div className="confirm-modal-overlay" onClick={onClose}>
			<div className={`confirm-modal confirm-modal-alert confirm-modal-${type}`} onClick={e => e.stopPropagation()}>
				<div className="confirm-modal-icon">{getIcon()}</div>
				<h2 className="confirm-modal-title">{title}</h2>
				<p className="confirm-modal-message">{message}</p>
				<div className="confirm-modal-actions">
					<button 
						className="confirm-modal-btn confirm-modal-btn-primary"
						onClick={onClose}>
						OK
					</button>
				</div>
			</div>
		</div>
	)
}