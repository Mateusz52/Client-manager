import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { collection, addDoc, doc, setDoc } from 'firebase/firestore'
import './CheckoutPage.css'

export default function CheckoutPage() {
	const navigate = useNavigate()
	const { currentUser } = useAuth()
	const [loading, setLoading] = useState(false)
	const [success, setSuccess] = useState(false)
	const [pendingOrg, setPendingOrg] = useState(null)

	useEffect(() => {
		const data = localStorage.getItem('pendingOrganization')
		if (!data) {
			navigate('/pricing')
			return
		}
		setPendingOrg(JSON.parse(data))
	}, [navigate])

	const handleMockPayment = async () => {
		if (!currentUser || !pendingOrg) return

		setLoading(true)

		try {
			await new Promise(resolve => setTimeout(resolve, 2000))

			const orgRef = await addDoc(collection(db, 'organizations'), {
				name: pendingOrg.companyName,
				ownerId: currentUser.uid,
				ownerEmail: currentUser.email,
				subscription: {
					plan: pendingOrg.plan.id,
					status: 'trialing',
					trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
					currentPeriodStart: new Date().toISOString(),
					currentPeriodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
					cancelAtPeriodEnd: false,
					price: pendingOrg.plan.price,
					interval: pendingOrg.plan.id === 'monthly' ? 'month' : pendingOrg.plan.id === 'semiannual' ? 'half_year' : 'year',
					stripeCustomerId: `cus_mock_${Date.now()}`,
					stripeSubscriptionId: `sub_mock_${Date.now()}`
				},
				limits: {
					maxOrganizations: pendingOrg.plan.id === 'monthly' ? 1 : 999,
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})

			const userRef = doc(db, 'users', currentUser.uid)
			const userDoc = await import('firebase/firestore').then(m => m.getDoc(userRef))
			
			const userData = userDoc.data()
			const existingOrgs = userData?.organizations || []

			await setDoc(userRef, {
				...userData,
				organizations: [
					...existingOrgs,
					{
						id: orgRef.id,
						name: pendingOrg.companyName,
						role: 'Właściciel',
						permissions: {
							canAddOrders: true,
							canEditOrders: true,
							canDeleteOrders: true,
							canViewStatistics: true,
							canExportPDF: true,
							canConfigureProducts: true,
							canManageTeam: true,
							canChangePlan: true,
						},
						isDefault: existingOrgs.length === 0,
						joinedAt: new Date().toISOString()
					}
				],
				currentOrganizationId: orgRef.id,
				updatedAt: new Date().toISOString()
			}, { merge: true })

			localStorage.removeItem('pendingOrganization')
			setLoading(false)
			setSuccess(true)

		} catch (error) {
			console.error('Błąd tworzenia organizacji:', error)
			alert('Wystąpił błąd podczas tworzenia organizacji. Spróbuj ponownie.')
			setLoading(false)
		}
	}

	if (!pendingOrg) {
		return (
			<div className="checkout-page">
				<div className="checkout-loading">Ładowanie...</div>
			</div>
		)
	}

	return (
		<div className="checkout-page">
			<div className="checkout-container">
				{success ? (
					/* EKRAN SUKCESU */
					<div className="checkout-success">
						<div className="success-icon">✅</div>
						<h2>Organizacja utworzona!</h2>
						<p>Twoja subskrypcja jest już aktywna. Możesz teraz korzystać z pełni możliwości systemu.</p>
						
						<div className="success-details">
							<div className="success-item">
								<span className="success-label">Firma: </span>
								<span className="success-value">{pendingOrg.companyName}</span>
							</div>
							<div className="success-item">
								<span className="success-label">Plan: </span>
								<span className="success-value">{pendingOrg.plan.name}</span>
							</div>
							<div className="success-item">
								<span className="success-label">Okres próbny: </span>
								<span className="success-value">3 miesiące gratis 🎁</span>
							</div>
						</div>

						<div className="checkout-actions">
							<button 
								onClick={() => {
									navigate('/')
									window.location.reload()
								}}
								className="btn-checkout btn-primary">
								🏠 Przejdź do aplikacji
							</button>
						</div>
					</div>
				) : loading ? (
					/* EKRAN ŁADOWANIA */
					<div className="checkout-processing">
						<div className="processing-spinner"></div>
						<h2>Przetwarzanie płatności...</h2>
						<p>Proszę czekać, to zajmie chwilę</p>
					</div>
				) : (
					/* EKRAN CHECKOUT */
					<>
						<div className="checkout-header">
							<h1>💳 Podsumowanie zamówienia</h1>
							<p>Sprawdź szczegóły przed zakupem</p>
						</div>

						<div className="checkout-summary">
							<h3>📋 Szczegóły organizacji</h3>
							<div className="summary-item">
								<span className="summary-label">Nazwa firmy: </span>
								<span className="summary-value">{pendingOrg.companyName}</span>
							</div>
							<div className="summary-item">
								<span className="summary-label">Plan: </span>
								<span className="summary-value">{pendingOrg.plan.name}</span>
							</div>
							<div className="summary-item">
								<span className="summary-label">Cena: </span>
								<span className="summary-value">{pendingOrg.plan.price} zł/{pendingOrg.plan.period}</span>
							</div>
							<div className="summary-item">
								<span className="summary-label">Okres próbny: </span>
								<span className="summary-value trial-highlight">3 miesiące gratis 🎁</span>
							</div>
							<div className="summary-divider"></div>
							<div className="summary-item summary-total">
								<span className="summary-label">Do zapłaty dzisiaj: </span>
								<span className="summary-value">0 zł</span>
							</div>
							<div className="summary-note">
								Pierwsza płatność {pendingOrg.plan.total} zł nastąpi {new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL')}
							</div>
						</div>

						<div className="checkout-info">
							<h4>ℹ️ To jest wersja testowa (Mock Payment)</h4>
							<p>
								W prawdziwej wersji tutaj pojawi się formularz płatności Stripe. 
								Na razie kliknij "Potwierdź zakup" aby symulować udaną płatność i utworzyć organizację.
							</p>
						</div>

						<div className="checkout-actions">
							<button 
								onClick={() => navigate('/pricing')}
								className="btn-checkout btn-secondary">
								← Wróć do planów
							</button>
							<button 
								onClick={handleMockPayment}
								className="btn-checkout btn-primary"
								disabled={loading}>
								Potwierdź zakup (Mock)
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	)
}