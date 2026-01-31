import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore'
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

			// Dane subskrypcji
			const subscriptionData = {
				plan: pendingOrg.plan.id,
				status: 'active', // ACTIVE - trial to tylko info o braku platnosci
				trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
				currentPeriodStart: new Date().toISOString(),
				currentPeriodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
				cancelAtPeriodEnd: false,
				price: pendingOrg.plan.price,
				interval: pendingOrg.plan.id === 'monthly' ? 'month' : pendingOrg.plan.id === 'semiannual' ? 'half_year' : 'year',
				stripeCustomerId: `cus_mock_${Date.now()}`,
				stripeSubscriptionId: `sub_mock_${Date.now()}`
			}

			// 1. Utworz organizacje z subskrypcja
			const orgRef = await addDoc(collection(db, 'organizations'), {
				name: pendingOrg.companyName,
				ownerId: currentUser.uid,
				ownerEmail: currentUser.email,
				subscription: subscriptionData, // Subskrypcja w organizacji
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})

			// 2. Pobierz aktualne dane usera
			const userRef = doc(db, 'users', currentUser.uid)
			const userDoc = await getDoc(userRef)
			const userData = userDoc.exists() ? userDoc.data() : {}
			const existingOrgs = userData.organizations || []

			// 3. Zaktualizuj profil usera - dodaj org i subskrypcje
			await setDoc(userRef, {
				...userData,
				subscription: subscriptionData, // Subskrypcja TAKZE w profilu usera!
				organizations: [
					...existingOrgs,
					{
						id: orgRef.id,
						name: pendingOrg.companyName,
						role: 'Wlasciciel',
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
			console.error('Blad tworzenia organizacji:', error)
			alert('Wystapil blad. Sprobuj ponownie.')
			setLoading(false)
		}
	}

	if (!pendingOrg) {
		return (
			<div className="checkout-page">
				<div className="checkout-loading">Ladowanie...</div>
			</div>
		)
	}

	return (
		<div className="checkout-page">
			<div className="checkout-container">
				{success ? (
					<div className="checkout-success">
						<div className="success-icon">✅</div>
						<h2>Organizacja utworzona!</h2>
						<p>Twoja subskrypcja jest juz aktywna. Mozesz teraz korzystac z pelni mozliwosci systemu.</p>
						
						<div className="success-details">
							<div className="success-item">
								<span className="success-label">Firma:</span>
								<span className="success-value">{pendingOrg.companyName}</span>
							</div>
							<div className="success-item">
								<span className="success-label">Plan:</span>
								<span className="success-value">{pendingOrg.plan.name}</span>
							</div>
							<div className="success-item">
								<span className="success-label">Okres probny:</span>
								<span className="success-value">3 miesiace gratis 🎁</span>
							</div>
						</div>

						<div className="checkout-actions">
							<button 
								onClick={() => {
									navigate('/')
									window.location.reload()
								}}
								className="btn-checkout btn-primary">
								🏠 Przejdz do aplikacji
							</button>
						</div>
					</div>
				) : loading ? (
					<div className="checkout-processing">
						<div className="processing-spinner"></div>
						<h2>Przetwarzanie platnosci...</h2>
						<p>Prosze czekac, to zajmie chwile</p>
					</div>
				) : (
					<>
						<div className="checkout-header">
							<h1>💳 Podsumowanie zamowienia</h1>
							<p>Sprawdz szczegoly przed zakupem</p>
						</div>

						<div className="checkout-summary">
							<h3>📋 Szczegoly organizacji</h3>
							<div className="summary-item">
								<span className="summary-label">Nazwa firmy:</span>
								<span className="summary-value">{pendingOrg.companyName}</span>
							</div>
							<div className="summary-item">
								<span className="summary-label">Plan:</span>
								<span className="summary-value">{pendingOrg.plan.name}</span>
							</div>
							<div className="summary-item">
								<span className="summary-label">Cena:</span>
								<span className="summary-value">{pendingOrg.plan.price} zl/{pendingOrg.plan.period}</span>
							</div>
							<div className="summary-item">
								<span className="summary-label">Okres probny:</span>
								<span className="summary-value trial-highlight">3 miesiace gratis 🎁</span>
							</div>
							<div className="summary-divider"></div>
							<div className="summary-item summary-total">
								<span className="summary-label">Do zaplaty dzisiaj:</span>
								<span className="summary-value">0 zl</span>
							</div>
							<div className="summary-note">
								Pierwsza platnosc {pendingOrg.plan.total} zl nastapi {new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL')}
							</div>
						</div>

						<div className="checkout-info">
							<h4>ℹ️ To jest wersja testowa (Mock Payment)</h4>
							<p>
								W prawdziwej wersji tutaj pojawi sie formularz platnosci Stripe. 
								Na razie kliknij "Potwierdz zakup" aby symulowac udana platnosc.
							</p>
						</div>

						<div className="checkout-actions">
							<button 
								onClick={() => navigate('/pricing')}
								className="btn-checkout btn-secondary">
								← Wroc do planow
							</button>
							<button 
								onClick={handleMockPayment}
								className="btn-checkout btn-primary"
								disabled={loading}>
								Potwierdz zakup (Mock)
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	)
}