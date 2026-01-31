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
import TermsPage from './TermsPage'
import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'

// Funkcja sprawdzająca czy subskrypcja jest ważna
const isSubscriptionValid = (subscription) => {
	if (!subscription) return false
	// Akceptujemy: active, trialing (i wersje z wielką literą)
	const status = subscription.status?.toLowerCase()
	if (status === 'active' || status === 'trialing') return true
	// Fallback - jeśli ma plan to też OK
	if (subscription.plan) return true
	return false
}

// Protected Dashboard
function ProtectedDashboard() {
	const { currentUser, userProfile } = useAuth()
	const [canAccess, setCanAccess] = useState(null)

	useEffect(() => {
		const checkAccess = async () => {
			console.log('=== CHECK ACCESS ===')
			console.log('userProfile:', userProfile)

			if (!currentUser || !userProfile) {
				setCanAccess('no-user')
				return
			}

			// Sprawdź czy ma organizację
			if (!userProfile.organizations || userProfile.organizations.length === 0) {
				setCanAccess('no-org')
				return
			}

			// 1. Sprawdź subskrypcję w profilu usera
			console.log('User subscription:', userProfile.subscription)
			if (isSubscriptionValid(userProfile.subscription)) {
				console.log('OK - user ma subskrypcję w profilu')
				setCanAccess('ok')
				return
			}

			// 2. Sprawdź subskrypcję w ORGANIZACJI
			const orgId = userProfile.currentOrganizationId
			console.log('Sprawdzam organizację:', orgId)
			
			if (orgId) {
				try {
					const orgDoc = await getDoc(doc(db, 'organizations', orgId))
					if (orgDoc.exists()) {
						const orgData = orgDoc.data()
						console.log('Org data:', orgData)
						
						// Sprawdź subskrypcję w organizacji
						console.log('Org subscription:', orgData.subscription)
						if (isSubscriptionValid(orgData.subscription)) {
							console.log('OK - organizacja ma subskrypcję')
							setCanAccess('ok')
							return
						}
						
						// Jeśli user NIE jest właścicielem, sprawdź subskrypcję właściciela
						if (orgData.ownerId !== currentUser.uid) {
							const ownerDoc = await getDoc(doc(db, 'users', orgData.ownerId))
							if (ownerDoc.exists()) {
								const ownerSub = ownerDoc.data().subscription
								console.log('Owner subscription:', ownerSub)
								if (isSubscriptionValid(ownerSub)) {
									console.log('OK - właściciel ma subskrypcję')
									setCanAccess('ok')
									return
								}
							}
						}
					}
				} catch (err) {
					console.error('Błąd:', err)
				}
			}

			console.log('BRAK ważnej subskrypcji')
			setCanAccess('no-plan')
		}

		checkAccess()
	}, [currentUser, userProfile])

	if (canAccess === null) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<div style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
					<p style={{ fontSize: '18px', color: '#666' }}>Sprawdzam dostęp...</p>
				</div>
			</div>
		)
	}

	if (canAccess === 'no-user') return <Navigate to="/login" replace />
	if (canAccess === 'no-org') return <Navigate to="/select-plan" replace />

	if (canAccess === 'no-plan') {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', background: '#f5f5f5' }}>
				<div style={{ background: 'white', borderRadius: '20px', padding: '40px', maxWidth: '500px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
					<div style={{ fontSize: '64px', marginBottom: '20px' }}>💳</div>
					<h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#243c4c' }}>Opłać plan aby kontynuować</h2>
					<p style={{ color: '#666', marginBottom: '24px' }}>Aby korzystać z aplikacji, musisz wybrać i opłacić plan.</p>
					<button onClick={() => window.location.href = '/pricing'} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px', width: '100%' }}>
						💳 Wybierz plan
					</button>
					<button onClick={() => window.location.href = '/landing'} style={{ padding: '12px 24px', background: 'transparent', color: '#667eea', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
						← Powrót
					</button>
				</div>
			</div>
		)
	}

	return <Dashboard />
}

function App() {
	const { currentUser, userProfile, loading } = useAuth()

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
				<div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px' }}>
					<div style={{ width: '50px', height: '50px', border: '4px solid #e0e0e0', borderTop: '4px solid #667eea', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}></div>
					Ładowanie...
					<style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
				</div>
			</div>
		)
	}

	const hasOrganization = userProfile?.organizations?.length > 0

	return (
		<>
			<Navbar />
			<Routes>
				<Route path="/" element={
					!currentUser ? <LandingPage /> : 
					!hasOrganization ? <Navigate to="/select-plan" replace /> : 
					<ProtectedDashboard />
				} />
				<Route path="/landing" element={<LandingPage />} />
				<Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" replace />} />
				<Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" replace />} />
				<Route path="/select-plan" element={
					!currentUser ? <Navigate to="/register" replace /> : 
					hasOrganization ? <Navigate to="/" replace /> : 
					<SelectPlanPage />
				} />
				<Route path="/pricing" element={currentUser ? <PricingPage /> : <Navigate to="/register" replace />} />
				<Route path="/checkout" element={currentUser ? <CheckoutPage /> : <Navigate to="/register" replace />} />
				<Route path="/settings" element={currentUser ? <Settings /> : <Navigate to="/login" replace />} />
				{/* NOWA STRONA - REGULAMIN */}
				<Route path="/regulamin" element={<TermsPage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</>
	)
}

export default App