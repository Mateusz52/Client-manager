import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'
import { db } from './firebase'
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import './Settings.css'

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

export default function Settings() {
	const navigate = useNavigate()
	const { currentUser, userProfile, logout } = useAuth()
	const [activeTab, setActiveTab] = useState('account')
	const [orgData, setOrgData] = useState(null)
	const [loading, setLoading] = useState(true)
	
	// Account form
	const [displayName, setDisplayName] = useState('')
	const [email, setEmail] = useState('')
	const [saving, setSaving] = useState(false)

	// Organizations
	const [showNewOrgModal, setShowNewOrgModal] = useState(false)
	const [newOrgName, setNewOrgName] = useState('')
	const [newOrgLoading, setNewOrgLoading] = useState(false)
	const [ownedSubscription, setOwnedSubscription] = useState(null)
	const [checkingSubscription, setCheckingSubscription] = useState(true)
	const [ownedOrganizationIds, setOwnedOrganizationIds] = useState([]) // Lista ID organizacji gdzie user jest WŁAŚCICIELEM

	// Delete organization
	const [showDeleteOrgModal, setShowDeleteOrgModal] = useState(false)
	const [orgToDelete, setOrgToDelete] = useState(null)
	const [deleteOrgConfirmName, setDeleteOrgConfirmName] = useState('')
	const [deleteOrgPassword, setDeleteOrgPassword] = useState('')
	const [deletingOrg, setDeletingOrg] = useState(false)
	const [deleteOrgError, setDeleteOrgError] = useState('')

	// Password change
	const [showPasswordModal, setShowPasswordModal] = useState(false)
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [passwordLoading, setPasswordLoading] = useState(false)
	const [passwordError, setPasswordError] = useState('')

	useEffect(() => {
		if (currentUser && userProfile) {
			setDisplayName(userProfile.displayName || '')
			setEmail(currentUser.email || '')
			loadOrgData()
			checkOwnedSubscription()
			checkOwnedOrganizations() // Sprawdź które organizacje user NAPRAWDĘ posiada
		}
	}, [currentUser, userProfile])

	const loadOrgData = async () => {
		try {
			const orgId = userProfile?.currentOrganizationId
			if (!orgId) {
				setLoading(false)
				return
			}

			const orgRef = doc(db, 'organizations', orgId)
			const orgSnap = await getDoc(orgRef)

			if (orgSnap.exists()) {
				setOrgData(orgSnap.data())
			}
			setLoading(false)
		} catch (error) {
			console.error('Błąd ładowania danych:', error)
			setLoading(false)
		}
	}

	// Sprawdź które organizacje user NAPRAWDĘ posiada (przez ownerId w bazie)
	const checkOwnedOrganizations = async () => {
		if (!currentUser) return

		try {
			const orgsRef = collection(db, 'organizations')
			const q = query(orgsRef, where('ownerId', '==', currentUser.uid))
			const querySnapshot = await getDocs(q)

			const ownedIds = querySnapshot.docs.map(doc => doc.id)
			setOwnedOrganizationIds(ownedIds)
		} catch (error) {
			console.error('Błąd sprawdzania własności organizacji:', error)
			setOwnedOrganizationIds([])
		}
	}

	// Sprawdź WŁASNĄ subskrypcję
	const checkOwnedSubscription = async () => {
		if (!currentUser) {
			setCheckingSubscription(false)
			return
		}

		// 1. Sprawdź w profilu
		if (userProfile?.subscription) {
			if (isSubscriptionActive(userProfile.subscription)) {
				setOwnedSubscription(userProfile.subscription)
				setCheckingSubscription(false)
				return
			}
		}

		// 2. Szukaj organizacji gdzie user jest WŁAŚCICIELEM
		try {
			const orgsRef = collection(db, 'organizations')
			const q = query(orgsRef, where('ownerId', '==', currentUser.uid))
			const querySnapshot = await getDocs(q)

			for (const docSnap of querySnapshot.docs) {
				const orgDataDoc = docSnap.data()
				if (isSubscriptionActive(orgDataDoc.subscription)) {
					// Przepisz do profilu
					const userRef = doc(db, 'users', currentUser.uid)
					await setDoc(userRef, {
						subscription: orgDataDoc.subscription,
						limits: orgDataDoc.limits || { maxOrganizations: 1 },
					}, { merge: true })
					
					setOwnedSubscription(orgDataDoc.subscription)
					setCheckingSubscription(false)
					return
				}
			}

			setOwnedSubscription(null)
			setCheckingSubscription(false)
		} catch (error) {
			console.error('Błąd sprawdzania subskrypcji:', error)
			setCheckingSubscription(false)
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
		if (!confirm('Czy na pewno chcesz anulować subskrypcję?\n\nDostęp pozostanie aktywny do końca bieżącego okresu rozliczeniowego.')) {
			return
		}

		try {
			// Anuluj w PROFILU UŻYTKOWNIKA
			const userRef = doc(db, 'users', currentUser.uid)
			await updateDoc(userRef, {
				'subscription.cancelAtPeriodEnd': true,
				updatedAt: new Date().toISOString()
			})

			// Anuluj też we wszystkich organizacjach gdzie user jest właścicielem
			const orgsRef = collection(db, 'organizations')
			const q = query(orgsRef, where('ownerId', '==', currentUser.uid))
			const querySnapshot = await getDocs(q)

			for (const docSnap of querySnapshot.docs) {
				await updateDoc(doc(db, 'organizations', docSnap.id), {
					'subscription.cancelAtPeriodEnd': true,
					updatedAt: new Date().toISOString()
				})
			}

			alert('✅ Subskrypcja zostanie anulowana na koniec okresu rozliczeniowego.')
			window.location.reload()
		} catch (error) {
			console.error('Błąd anulowania:', error)
			alert('❌ Błąd anulowania subskrypcji')
		}
	}

	const handleCreateNewOrg = async (e) => {
		e.preventDefault()
		if (!newOrgName.trim()) {
			alert('Wpisz nazwę firmy!')
			return
		}

		setNewOrgLoading(true)

		// BLOKADA - sprawdź czy ma aktywną subskrypcję
		if (!isSubscriptionActive(ownedSubscription)) {
			alert('❌ Nie masz aktywnej subskrypcji.\n\nAby utworzyć własną organizację, musisz najpierw kupić plan.')
			setNewOrgLoading(false)
			navigate('/pricing')
			return
		}

		try {
			const subscriptionData = ownedSubscription
			const limitsData = userProfile?.limits || { maxOrganizations: 1 }

			// Sprawdź limit organizacji
			const userOwnedOrgs = userProfile?.organizations?.filter(org => org.role === 'Właściciel') || []
			const maxOrgs = limitsData.maxOrganizations || 1

			if (userOwnedOrgs.length >= maxOrgs && maxOrgs !== 999) {
				alert(`❌ Osiągnąłeś limit organizacji (${maxOrgs}).\n\nAby utworzyć więcej firm, zmień plan na Półroczny lub Roczny.`)
				setNewOrgLoading(false)
				return
			}

			const newOrgRef = await addDoc(collection(db, 'organizations'), {
				name: newOrgName,
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
			const existingOrgs = userData?.organizations || []

			await setDoc(userRef, {
				...userData,
				subscription: subscriptionData,
				limits: limitsData,
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
							canChangePlan: true
						},
						isDefault: existingOrgs.length === 0,
						joinedAt: new Date().toISOString()
					}
				],
				currentOrganizationId: newOrgRef.id,
				updatedAt: new Date().toISOString()
			}, { merge: true })

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

	// ============================================
	// USUWANIE ORGANIZACJI
	// ============================================
	
	// Sprawdź czy user jest PRAWDZIWYM właścicielem (przez ownerId w bazie)
	const isRealOwner = (orgId) => {
		return ownedOrganizationIds.includes(orgId)
	}

	const openDeleteOrgModal = (org) => {
		// Dodatkowe sprawdzenie przed otwarciem modala
		if (!isRealOwner(org.id)) {
			alert('❌ Nie masz uprawnień do usunięcia tej organizacji.\n\nTylko właściciel może usunąć organizację.')
			return
		}

		setOrgToDelete(org)
		setDeleteOrgConfirmName('')
		setDeleteOrgPassword('')
		setDeleteOrgError('')
		setShowDeleteOrgModal(true)
	}

	const closeDeleteOrgModal = () => {
		setShowDeleteOrgModal(false)
		setOrgToDelete(null)
		setDeleteOrgConfirmName('')
		setDeleteOrgPassword('')
		setDeleteOrgError('')
	}

	const handleDeleteOrganization = async () => {
		if (!orgToDelete) return

		setDeleteOrgError('')

		// Sprawdź czy wpisana nazwa się zgadza
		if (deleteOrgConfirmName !== orgToDelete.name) {
			setDeleteOrgError('Wpisana nazwa nie zgadza się z nazwą organizacji')
			return
		}

		// Sprawdź czy hasło zostało wpisane
		if (!deleteOrgPassword) {
			setDeleteOrgError('Wpisz swoje hasło')
			return
		}

		setDeletingOrg(true)

		try {
			// 1. Najpierw zweryfikuj hasło użytkownika
			const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth')
			const credential = EmailAuthProvider.credential(currentUser.email, deleteOrgPassword)
			
			try {
				await reauthenticateWithCredential(currentUser, credential)
			} catch (authError) {
				if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
					setDeleteOrgError('Nieprawidłowe hasło')
				} else {
					setDeleteOrgError('Błąd weryfikacji: ' + authError.message)
				}
				setDeletingOrg(false)
				return
			}

			const orgId = orgToDelete.id

			// 2. KRYTYCZNE SPRAWDZENIE: Czy user jest PRAWDZIWYM właścicielem w bazie?
			const orgRef = doc(db, 'organizations', orgId)
			const orgSnap = await getDoc(orgRef)

			if (!orgSnap.exists()) {
				setDeleteOrgError('Organizacja nie istnieje')
				setDeletingOrg(false)
				return
			}

			const orgDataFromDb = orgSnap.data()
			if (orgDataFromDb.ownerId !== currentUser.uid) {
				setDeleteOrgError('Nie masz uprawnień do usunięcia tej organizacji. Tylko właściciel może to zrobić.')
				setDeletingOrg(false)
				return
			}

			// 3. Znajdź wszystkich użytkowników którzy należą do tej organizacji
			const usersRef = collection(db, 'users')
			const usersSnapshot = await getDocs(usersRef)

			for (const userDoc of usersSnapshot.docs) {
				const userData = userDoc.data()
				const userOrgs = userData.organizations || []

				// Sprawdź czy użytkownik należy do tej organizacji
				const belongsToOrg = userOrgs.some(org => org.id === orgId)

				if (belongsToOrg) {
					// Usuń organizację z listy użytkownika
					const updatedOrgs = userOrgs.filter(org => org.id !== orgId)

					// Jeśli to była aktualna organizacja, przełącz na inną
					let newCurrentOrgId = userData.currentOrganizationId
					if (newCurrentOrgId === orgId) {
						newCurrentOrgId = updatedOrgs.length > 0 ? updatedOrgs[0].id : null
					}

					await updateDoc(doc(db, 'users', userDoc.id), {
						organizations: updatedOrgs,
						currentOrganizationId: newCurrentOrgId,
						updatedAt: new Date().toISOString()
					})
				}
			}

			// 4. Usuń subkolekcje organizacji (orders, productTypes)
			// Usuń zamówienia
			const ordersRef = collection(db, 'organizations', orgId, 'orders')
			const ordersSnapshot = await getDocs(ordersRef)
			for (const orderDoc of ordersSnapshot.docs) {
				await deleteDoc(doc(db, 'organizations', orgId, 'orders', orderDoc.id))
			}

			// Usuń typy produktów
			const productTypesRef = collection(db, 'organizations', orgId, 'productTypes')
			const productTypesSnapshot = await getDocs(productTypesRef)
			for (const ptDoc of productTypesSnapshot.docs) {
				await deleteDoc(doc(db, 'organizations', orgId, 'productTypes', ptDoc.id))
			}

			// 5. Usuń kody zaproszenia powiązane z organizacją
			const inviteCodesRef = collection(db, 'inviteCodes')
			const inviteCodesQuery = query(inviteCodesRef, where('organizationId', '==', orgId))
			const inviteCodesSnapshot = await getDocs(inviteCodesQuery)
			for (const codeDoc of inviteCodesSnapshot.docs) {
				await deleteDoc(doc(db, 'inviteCodes', codeDoc.id))
			}

			// 6. Usuń dokument organizacji
			await deleteDoc(doc(db, 'organizations', orgId))

			alert(`✅ Organizacja "${orgToDelete.name}" została usunięta.\n\nTwoja subskrypcja pozostaje aktywna.`)
			closeDeleteOrgModal()
			window.location.reload()

		} catch (error) {
			console.error('Błąd usuwania organizacji:', error)
			setDeleteOrgError(`Błąd: ${error.message}`)
			setDeletingOrg(false)
		}
	}

	const handleChangePassword = async (e) => {
		e.preventDefault()
		setPasswordError('')

		if (newPassword !== confirmPassword) {
			setPasswordError('Hasła nie są identyczne')
			return
		}

		if (newPassword.length < 6) {
			setPasswordError('Hasło musi mieć minimum 6 znaków')
			return
		}

		setPasswordLoading(true)

		try {
			// Firebase wymaga ponownego uwierzytelnienia przed zmianą hasła
			const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth')
			
			const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
			await reauthenticateWithCredential(currentUser, credential)
			await updatePassword(currentUser, newPassword)

			alert('✅ Hasło zostało zmienione!')
			setShowPasswordModal(false)
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch (error) {
			console.error('Błąd zmiany hasła:', error)
			if (error.code === 'auth/wrong-password') {
				setPasswordError('Nieprawidłowe aktualne hasło')
			} else {
				setPasswordError('Błąd zmiany hasła: ' + error.message)
			}
		} finally {
			setPasswordLoading(false)
		}
	}

	const hasOwnSubscription = isSubscriptionActive(ownedSubscription)
	const organizations = userProfile?.organizations || []
	const maxOrganizations = userProfile?.limits?.maxOrganizations || 1

	// Walidacja formularza usuwania
	const canDeleteOrg = orgToDelete && 
		deleteOrgConfirmName === orgToDelete.name && 
		deleteOrgPassword.length >= 6

	if (loading) {
		return <div className="settings-loading">Ładowanie ustawień...</div>
	}

	return (
		<div className="settings-page">
			<div className="settings-header">
				<h1>⚙️ Ustawienia</h1>
				<p>Zarządzaj swoim kontem i subskrypcją</p>
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
						<p style={{ color: '#666', marginBottom: '8px' }}>
							Zarządzaj zespołami do których należysz lub które stworzyłeś.
						</p>
						<p style={{ color: '#94c11e', fontWeight: '600', marginBottom: '24px' }}>
							Limit organizacji: {maxOrganizations === 999 ? 'Nielimitowane' : maxOrganizations}
						</p>

						{organizations.length > 0 ? (
							<div className="organizations-list">
								{organizations.map((org) => (
									<div key={org.id} className="organization-card">
										<div className="org-card-header">
											<div className="org-card-icon">🏢</div>
											<div className="org-card-info">
												<h3>{org.name}</h3>
												<span className={`org-role-badge ${org.role === 'Właściciel' ? 'owner' : 'member'}`}>
													{org.role}
												</span>
											</div>
											{/* Przycisk usuwania - TYLKO dla PRAWDZIWEGO właściciela (sprawdzenie przez ownerId) */}
											{isRealOwner(org.id) && (
												<button 
													className="org-delete-btn"
													onClick={() => openDeleteOrgModal(org)}
													title="Usuń organizację"
												>
													🗑️
												</button>
											)}
										</div>
										<div className="org-card-meta">
											<span>Dołączono: {new Date(org.joinedAt).toLocaleDateString('pl-PL')}</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="no-organizations">
								<div style={{ fontSize: '64px', marginBottom: '16px' }}>🏢</div>
								<h3>Brak organizacji</h3>
								<p>Nie należysz jeszcze do żadnej organizacji.</p>
							</div>
						)}

						{/* Przycisk tworzenia organizacji */}
						<div style={{ marginTop: '24px' }}>
							{checkingSubscription ? (
								<p style={{ color: '#666' }}>🔍 Sprawdzam subskrypcję...</p>
							) : hasOwnSubscription ? (
								<button 
									onClick={() => setShowNewOrgModal(true)}
									className="btn-primary"
									style={{ 
										padding: '14px 28px',
										fontSize: '16px',
										background: 'linear-gradient(135deg, #94c11e 0%, #7ea518 100%)'
									}}>
									🔧 Utwórz organizację
								</button>
							) : (
								<button 
									onClick={() => navigate('/pricing')}
									className="btn-primary"
									style={{ 
										padding: '14px 28px',
										fontSize: '16px',
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
									}}>
									💳 Wybierz plan
								</button>
							)}
						</div>
					</div>
				)}

				{/* SUBSKRYPCJA */}
				{activeTab === 'subscription' && (
					<div className="settings-section">
						<h2>Twoja subskrypcja</h2>

						{isSubscriptionActive(userProfile?.subscription) ? (
							<>
								<div className="subscription-card">
									<div className="subscription-header">
										<h3>Twój plan</h3>
										<span className={`subscription-status ${userProfile.subscription.status}`}>
											{userProfile.subscription.status === 'trialing' ? '🎁 Okres próbny' : 
											 userProfile.subscription.status === 'active' ? '✅ Aktywna' : 
											 userProfile.subscription.status === 'past_due' ? '⚠️ Zaległość' : 
											 '❌ Nieaktywna'}
										</span>
									</div>

									<div className="subscription-details">
										<div className="detail-row">
											<span className="detail-label">Plan:</span>
											<span className="detail-value">
												{userProfile.subscription.plan === 'monthly' ? 'Miesięczny' :
												 userProfile.subscription.plan === 'semiannual' ? 'Półroczny' :
												 userProfile.subscription.plan === 'annual' ? 'Roczny' : 'Nieznany'}
											</span>
										</div>
										<div className="detail-row">
											<span className="detail-label">Cena:</span>
											<span className="detail-value">{userProfile.subscription.price} zł/{userProfile.subscription.interval === 'month' ? 'miesiąc' : 'rok'}</span>
										</div>
										<div className="detail-row">
											<span className="detail-label">Następna płatność:</span>
											<span className="detail-value">
												{new Date(userProfile.subscription.currentPeriodEnd).toLocaleDateString('pl-PL')}
											</span>
										</div>
										{userProfile.subscription.status === 'trialing' && (
											<div className="detail-row">
												<span className="detail-label">Koniec okresu próbnego:</span>
												<span className="detail-value">
													{new Date(userProfile.subscription.trialEndsAt).toLocaleDateString('pl-PL')}
												</span>
											</div>
										)}
										<div className="detail-row">
											<span className="detail-label">Limit organizacji:</span>
											<span className="detail-value">
												{userProfile.limits?.maxOrganizations === 999 ? 'Nielimitowane' : userProfile.limits?.maxOrganizations || 1}
											</span>
										</div>
									</div>

									<div className="subscription-actions">
										<button className="btn-secondary" onClick={() => alert('Funkcja wkrótce')}>
											🔄 Zmień plan
										</button>
										{!userProfile.subscription.cancelAtPeriodEnd && (
											<button className="btn-danger" onClick={handleCancelSubscription}>
												🚫 Anuluj subskrypcję
											</button>
										)}
										{userProfile.subscription.cancelAtPeriodEnd && (
											<div className="cancel-notice">
												⚠️ Subskrypcja zostanie anulowana {new Date(userProfile.subscription.currentPeriodEnd).toLocaleDateString('pl-PL')}
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
								<div style={{ fontSize: '64px', marginBottom: '16px' }}>💳</div>
								<h3 style={{ marginBottom: '12px', color: '#243c4c' }}>Nie masz własnej subskrypcji</h3>
								<p style={{ marginBottom: '24px' }}>
									Korzystasz z dostępu do organizacji innego użytkownika.
									<br />
									Aby utworzyć własną organizację, kup plan.
								</p>
								<button className="btn-primary" onClick={() => navigate('/pricing')}>
									💳 Wybierz plan
								</button>
							</div>
						)}
					</div>
				)}

				{/* BEZPIECZEŃSTWO - tylko zmiana hasła */}
				{activeTab === 'security' && (
					<div className="settings-section">
						<h2>Bezpieczeństwo</h2>

						<div className="security-item">
							<h3>Zmiana hasła</h3>
							<p>Zaktualizuj swoje hasło aby zachować bezpieczeństwo konta</p>
							<button className="btn-secondary" onClick={() => setShowPasswordModal(true)}>
								🔑 Zmień hasło
							</button>
						</div>
					</div>
				)}
			</div>

			{/* MODAL TWORZENIA ORGANIZACJI */}
			{showNewOrgModal && (
				<div className="modal-overlay" onClick={() => setShowNewOrgModal(false)}>
					<div className="modal-card" onClick={(e) => e.stopPropagation()}>
						<h2>🏢 Utwórz nową firmę</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Dodaj nową organizację do swojego konta
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
								<button type="submit" className="modal-btn-primary" disabled={newOrgLoading}>
									{newOrgLoading ? 'Tworzenie...' : 'Utwórz'}
								</button>
								<button type="button" className="modal-btn-secondary" onClick={() => { setShowNewOrgModal(false); setNewOrgName('') }}>
									Anuluj
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL USUWANIA ORGANIZACJI */}
			{showDeleteOrgModal && orgToDelete && (
				<div className="modal-overlay" onClick={closeDeleteOrgModal}>
					<div className="modal-card modal-card-danger" onClick={(e) => e.stopPropagation()}>
						<h2>🗑️ Usuń organizację</h2>
						
						<div className="delete-warning">
							<p><strong>⚠️ UWAGA!</strong> Ta operacja jest <strong>nieodwracalna</strong>.</p>
							<p>Usunięte zostaną:</p>
							<ul>
								<li>Wszystkie zamówienia</li>
								<li>Wszystkie typy produktów</li>
								<li>Wszystkie kody zaproszenia</li>
								<li>Wszyscy członkowie stracą dostęp</li>
							</ul>
							<p style={{ color: '#28a745', fontWeight: '600' }}>
								✅ Twoja subskrypcja pozostanie aktywna
							</p>
						</div>

						<div className="delete-form">
							<div className="delete-form-group">
								<label>
									Wpisz nazwę organizacji: <strong style={{ color: '#dc3545' }}>{orgToDelete.name}</strong>
								</label>
								<input
									type="text"
									placeholder="Wpisz nazwę organizacji"
									value={deleteOrgConfirmName}
									onChange={(e) => setDeleteOrgConfirmName(e.target.value)}
									className="modal-input"
								/>
								{deleteOrgConfirmName && deleteOrgConfirmName !== orgToDelete.name && (
									<small className="field-error">Nazwa nie zgadza się</small>
								)}
								{deleteOrgConfirmName === orgToDelete.name && (
									<small className="field-success">✓ Nazwa poprawna</small>
								)}
							</div>

							<div className="delete-form-group">
								<label>
									Wpisz swoje hasło do konta:
								</label>
								<input
									type="password"
									placeholder="Twoje hasło"
									value={deleteOrgPassword}
									onChange={(e) => setDeleteOrgPassword(e.target.value)}
									className="modal-input"
								/>
							</div>
						</div>

						{deleteOrgError && (
							<div className="delete-error">
								{deleteOrgError}
							</div>
						)}

						<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
							<button 
								type="button" 
								className="modal-btn-danger" 
								disabled={deletingOrg || !canDeleteOrg}
								onClick={handleDeleteOrganization}
							>
								{deletingOrg ? 'Usuwanie...' : '🗑️ Usuń organizację'}
							</button>
							<button 
								type="button" 
								className="modal-btn-secondary" 
								onClick={closeDeleteOrgModal}
							>
								Anuluj
							</button>
						</div>
					</div>
				</div>
			)}

			{/* MODAL ZMIANY HASŁA */}
			{showPasswordModal && (
				<div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
					<div className="modal-card" onClick={(e) => e.stopPropagation()}>
						<h2>🔑 Zmień hasło</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Wpisz aktualne hasło i nowe hasło
						</p>

						<form onSubmit={handleChangePassword}>
							<input
								type="password"
								placeholder="Aktualne hasło"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								className="modal-input"
								style={{ marginBottom: '12px' }}
								required
								autoFocus
							/>
							<input
								type="password"
								placeholder="Nowe hasło"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								className="modal-input"
								style={{ marginBottom: '12px' }}
								required
							/>
							<input
								type="password"
								placeholder="Potwierdź nowe hasło"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="modal-input"
								required
							/>

							{passwordError && (
								<div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '8px', fontSize: '14px', marginTop: '12px' }}>
									{passwordError}
								</div>
							)}

							<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
								<button type="submit" className="modal-btn-primary" disabled={passwordLoading}>
									{passwordLoading ? 'Zmieniam...' : 'Zmień hasło'}
								</button>
								<button type="button" className="modal-btn-secondary" onClick={() => { 
									setShowPasswordModal(false)
									setCurrentPassword('')
									setNewPassword('')
									setConfirmPassword('')
									setPasswordError('')
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