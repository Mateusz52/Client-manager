import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import './Settings.css'

export default function Settings() {
	const { currentUser, userProfile, logout, switchOrganization } = useAuth()
	const [activeTab, setActiveTab] = useState('account')
	const [orgData, setOrgData] = useState(null)
	const [loading, setLoading] = useState(true)
	const [isOwner, setIsOwner] = useState(false)
	const [allOrgsData, setAllOrgsData] = useState([])  // ✅ NOWE - dane wszystkich organizacji
	
	// Account form
	const [displayName, setDisplayName] = useState('')
	const [email, setEmail] = useState('')
	const [saving, setSaving] = useState(false)

	// Password change form
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmNewPassword, setConfirmNewPassword] = useState('')
	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
	const [changingPassword, setChangingPassword] = useState(false)
	const [passwordError, setPasswordError] = useState('')
	const [passwordSuccess, setPasswordSuccess] = useState('')

	// Leave/Delete organization modals
	const [showLeaveModal, setShowLeaveModal] = useState(false)
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [selectedOrgForAction, setSelectedOrgForAction] = useState(null)  // ✅ NOWE - która org jest wybrana
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [actionLoading, setActionLoading] = useState(false)
	const [actionError, setActionError] = useState('')

	useEffect(() => {
		if (currentUser && userProfile) {
			setDisplayName(userProfile.displayName || '')
			setEmail(currentUser.email || '')
			loadAllOrgsData()
		}
	}, [currentUser, userProfile])

	// ✅ NOWA FUNKCJA - Ładuje dane WSZYSTKICH organizacji użytkownika
	const loadAllOrgsData = async () => {
		try {
			const organizations = userProfile?.organizations || []
			if (organizations.length === 0) {
				setLoading(false)
				return
			}

			// Załaduj dane każdej organizacji
			const orgsDataPromises = organizations.map(async (org) => {
				try {
					const orgRef = doc(db, 'organizations', org.id)
					const orgSnap = await getDoc(orgRef)
					
					if (orgSnap.exists()) {
						const data = orgSnap.data()
						
						// ✅ Pomiń organizacje oznaczone jako deleted
						if (data.deleted === true) {
							return null
						}
						
						return {
							...org,
							orgData: data,
							isOwner: data.ownerId === currentUser.uid
						}
					}
					return null
				} catch (error) {
					console.error(`Błąd ładowania org ${org.id}:`, error)
					return null
				}
			})

			const loadedOrgs = await Promise.all(orgsDataPromises)
			
			// ✅ Filtruj null (usunięte organizacje)
			const validOrgs = loadedOrgs.filter(org => org !== null)
			
			setAllOrgsData(validOrgs)

			// Ustaw dane obecnej organizacji
			const currentOrgId = userProfile?.currentOrganizationId
			const currentOrgData = validOrgs.find(o => o.id === currentOrgId)
			
			if (currentOrgData?.orgData) {
				setOrgData(currentOrgData.orgData)
				setIsOwner(currentOrgData.isOwner)
			}

			setLoading(false)
		} catch (error) {
			console.error('Błąd ładowania danych organizacji:', error)
			setLoading(false)
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

	const handleChangePassword = async (e) => {
		e.preventDefault()
		setPasswordError('')
		setPasswordSuccess('')

		if (!currentPassword) {
			setPasswordError('Wpisz aktualne hasło')
			return
		}

		if (!newPassword) {
			setPasswordError('Wpisz nowe hasło')
			return
		}

		if (newPassword.length < 6) {
			setPasswordError('Nowe hasło musi mieć minimum 6 znaków')
			return
		}

		if (newPassword !== confirmNewPassword) {
			setPasswordError('Nowe hasła nie są identyczne')
			return
		}

		if (currentPassword === newPassword) {
			setPasswordError('Nowe hasło musi być inne niż aktualne')
			return
		}

		setChangingPassword(true)

		try {
			const credential = EmailAuthProvider.credential(
				currentUser.email,
				currentPassword
			)
			await reauthenticateWithCredential(currentUser, credential)
			await updatePassword(currentUser, newPassword)

			setPasswordSuccess('✅ Hasło zostało zmienione!')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmNewPassword('')
			
			setTimeout(() => setPasswordSuccess(''), 5000)

		} catch (error) {
			console.error('Błąd zmiany hasła:', error)
			
			if (error.code === 'auth/wrong-password') {
				setPasswordError('❌ Aktualne hasło jest nieprawidłowe')
			} else if (error.code === 'auth/too-many-requests') {
				setPasswordError('❌ Zbyt wiele prób. Spróbuj później')
			} else if (error.code === 'auth/requires-recent-login') {
				setPasswordError('❌ Wyloguj się i zaloguj ponownie, aby zmienić hasło')
			} else {
				setPasswordError('❌ Błąd zmiany hasła. Spróbuj ponownie')
			}
		}

		setChangingPassword(false)
	}

	const handleCancelSubscription = async () => {
		if (!isOwner) {
			alert('❌ Tylko właściciel organizacji może zarządzać subskrypcją.')
			return
		}

		if (!confirm('Czy na pewno chcesz anulować subskrypcję?\n\nDostęp pozostanie aktywny do końca bieżącego okresu rozliczeniowego.')) {
			return
		}

		try {
			const orgRef = doc(db, 'organizations', userProfile.currentOrganizationId)
			await updateDoc(orgRef, {
				'subscription.cancelAtPeriodEnd': true,
				updatedAt: new Date().toISOString()
			})

			alert('✅ Subskrypcja zostanie anulowana na koniec okresu rozliczeniowego.')
			loadAllOrgsData()
		} catch (error) {
			console.error('Błąd anulowania:', error)
			alert('❌ Błąd anulowania subskrypcji')
		}
	}

	// Opuść organizację
	const handleLeaveOrganization = async (e) => {
		e.preventDefault()
		setActionError('')
		setActionLoading(true)

		try {
			const credential = EmailAuthProvider.credential(
				currentUser.email,
				confirmPassword
			)
			await reauthenticateWithCredential(currentUser, credential)

			const orgIdToLeave = selectedOrgForAction?.id || userProfile.currentOrganizationId
			const userRef = doc(db, 'users', currentUser.uid)

			const updatedOrganizations = userProfile.organizations.filter(
				org => org.id !== orgIdToLeave
			)

			if (updatedOrganizations.length === 0) {
				await updateDoc(userRef, {
					organizations: [],
					currentOrganizationId: null,
					updatedAt: new Date().toISOString()
				})

				alert('✅ Opuściłeś organizację.\n\nNie masz już dostępu do żadnej organizacji.')
				await logout()
				window.location.href = '/register'
				return
			}

			const newOrgId = updatedOrganizations[0].id

			await updateDoc(userRef, {
				organizations: updatedOrganizations,
				currentOrganizationId: newOrgId,
				updatedAt: new Date().toISOString()
			})

			alert('✅ Opuściłeś organizację.\n\nPrzełączono na inną organizację.')
			window.location.reload()

		} catch (error) {
			console.error('Błąd opuszczania organizacji:', error)
			
			if (error.code === 'auth/wrong-password') {
				setActionError('❌ Nieprawidłowe hasło')
			} else {
				setActionError('❌ Błąd opuszczania organizacji')
			}
			setActionLoading(false)
		}
	}

	// Usuń organizację
	const handleDeleteOrganization = async (e) => {
		e.preventDefault()
		setActionError('')
		setActionLoading(true)

		try {
			const credential = EmailAuthProvider.credential(
				currentUser.email,
				confirmPassword
			)
			await reauthenticateWithCredential(currentUser, credential)

			const orgIdToDelete = selectedOrgForAction?.id || userProfile.currentOrganizationId

			// ✅ ZMIANA - Nie usuwaj organizacji, tylko oznacz jako deleted
			// Dzięki temu checkIfUserHasPaidPlan() nadal ją znajdzie!
			const orgRef = doc(db, 'organizations', orgIdToDelete)
			await updateDoc(orgRef, {
				deleted: true,
				deletedAt: new Date().toISOString(),
				deletedBy: currentUser.uid,
				updatedAt: new Date().toISOString()
			})

			// 2. Znajdź wszystkich użytkowników
			const usersRef = collection(db, 'users')
			const usersSnapshot = await getDocs(usersRef)

			const updatePromises = []

			usersSnapshot.forEach((userDoc) => {
				const userData = userDoc.data()
				const hasThisOrg = userData.organizations?.some(org => org.id === orgIdToDelete)

				if (hasThisOrg) {
					const updatedOrganizations = userData.organizations.filter(
						org => org.id !== orgIdToDelete
					)

					let newCurrentOrgId = userData.currentOrganizationId
					if (userData.currentOrganizationId === orgIdToDelete) {
						newCurrentOrgId = updatedOrganizations.length > 0 ? updatedOrganizations[0].id : null
					}

					updatePromises.push(
						updateDoc(doc(db, 'users', userDoc.id), {
							organizations: updatedOrganizations,
							currentOrganizationId: newCurrentOrgId,
							updatedAt: new Date().toISOString()
						})
					)
				}
			})

			await Promise.all(updatePromises)

			// 3. Sprawdź czy owner ma inne organizacje
			const ownerOrgs = userProfile.organizations.filter(org => org.id !== orgIdToDelete)

			if (ownerOrgs.length === 0) {
				// ✅ Owner usunął ostatnią organizację
				// NIE WYLOGOWUJ - ma płatny plan!
				alert('✅ Organizacja usunięta.\n\nMożesz utworzyć nową organizację z tym samym planem.')
				window.location.href = '/'
				return
			}

			alert('✅ Organizacja usunięta.')
			window.location.reload()

		} catch (error) {
			console.error('Błąd usuwania organizacji:', error)
			
			if (error.code === 'auth/wrong-password') {
				setActionError('❌ Nieprawidłowe hasło')
			} else {
				setActionError('❌ Błąd usuwania organizacji')
			}
			setActionLoading(false)
		}
	}

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
				
				{isOwner && (
					<button 
						className={`settings-tab ${activeTab === 'subscription' ? 'active' : ''}`}
						onClick={() => setActiveTab('subscription')}>
						💳 Subskrypcja
					</button>
				)}
				
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

						{!isOwner && (
							<div style={{
								marginTop: '32px',
								padding: '20px',
								background: '#e7f3ff',
								border: '1px solid #0d6efd',
								borderRadius: '12px'
							}}>
								<h3 style={{ margin: '0 0 12px 0', color: '#004085' }}>
									👥 Członek zespołu
								</h3>
								<p style={{ margin: 0, color: '#004085', lineHeight: '1.6' }}>
									Jesteś członkiem organizacji <strong>{orgData?.name}</strong>.<br/>
									Subskrypcją zarządza właściciel organizacji.
								</p>
							</div>
						)}

						<div className="danger-zone">
							<h3>Strefa niebezpieczna</h3>
							
							{/* ✅ NOWE - LISTA WSZYSTKICH ORGANIZACJI */}
							<div style={{ marginBottom: '32px' }}>
								<h4 style={{ fontSize: '16px', marginBottom: '16px', color: '#333' }}>
									📋 Twoje organizacje
								</h4>
								
								{allOrgsData.map((org) => (
									<div 
										key={org.id}
										style={{
											padding: '16px',
											background: org.id === userProfile.currentOrganizationId ? '#f0f9ff' : '#f8f9fa',
											border: org.id === userProfile.currentOrganizationId ? '2px solid #0d6efd' : '1px solid #dee2e6',
											borderRadius: '8px',
											marginBottom: '12px'
										}}>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
											<div style={{ flex: '1 1 300px' }}>
												<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
													<strong style={{ fontSize: '16px' }}>
														{org.orgData?.name || org.name || 'Bez nazwy'}
													</strong>
													{org.id === userProfile.currentOrganizationId && (
														<span style={{ 
															background: '#0d6efd', 
															color: 'white', 
															padding: '2px 8px', 
															borderRadius: '4px', 
															fontSize: '12px',
															fontWeight: '600'
														}}>
															Obecna
														</span>
													)}
												</div>
												<div style={{ fontSize: '14px', color: '#666' }}>
													Rola: <strong>{org.role}</strong>
												</div>
											</div>
											
											<div>
												{org.isOwner ? (
													<button 
														className="btn-danger"
														onClick={() => {
															setSelectedOrgForAction(org)
															setShowDeleteModal(true)
														}}
														style={{ fontSize: '14px', padding: '8px 16px' }}>
														🗑️ Usuń organizację
													</button>
												) : (
													<button 
														className="btn-danger"
														onClick={() => {
															setSelectedOrgForAction(org)
															setShowLeaveModal(true)
														}}
														style={{ fontSize: '14px', padding: '8px 16px' }}>
														🚪 Opuść organizację
													</button>
												)}
											</div>
										</div>
									</div>
								))}
							</div>

							{/* Usuń konto */}
							<div>
								<h4 style={{ fontSize: '16px', marginBottom: '8px' }}>Usuń konto</h4>
								<p style={{ color: '#666', marginBottom: '12px' }}>
									Usuń swoje konto na zawsze. Ta akcja jest nieodwracalna.
								</p>
								<button className="btn-danger" onClick={() => alert('Funkcja wkrótce')}>
									🗑️ Usuń konto
								</button>
							</div>
						</div>
					</div>
				)}

				{/* SUBSKRYPCJA - TYLKO DLA OWNERÓW */}
				{activeTab === 'subscription' && isOwner && (
					<div className="settings-section">
						<h2>Twoja subskrypcja</h2>

						{orgData?.subscription ? (
							<>
								<div className="subscription-card">
									<div className="subscription-header">
										<h3>{orgData.name}</h3>
										<span className={`subscription-status ${orgData.subscription.status}`}>
											{orgData.subscription.status === 'trialing' ? '🎁 Okres próbny' : 
											 orgData.subscription.status === 'active' ? '✅ Aktywna' : 
											 orgData.subscription.status === 'past_due' ? '⚠️ Zaległość' : 
											 '❌ Nieaktywna'}
										</span>
									</div>

									<div className="subscription-details">
										<div className="detail-row">
											<span className="detail-label">Plan:</span>
											<span className="detail-value">
												{orgData.subscription.plan === 'monthly' ? 'Miesięczny' :
												 orgData.subscription.plan === 'semiannual' ? 'Półroczny' :
												 orgData.subscription.plan === 'annual' ? 'Roczny' : 'Nieznany'}
											</span>
										</div>
										<div className="detail-row">
											<span className="detail-label">Cena:</span>
											<span className="detail-value">{orgData.subscription.price} zł/{orgData.subscription.interval === 'month' ? 'miesiąc' : 'rok'}</span>
										</div>
										<div className="detail-row">
											<span className="detail-label">Następna płatność:</span>
											<span className="detail-value">
												{new Date(orgData.subscription.currentPeriodEnd).toLocaleDateString('pl-PL')}
											</span>
										</div>
										{orgData.subscription.status === 'trialing' && (
											<div className="detail-row">
												<span className="detail-label">Koniec okresu próbnego:</span>
												<span className="detail-value">
													{new Date(orgData.subscription.trialEndsAt).toLocaleDateString('pl-PL')}
												</span>
											</div>
										)}
										<div className="detail-row">
											<span className="detail-label">Limit organizacji:</span>
											<span className="detail-value">
												{orgData.limits?.maxOrganizations === 999 ? 'Nielimitowane' : orgData.limits?.maxOrganizations || 1}
											</span>
										</div>
									</div>

									<div className="subscription-actions">
										<button className="btn-secondary" onClick={() => alert('Funkcja wkrótce')}>
											📝 Zmień plan
										</button>
										{!orgData.subscription.cancelAtPeriodEnd && (
											<button className="btn-danger" onClick={handleCancelSubscription}>
												🚫 Anuluj subskrypcję
											</button>
										)}
										{orgData.subscription.cancelAtPeriodEnd && (
											<div className="cancel-notice">
												⚠️ Subskrypcja zostanie anulowana {new Date(orgData.subscription.currentPeriodEnd).toLocaleDateString('pl-PL')}
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
								<p>Nie masz aktywnej subskrypcji</p>
								<button className="btn-primary" onClick={() => window.location.href = '/pricing'}>
									Wybierz plan
								</button>
							</div>
						)}
					</div>
				)}

				{/* BEZPIECZEŃSTWO */}
				{activeTab === 'security' && (
					<div className="settings-section">
						<h2>Bezpieczeństwo</h2>

						<div className="security-item password-change-section">
							<h3>Zmiana hasła</h3>
							<p>Zaktualizuj swoje hasło aby zachować bezpieczeństwo konta</p>

							<form onSubmit={handleChangePassword} className="password-change-form">
								<div className="form-group">
									<label>Aktualne hasło</label>
									<div className="password-input-wrapper">
										<input
											type={showCurrentPassword ? "text" : "password"}
											placeholder="Wpisz aktualne hasło"
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
											className="settings-input"
											disabled={changingPassword}
										/>
										<button
											type="button"
											className="password-toggle"
											onClick={() => setShowCurrentPassword(!showCurrentPassword)}
											tabIndex={-1}>
											{showCurrentPassword ? '🙈' : '👁️'}
										</button>
									</div>
								</div>

								<div className="form-group">
									<label>Nowe hasło (min. 6 znaków)</label>
									<div className="password-input-wrapper">
										<input
											type={showNewPassword ? "text" : "password"}
											placeholder="Wpisz nowe hasło"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											className="settings-input"
											disabled={changingPassword}
											minLength={6}
										/>
										<button
											type="button"
											className="password-toggle"
											onClick={() => setShowNewPassword(!showNewPassword)}
											tabIndex={-1}>
											{showNewPassword ? '🙈' : '👁️'}
										</button>
									</div>
								</div>

								<div className="form-group">
									<label>Powtórz nowe hasło</label>
									<div className="password-input-wrapper">
										<input
											type={showConfirmNewPassword ? "text" : "password"}
											placeholder="Powtórz nowe hasło"
											value={confirmNewPassword}
											onChange={(e) => setConfirmNewPassword(e.target.value)}
											className="settings-input"
											disabled={changingPassword}
											minLength={6}
										/>
										<button
											type="button"
											className="password-toggle"
											onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
											tabIndex={-1}>
											{showConfirmNewPassword ? '🙈' : '👁️'}
										</button>
									</div>
								</div>

								{passwordError && (
									<div className="password-error" style={{
										padding: '12px',
										background: '#fee',
										border: '1px solid #fcc',
										borderRadius: '8px',
										color: '#c33',
										fontSize: '14px',
										marginBottom: '16px'
									}}>
										{passwordError}
									</div>
								)}

								{passwordSuccess && (
									<div className="password-success" style={{
										padding: '12px',
										background: '#efe',
										border: '1px solid #cfc',
										borderRadius: '8px',
										color: '#383',
										fontSize: '14px',
										marginBottom: '16px'
									}}>
										{passwordSuccess}
									</div>
								)}

								<button 
									type="submit" 
									className="btn-save" 
									disabled={changingPassword}
									style={{ marginTop: '8px' }}>
									{changingPassword ? '⏳ Zmieniam hasło...' : '🔒 Zmień hasło'}
								</button>
							</form>
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

			{/* MODAL - OPUŚĆ ORGANIZACJĘ */}
			{showLeaveModal && (
				<div className='modal-overlay' onClick={() => setShowLeaveModal(false)}>
					<div className='modal-card' onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
						<h2>🚪 Opuść organizację</h2>
						<p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
							Czy na pewno chcesz opuścić organizację <strong>{selectedOrgForAction?.orgData?.name || selectedOrgForAction?.name}</strong>?
							{userProfile?.organizations?.length > 1 ? (
								<>
									<br/><br/>
									Zostaniesz przełączony na inną dostępną organizację.
								</>
							) : (
								<>
									<br/><br/>
									⚠️ <strong>Nie masz innych organizacji.</strong> Po opuszczeniu tej organizacji stracisz dostęp do aplikacji.
								</>
							)}
						</p>

						<form onSubmit={handleLeaveOrganization}>
							<div className="form-group">
								<label>Potwierdź hasło</label>
								<div className="password-input-wrapper">
									<input
										type={showConfirmPassword ? "text" : "password"}
										placeholder="Wpisz swoje hasło"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="settings-input"
										disabled={actionLoading}
										required
										autoFocus
									/>
									<button
										type="button"
										className="password-toggle"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										tabIndex={-1}>
										{showConfirmPassword ? '🙈' : '👁️'}
									</button>
								</div>
							</div>

							{actionError && (
								<div style={{ 
									padding: '12px', 
									background: '#fee', 
									color: '#c00', 
									borderRadius: '8px', 
									fontSize: '14px',
									marginBottom: '16px'
								}}>
									{actionError}
								</div>
							)}

							<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
								<button 
									type='submit' 
									className='btn-danger'
									disabled={actionLoading}
									style={{ flex: 1 }}>
									{actionLoading ? '⏳ Opuszczam...' : '🚪 Opuść organizację'}
								</button>
								<button 
									type='button' 
									className='modal-btn-secondary'
									onClick={() => {
										setShowLeaveModal(false)
										setConfirmPassword('')
										setActionError('')
										setSelectedOrgForAction(null)
									}}
									style={{ flex: 1 }}>
									Anuluj
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL - USUŃ ORGANIZACJĘ */}
			{showDeleteModal && (
				<div className='modal-overlay' onClick={() => setShowDeleteModal(false)}>
					<div className='modal-card' onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
						<h2>🗑️ Usuń organizację</h2>
						<div style={{ 
							padding: '16px', 
							background: '#fff3cd', 
							border: '2px solid #ffc107',
							borderRadius: '8px',
							marginBottom: '20px'
						}}>
							<p style={{ margin: '0 0 12px 0', color: '#856404', fontWeight: '600', fontSize: '16px' }}>
								⚠️ UWAGA! To działanie jest NIEODWRACALNE!
							</p>
							<p style={{ margin: 0, color: '#856404', fontSize: '14px', lineHeight: '1.6' }}>
								Zostaną usunięte:<br/>
								• Wszystkie zamówienia<br/>
								• Wszystkie typy produktów<br/>
								• Wszyscy członkowie zespołu<br/>
								• Wszystkie dane organizacji
							</p>
						</div>
						<p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
							Czy na pewno chcesz usunąć organizację <strong>{selectedOrgForAction?.orgData?.name || selectedOrgForAction?.name}</strong>?
						</p>

						<form onSubmit={handleDeleteOrganization}>
							<div className="form-group">
								<label>Potwierdź hasło</label>
								<div className="password-input-wrapper">
									<input
										type={showConfirmPassword ? "text" : "password"}
										placeholder="Wpisz swoje hasło"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="settings-input"
										disabled={actionLoading}
										required
										autoFocus
									/>
									<button
										type="button"
										className="password-toggle"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										tabIndex={-1}>
										{showConfirmPassword ? '🙈' : '👁️'}
									</button>
								</div>
							</div>

							{actionError && (
								<div style={{ 
									padding: '12px', 
									background: '#fee', 
									color: '#c00', 
									borderRadius: '8px', 
									fontSize: '14px',
									marginBottom: '16px'
								}}>
									{actionError}
								</div>
							)}

							<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
								<button 
									type='submit' 
									className='btn-danger'
									disabled={actionLoading}
									style={{ flex: 1 }}>
									{actionLoading ? '⏳ Usuwam...' : '🗑️ Usuń organizację'}
								</button>
								<button 
									type='button' 
									className='modal-btn-secondary'
									onClick={() => {
										setShowDeleteModal(false)
										setConfirmPassword('')
										setActionError('')
										setSelectedOrgForAction(null)
									}}
									style={{ flex: 1 }}>
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