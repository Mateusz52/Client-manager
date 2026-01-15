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
					<div className="plan-option plan-option-buy">
						<div className="plan-option-icon">💳</div>
						<h2>Kup własny plan</h2>
						<p>
							Załóż własną organizację i zarządzaj swoim zespołem. 
							<strong>Pierwsze 3 miesiące za darmo!</strong>
						</p>
						<ul className="plan-option-features">
							<li>✅ Nielimitowane zamówienia</li>
							<li>✅ Własne produkty</li>
							<li>✅ Zapraszanie pracowników</li>
							<li>✅ Zaawansowane statystyki</li>
							<li>✅ Export PDF</li>
							<li>🎁 <strong>3 miesiące gratis!</strong></li>
						</ul>
						<button onClick={handleBuyPlan} className="btn-select-plan btn-primary">
							Wybierz plan
						</button>
					</div>

					{/* OPCJA 2: DOŁĄCZ DO ZESPOŁU */}
					<div className="plan-option plan-option-join">
						<div className="plan-option-icon">👥</div>
						<h2>Dołącz do zespołu</h2>
						<p>
							Masz kod zaproszenia od właściciela firmy? 
							Wpisz go poniżej i dołącz do zespołu.
						</p>
						<ul className="plan-option-features">
							<li>✅ Dostęp do firmowego panelu</li>
							<li>✅ Uprawnienia przydzielone przez właściciela</li>
							<li>✅ Współpraca w czasie rzeczywistym</li>
							<li>✅ Bez kosztów subskrypcji</li>
						</ul>
						<button onClick={() => setShowJoinModal(true)} className="btn-select-plan btn-secondary">
							Mam kod zaproszenia
						</button>
					</div>
				</div>

				<div className="select-plan-info">
					<p>💡 <strong>Możesz wybrać obie opcje!</strong></p>
					<p>
						Kup własny plan dla swojej firmy i jednocześnie dołącz do innej organizacji jako pracownik.
						Łatwo przełączaj się między różnymi firmami.
					</p>
				</div>
			</div>

			{/* MODAL DOŁĄCZANIA */}
			{showJoinModal && (
				<div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
					<div className="modal-card" onClick={(e) => e.stopPropagation()}>
						<h2>👥 Dołącz do zespołu</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Wpisz 6-znakowy kod zaproszenia otrzymany od właściciela firmy
						</p>

						<form onSubmit={handleJoinTeam}>
							<input
								type="text"
								placeholder="Kod zaproszenia (np. XY4K9P)"
								value={joinCode}
								onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
								className="modal-input"
								maxLength={6}
								style={{ 
									textTransform: 'uppercase',
									letterSpacing: '3px',
									fontWeight: '700',
									fontSize: '20px',
									textAlign: 'center'
								}}
								required
								autoFocus
							/>

							{joinError && (
								<div style={{ 
									padding: '12px', 
									background: '#fee', 
									color: '#c00', 
									borderRadius: '8px', 
									fontSize: '14px',
									marginTop: '12px'
								}}>
									{joinError}
								</div>
							)}

							<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
								<button 
									type="submit" 
									className="modal-btn-primary"
									disabled={joinLoading}>
									{joinLoading ? 'Dołączanie...' : 'Dołącz do zespołu'}
								</button>
								<button 
									type="button" 
									className="modal-btn-secondary"
									onClick={() => {
										setShowJoinModal(false)
										setJoinCode('')
										setJoinError('')
									}}>
									Anuluj
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}