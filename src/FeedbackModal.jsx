import { useState } from 'react'
import { db } from './firebase'
import { collection, addDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { showToast } from './simpleAlerts'
import './FeedbackModal.css'

export default function FeedbackModal({ isOpen, onClose, onSubmit, onRemindLater, onNeverShow }) {
	const { currentUser, userProfile, organizationId } = useAuth()
	const [rating, setRating] = useState(0)
	const [hoveredRating, setHoveredRating] = useState(0)
	const [comment, setComment] = useState('')
	const [loading, setLoading] = useState(false)

	if (!isOpen) return null

	const handleSubmit = async (e) => {
		e.preventDefault()

		// Walidacja - przynajmniej gwiazdki lub komentarz
		if (rating === 0 && !comment.trim()) {
			showToast('Dodaj ocenę gwiazdkami lub komentarz', 'warning')
			return
		}

		setLoading(true)

		try {
			// Zapisz feedback do Firebase
			await addDoc(collection(db, 'feedback'), {
				userId: currentUser?.uid || 'anonymous',
				userEmail: currentUser?.email || 'anonymous',
				userName: userProfile?.displayName || 'Anonim',
				organizationId: organizationId || 'no-org',
				organizationName: userProfile?.organizationName || 'Brak organizacji',
				rating: rating,
				comment: comment.trim(),
				createdAt: new Date().toISOString(),
				status: 'new', // new, read, resolved
			})

			showToast('Dziękujemy za feedback! 🎉', 'success')
			
			// Reset formularza
			setRating(0)
			setComment('')
			
			// Callback sukcesu
			if (onSubmit) {
				onSubmit()
			}
			
			onClose()
		} catch (error) {
			console.error('Błąd wysyłania feedbacku:', error)
			showToast('Nie udało się wysłać feedbacku', 'error')
		} finally {
			setLoading(false)
		}
	}

	const handleRemindLater = () => {
		showToast('Przypomnimy później! 📅', 'info')
		if (onRemindLater) {
			onRemindLater()
		}
		onClose()
	}

	const handleNeverShow = () => {
		showToast('Okienko feedbacku zostało wyłączone', 'info')
		if (onNeverShow) {
			onNeverShow()
		}
		onClose()
	}

	return (
		<>
			<div className="feedback-overlay" onClick={onClose}></div>
			<div className="feedback-modal">
				<button className="feedback-close" onClick={onClose} aria-label="Zamknij">×</button>
				
				<div className="feedback-header">
					<div className="feedback-icon">💡</div>
					<h2>Pomóż nam ulepszyć aplikację!</h2>
					<p>Twoja opinia pomaga nam tworzyć lepsze narzędzie dla Twojej firmy</p>
				</div>

				<form onSubmit={handleSubmit} className="feedback-form">
					{/* Ocena gwiazdkami */}
					<div className="feedback-section">
						<label className="feedback-label">
							Jak oceniasz aplikację?
						</label>
						<div className="stars-container">
							{[1, 2, 3, 4, 5].map((star) => (
								<button
									key={star}
									type="button"
									className={`star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
									onClick={() => setRating(star)}
									onMouseEnter={() => setHoveredRating(star)}
									onMouseLeave={() => setHoveredRating(0)}
									aria-label={`${star} gwiazdek`}
								>
									{star <= (hoveredRating || rating) ? '⭐' : '☆'}
								</button>
							))}
						</div>
						{rating > 0 && (
							<div className="rating-text">
								{rating === 1 && '😞 Bardzo słabo'}
								{rating === 2 && '😕 Słabo'}
								{rating === 3 && '😐 Średnio'}
								{rating === 4 && '😊 Dobrze'}
								{rating === 5 && '🎉 Świetnie!'}
							</div>
						)}
					</div>

					{/* Komentarz */}
					<div className="feedback-section">
						<label className="feedback-label">
							Co możemy poprawić? (opcjonalne)
						</label>
						<textarea
							className="feedback-textarea"
							placeholder="Napisz co Ci się podoba, a co moglibyśmy ulepszyć..."
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							rows={4}
							maxLength={500}
						/>
						<div className="char-count">
							{comment.length}/500
						</div>
					</div>

					{/* Przyciski */}
					<div className="feedback-actions">
						<button
							type="submit"
							className="btn-submit-feedback"
							disabled={loading}
						>
							{loading ? 'Wysyłanie...' : '📤 Wyślij feedback'}
						</button>
						
						<div className="feedback-secondary-actions">
							<button
								type="button"
								className="btn-remind-later"
								onClick={handleRemindLater}
							>
								📅 Przypomnij później
							</button>
							<button
								type="button"
								className="btn-never-show"
								onClick={handleNeverShow}
							>
								🚫 Nie pokazuj więcej
							</button>
						</div>
					</div>
				</form>

				<div className="feedback-footer">
					<p>💙 Dziękujemy, że pomagasz nam się rozwijać!</p>
				</div>
			</div>
		</>
	)
}