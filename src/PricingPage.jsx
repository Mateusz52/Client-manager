import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './PricingPage.css'

export default function PricingPage() {
	const navigate = useNavigate()
	const { currentUser } = useAuth()
	const [companyName, setCompanyName] = useState('')
	const [showNameModal, setShowNameModal] = useState(false)
	const [selectedPlan, setSelectedPlan] = useState(null)

	const plans = [
		{
			id: 'monthly',
			name: 'Miesięczny',
			price: 129,
			period: 'miesiąc',
			total: 129,
			features: [
				'Nielimitowane zamówienia',
				'Nielimitowani użytkownicy',
				'Własne produkty',
				'Zaawansowane statystyki',
				'Export PDF',
				'Wsparcie email',
				'1 organizacja'
			],
			badge: null,
			popular: false
		},
		{
			id: 'semiannual',
			name: 'Półroczny',
			price: 109,
			period: 'miesiąc',
			total: 654,
			originalTotal: 774,
			features: [
				'Nielimitowane zamówienia',
				'Nielimitowani użytkownicy',
				'Własne produkty',
				'Zaawansowane statystyki',
				'Export PDF',
				'Wsparcie email',
				'Nielimitowane organizacje'
			],
			badge: 'Oszczędzasz 15%',
			popular: true
		},
		{
			id: 'annual',
			name: 'Roczny',
			price: 96,
			period: 'miesiąc',
			total: 1152,
			originalTotal: 1548,
			features: [
				'Nielimitowane zamówienia',
				'Nielimitowani użytkownicy',
				'Własne produkty',
				'Zaawansowane statystyki',
				'Export PDF',
				'Wsparcie priorytetowe',
				'Nielimitowane organizacje'
			],
			badge: 'Oszczędzasz 25%',
			popular: false
		}
	]

	const handleSelectPlan = (plan) => {
		if (!currentUser) {
			navigate('/register')
			return
		}

		setSelectedPlan(plan)
		setShowNameModal(true)
	}

	const handleCreateOrganization = () => {
		if (!companyName.trim()) {
			alert('Wpisz nazwę firmy!')
			return
		}

		localStorage.setItem('pendingOrganization', JSON.stringify({
			companyName: companyName.trim(),
			plan: selectedPlan
		}))

		navigate('/checkout')
	}

	return (
		<div className="pricing-page">
			<div className="pricing-container">
				{/* HEADER */}
				<div className="pricing-header">
					<h1>Wybierz plan dla siebie</h1>
					<p>Pierwsze 3 miesiące za darmo! Bez karty kredytowej.</p>
					<div className="trial-badge">
						🎁 3 MIESIĄCE GRATIS
					</div>
				</div>

				{/* PLANY */}
				<div className="pricing-grid">
					{plans.map(plan => (
						<div 
							key={plan.id} 
							className={`pricing-card ${plan.popular ? 'pricing-card-popular' : ''}`}>
							
							{plan.badge && (
								<div className="pricing-badge">{plan.badge}</div>
							)}

							<h3 className="pricing-name">{plan.name}</h3>
							
							<div className="pricing-price">
								<span className="price-amount">{plan.price} zł</span>
								<span className="price-period">/{plan.period}</span>
							</div>

							<div className="pricing-total">
								<span className="total-label">Koszt całkowity:</span>
								<span className="total-amount">{plan.total} zł</span>
								{plan.originalTotal && (
									<span className="total-original">zamiast {plan.originalTotal} zł</span>
								)}
							</div>

							<ul className="pricing-features">
								{plan.features.map((feature, index) => (
									<li key={index}>✅ {feature}</li>
								))}
							</ul>

							<button 
								onClick={() => handleSelectPlan(plan)}
								className={`btn-pricing ${plan.popular ? 'btn-popular' : ''}`}>
								Wybierz plan
							</button>
						</div>
					))}
				</div>

				{/* INFO */}
				<div className="pricing-info">
					<h3>💡 Informacje o planach</h3>
					<ul>
						<li><strong>3 miesiące gratis</strong> - Testuj przez 3 miesiące bez płacenia!</li>
						<li><strong>Anuluj kiedy chcesz</strong> - Bez zobowiązań, bez ukrytych kosztów</li>
						<li><strong>Bezpieczne płatności</strong> - Obsługiwane przez Stripe</li>
						<li><strong>Nielimitowane organizacje</strong> - Tylko w planach półrocznym i rocznym</li>
						<li><strong>Dane bezpieczne</strong> - Backup co 24h, szyfrowanie danych</li>
					</ul>
				</div>

				{/* FAQ */}
				<div className="pricing-faq">
					<h3>❓ Często zadawane pytania</h3>
					<div className="faq-grid">
						<div className="faq-item">
							<h4>Kiedy rozpocznie się płatność?</h4>
							<p>Po 3 miesiącach darmowego okresu próbnego. Dostaniesz powiadomienie przed pierwszą płatnością.</p>
						</div>
						<div className="faq-item">
							<h4>Czy mogę zmienić plan później?</h4>
							<p>Tak! Możesz w każdej chwili zmienić plan na wyższy lub niższy.</p>
						</div>
						<div className="faq-item">
							<h4>Co jeśli chcę anulować?</h4>
							<p>Możesz anulować w każdej chwili bez dodatkowych opłat. Twoje dane będą dostępne przez 30 dni.</p>
						</div>
						<div className="faq-item">
							<h4>Czy mogę mieć wiele organizacji?</h4>
							<p>Plan miesięczny: 1 organizacja. Plany półroczny i roczny: nielimitowane organizacje.</p>
						</div>
					</div>
				</div>
			</div>

			{/* MODAL NAZWA FIRMY */}
			{showNameModal && (
				<div className="modal-overlay" onClick={() => setShowNameModal(false)}>
					<div className="modal-card" onClick={(e) => e.stopPropagation()}>
						<h2>🏢 Nazwa Twojej firmy</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Podaj nazwę organizacji która pojawi się w systemie
						</p>

						<input
							type="text"
							placeholder="np. Firma ABC Sp. z o.o."
							value={companyName}
							onChange={(e) => setCompanyName(e.target.value)}
							className="modal-input"
							autoFocus
							maxLength={100}
						/>

						<div className="modal-plan-summary">
							<strong>Wybrany plan:</strong> {selectedPlan?.name}
							<br />
							<strong>Cena:</strong> {selectedPlan?.price} zł/{selectedPlan?.period}
							<br />
							<strong>Trial:</strong> 3 miesiące gratis 🎁
						</div>

						<div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
							<button 
								onClick={handleCreateOrganization}
								className="modal-btn-primary">
								Przejdź do płatności
							</button>
							<button 
								onClick={() => {
									setShowNameModal(false)
									setCompanyName('')
								}}
								className="modal-btn-secondary">
								Anuluj
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}