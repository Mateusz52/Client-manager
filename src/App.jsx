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
import CreateFirstOrganization from './CreateFirstOrganization'
import Settings from './Settings'  // ✅ DODANE
import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'

// Protected Dashboard Component
function ProtectedDashboard() {
	const { currentUser, userProfile } = useAuth()
	const [canAccess, setCanAccess] = useState(null)
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

			// ✅ NOWA LOGIKA - Sprawdź czy user nie ma org ale ma plan
			if (userProfile?.hasNoOrganizations && userProfile?.canCreateOrganization) {
				console.log('⚠️ User nie ma organizacji ale ma płatny plan')
				setCanAccess('needs-organization')
				return
			}

			if (!hasOrganization) {
				console.log('❌ BRAK ORGANIZACJI')
				setCanAccess('no-org')
				return
			}
			console.log('✅ ORGANIZACJA OK')

			const orgId = userProfile.currentOrganizationId
			console.log('🔵 orgId:', orgId)
			
			if (orgId) {
				const orgDoc = await getDoc(doc(db, 'organizations', orgId))
				console.log('🔵 orgDoc.exists():', orgDoc.exists())
				
				if (orgDoc.exists()) {
					const orgData = orgDoc.data()
					console.log('🔵 orgData:', orgData)
					
					const plan = orgData.subscription?.plan || orgData.plan
					console.log('🔵 PLAN:', plan)

					if (!plan || plan === 'free') {
						console.log('❌ PLAN FREE LUB BRAK')
						setCanAccess('no-plan')
						return
					}

					console.log('✅ PLAN OK - DOSTĘP!')
					setCanAccess('ok')
				}
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

	// ✅ NOWE - User nie ma org ale ma plan
	if (canAccess === 'needs-organization') {
		return <Navigate to="/create-first-organization" replace />
	}

	if (canAccess === 'no-org') {
		return <Navigate to="/select-plan" replace />
	}

	if (canAccess === 'no-plan') {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				minHeight: '100vh',
				padding: '20px',
				background: '#f5f5f5'
			}}>
				<div style={{
					background: 'white',
					borderRadius: '20px',
					padding: '40px',
					maxWidth: '500px',
					textAlign: 'center',
					boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
				}}>
					<div style={{ fontSize: '64px', marginBottom: '20px' }}>💳</div>
					<h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#243c4c' }}>
						Opłać plan aby kontynuować
					</h2>
					<p style={{ color: '#666', marginBottom: '24px' }}>
						Aby korzystać z aplikacji, musisz wybrać i opłacić plan dopasowany do Twojej firmy.
					</p>
					<button 
						onClick={() => window.location.href = '/pricing'}
						style={{
							padding: '14px 32px',
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							color: 'white',
							border: 'none',
							borderRadius: '12px',
							fontSize: '16px',
							fontWeight: '700',
							cursor: 'pointer',
							marginBottom: '12px',
							width: '100%'
						}}>
						💳 Wybierz plan
					</button>
					<button 
						onClick={() => window.location.href = '/landing'}
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
			</div>
		)
	}

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
				{/* / - Dashboard dla zalogowanych, Landing dla niezalogowanych */}
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
				
				{/* Landing - osobna route */}
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
				
				{/* ✅ NOWE - Strona tworzenia pierwszej organizacji */}
				<Route 
					path="/create-first-organization" 
					element={currentUser ? <CreateFirstOrganization /> : <Navigate to="/register" />} 
				/>
				
				{/* ✅ NOWE - Ustawienia */}
				<Route 
					path="/settings" 
					element={currentUser && hasOrganization ? <Settings /> : <Navigate to="/login" />} 
				/>
				
				{/* 404 */}
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</>
	)
}

export default App