import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Navbar from './Navbar'
import LandingPage from './LandingPage'
import Login from './Login'
import Register from './Register'
import Dashboard from './Dashboard'
import SelectPlanPage from './SelectPlanPage'
import PricingPage from './PricingPage'
import CheckoutPage from './CheckoutPage'
import Settings from './Settings'
import PrivacyPolicyPage from './PrivacyPolicyPage'
import TermsPage from './TermsPage'
import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore'

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

// Komponent dla użytkownika bez organizacji
function NoOrganizationScreen() {
	const navigate = useNavigate()
	const { currentUser, userProfile } = useAuth()
	const [ownedSubscription, setOwnedSubscription] = useState(null)
	const [loading, setLoading] = useState(true)
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [orgName, setOrgName] = useState('')
	const [creating, setCreating] = useState(false)

	// Sprawdź WŁASNĄ subskrypcję (z profilu lub z organizacji gdzie user jest właścicielem)
	useEffect(() => {
		const checkOwnedSubscription = async () => {
			if (!currentUser) {
				setLoading(false)
				return
			}

			console.log('🔍 [NoOrgScreen] Sprawdzam subskrypcję dla:', currentUser.email)

			// 1. Sprawdź w profilu użytkownika
			if (userProfile?.subscription) {
				console.log('📋 [NoOrgScreen] Subskrypcja w profilu:', userProfile.subscription)
				if (isSubscriptionActive(userProfile.subscription)) {
					console.log('✅ [NoOrgScreen] Aktywna subskrypcja w profilu!')
					setOwnedSubscription(userProfile.subscription)
					setLoading(false)
					return
				}
			}

			// 2. Szukaj organizacji gdzie user jest WŁAŚCICIELEM (ownerId)
			try {
				console.log('🔍 [NoOrgScreen] Szukam organizacji gdzie jestem właścicielem...')
				const orgsRef = collection(db, 'organizations')
				const q = query(orgsRef, where('ownerId', '==', currentUser.uid))
				const querySnapshot = await getDocs(q)

				console.log('📋 [NoOrgScreen] Znaleziono organizacji:', querySnapshot.size)

				for (const docSnap of querySnapshot.docs) {
					const orgData = docSnap.data()
					console.log('📋 [NoOrgScreen] Sprawdzam org:', orgData.name)
					
					if (isSubscriptionActive(orgData.subscription)) {
						console.log('✅ [NoOrgScreen] Znaleziono aktywną subskrypcję!')
						
						// Przepisz do profilu
						const userRef = doc(db, 'users', currentUser.uid)
						await setDoc(userRef, {
							subscription: orgData.subscription,
							limits: orgData.limits || { maxOrganizations: 1 },
						}, { merge: true })
						
						setOwnedSubscription(orgData.subscription)
						setLoading(false)
						return
					}
				}

				console.log('❌ [NoOrgScreen] Brak własnej aktywnej subskrypcji')
				setOwnedSubscription(null)
				setLoading(false)
			} catch (error) {
				console.error('❌ [NoOrgScreen] Błąd:', error)
				setLoading(false)
			}
		}

		checkOwnedSubscription()
	}, [currentUser, userProfile])

	const handleCreateOrg = async (e) => {
		e.preventDefault()
		if (!orgName.trim()) return

		console.log('🏢 [NoOrgScreen] Tworzenie organizacji...')
		console.log('📋 [NoOrgScreen] ownedSubscription:', ownedSubscription)

		setCreating(true)

		// BLOKADA - sprawdź czy ma aktywną subskrypcję
		if (!isSubscriptionActive(ownedSubscription)) {
			console.log('❌ [NoOrgScreen] BLOKADA - brak aktywnej subskrypcji!')
			alert('❌ Nie masz aktywnej subskrypcji.\n\nAby utworzyć własną organizację, musisz najpierw kupić plan.')
			setCreating(false)
			navigate('/pricing')
			return
		}

		try {
			const subscriptionData = ownedSubscription
			const limitsData = userProfile?.limits || { maxOrganizations: 1 }

			console.log('✅ [NoOrgScreen] Tworzę organizację z subskrypcją:', subscriptionData)

			const orgRef = await addDoc(collection(db, 'organizations'), {
				name: orgName,
				ownerId: currentUser.uid,
				ownerEmail: currentUser.email,
				subscription: subscriptionData,
				limits: limitsData,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})

			const userRef = doc(db, 'users', currentUser.uid)
			const userDoc = await getDoc(userRef)
			const userData = userDoc.data() || {}

			await setDoc(userRef, {
				...userData,
				subscription: subscriptionData,
				limits: limitsData,
				organizations: [
					{
						id: orgRef.id,
						name: orgName,
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
						isDefault: true,
						joinedAt: new Date().toISOString()
					}
				],
				currentOrganizationId: orgRef.id,
				updatedAt: new Date().toISOString()
			}, { merge: true })

			window.location.reload()
		} catch (error) {
			console.error('❌ [NoOrgScreen] Błąd:', error)
			alert('Błąd tworzenia organizacji')
			setCreating(false)
		}
	}

	const getPlanName = (planId) => {
		const plans = { 'monthly': 'Miesięczny', 'semiannual': 'Półroczny', 'annual': 'Roczny' }
		return plans[planId] || planId
	}

	if (loading) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				minHeight: '100vh',
				background: '#f5f5f5'
			}}>
				<div style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
					<p style={{ fontSize: '18px', color: '#666' }}>Sprawdzam subskrypcję...</p>
				</div>
			</div>
		)
	}

	const hasOwnSubscription = isSubscriptionActive(ownedSubscription)

	return (
		<div style={{ 
			display: 'flex', 
			justifyContent: 'center', 
			alignItems: 'center', 
			minHeight: '100vh',
			padding: '20px',
			background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
		}}>
			<div style={{
				background: 'white',
				borderRadius: '24px',
				padding: '48px',
				maxWidth: '500px',
				width: '100%',
				textAlign: 'center',
				boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
			}}>
				<div style={{ fontSize: '72px', marginBottom: '24px' }}>🏢</div>
				<h2 style={{ fontSize: '28px', marginBottom: '12px', color: '#243c4c' }}>
					Brak organizacji
				</h2>
				<p style={{ color: '#666', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6' }}>
					Nie masz jeszcze żadnej organizacji. 
					{hasOwnSubscription 
						? ' Utwórz nową aby rozpocząć pracę!'
						: ' Wybierz plan lub dołącz do istniejącego zespołu.'
					}
				</p>

				{hasOwnSubscription && (
					<div style={{
						background: '#f0fdf4',
						border: '2px solid #86efac',
						borderRadius: '12px',
						padding: '16px',
						marginBottom: '24px',
						textAlign: 'left'
					}}>
						<div style={{ fontWeight: '700', color: '#166534', marginBottom: '8px' }}>
							✅ Masz aktywny plan: {getPlanName(ownedSubscription.plan)}
						</div>
						<div style={{ fontSize: '14px', color: '#15803d' }}>
							Ważny do: {new Date(ownedSubscription.currentPeriodEnd).toLocaleDateString('pl-PL')}
						</div>
					</div>
				)}

				{hasOwnSubscription ? (
					<button 
						onClick={() => setShowCreateModal(true)}
						style={{
							padding: '16px 32px',
							background: 'linear-gradient(135deg, #94c11e 0%, #7ea518 100%)',
							color: 'white',
							border: 'none',
							borderRadius: '12px',
							fontSize: '18px',
							fontWeight: '700',
							cursor: 'pointer',
							width: '100%',
							marginBottom: '16px'
						}}>
						🏢 Utwórz organizację
					</button>
				) : (
					<button 
						onClick={() => navigate('/pricing')}
						style={{
							padding: '16px 32px',
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							color: 'white',
							border: 'none',
							borderRadius: '12px',
							fontSize: '18px',
							fontWeight: '700',
							cursor: 'pointer',
							width: '100%',
							marginBottom: '16px'
						}}>
						💳 Wybierz plan
					</button>
				)}

				<button 
					onClick={() => navigate('/landing')}
					style={{
						padding: '12px 24px',
						background: 'transparent',
						color: '#667eea',
						border: 'none',
						fontSize: '14px',
						fontWeight: '600',
						cursor: 'pointer'
					}}>
					← Powrót na stronę główną
				</button>
			</div>

			{showCreateModal && (
				<div style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0,0,0,0.5)',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					zIndex: 1000
				}} onClick={() => setShowCreateModal(false)}>
					<div style={{
						background: 'white',
						borderRadius: '16px',
						padding: '32px',
						maxWidth: '400px',
						width: '90%'
					}} onClick={e => e.stopPropagation()}>
						<h3 style={{ marginBottom: '20px' }}>🏢 Nowa organizacja</h3>
						<form onSubmit={handleCreateOrg}>
							<input
								type="text"
								placeholder="Nazwa firmy"
								value={orgName}
								onChange={e => setOrgName(e.target.value)}
								style={{
									width: '100%',
									padding: '14px',
									fontSize: '16px',
									border: '2px solid #e0e0e0',
									borderRadius: '10px',
									marginBottom: '20px',
									boxSizing: 'border-box'
								}}
								required
								autoFocus
							/>
							<div style={{ display: 'flex', gap: '12px' }}>
								<button type="submit" disabled={creating} style={{
									flex: 1,
									padding: '14px',
									background: '#94c11e',
									color: 'white',
									border: 'none',
									borderRadius: '10px',
									fontWeight: '700',
									cursor: 'pointer'
								}}>
									{creating ? 'Tworzenie...' : 'Utwórz'}
								</button>
								<button type="button" onClick={() => setShowCreateModal(false)} style={{
									flex: 1,
									padding: '14px',
									background: '#f0f0f0',
									color: '#333',
									border: 'none',
									borderRadius: '10px',
									fontWeight: '600',
									cursor: 'pointer'
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

// Protected Dashboard Component
function ProtectedDashboard() {
	const { currentUser, userProfile } = useAuth()
	const [canAccess, setCanAccess] = useState(null)
	const hasOrganization = userProfile?.organizations?.length > 0

	useEffect(() => {
		const checkAccess = async () => {
			console.log('🔍 [ProtectedDashboard] Sprawdzam dostęp...')

			if (!currentUser) {
				console.log('❌ Brak użytkownika')
				setCanAccess('no-user')
				return
			}

			if (!hasOrganization) {
				console.log('❌ Brak organizacji')
				setCanAccess('no-org')
				return
			}

			const orgId = userProfile.currentOrganizationId
			console.log('orgId:', orgId)

			// Znajdź rolę użytkownika w tej organizacji
			const currentOrgInProfile = userProfile.organizations.find(org => org.id === orgId)
			const userRole = currentOrgInProfile?.role
			console.log('Rola użytkownika:', userRole)

			// Jeśli NIE jest właścicielem - daj dostęp bez sprawdzania planu
			if (userRole && userRole !== 'Właściciel') {
				console.log('✅ Użytkownik zaproszony - dostęp bez sprawdzania planu')
				setCanAccess('ok')
				return
			}
			
			// Jeśli jest właścicielem - sprawdź czy organizacja ma plan
			if (orgId) {
				try {
					const orgDoc = await getDoc(doc(db, 'organizations', orgId))
					
					if (orgDoc.exists()) {
						const orgData = orgDoc.data()
						console.log('Subscription:', orgData.subscription)

						if (!isSubscriptionActive(orgData.subscription)) {
							console.log('❌ Właściciel bez aktywnej subskrypcji')
							setCanAccess('no-plan')
							return
						}

						console.log('✅ Dostęp OK')
						setCanAccess('ok')
					} else {
						console.log('❌ Organizacja nie istnieje w Firestore')
						setCanAccess('no-org')
					}
				} catch (error) {
					console.error('Błąd sprawdzania organizacji:', error)
					setCanAccess('no-org')
				}
			} else {
				console.log('❌ Brak orgId')
				setCanAccess('no-org')
			}
		}

		checkAccess()
	}, [currentUser, hasOrganization, userProfile])

	if (canAccess === null) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				minHeight: '100vh' 
			}}>
				<div style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
					<p style={{ fontSize: '18px', color: '#666' }}>Sprawdzam dostęp...</p>
				</div>
			</div>
		)
	}

	if (canAccess === 'no-user') {
		return <Navigate to="/login" replace />
	}

	if (canAccess === 'no-org') {
		return <NoOrganizationScreen />
	}

	if (canAccess === 'no-plan') {
		return <Navigate to="/pricing" replace />
	}

	if (canAccess === 'ok') {
		return <Dashboard />
	}

	return <Navigate to="/landing" replace />
}

function App() {
	const { currentUser, loading } = useAuth()

	if (loading) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				minHeight: '100vh',
				fontSize: '18px',
				color: '#6c757d',
				background: '#f5f5f5'
			}}>
				<div style={{
					textAlign: 'center',
					padding: '40px',
					background: 'white',
					borderRadius: '16px',
					boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
				}}>
					<div style={{
						width: '50px',
						height: '50px',
						border: '4px solid #e0e0e0',
						borderTop: '4px solid #667eea',
						borderRadius: '50%',
						margin: '0 auto 20px',
						animation: 'spin 1s linear infinite'
					}}></div>
					Ładowanie...
					<style>{`
						@keyframes spin {
							0% { transform: rotate(0deg); }
							100% { transform: rotate(360deg); }
						}
					`}</style>
				</div>
			</div>
		)
	}

	return (
		<>
			<Navbar />
			<Routes>
				{/* Strona główna */}
				<Route 
					path="/" 
					element={
						currentUser ? (
							<ProtectedDashboard />
						) : (
							<LandingPage />
						)
					} 
				/>
				
				{/* Landing */}
				<Route path="/landing" element={<LandingPage />} />
				
				{/* Auth */}
				<Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
				<Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
				
				{/* Plan selection flow */}
				<Route 
					path="/select-plan" 
					element={currentUser ? <SelectPlanPage /> : <Navigate to="/register" />} 
				/>
				<Route 
					path="/pricing" 
					element={currentUser ? <PricingPage /> : <Navigate to="/register" />} 
				/>
				<Route 
					path="/checkout" 
					element={currentUser ? <CheckoutPage /> : <Navigate to="/register" />} 
				/>
				
				{/* Settings - dostępne dla KAŻDEGO zalogowanego */}
				<Route 
					path="/settings" 
					element={currentUser ? <Settings /> : <Navigate to="/login" />} 
				/>
				
				{/* Legal pages */}
				<Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
				<Route path="/terms" element={<TermsPage />} />
				
				{/* 404 */}
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</>
	)
}

export default App