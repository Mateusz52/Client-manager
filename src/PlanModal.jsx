import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export default function PlanModal({ onClose }) {
	const { userProfile } = useAuth()
	const [orgPlan, setOrgPlan] = useState(null)
	const [selectedPlan, setSelectedPlan] = useState(null)

	useEffect(() => {
		const fetchPlan = async () => {
			if (userProfile?.currentOrganizationId) {
				const orgDoc = await getDoc(doc(db, 'organizations', userProfile.currentOrganizationId))
				if (orgDoc.exists()) {
					setOrgPlan(orgDoc.data().plan)
				}
			}
		}
		fetchPlan()
	}, [userProfile])

	const plans = [
		{
			id: 'basic',
			name: 'Basic',
			price: '49',
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
			features: [
				'Nielimitowani użytkownicy',
				'Nielimitowane zamówienia',
				'API access',
				'Custom integracje',
				'24/7 support'
			]
		}
	]

	const handleSelectPlan = (planId) => {
		setSelectedPlan(planId)
		// TODO: Integracja z płatnościami
		console.log('💳 Wybrany plan:', planId)
		alert(`Płatność dla planu ${planId} zostanie wkrótce zaimplementowana!\n\nNa razie zamykam modal (w produkcji byłaby płatność).`)
		onClose()
	}

	// Nie pokazuj modala jeśli ma już płatny plan
	if (orgPlan && orgPlan !== 'free') {
		return null
	}

	return (
		<div style={{
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			background: 'rgba(0, 0, 0, 0.8)',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: 9999,
			padding: '20px',
			overflow: 'auto'
		}}>
			<div style={{
				background: 'white',
				borderRadius: '24px',
				padding: '48px',
				maxWidth: '1200px',
				width: '100%',
				maxHeight: '90vh',
				overflow: 'auto',
				position: 'relative'
			}}>
				{/* HEADER */}
				<div style={{ textAlign: 'center', marginBottom: '48px' }}>
					<div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
					<h1 style={{ 
						fontSize: '36px', 
						fontWeight: '800', 
						color: '#243c4c',
						marginBottom: '12px'
					}}>
						Wybierz plan aby kontynuować
					</h1>
					<p style={{ 
						fontSize: '18px', 
						color: '#666',
						maxWidth: '600px',
						margin: '0 auto'
					}}>
						Aby korzystać z aplikacji, wybierz plan dopasowany do Twojej firmy
					</p>
				</div>

				{/* PLANS GRID */}
				<div style={{ 
					display: 'grid', 
					gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
					gap: '24px',
					marginBottom: '32px'
				}}>
					{plans.map(plan => (
						<div 
							key={plan.id}
							style={{
								background: '#f9f9f9',
								borderRadius: '16px',
								padding: '32px 24px',
								position: 'relative',
								border: plan.popular ? '3px solid #94c11e' : '1px solid #e0e0e0',
								transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
								boxShadow: plan.popular ? '0 10px 40px rgba(148, 193, 30, 0.2)' : 'none'
							}}>
							{plan.popular && (
								<div style={{
									position: 'absolute',
									top: '-12px',
									left: '50%',
									transform: 'translateX(-50%)',
									background: '#94c11e',
									color: 'white',
									padding: '4px 16px',
									borderRadius: '12px',
									fontSize: '11px',
									fontWeight: '700',
									textTransform: 'uppercase'
								}}>
									Polecany
								</div>
							)}

							<h3 style={{ 
								fontSize: '22px', 
								fontWeight: '800',
								color: '#243c4c',
								marginBottom: '8px'
							}}>
								{plan.name}
							</h3>

							<div style={{ marginBottom: '20px' }}>
								<span style={{ 
									fontSize: '40px', 
									fontWeight: '800',
									color: '#667eea'
								}}>
									{plan.price}zł
								</span>
								<span style={{ 
									fontSize: '14px', 
									color: '#666',
									marginLeft: '6px'
								}}>
									/miesiąc
								</span>
							</div>

							<ul style={{ 
								listStyle: 'none', 
								padding: 0,
								marginBottom: '24px'
							}}>
								{plan.features.map((feature, i) => (
									<li key={i} style={{ 
										padding: '10px 0',
										fontSize: '14px',
										color: '#243c4c',
										display: 'flex',
										alignItems: 'flex-start',
										gap: '10px'
									}}>
										<span style={{ color: '#94c11e', fontSize: '16px', flexShrink: 0 }}>✓</span>
										<span>{feature}</span>
									</li>
								))}
							</ul>

							<button
								onClick={() => handleSelectPlan(plan.id)}
								style={{
									width: '100%',
									padding: '14px',
									background: plan.popular ? '#94c11e' : '#667eea',
									color: 'white',
									border: 'none',
									borderRadius: '10px',
									fontSize: '15px',
									fontWeight: '700',
									cursor: 'pointer',
									transition: 'all 0.2s ease'
								}}
								onMouseOver={(e) => {
									e.target.style.transform = 'translateY(-2px)'
									e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'
								}}
								onMouseOut={(e) => {
									e.target.style.transform = 'translateY(0)'
									e.target.style.boxShadow = 'none'
								}}
							>
								Wybierz {plan.name}
							</button>
						</div>
					))}
				</div>

				{/* INFO */}
				<div style={{
					background: '#f0f7ff',
					borderRadius: '12px',
					padding: '20px',
					textAlign: 'center',
					border: '1px solid #d0e7ff'
				}}>
					<p style={{ fontSize: '14px', color: '#243c4c', margin: 0 }}>
						💡 <strong>14 dni darmowego okresu próbnego</strong> - możesz anulować w każdej chwili
					</p>
				</div>
			</div>
		</div>
	)
}
