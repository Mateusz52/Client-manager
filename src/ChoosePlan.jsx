import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import './Auth.css'

export default function ChoosePlan() {
	const { currentUser, userProfile } = useAuth()
	const navigate = useNavigate()
	const [selectedPlan, setSelectedPlan] = useState(null)
	const [loading, setLoading] = useState(true)
	const [orgPlan, setOrgPlan] = useState(null)

	useEffect(() => {
		const checkPlan = async () => {
			if (!currentUser) {
				navigate('/login')
				return
			}

			if (!userProfile) {
				console.log('⏳ Czekam na profil...')
				return
			}

			// Pobierz plan organizacji z Firebase
			const orgId = userProfile.currentOrganizationId
			if (orgId) {
				const orgDoc = await getDoc(doc(db, 'organizations', orgId))
				if (orgDoc.exists()) {
					const plan = orgDoc.data().plan
					console.log('📊 Aktualny plan:', plan)
					setOrgPlan(plan)
					
					// Jeśli ma już płatny plan, przekieruj do aplikacji
					if (plan !== 'free') {
						console.log('✅ Ma płatny plan - przekierowuję do app')
						navigate('/')
						return
					}
				}
			}

			setLoading(false)
		}

		checkPlan()
	}, [currentUser, userProfile, navigate])

	const plans = [
		{
			id: 'basic',
			name: 'Basic',
			price: '49',
			period: 'miesięcznie',
			features: [
				'Do 10 użytkowników',
				'100 zamówień/miesiąc',
				'Podstawowe statystyki',
				'Email support'
			]
		},
		{
			id: 'pro',
			name: 'Pro',
			price: '99',
			period: 'miesięcznie',
			popular: true,
			features: [
				'Do 50 użytkowników',
				'Nielimitowane zamówienia',
				'Zaawansowane statystyki',
				'Export do PDF',
				'Priority support'
			]
		},
		{
			id: 'enterprise',
			name: 'Enterprise',
			price: '199',
			period: 'miesięcznie',
			features: [
				'Nielimitowani użytkownicy',
				'Nielimitowane zamówienia',
				'Dedykowany account manager',
				'API access',
				'Custom integracje',
				'24/7 support'
			]
		}
	]

	const handleSelectPlan = (planId) => {
		setSelectedPlan(planId)
		// TODO: Przekieruj do płatności Stripe/PayPal
		console.log('💳 Wybrany plan:', planId)
		alert(`Płatność dla planu ${planId} zostanie wkrótce zaimplementowana!`)
	}

	if (loading) {
		return (
			<div className="auth-container">
				<div className="auth-card">
					<div className="auth-header">
						<h1 className="auth-title">Ładowanie...</h1>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div style={{ 
			minHeight: '100vh', 
			background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			padding: '60px 20px'
		}}>
			<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
				{/* HEADER */}
				<div style={{ textAlign: 'center', marginBottom: '60px' }}>
					<h1 style={{ 
						fontSize: '48px', 
						fontWeight: '800', 
						color: 'white',
						marginBottom: '16px'
					}}>
						Wybierz swój plan
					</h1>
					<p style={{ 
						fontSize: '20px', 
						color: 'rgba(255,255,255,0.9)',
						maxWidth: '600px',
						margin: '0 auto'
					}}>
						Aby kontynuować, wybierz plan dopasowany do potrzeb Twojej firmy
					</p>
				</div>

				{/* PLANS GRID */}
				<div style={{ 
					display: 'grid', 
					gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
					gap: '32px',
					marginBottom: '40px'
				}}>
					{plans.map(plan => (
						<div 
							key={plan.id}
							style={{
								background: 'white',
								borderRadius: '20px',
								padding: '40px',
								position: 'relative',
								boxShadow: plan.popular ? '0 20px 60px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.15)',
								transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
								border: plan.popular ? '3px solid #94c11e' : 'none'
							}}>
							{plan.popular && (
								<div style={{
									position: 'absolute',
									top: '-15px',
									left: '50%',
									transform: 'translateX(-50%)',
									background: '#94c11e',
									color: 'white',
									padding: '6px 24px',
									borderRadius: '20px',
									fontSize: '13px',
									fontWeight: '700',
									textTransform: 'uppercase'
								}}>
									Najpopularniejszy
								</div>
							)}

							<h3 style={{ 
								fontSize: '24px', 
								fontWeight: '800',
								color: '#243c4c',
								marginBottom: '12px'
							}}>
								{plan.name}
							</h3>

							<div style={{ marginBottom: '24px' }}>
								<span style={{ 
									fontSize: '48px', 
									fontWeight: '800',
									color: '#667eea'
								}}>
									{plan.price}zł
								</span>
								<span style={{ 
									fontSize: '16px', 
									color: '#666',
									marginLeft: '8px'
								}}>
									/{plan.period}
								</span>
							</div>

							<ul style={{ 
								listStyle: 'none', 
								padding: 0,
								marginBottom: '32px'
							}}>
								{plan.features.map((feature, i) => (
									<li key={i} style={{ 
										padding: '12px 0',
										borderBottom: '1px solid #f0f0f0',
										fontSize: '15px',
										color: '#243c4c',
										display: 'flex',
										alignItems: 'center',
										gap: '12px'
									}}>
										<span style={{ color: '#94c11e', fontSize: '18px' }}>✓</span>
										{feature}
									</li>
								))}
							</ul>

							<button
								onClick={() => handleSelectPlan(plan.id)}
								style={{
									width: '100%',
									padding: '16px',
									background: plan.popular ? '#94c11e' : '#667eea',
									color: 'white',
									border: 'none',
									borderRadius: '12px',
									fontSize: '16px',
									fontWeight: '700',
									cursor: 'pointer',
									transition: 'all 0.3s ease'
								}}
								onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
								onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
							>
								Wybierz {plan.name}
							</button>
						</div>
					))}
				</div>

				{/* INFO */}
				<div style={{
					background: 'rgba(255,255,255,0.15)',
					borderRadius: '16px',
					padding: '24px',
					textAlign: 'center',
					color: 'white'
				}}>
					<p style={{ fontSize: '16px', marginBottom: '8px' }}>
						💡 <strong>Wszystkie plany zawierają 14-dniowy darmowy okres próbny</strong>
					</p>
					<p style={{ fontSize: '14px', opacity: 0.9 }}>
						Możesz anulować w każdej chwili bez żadnych opłat
					</p>
				</div>
			</div>
		</div>
	)
}
