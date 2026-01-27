import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'
import { db } from './firebase'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import './Settings.css'

export default function CreateFirstOrganization() {
	const { currentUser, userProfile, logout } = useAuth()
	const navigate = useNavigate()
	const [orgName, setOrgName] = useState('')
	const [creating, setCreating] = useState(false)
	const [error, setError] = useState('')

	const handleCreateOrganization = async (e) => {
		e.preventDefault()
		setError('')

		if (!orgName.trim()) {
			setError('Wpisz nazwę organizacji')
			return
		}

		setCreating(true)

		try {
			// Utwórz nową organizację z tym samym planem co miał user
			const newOrgRef = await addDoc(collection(db, 'organizations'), {
				name: orgName,
				ownerId: currentUser.uid,
				ownerEmail: currentUser.email,
				subscription: {
					plan: userProfile.paidPlan, // Plan który user miał
					status: 'active',
					trialEndsAt: null,
					currentPeriodStart: new Date().toISOString(),
					currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
					cancelAtPeriodEnd: false,
					price: userProfile.paidPlan === 'monthly' ? 59 : userProfile.paidPlan === 'semiannual' ? 89 : 109,
					interval: userProfile.paidPlan === 'monthly' ? 'month' : 'year',
					stripeCustomerId: `cus_mock_${Date.now()}`,
					stripeSubscriptionId: `sub_mock_${Date.now()}`
				},
				limits: {
					maxOrganizations: userProfile.paidPlan === 'annual' ? 999 : 1
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})

			// Zaktualizuj profil użytkownika
			const userRef = doc(db, 'users', currentUser.uid)
			
			await updateDoc(userRef, {
				organizations: [
					{
						id: newOrgRef.id,
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
				currentOrganizationId: newOrgRef.id,
				updatedAt: new Date().toISOString()
			})

			alert(`✅ Utworzono nową organizację: ${orgName}!`)
			window.location.href = '/'

		} catch (error) {
			console.error('Błąd tworzenia organizacji:', error)
			setError(`❌ Błąd: ${error.message}`)
			setCreating(false)
		}
	}

	return (
		<div style={{
			minHeight: '100vh',
			background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			padding: '20px'
		}}>
			<div style={{
				background: 'white',
				borderRadius: '16px',
				boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
				padding: '40px',
				maxWidth: '500px',
				width: '100%'
			}}>
				<div style={{ textAlign: 'center', marginBottom: '32px' }}>
					<div style={{ fontSize: '64px', marginBottom: '16px' }}>🏢</div>
					<h1 style={{ 
						fontSize: '28px', 
						fontWeight: '700', 
						color: '#1a202c',
						marginBottom: '12px'
					}}>
						Utwórz nową organizację
					</h1>
					<p style={{ 
						fontSize: '16px', 
						color: '#718096',
						lineHeight: '1.6'
					}}>
						Nie masz obecnie żadnych organizacji. Wykorzystaj swój płatny plan <strong>({userProfile?.paidPlan})</strong> i utwórz nową firmę!
					</p>
				</div>

				<div style={{
					background: '#e6fffa',
					border: '2px solid #38b2ac',
					borderRadius: '12px',
					padding: '16px',
					marginBottom: '32px'
				}}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<span style={{ fontSize: '32px' }}>✅</span>
						<div>
							<div style={{ fontWeight: '600', color: '#234e52', marginBottom: '4px' }}>
								Masz aktywny plan: {userProfile?.paidPlan === 'monthly' ? 'Miesięczny' : userProfile?.paidPlan === 'semiannual' ? 'Półroczny' : 'Roczny'}
							</div>
							<div style={{ fontSize: '14px', color: '#2c7a7b' }}>
								Możesz utworzyć nową organizację z tym samym planem
							</div>
						</div>
					</div>
				</div>

				<form onSubmit={handleCreateOrganization}>
					<div style={{ marginBottom: '24px' }}>
						<label style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: '#2d3748',
							marginBottom: '8px'
						}}>
							Nazwa organizacji *
						</label>
						<input
							type="text"
							placeholder="np. Moja Firma Sp. z o.o."
							value={orgName}
							onChange={(e) => setOrgName(e.target.value)}
							disabled={creating}
							required
							autoFocus
							style={{
								width: '100%',
								padding: '12px 16px',
								fontSize: '16px',
								border: '2px solid #e2e8f0',
								borderRadius: '8px',
								outline: 'none',
								transition: 'all 0.2s',
								boxSizing: 'border-box'
							}}
							onFocus={(e) => e.target.style.borderColor = '#667eea'}
							onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
						/>
					</div>

					{error && (
						<div style={{
							padding: '12px',
							background: '#fee',
							border: '1px solid #fcc',
							borderRadius: '8px',
							color: '#c33',
							fontSize: '14px',
							marginBottom: '20px'
						}}>
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={creating}
						style={{
							width: '100%',
							padding: '14px',
							fontSize: '16px',
							fontWeight: '600',
							color: 'white',
							background: creating ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							border: 'none',
							borderRadius: '8px',
							cursor: creating ? 'not-allowed' : 'pointer',
							transition: 'all 0.2s',
							marginBottom: '16px'
						}}
						onMouseEnter={(e) => {
							if (!creating) {
								e.target.style.transform = 'translateY(-2px)'
								e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)'
							}
						}}
						onMouseLeave={(e) => {
							e.target.style.transform = 'translateY(0)'
							e.target.style.boxShadow = 'none'
						}}
					>
						{creating ? '⏳ Tworzenie organizacji...' : '🏢 Utwórz organizację'}
					</button>

					<button
						type="button"
						onClick={logout}
						disabled={creating}
						style={{
							width: '100%',
							padding: '12px',
							fontSize: '14px',
							color: '#718096',
							background: 'transparent',
							border: '2px solid #e2e8f0',
							borderRadius: '8px',
							cursor: creating ? 'not-allowed' : 'pointer',
							transition: 'all 0.2s'
						}}
					>
						Wyloguj się
					</button>
				</form>
			</div>
		</div>
	)
}