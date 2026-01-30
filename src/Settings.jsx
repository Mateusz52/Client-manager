import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import './Settings.css'

export default function Settings() {
	const { currentUser, userProfile, logout } = useAuth()
	const [activeTab, setActiveTab] = useState('account')
	const [loading, setLoading] = useState(true)
	
	// Organizacje z pełnymi danymi
	const [organizationsData, setOrganizationsData] = useState([])
	const [orgsLoading, setOrgsLoading] = useState(true)
	
	// Account form
	const [displayName, setDisplayName] = useState('')
	const [email, setEmail] = useState('')
	const [saving, setSaving] = useState(false)
	
	// Akcje na organizacjach
	const [actionLoading, setActionLoading] = useState(null)
	
	// Modal tworzenia organizacji
	const [showNewOrgModal, setShowNewOrgModal] = useState(false)
	const [newOrgName, setNewOrgName] = useState('')
	const [newOrgLoading, setNewOrgLoading] = useState(false)

	useEffect(() => {
		if (currentUser && userProfile) {
			setDisplayName(userProfile.displayName || '')
			setEmail(currentUser.email || '')
			setLoading(false)
			loadOrganizationsData()
		}
	}, [currentUser, userProfile])

	const loadOrganizationsData = async () => {
		try {
			setOrgsLoading(true)
			const organizations = userProfile?.organizations || []
			const orgsWithData = []
			
			for (const org of organizations) {
				const orgRef = doc(db, 'organizations', org.id)
				const orgSnap = await getDoc(orgRef)

				if (orgSnap.exists()) {
					const orgData = orgSnap.data()
					orgsWithData.push({
						id: org.id,
						name: orgData.name,
						role: org.role,
						isOwner: orgData.ownerId === currentUser.uid,
						createdAt: orgData.createdAt
					})
				}
			}
			
			setOrganizationsData(orgsWithData)
			setOrgsLoading(false)
		} catch (error) {
			console.error('Błąd ładowania organizacji:', error)
			setOrgsLoading(false)
		}
	}

	const handleSaveAccount = async (e) => {
		e.preventDefault()
		setSaving(true)

		try {
			const userRef = doc(db, 'users', currentUser.uid)
			await updateDoc(userRef, {
				displayName: displayName,
				updatedAt: new Date().toISOString()
			})

			alert('✅ Dane zapisane!')
			setSaving(false)
		} catch (error) {
			console.error('Błąd zapisu:', error)
			alert('❌ Błąd zapisu danych')
			setSaving(false)
		}
	}

	const handleCancelSubscription = async () => {
		if (!userProfile?.subscription) return
		
		if (!confirm('Czy na pewno chcesz anulować subskrypcję?\n\nDostęp pozostanie aktywny do końca bieżącego okresu rozliczeniowego.')) {
			return
		}

		try {
			const userRef = doc(db, 'users', currentUser.uid)
			await updateDoc(userRef, {
				'subscription.cancelAtPeriodEnd': true,
				updatedAt: new Date().toISOString()
			})

			alert('✅ Subskrypcja zostanie anulowana na koniec okresu rozliczeniowego.')
			window.location.reload()
		} catch (error) {
			console.error('Błąd anulowania:', error)
			alert('❌ Błąd anulowania subskrypcji')
		}
	}

	// UTWÓRZ ORGANIZACJĘ
	const handleCreateNewOrg = async (e) => {
		e.preventDefault()
		if (!newOrgName.trim()) {
			alert('Wpisz nazwę firmy!')
			return
		}

		setNewOrgLoading(true)

		try {
			const maxOrgs = 15
			const userOwnedOrgs = userProfile?.organizations?.filter(org => org.role === 'Właściciel') || []

			if (userOwnedOrgs.length >= maxOrgs) {
				alert(`❌ Osiągnąłeś limit organizacji (${maxOrgs}).`)
				setNewOrgLoading(false)
				return
			}

			const newOrgRef = await addDoc(collection(db, 'organizations'), {
				name: newOrgName,
				ownerId: currentUser.uid,
				ownerEmail: currentUser.email,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})

			const userRef = doc(db, 'users', currentUser.uid)
			const existingOrgs = userProfile?.organizations || []
			
			await updateDoc(userRef, {
				organizations: [
					...existingOrgs,
					{
						id: newOrgRef.id,
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
				currentOrganizationId: newOrgRef.id,
				updatedAt: new Date().toISOString()
			})

			alert(`✅ Utworzono nową organizację: ${newOrgName}`)
			setShowNewOrgModal(false)
			setNewOrgName('')
			window.location.reload()

		} catch (error) {
			console.error('Błąd tworzenia organizacji:', error)
			alert(`❌ Błąd: ${error.message}`)
			setNewOrgLoading(false)
		}
	}

	// OPUŚĆ ZESPÓŁ
	const handleLeaveOrganization = async (orgId, orgName) => {
		if (!confirm(`Czy na pewno chcesz opuścić zespół "${orgName}"?\n\nStracisz dostęp do wszystkich danych tej organizacji.`)) {
			return
		}

		setActionLoading(orgId)

		try {
			const leaveOrganization = httpsCallable(functions, 'leaveOrganization')
			const result = await leaveOrganization({ organizationId: orgId })

			alert(`✅ ${result.data.message}`)
			window.location.reload()

		} catch (error) {
			console.error('Błąd opuszczania zespołu:', error)
			alert(`❌ Błąd: ${error.message}`)
			setActionLoading(null)
		}
	}

	// USUŃ ZESPÓŁ
	const handleDeleteOrganization = async (orgId, orgName) => {
		const confirmText = prompt(
			`⚠️ UWAGA! Ta akcja jest nieodwracalna!\n\n` +
			`Aby usunąć zespół "${orgName}", wpisz jego nazwę poniżej:`
		)

		if (confirmText !== orgName) {
			if (confirmText !== null) {
				alert('❌ Nazwa zespołu nie zgadza się. Usuwanie anulowane.')
			}
			return
		}

		setActionLoading(orgId)

		try {
			const deleteOrganization = httpsCallable(functions, 'deleteOrganization')
			const result = await deleteOrganization({ 
				organizationId: orgId,
				confirmName: confirmText
			})

			const membersInfo = result.data.membersRemoved > 0 
				? `\n${result.data.membersRemoved} członków zostało wyrzuconych.` 
				: ''

			alert(`✅ ${result.data.message}${membersInfo}`)
			window.location.reload()

		} catch (error) {
			console.error('Błąd usuwania zespołu:', error)
			alert(`❌ Błąd: ${error.message}`)
			setActionLoading(null)
		}
	}

	if (loading) {
		return <div className="settings-loading">Ładowanie ustawień...</div>
	}

	const subscription = userProfile?.subscription

	return (
		<div className="settings-page">
			<div className="settings-header">
				<h1>⚙️ Ustawienia</h1>
				<p>Zarządzaj swoim kontem, organizacjami i subskrypcją</p>
			</div>

			<div className="settings-tabs">
				<button 
					className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
					onClick={() => setActiveTab('account')}>
					👤 Konto
				</button>
				<button 
					className={`settings-tab ${activeTab === 'organizations' ? 'active' : ''}`}
					onClick={() => setActiveTab('organizations')}>
					🏢 Organizacje
				</button>
				<button 
					className={`settings-tab ${activeTab === 'subscription' ? 'active' : ''}`}
					onClick={() => setActiveTab('subscription')}>
					💳 Subskrypcja
				</button>
				<button 
					className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
					onClick={() => setActiveTab('security')}>
					🔒 Bezpieczeństwo
				</button>
			</div>

			<div className="settings-content">
				{/* KONTO */}
				{activeTab === 'account' && (
					<div className="settings-section">
						<h2>Informacje o koncie</h2>
						
						<form onSubmit={handleSaveAccount}>
							<div className="form-group">
								<label>Imię i nazwisko</label>
								<input
									type="text"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									className="settings-input"
									required
								/>
							</div>

							<div className="form-group">
								<label>Email</label>
								<input
									type="email"
									value={email}
									className="settings-input"
									disabled
								/>
								<small>Email nie może być zmieniony</small>
							</div>

							<button type="submit" className="btn-save" disabled={saving}>
								{saving ? 'Zapisywanie...' : '💾 Zapisz zmiany'}
							</button>
						</form>

						<div className="danger-zone">
							<h3>Strefa niebezpieczna</h3>
							<p>Usuń swoje konto na zawsze. Ta akcja jest nieodwracalna.</p>
							<button className="btn-danger" onClick={() => alert('Funkcja wkrótce')}>
								🗑️ Usuń konto
							</button>
						</div>
					</div>
				)}

				{/* ORGANIZACJE */}
				{activeTab === 'organizations' && (
					<div className="settings-section">
						<h2>Twoje organizacje</h2>
						<p className="section-description">
							Zarządzaj zespołami do których należysz lub które stworzyłeś.
							<span style={{ display: 'block', marginTop: '8px', color: '#667eea', fontWeight: '600' }}>
								Limit organizacji: 15
							</span>
						</p>

						{orgsLoading ? (
							<div className="orgs-loading">Ładowanie organizacji...</div>
						) : organizationsData.length === 0 ? (
							<div className="no-organizations">
								<div className="no-org-icon">🏢</div>
								<h3>Brak organizacji</h3>
								<p>Nie należysz jeszcze do żadnej organizacji.</p>
								<button className="btn-primary" onClick={() => setShowNewOrgModal(true)}>
									🚀 Utwórz organizację
								</button>
							</div>
						) : (
							<div className="organizations-list">
								{organizationsData.map(org => (
									<div key={org.id} className={`org-card ${org.isOwner ? 'org-card-owner' : ''}`}>
										<div className="org-card-header">
											<div className="org-card-info">
												<h3>{org.name}</h3>
												<span className={`org-badge ${org.isOwner ? 'badge-owner' : 'badge-member'}`}>
													{org.isOwner ? '👑 Właściciel' : '👤 Członek'}
												</span>
											</div>
											<div className="org-card-role">
												{org.role}
											</div>
										</div>

										<div className="org-card-actions">
											{org.isOwner ? (
												<>
													<p className="org-card-warning">
														⚠️ Jako właściciel możesz usunąć tę organizację. 
														Wszyscy członkowie stracą dostęp. Twoja subskrypcja pozostanie aktywna.
													</p>
													<button 
														className="btn-danger"
														onClick={() => handleDeleteOrganization(org.id, org.name)}
														disabled={actionLoading === org.id}>
														{actionLoading === org.id ? 'Usuwanie...' : '🗑️ Usuń zespół'}
													</button>
												</>
											) : (
												<>
													<p className="org-card-info-text">
														Dołączyłeś do tego zespołu przez zaproszenie. 
														Możesz opuścić zespół w każdej chwili.
													</p>
													<button 
														className="btn-warning"
														onClick={() => handleLeaveOrganization(org.id, org.name)}
														disabled={actionLoading === org.id}>
														{actionLoading === org.id ? 'Opuszczanie...' : '🚪 Opuść zespół'}
													</button>
												</>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* SUBSKRYPCJA */}
				{activeTab === 'subscription' && (
					<div className="settings-section">
						<h2>Twoja subskrypcja</h2>

						{subscription ? (
							<>
								<div className="subscription-card">
									<div className="subscription-header">
										<h3>Plan subskrypcji</h3>
										<span className={`subscription-status ${subscription.status}`}>
											{subscription.status === 'trialing' ? '🎁 Okres próbny' : 
											 subscription.status === 'active' ? '✅ Aktywna' : 
											 subscription.status === 'past_due' ? '⚠️ Zaległość' : 
											 '❌ Nieaktywna'}
										</span>
									</div>

									<div className="subscription-details">
										<div className="detail-row">
											<span className="detail-label">Plan:</span>
											<span className="detail-value">
												{subscription.plan === 'monthly' ? 'Miesięczny' :
												 subscription.plan === 'semiannual' ? 'Półroczny' :
												 subscription.plan === 'annual' ? 'Roczny' : 'Nieznany'}
											</span>
										</div>
										<div className="detail-row">
											<span className="detail-label">Cena:</span>
											<span className="detail-value">
												{subscription.price} zł/
												{subscription.interval === 'month' ? 'miesiąc' : 
												 subscription.interval === 'half_year' ? 'pół roku' : 'rok'}
											</span>
										</div>
										<div className="detail-row">
											<span className="detail-label">Następna płatność:</span>
											<span className="detail-value">
												{new Date(subscription.currentPeriodEnd).toLocaleDateString('pl-PL')}
											</span>
										</div>
										{subscription.status === 'trialing' && (
											<div className="detail-row">
												<span className="detail-label">Koniec okresu próbnego:</span>
												<span className="detail-value">
													{new Date(subscription.trialEndsAt).toLocaleDateString('pl-PL')}
												</span>
											</div>
										)}
										<div className="detail-row">
											<span className="detail-label">Limit organizacji:</span>
											<span className="detail-value">15</span>
										</div>
									</div>

									<div className="subscription-actions">
										<button className="btn-secondary" onClick={() => alert('Funkcja wkrótce')}>
											🔄 Zmień plan
										</button>
										{!subscription.cancelAtPeriodEnd && (
											<button className="btn-danger" onClick={handleCancelSubscription}>
												🚫 Anuluj subskrypcję
											</button>
										)}
										{subscription.cancelAtPeriodEnd && (
											<div className="cancel-notice">
												⚠️ Subskrypcja zostanie anulowana {new Date(subscription.currentPeriodEnd).toLocaleDateString('pl-PL')}
											</div>
										)}
									</div>
								</div>

								<div className="payment-history">
									<h3>Historia płatności</h3>
									<p>Brak płatności (okres próbny)</p>
								</div>
							</>
						) : (
							<div className="no-subscription">
								<div className="no-subscription-icon">💳</div>
								<h3>Nie masz wykupionej subskrypcji</h3>
								<p>
									Dołączyłeś do organizacji przez kod zaproszenia, więc korzystasz z planu właściciela firmy.
									<br /><br />
									Jeśli chcesz założyć własną organizację, wykup plan.
								</p>
								<button className="btn-primary" onClick={() => window.location.href = '/pricing'}>
									🚀 Kup własny plan
								</button>
							</div>
						)}
					</div>
				)}

				{/* BEZPIECZEŃSTWO */}
				{activeTab === 'security' && (
					<div className="settings-section">
						<h2>Bezpieczeństwo</h2>

						<div className="security-item">
							<h3>Zmiana hasła</h3>
							<p>Zaktualizuj swoje hasło aby zachować bezpieczeństwo konta</p>
							<button className="btn-secondary" onClick={() => alert('Funkcja wkrótce')}>
								🔑 Zmień hasło
							</button>
						</div>

						<div className="security-item">
							<h3>Dwuetapowa weryfikacja (2FA)</h3>
							<p>Dodaj dodatkową warstwę zabezpieczeń do swojego konta</p>
							<button className="btn-secondary" onClick={() => alert('Funkcja wkrótce')}>
								🛡️ Włącz 2FA
							</button>
						</div>

						<div className="security-item">
							<h3>Aktywne sesje</h3>
							<p>Zarządzaj urządzeniami zalogowanymi do Twojego konta</p>
							<button className="btn-secondary" onClick={() => alert('Funkcja wkrótce')}>
								📱 Pokaż sesje
							</button>
						</div>

						<div className="security-item">
							<h3>Wyloguj ze wszystkich urządzeń</h3>
							<p>Wyloguj się ze wszystkich urządzeń oprócz tego</p>
							<button className="btn-danger" onClick={logout}>
								🚪 Wyloguj wszędzie
							</button>
						</div>
					</div>
				)}
			</div>

			{/* MODAL TWORZENIA ORGANIZACJI */}
			{showNewOrgModal && (
				<div 
					className='modal-overlay' 
					onClick={() => setShowNewOrgModal(false)} 
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0,0,0,0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000
					}}
				>
					<div 
						onClick={(e) => e.stopPropagation()} 
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '32px',
							maxWidth: '400px',
							width: '90%'
						}}
					>
						<h2 style={{ marginBottom: '8px' }}>🏢 Utwórz nową firmę</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Dodaj organizację do swojego konta
							<span style={{ display: 'block', marginTop: '8px', color: '#667eea' }}>
								Limit: 15 organizacji
							</span>
						</p>

						<form onSubmit={handleCreateNewOrg}>
							<input
								type='text'
								placeholder='Nazwa firmy'
								value={newOrgName}
								onChange={(e) => setNewOrgName(e.target.value)}
								required
								autoFocus
								style={{
									width: '100%',
									padding: '12px 16px',
									fontSize: '16px',
									border: '2px solid #e0e0e0',
									borderRadius: '8px',
									marginBottom: '16px',
									boxSizing: 'border-box'
								}}
							/>

							<div style={{ display: 'flex', gap: '12px' }}>
								<button 
									type='submit' 
									disabled={newOrgLoading}
									style={{
										flex: 1,
										padding: '12px 24px',
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										color: 'white',
										border: 'none',
										borderRadius: '8px',
										fontSize: '16px',
										fontWeight: '600',
										cursor: newOrgLoading ? 'not-allowed' : 'pointer',
										opacity: newOrgLoading ? 0.7 : 1
									}}
								>
									{newOrgLoading ? 'Tworzenie...' : 'Utwórz'}
								</button>
								<button 
									type='button' 
									onClick={() => {
										setShowNewOrgModal(false)
										setNewOrgName('')
									}}
									style={{
										flex: 1,
										padding: '12px 24px',
										background: '#f5f5f5',
										color: '#333',
										border: '1px solid #ddd',
										borderRadius: '8px',
										fontSize: '16px',
										fontWeight: '600',
										cursor: 'pointer'
									}}
								>
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