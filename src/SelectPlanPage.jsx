import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './SelectPlanPage.css'

export default function SelectPlanPage() {
	const navigate = useNavigate()
	const { userProfile, joinOrganizationWithCode } = useAuth()
	const [showJoinModal, setShowJoinModal] = useState(false)
	const [joinCode, setJoinCode] = useState('')
	const [joinLoading, setJoinLoading] = useState(false)
	const [joinError, setJoinError] = useState('')

	const handleBuyPlan = () => {
		navigate('/pricing')
	}

	const handleJoinTeam = async (e) => {
		e.preventDefault()
		setJoinError('')
		setJoinLoading(true)

		try {
			await joinOrganizationWithCode(joinCode.toUpperCase())
			// Po dolaczeniu przekieruj na glowna
			window.location.href = '/'
		} catch (error) {
			setJoinError(error.message || 'Blad dolaczania do zespolu')
			setJoinLoading(false)
		}
	}

	return (
		<div className="select-plan-page">
			<div className="select-plan-container">
				<div className="select-plan-header">
					<h1>🎉 Witaj w CLIENT MANAGER!</h1>
					<p>Wybierz jedna z opcji aby rozpoczac</p>
				</div>

				<div className="select-plan-options">
					{/* OPCJA 1: KUP PLAN */}
					<div className="plan-option plan-option-buy">
						<div className="plan-option-icon">💳</div>
						<h2>Kup wlasny plan</h2>
						<p>
							Zaloz wlasna organizacje i zarzadzaj swoim zespolem. 
							<strong> Pierwsze 3 miesiace za darmo!</strong>
						</p>
						<ul className="plan-option-features">
							<li>✅ Nielimitowane zamowienia</li>
							<li>✅ Wlasne produkty</li>
							<li>✅ Zapraszanie pracownikow</li>
							<li>✅ Zaawansowane statystyki</li>
							<li>✅ Export PDF</li>
							<li>🎁 <strong>3 miesiace gratis!</strong></li>
						</ul>
						<button onClick={handleBuyPlan} className="btn-select-plan btn-primary">
							Wybierz plan
						</button>
					</div>

					{/* OPCJA 2: DOLACZ DO ZESPOLU */}
					<div className="plan-option plan-option-join">
						<div className="plan-option-icon">👥</div>
						<h2>Dolacz do zespolu</h2>
						<p>
							Masz kod zaproszenia od wlasciciela firmy? 
							Wpisz go ponizej i dolacz do zespolu.
						</p>
						<ul className="plan-option-features">
							<li>✅ Dostep do firmowego panelu</li>
							<li>✅ Uprawnienia przydzielone przez wlasciciela</li>
							<li>✅ Wspolpraca w czasie rzeczywistym</li>
							<li>✅ Bez kosztow subskrypcji</li>
						</ul>
						<button onClick={() => setShowJoinModal(true)} className="btn-select-plan btn-secondary">
							Mam kod zaproszenia
						</button>
					</div>
				</div>

				<div className="select-plan-info">
					<p>💡 <strong>Mozesz wybrac obie opcje!</strong></p>
					<p>
						Kup wlasny plan dla swojej firmy i jednoczesnie dolacz do innej organizacji jako pracownik.
						Latwo przelaczaj sie miedzy roznymi firmami.
					</p>
				</div>
			</div>

			{/* MODAL DOLACZANIA */}
			{showJoinModal && (
				<div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
					<div className="modal-card" onClick={(e) => e.stopPropagation()}>
						<h2>👥 Dolacz do zespolu</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Wpisz 6-znakowy kod zaproszenia otrzymany od wlasciciela firmy
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
									{joinLoading ? 'Dolaczanie...' : 'Dolacz do zespolu'}
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