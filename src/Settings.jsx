import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import ConfirmModal, { AlertModal } from './ConfirmModal'
import './Settings.css'

export default function Settings() {
	const { currentUser, userProfile, logout } = useAuth()
	const [activeTab, setActiveTab] = useState('account')
	const [loading, setLoading] = useState(true)
	
	const [organizationsData, setOrganizationsData] = useState([])
	const [orgsLoading, setOrgsLoading] = useState(true)
	
	const [displayName, setDisplayName] = useState('')
	const [email, setEmail] = useState('')
	const [saving, setSaving] = useState(false)
	
	const [showNewOrgModal, setShowNewOrgModal] = useState(false)
	const [newOrgName, setNewOrgName] = useState('')
	const [newOrgLoading, setNewOrgLoading] = useState(false)

	const [deleteModal, setDeleteModal] = useState({ isOpen: false, org: null })
	const [deleteLoading, setDeleteLoading] = useState(false)

	const [leaveModal, setLeaveModal] = useState({ isOpen: false, org: null })
	const [leaveLoading, setLeaveLoading] = useState(false)

	const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' })

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

	const showAlert = (type, title, message) => {
		setAlert({ isOpen: true, type, title, message })
	}

	const verifyPassword = async (password) => {
		try {
			const credential = EmailAuthProvider.credential(currentUser.email, password)
			await reauthenticateWithCredential(currentUser, credential)
			return { success: true }
		} catch (error) {
			if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
				return { success: false, error: 'Nieprawidłowe hasło' }
			}
			return { success: false, error: 'Błąd weryfikacji' }
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

			showAlert('success', 'Zapisano!', 'Twoje dane zostały zaktualizowane.')
			setSaving(false)
		} catch (error) {
			console.error('Błąd zapisu:', error)
			showAlert('error', 'Błąd', 'Nie udało się zapisać danych.')
			setSaving(false)
		}
	}

	const handleCancelSubscription = async () => {
		showAlert('info', 'Funkcja wkrótce', 'Anulowanie subskrypcji będzie dostępne po integracji ze Stripe.')
	}

	const handleCreateNewOrg = async (e) => {
		e.preventDefault()
		if (!newOrgName.trim()) return

		setNewOrgLoading(true)

		try {
			const maxOrgs = 15
			const userOwnedOrgs = userProfile?.organizations?.filter(org => org.role === 'Właściciel') || []

			if (userOwnedOrgs.length >= maxOrgs) {
				showAlert('error', 'Limit osiągnięty', `Osiągnąłeś limit ${maxOrgs} organizacji.`)
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

			setShowNewOrgModal(false)
			setNewOrgName('')
			showAlert('success', 'Utworzono!', `Organizacja "${newOrgName}" została utworzona.`)
			setTimeout(() => window.location.reload(), 1500)

		} catch (error) {
			console.error('Błąd tworzenia organizacji:', error)
			showAlert('error', 'Błąd', error.message)
			setNewOrgLoading(false)
		}
	}

	const handleDeleteOrganization = async ({ password }) => {
		setDeleteLoading(true)

		const verification = await verifyPassword(password)
		if (!verification.success) {
			showAlert('error', 'Błąd', verification.error)
			setDeleteLoading(false)
			return
		}

		try {
			const deleteOrganization = httpsCallable(functions, 'deleteOrganization')
			const result = await deleteOrganization({ 
				organizationId: deleteModal.org.id,
				confirmName: deleteModal.org.name
			})

			setDeleteModal({ isOpen: false, org: null })
			setDeleteLoading(false)
			
			const membersInfo = result.data.membersRemoved > 0 
				? ` ${result.data.membersRemoved} członków zostało usuniętych.` 
				: ''
			showAlert('success', 'Usunięto!', `Organizacja "${deleteModal.org.name}" została usunięta.${membersInfo}`)
			setTimeout(() => window.location.reload(), 1500)

		} catch (error) {
			console.error('Błąd usuwania zespołu:', error)
			showAlert('error', 'Błąd', error.message)
			setDeleteLoading(false)
		}
	}

	const handleLeaveOrganization = async ({ password }) => {
		setLeaveLoading(true)

		const verification = await verifyPassword(password)
		if (!verification.success) {
			showAlert('error', 'Błąd', verification.error)
			setLeaveLoading(false)
			return
		}

		try {
			const leaveOrganization = httpsCallable(functions, 'leaveOrganization')
			await leaveOrganization({ organizationId: leaveModal.org.id })

			setLeaveModal({ isOpen: false, org: null })
			setLeaveLoading(false)
			showAlert('success', 'Opuszczono!', `Opuściłeś organizację "${leaveModal.org.name}".`)
			setTimeout(() => window.location.reload(), 1500)

		} catch (error) {
			console.error('Błąd opuszczania zespołu:', error)
			showAlert('error', 'Błąd', error.message)
			setLeaveLoading(false)
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
							<button className="btn-danger" onClick={() => showAlert('info', 'Funkcja wkrótce', 'Usuwanie konta będzie dostępne wkrótce.')}>
								🗑️ Usuń konto
							</button>
						</div>
					</div>
				)}

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
											<div className="org-card-role">{org.role}</div>
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
														onClick={() => setDeleteModal({ isOpen: true, org })}>
														🗑️ Usuń zespół
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
														onClick={() => setLeaveModal({ isOpen: true, org })}>
														🚪 Opuść zespół
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
										{subscription.status === 'trialing' && subscription.trialEndsAt && (
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
										<button className="btn-secondary" onClick={() => showAlert('info', 'Funkcja wkrótce', 'Zmiana planu będzie dostępna po integracji ze Stripe.')}>
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

				{activeTab === 'security' && (
					<div className="settings-section">
						<h2>Bezpieczeństwo</h2>

						<div className="security-item">
							<h3>Zmiana hasła</h3>
							<p>Zaktualizuj swoje hasło aby zachować bezpieczeństwo konta</p>
							<button className="btn-secondary" onClick={() => showAlert('info', 'Funkcja wkrótce', 'Zmiana hasła będzie dostępna wkrótce.')}>
								🔑 Zmień hasło
							</button>
						</div>

						<div className="security-item">
							<h3>Dwuetapowa weryfikacja (2FA)</h3>
							<p>Dodaj dodatkową warstwę zabezpieczeń do swojego konta</p>
							<button className="btn-secondary" onClick={() => showAlert('info', 'Funkcja wkrótce', '2FA będzie dostępne wkrótce.')}>
								🛡️ Włącz 2FA
							</button>
						</div>

						<div className="security-item">
							<h3>Aktywne sesje</h3>
							<p>Zarządzaj urządzeniami zalogowanymi do Twojego konta</p>
							<button className="btn-secondary" onClick={() => showAlert('info', 'Funkcja wkrótce', 'Zarządzanie sesjami będzie dostępne wkrótce.')}>
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
				<div className="confirm-modal-overlay" onClick={() => setShowNewOrgModal(false)}>
					<div className="confirm-modal confirm-modal-info" onClick={(e) => e.stopPropagation()}>
						<div className="confirm-modal-icon">🏢</div>
						<h2 className="confirm-modal-title">Utwórz nową firmę</h2>
						<p className="confirm-modal-message">
							Dodaj organizację do swojego konta
							<span style={{ display: 'block', marginTop: '8px', color: '#667eea', fontWeight: '600' }}>
								Limit: 15 organizacji
							</span>
						</p>

						<form onSubmit={handleCreateNewOrg}>
							<div className="confirm-modal-input-group">
								<label>Nazwa firmy:</label>
								<input
									type="text"
									placeholder="np. Palety Kowalski"
									value={newOrgName}
									onChange={(e) => setNewOrgName(e.target.value)}
									className="confirm-modal-input"
									required
									autoFocus
								/>
							</div>

							<div className="confirm-modal-actions">
								<button 
									type="button" 
									className="confirm-modal-btn confirm-modal-btn-cancel" 
									onClick={() => setShowNewOrgModal(false)}>
									Anuluj
								</button>
								<button 
									type="submit" 
									className="confirm-modal-btn confirm-modal-btn-primary" 
									disabled={newOrgLoading}>
									{newOrgLoading ? 'Tworzenie...' : 'Utwórz'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL USUWANIA ORGANIZACJI */}
			{deleteModal.isOpen && deleteModal.org && (
				<ConfirmModal
					isOpen={deleteModal.isOpen}
					onClose={() => setDeleteModal({ isOpen: false, org: null })}
					onConfirm={handleDeleteOrganization}
					title="Usuń organizację"
					message={`Ta akcja jest nieodwracalna! Wszystkie dane organizacji "${deleteModal.org.name}" zostaną usunięte. Wszyscy członkowie stracą dostęp. Twoja subskrypcja pozostanie aktywna.`}
					confirmText="🗑️ Usuń organizację"
					cancelText="Anuluj"
					type="danger"
					requirePassword={true}
					requireTextConfirm={deleteModal.org.name}
					loading={deleteLoading}
				/>
			)}

			{/* MODAL OPUSZCZANIA ORGANIZACJI */}
			{leaveModal.isOpen && leaveModal.org && (
				<ConfirmModal
					isOpen={leaveModal.isOpen}
					onClose={() => setLeaveModal({ isOpen: false, org: null })}
					onConfirm={handleLeaveOrganization}
					title="Opuść zespół"
					message={`Czy na pewno chcesz opuścić zespół "${leaveModal.org.name}"? Stracisz dostęp do wszystkich danych tej organizacji. Aby wrócić, będziesz potrzebował nowego zaproszenia.`}
					confirmText="🚪 Opuść zespół"
					cancelText="Anuluj"
					type="warning"
					requirePassword={true}
					loading={leaveLoading}
				/>
			)}

			{/* ALERT MODAL */}
			<AlertModal
				isOpen={alert.isOpen}
				onClose={() => setAlert({ ...alert, isOpen: false })}
				title={alert.title}
				message={alert.message}
				type={alert.type}
			/>
		</div>
	)
}