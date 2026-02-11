import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { collection, addDoc, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore'
import './SelectPlanPage.css'

// Funkcja sprawdzająca czy subskrypcja jest aktywna
function isSubscriptionActive(sub) {
	if (!sub) return false
	if (!sub.plan) return false
	if (sub.status === 'canceled') return false
	if (!sub.currentPeriodEnd) return false
	
	const endDate = new Date(sub.currentPeriodEnd)
	const now = new Date()
	
	return endDate > now
}

export default function SelectPlanPage() {
	const navigate = useNavigate()
	const { currentUser, userProfile, joinOrganizationWithCode } = useAuth()
	const [showJoinModal, setShowJoinModal] = useState(false)
	const [showNewOrgModal, setShowNewOrgModal] = useState(false)
	const [joinCode, setJoinCode] = useState('')
	const [joinLoading, setJoinLoading] = useState(false)
	const [joinError, setJoinError] = useState('')
	const [newOrgName, setNewOrgName] = useState('')
	const [newOrgLoading, setNewOrgLoading] = useState(false)
	
	// Stan dla wykrytej subskrypcji
	const [ownedSubscription, setOwnedSubscription] = useState(null)
	const [checkingSubscription, setCheckingSubscription] = useState(true)

	// Sprawdź czy użytkownik ma WŁASNĄ aktywną subskrypcję
	useEffect(() => {
		const checkForOwnedSubscription = async () => {
			if (!currentUser) {
				setCheckingSubscription(false)
				return
			}

			console.log('🔍 [SelectPlan] Sprawdzam subskrypcję...')

			// 1. Sprawdź czy ma subscription w profilu
			if (userProfile?.subscription) {
				console.log('📋 [SelectPlan] Subskrypcja w profilu:', userProfile.subscription)
				if (isSubscriptionActive(userProfile.subscription)) {
					console.log('✅ [SelectPlan] Aktywna subskrypcja w profilu!')
					setOwnedSubscription(userProfile.subscription)
					setCheckingSubscription(false)
					return
				}
			}

			// 2. Szukaj organizacji gdzie user jest WŁAŚCICIELEM
			try {
				console.log('🔍 [SelectPlan] Szukam organizacji gdzie jestem właścicielem...')
				const orgsRef = collection(db, 'organizations')
				const q = query(orgsRef, where('ownerId', '==', currentUser.uid))
				const querySnapshot = await getDocs(q)

				console.log('📋 [SelectPlan] Znaleziono organizacji:', querySnapshot.size)

				for (const docSnap of querySnapshot.docs) {
					const orgData = docSnap.data()
					console.log('📋 [SelectPlan] Sprawdzam org:', orgData.name)
					
					if (isSubscriptionActive(orgData.subscription)) {
						console.log('✅ [SelectPlan] Znaleziono aktywną subskrypcję!')
						
						// Przepisz do profilu
						const userRef = doc(db, 'users', currentUser.uid)
						await setDoc(userRef, {
							subscription: orgData.subscription,
							limits: orgData.limits || { maxOrganizations: 1 },
						}, { merge: true })

						setOwnedSubscription(orgData.subscription)
						setCheckingSubscription(false)
						return
					}
				}

				console.log('❌ [SelectPlan] Brak własnej aktywnej subskrypcji')
				setCheckingSubscription(false)
			} catch (error) {
				console.error('❌ [SelectPlan] Błąd:', error)
				setCheckingSubscription(false)
			}
		}

		checkForOwnedSubscription()
	}, [currentUser, userProfile])

	// Sprawdź czy użytkownik już ma organizację
	useEffect(() => {
		if (userProfile?.organizations?.length > 0) {
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
			navigate('/')
			window.location.reload()
		} catch (error) {
			setJoinError(error.message || 'Błąd dołączania do zespołu')
			setJoinLoading(false)
		}
	}

	// Utwórz nową organizację używając istniejącej subskrypcji
	const handleCreateNewOrg = async (e) => {
		e.preventDefault()
		if (!newOrgName.trim()) {
			alert('Wpisz nazwę firmy!')
			return
		}

		console.log('🏢 [SelectPlan] Tworzenie organizacji...')
		console.log('📋 [SelectPlan] ownedSubscription:', ownedSubscription)

		setNewOrgLoading(true)

		// BLOKADA - sprawdź czy ma aktywną subskrypcję
		if (!isSubscriptionActive(ownedSubscription)) {
			console.log('❌ [SelectPlan] BLOKADA - brak aktywnej subskrypcji!')
			alert('❌ Nie masz aktywnej subskrypcji.\n\nAby utworzyć własną organizację, musisz najpierw kupić plan.')
			setNewOrgLoading(false)
			navigate('/pricing')
			return
		}

		try {
			const subscriptionData = ownedSubscription
			const limitsData = userProfile?.limits || { maxOrganizations: 1 }

			console.log('✅ [SelectPlan] Tworzę organizację z subskrypcją:', subscriptionData)

			// Utwórz nową organizację
			const orgRef = await addDoc(collection(db, 'organizations'), {
				name: newOrgName,
				ownerId: currentUser.uid,
				ownerEmail: currentUser.email,
				subscription: subscriptionData,
				limits: limitsData,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})

			// Pobierz aktualne dane użytkownika
			const userRef = doc(db, 'users', currentUser.uid)
			const userDoc = await getDoc(userRef)
			const userData = userDoc.data() || {}
			const existingOrgs = userData?.organizations || []

			// Dodaj organizację do profilu użytkownika
			await setDoc(userRef, {
				...userData,
				subscription: subscriptionData,
				limits: limitsData,
				organizations: [
					...existingOrgs,
					{
						id: orgRef.id,
						name: newOrgName,
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

			alert(`✅ Utworzono nową organizację: ${newOrgName}`)
			setShowNewOrgModal(false)
			setNewOrgName('')
			navigate('/')
			window.location.reload()

		} catch (error) {
			console.error('❌ [SelectPlan] Błąd:', error)
			alert(`❌ Błąd: ${error.message}`)
			setNewOrgLoading(false)
		}
	}

	// Loading podczas sprawdzania subskrypcji
	if (checkingSubscription) {
		return (
			<div className="select-plan-page">
				<div className="checkout-loading">
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
					<p>Sprawdzam Twoją subskrypcję...</p>
				</div>
			</div>
		)
	}

	// Jeśli ma organizację, nie renderuj
	if (userProfile?.organizations?.length > 0) {
		return (
			<div className="select-plan-page">
				<div className="checkout-loading">Przekierowuję...</div>
			</div>
		)
	}

	// Czy ma WŁASNĄ aktywną subskrypcję
	const hasOwnSubscription = isSubscriptionActive(ownedSubscription)

	// Pobierz nazwę planu
	const getPlanName = (planId) => {
		const plans = {
			'monthly': 'Miesięczny',
			'semiannual': 'Półroczny',
			'annual': 'Roczny'
		}
		return plans[planId] || planId
	}

	return (
		<div className="select-plan-page">
			<div className="select-plan-container">
				<div className="select-plan-header">
					<h1>🎉 Witaj w CLIENT MANAGER!</h1>
					<p>Wybierz jedną z opcji aby rozpocząć</p>
				</div>

				<div className="select-plan-options">
					{/* OPCJA 1: KUP PLAN lub UTWÓRZ ORGANIZACJĘ (jeśli ma plan) */}
					{hasOwnSubscription ? (
						// Użytkownik MA aktywny plan - pozwól utworzyć organizację
						<div className="plan-option plan-option-buy" style={{ borderColor: '#94c11e', borderWidth: '3px' }}>
							<div className="plan-option-icon">🏢</div>
							<h2>Utwórz nową organizację</h2>
							<p>
								Masz aktywny plan <strong>{getPlanName(ownedSubscription.plan)}</strong>!
								<br />Utwórz nową organizację aby kontynuować.
							</p>
							<ul className="plan-option-features">
								<li>✅ Plan: {getPlanName(ownedSubscription.plan)}</li>
								<li>✅ Status: {ownedSubscription.status === 'trialing' ? 'Okres próbny' : 'Aktywny'}</li>
								<li>✅ Ważny do: {new Date(ownedSubscription.currentPeriodEnd).toLocaleDateString('pl-PL')}</li>
								<li>🎁 Nie musisz płacić ponownie!</li>
							</ul>
							<button onClick={() => setShowNewOrgModal(true)} className="btn-select-plan btn-primary" style={{ background: 'linear-gradient(135deg, #94c11e 0%, #7ea518 100%)' }}>
								🏢 Utwórz organizację
							</button>
						</div>
					) : (
						// Użytkownik NIE MA planu - pokaż opcję kupna
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
					)}

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

			{/* MODAL TWORZENIA ORGANIZACJI */}
			{showNewOrgModal && (
				<div className="modal-overlay" onClick={() => setShowNewOrgModal(false)}>
					<div className="modal-card" onClick={(e) => e.stopPropagation()}>
						<h2>🏢 Utwórz nową organizację</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Twój plan <strong>{getPlanName(ownedSubscription?.plan)}</strong> zostanie przypisany do tej organizacji
						</p>

						<form onSubmit={handleCreateNewOrg}>
							<input
								type="text"
								placeholder="Nazwa firmy"
								value={newOrgName}
								onChange={(e) => setNewOrgName(e.target.value)}
								className="modal-input"
								required
								autoFocus
							/>

							<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
								<button 
									type="submit" 
									className="modal-btn-primary"
									disabled={newOrgLoading}>
									{newOrgLoading ? 'Tworzenie...' : 'Utwórz organizację'}
								</button>
								<button 
									type="button" 
									className="modal-btn-secondary"
									onClick={() => {
										setShowNewOrgModal(false)
										setNewOrgName('')
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