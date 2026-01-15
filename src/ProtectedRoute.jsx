import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export default function ProtectedRoute({ children }) {
	const { currentUser, userProfile, loading } = useAuth()
	const [checking, setChecking] = useState(true)
	const [hasPlan, setHasPlan] = useState(false)

	useEffect(() => {
		const checkPlan = async () => {
			if (loading) {
				console.log('⏳ Auth loading...')
				return
			}

			if (!currentUser) {
				console.log('❌ Brak usera - redirect na login')
				setChecking(false)
				return
			}

			if (!userProfile) {
				console.log('⏳ Czekam na profil...')
				return
			}

			// Sprawdź plan organizacji
			const orgId = userProfile.currentOrganizationId
			if (orgId) {
				const orgDoc = await getDoc(doc(db, 'organizations', orgId))
				if (orgDoc.exists()) {
					const plan = orgDoc.data().plan
					console.log('📊 Plan:', plan)
					
					// Jeśli free - przekieruj na wybór planu
					if (plan === 'free') {
						console.log('❌ Free plan - redirect na choose-plan')
						setHasPlan(false)
					} else {
						console.log('✅ Płatny plan - dostęp OK')
						setHasPlan(true)
					}
				}
			}

			setChecking(false)
		}

		checkPlan()
	}, [currentUser, userProfile, loading])

	// Loading
	if (loading || checking) {
		return (
			<div style={{ 
				display: 'flex', 
				justifyContent: 'center', 
				alignItems: 'center', 
				height: '100vh' 
			}}>
				<div style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
					<p style={{ fontSize: '18px', color: '#666' }}>Ładowanie...</p>
				</div>
			</div>
		)
	}

	// Nie zalogowany
	if (!currentUser) {
		return <Navigate to="/login" replace />
	}

	// Brak płatnego planu
	if (!hasPlan) {
		return <Navigate to="/choose-plan" replace />
	}

	// Wszystko OK
	return children
}
