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
			navigate('/')
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
			navigate('/')
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
						<div className="plan-option-icon">🚀</div>
						<h2>Rozpocznij swoją firmę</h2>
						<p>
							Kup plan i zarządzaj swoją produkcją palet.
							<strong> Pierwsze 3 miesiące za darmo!</strong>
						</p>
						<ul className="plan-option-features">
							<li>✓ Pełna kontrola nad organizacją</li>
							<li>✓ Zapraszaj członków zespołu</li>
							<li>✓ 3 miesiące gratis</li>
							<li>✓ Nielimitowane zamówienia</li>
						</ul>
						<button onClick={handleBuyPlan} className="btn-select-plan btn-primary">
							💳 Kup plan
						</button>
					</div>

					{/* OPCJA 2: DOŁĄCZ DO ZESPOŁU */}
					<div className="plan-option plan-option-join">
						<div className="plan-option-icon">👥</div>
						<h2>Dołącz do zespołu</h2>
						<p>
							Masz kod zaproszenia? Dołącz do istniejącej organizacji.
						</p>
						<ul className="plan-option-features">
							<li>✓ Pracuj w zespole</li>
							<li>✓ Dostęp do zamówień firmy</li>
							<li>✓ Bez dodatkowych kosztów</li>
							<li>✓ Uprawnienia nadane przez właściciela</li>
						</ul>
						<button onClick={() => setShowJoinModal(true)} className="btn-select-plan btn-secondary">
							🔑 Użyj kodu
						</button>
					</div>
				</div>

				<div className="select-plan-info">
					<p>Masz pytania? <a href="/landing#contact">Skontaktuj się z nami</a></p>
				</div>
			</div>

			{/* MODAL DOŁĄCZANIA */}
			{showJoinModal && (
				<div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
					<div className="modal-card" onClick={(e) => e.stopPropagation()}>
						<h2>🔑 Dołącz do zespołu</h2>
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


// Okej, ale mamy problem jest fajnie wszystko ale teraz tak



// Stworzyłem konto i kupiłem subskrybcje na koncie mateusz.kowalski5115@gmail.com. Zaprosiłem nowego użytkownika do mojej organizacji mateusz.kowalski2255@wp.pl. I okej zarejestrowałem sie z kodem wiec mam dostep do danej organizacji za darmo. Tak jak ma być super! Ale jednak moge dalej kliknąć dodaj nową organizacje mimo, że to konto mateusz.kowalski2255@wp.pl nie ma subskrybcji tylko dołączyło do organizacji za darmo. Rozumiesz o co chodzi?