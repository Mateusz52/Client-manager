import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './SelectPlanPage.css'

export default function SelectPlanPage() {
	const navigate = useNavigate()
	const { currentUser, userProfile, joinOrganizationWithCode } = useAuth()
	const [showJoinModal, setShowJoinModal] = useState(false)
	const [joinCode, setJoinCode] = useState('')
	const [joinLoading, setJoinLoading] = useState(false)
	const [joinError, setJoinError] = useState('')

	// Sprawdź czy użytkownik już ma organizację
	useEffect(() => {
		if (userProfile?.organizations?.length > 0) {
			// Ma już organizację - przekieruj do dashboardu
			console.log('✅ Użytkownik ma organizację, przekierowuję do dashboardu')
			navigate('/dashboard')
		}
	}, [userProfile, navigate])

	const handleBuyPlan = () => {
		navigate('/pricing')
	}

	const handleJoinTeam = async (e) => {
		e.preventDefault()
		setJoinError('')
		setJoinLoading(true)

		try {
			await joinOrganizationWithCode(joinCode.toUpperCase())
			// Po dołączeniu przekieruj do dashboardu
			navigate('/dashboard')
		} catch (error) {
			setJoinError(error.message || 'Błąd dołączania do zespołu')
			setJoinLoading(false)
		}
	}

	// Jeśli ma organizację, nie renderuj (pokazuje się loading z useEffect)
	if (userProfile?.organizations?.length > 0) {
		return (
			<div className="select-plan-page">
				<div className="checkout-loading">Przekierowuję...</div>
			</div>
		)
	}

	return (
		<div className="select-plan-page">
			<div className="select-plan-container">
				<div className="select-plan-header">
					<h1>🎉 Witaj w CLIENT MANAGER!</h1>
					<p>Wybierz jedną z opcji aby rozpocząć</p>
				</div>

				<div className="select-plan-options">
					{/* OPCJA 1: KUP PLAN */}
					<div className="plan-option">
						<div className="option-icon">🚀</div>
						<h2>Rozpocznij swoją firmę</h2>
						<p>Kup plan i zarządzaj swoją produkcją palet</p>
						<ul className="option-benefits">
							<li>✓ Pełna kontrola nad organizacją</li>
							<li>✓ Zapraszaj członków zespołu</li>
							<li>✓ 3 miesiące gratis</li>
							<li>✓ Nielimitowane zamówienia</li>
						</ul>
						<button onClick={handleBuyPlan} className="btn-option btn-primary">
							💳 Kup plan
						</button>
					</div>

					{/* OPCJA 2: DOŁĄCZ DO ZESPOŁU */}
					<div className="plan-option">
						<div className="option-icon">👥</div>
						<h2>Dołącz do zespołu</h2>
						<p>Masz kod zaproszenia? Dołącz do istniejącej organizacji</p>
						<ul className="option-benefits">
							<li>✓ Pracuj w zespole</li>
							<li>✓ Dostęp do zamówień firmy</li>
							<li>✓ Bez dodatkowych kosztów</li>
							<li>✓ Uprawnienia nadane przez właściciela</li>
						</ul>
						<button onClick={() => setShowJoinModal(true)} className="btn-option btn-secondary">
							🔑 Użyj kodu
						</button>
					</div>
				</div>

				<div className="select-plan-footer">
					<p>Masz pytania? <a href="mailto:kontakt@clientmanager.pl">Skontaktuj się z nami</a></p>
				</div>
			</div>

			{/* Modal z kodem zaproszenia */}
			{showJoinModal && (
				<div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
					<div className="modal-box" onClick={(e) => e.stopPropagation()}>
						<h2>Dołącz do zespołu</h2>
						<p>Wpisz kod zaproszenia otrzymany od właściciela organizacji</p>
						
						<form onSubmit={handleJoinTeam}>
							<input
								type="text"
								placeholder="np. ABC123XYZ"
								value={joinCode}
								onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
								className="join-code-input"
								autoFocus
								maxLength={9}
								pattern="[A-Z0-9]{9}"
								required
							/>

							{joinError && (
								<div className="join-error">
									⚠️ {joinError}
								</div>
							)}

							<div className="modal-actions">
								<button 
									type="button"
									onClick={() => setShowJoinModal(false)}
									className="btn-modal btn-cancel"
									disabled={joinLoading}>
									Anuluj
								</button>
								<button 
									type="submit"
									className="btn-modal btn-confirm"
									disabled={joinLoading || !joinCode.trim()}>
									{joinLoading ? 'Dołączam...' : 'Dołącz'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}