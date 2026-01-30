import { Routes, Route, Navigate } from 'react-router-dom'
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
import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'

// Protected Dashboard Component - wymaga aktywnej subskrypcji
function ProtectedDashboard() {
	const { currentUser, userProfile } = useAuth()
	const [canAccess, setCanAccess] = useState(null)
	const [expiredInfo, setExpiredInfo] = useState('')
	const hasOrganization = userProfile?.organizations?.length > 0

	useEffect(() => {
		const checkAccess = async () => {
			console.log('🔵 START CHECK ACCESS')
			
			if (!currentUser) {
				console.log('❌ BRAK USERA')
				setCanAccess('no-user')
				return
			}
			console.log('✅ USER OK')

			// Brak organizacji - przekieruj do pricing
			if (!hasOrganization) {
				console.log('❌ BRAK ORGANIZACJI')
				setCanAccess('no-org')
				return
			}
			console.log('✅ ORGANIZACJA OK')

			// NOWA LOGIKA: Sprawdź subskrypcję UŻYTKOWNIKA lub WŁAŚCICIELA organizacji
			
			// 1. Sprawdź czy user ma własną subskrypcję
			if (userProfile.subscription) {
				console.log('🔵 User ma własną subskrypcję:', userProfile.subscription)
				const result = checkSubscription(userProfile.subscription, 'Twoje konto')
				if (result !== 'ok') {
					setCanAccess(result)
					return
				}
				console.log('✅ WŁASNA SUBSKRYPCJA AKTYWNA - DOSTĘP!')
				setCanAccess('ok')
				return
			}

			// 2. User nie ma własnej subskrypcji - sprawdź subskrypcję właściciela organizacji
			console.log('🔵 User nie ma własnej subskrypcji, sprawdzam właściciela organizacji...')
			
			const orgId = userProfile.currentOrganizationId
			if (orgId) {
				const orgDoc = await getDoc(doc(db, 'organizations', orgId))
				
				if (orgDoc.exists()) {
					const orgData = orgDoc.data()
					const ownerId = orgData.ownerId
					
					// Pobierz profil właściciela
					const ownerDoc = await getDoc(doc(db, 'users', ownerId))
					
					if (ownerDoc.exists()) {
						const ownerData = ownerDoc.data()
						
						if (ownerData.subscription) {
							console.log('🔵 Subskrypcja właściciela:', ownerData.subscription)
							const result = checkSubscription(ownerData.subscription, orgData.name)
							if (result !== 'ok') {
								setCanAccess(result)
								return
							}
							console.log('✅ SUBSKRYPCJA WŁAŚCICIELA AKTYWNA - DOSTĘP!')
							setCanAccess('ok')
							return
						}
					}
				}
			}

			// Brak aktywnej subskrypcji
			console.log('❌ BRAK AKTYWNEJ SUBSKRYPCJI')
			setCanAccess('no-plan')
		}

		// Funkcja pomocnicza do sprawdzania subskrypcji
		const checkSubscription = (subscription, name) => {
			const plan = subscription.plan
			const status = subscription.status
			const periodEnd = subscription.currentPeriodEnd

			console.log('🔵 PLAN:', plan, 'STATUS:', status, 'PERIOD_END:', periodEnd)

			// Sprawdź czy plan istnieje
			if (!plan || plan === 'free') {
				console.log('❌ PLAN FREE LUB BRAK')
				return 'no-plan'
			}

			// Sprawdź status subskrypcji
			const activeStatuses = ['active', 'trialing']
			if (status && !activeStatuses.includes(status)) {
				console.log('❌ SUBSKRYPCJA NIEAKTYWNA - status:', status)
				setExpiredInfo(name)
				return 'subscription-expired'
			}

			// Sprawdź datę wygaśnięcia
			if (periodEnd) {
				const endDate = new Date(periodEnd)
				const now = new Date()
				
				if (endDate < now) {
					console.log('❌ SUBSKRYPCJA WYGASŁA - data:', periodEnd)
					setExpiredInfo(name)
					return 'subscription-expired'
				}
			}

			return 'ok'
		}

		checkAccess()
	}, [currentUser, hasOrganization, userProfile])

	// Loading
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

	// Brak użytkownika - login
	if (canAccess === 'no-user') {
		return <Navigate to="/login" replace />
	}

	// Brak organizacji - komunikat i przekierowanie do pricing
	if (canAccess === 'no-org') {
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
					textAlign: 'center',
					boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
				}}>
					<div style={{ fontSize: '72px', marginBottom: '24px' }}>🚀</div>
					<h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#243c4c' }}>
						Rozpocznij swoją firmę!
					</h2>
					<p style={{ color: '#666', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6' }}>
						Aby korzystać z panelu zarządzania, musisz najpierw wybrać plan i utworzyć organizację.
						<br /><br />
						<strong>Pierwsze 3 miesiące za darmo!</strong>
					</p>
					<button 
						onClick={() => window.location.href = '/pricing'}
						style={{
							padding: '16px 40px',
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							color: 'white',
							border: 'none',
							borderRadius: '12px',
							fontSize: '18px',
							fontWeight: '700',
							cursor: 'pointer',
							marginBottom: '16px',
							width: '100%'
						}}>
						💳 Wybierz plan
					</button>
					<button 
						onClick={() => window.location.href = '/landing'}
						style={{
							padding: '14px 24px',
							background: 'transparent',
							color: '#667eea',
							border: '2px solid #667eea',
							borderRadius: '12px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
							width: '100%'
						}}>
						← Powrót na stronę główną
					</button>
				</div>
			</div>
		)
	}

	// Brak planu
	if (canAccess === 'no-plan') {
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
					textAlign: 'center',
					boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
				}}>
					<div style={{ fontSize: '72px', marginBottom: '24px' }}>💳</div>
					<h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#243c4c' }}>
						Opłać plan aby kontynuować
					</h2>
					<p style={{ color: '#666', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6' }}>
						Aby korzystać z aplikacji, potrzebujesz aktywnej subskrypcji.
					</p>
					<button 
						onClick={() => window.location.href = '/pricing'}
						style={{
							padding: '16px 40px',
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							color: 'white',
							border: 'none',
							borderRadius: '12px',
							fontSize: '18px',
							fontWeight: '700',
							cursor: 'pointer',
							marginBottom: '16px',
							width: '100%'
						}}>
						💳 Wybierz plan
					</button>
					<button 
						onClick={() => window.location.href = '/landing'}
						style={{
							padding: '14px 24px',
							background: 'transparent',
							color: '#667eea',
							border: '2px solid #667eea',
							borderRadius: '12px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
							width: '100%'
						}}>
						← Powrót na stronę główną
					</button>
				</div>
			</div>
		)
	}

	// Subskrypcja wygasła
	if (canAccess === 'subscription-expired') {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				minHeight: '100vh',
				padding: '20px',
				background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
			}}>
				<div style={{
					background: 'white',
					borderRadius: '24px',
					padding: '48px',
					maxWidth: '520px',
					textAlign: 'center',
					boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
				}}>
					<div style={{ fontSize: '72px', marginBottom: '24px' }}>⏰</div>
					<h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#243c4c' }}>
						Subskrypcja wygasła
					</h2>
					
					<div style={{
						background: '#e8f5e9',
						border: '2px solid #4caf50',
						borderRadius: '12px',
						padding: '16px',
						marginBottom: '24px'
					}}>
						<p style={{ color: '#2e7d32', margin: 0, fontSize: '15px', fontWeight: '600' }}>
							✅ Twoje dane są bezpieczne!
						</p>
						<p style={{ color: '#388e3c', margin: '8px 0 0 0', fontSize: '14px' }}>
							Wszystkie zamówienia i dane zostały zachowane.
						</p>
					</div>
					
					<p style={{ color: '#666', marginBottom: '32px', fontSize: '16px', lineHeight: '1.6' }}>
						Aby kontynuować pracę z aplikacją, odnów subskrypcję.
					</p>
					
					<button 
						onClick={() => window.location.href = '/pricing'}
						style={{
							padding: '16px 40px',
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							color: 'white',
							border: 'none',
							borderRadius: '12px',
							fontSize: '18px',
							fontWeight: '700',
							cursor: 'pointer',
							marginBottom: '16px',
							width: '100%'
						}}>
						🔄 Odnów subskrypcję
					</button>
					
					<button 
						onClick={() => window.location.href = '/settings'}
						style={{
							padding: '14px 24px',
							background: 'transparent',
							color: '#667eea',
							border: '2px solid #667eea',
							borderRadius: '12px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
							width: '100%',
							marginBottom: '12px'
						}}>
						⚙️ Ustawienia konta
					</button>
					
					<button 
						onClick={() => window.location.href = '/landing'}
						style={{
							padding: '12px 24px',
							background: 'transparent',
							color: '#999',
							border: 'none',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
							width: '100%'
						}}>
						← Powrót na stronę główną
					</button>
				</div>
			</div>
		)
	}

	// Wszystko OK - pokaż dashboard
	if (canAccess === 'ok') {
		return <Dashboard />
	}

	return <Navigate to="/landing" replace />
}

function App() {
	const { currentUser, userProfile, loading } = useAuth()

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

	const hasOrganization = userProfile?.organizations?.length > 0

	return (
		<>
			<Navbar />
			<Routes>
				<Route 
					path="/" 
					element={
						currentUser && hasOrganization ? (
							<ProtectedDashboard />
						) : (
							<LandingPage />
						)
					} 
				/>
				
				<Route path="/landing" element={<LandingPage />} />
				
				<Route path="/login" element={!currentUser ? <Login /> : <Navigate to={hasOrganization ? "/" : "/landing"} />} />
				<Route path="/register" element={!currentUser ? <Register /> : <Navigate to={hasOrganization ? "/" : "/landing"} />} />
				
				<Route 
					path="/select-plan" 
					element={currentUser ? <SelectPlanPage /> : <Navigate to="/register" />} 
				/>
				<Route path="/pricing" element={<PricingPage />} />
				<Route 
					path="/checkout" 
					element={currentUser ? <CheckoutPage /> : <Navigate to="/register" />} 
				/>
				
				<Route path="/dashboard" element={<ProtectedDashboard />} />
				
				<Route 
					path="/settings" 
					element={currentUser ? <Settings /> : <Navigate to="/login" />} 
				/>
				
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</>
	)
}

export default App