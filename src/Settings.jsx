import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import './Settings.css'

export default function Settings() {
	const { currentUser, userProfile, logout } = useAuth()
	const [activeTab, setActiveTab] = useState('account')
	const [orgData, setOrgData] = useState(null)
	const [loading, setLoading] = useState(true)
	
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

	useEffect(() => {
		if (currentUser && userProfile) {
			setDisplayName(userProfile.displayName || '')
			setEmail(currentUser.email || '')
			loadOrgData()
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

		// Walidacja
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
			// Krok 1: Reauthentication (weryfikacja starego hasła)
			const credential = EmailAuthProvider.credential(
				currentUser.email,
				currentPassword
			)
			await reauthenticateWithCredential(currentUser, credential)

			// Krok 2: Zmiana hasła
			await updatePassword(currentUser, newPassword)

			// Sukces!
			setPasswordSuccess('✅ Hasło zostało zmienione!')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmNewPassword('')
			
			// Ukryj komunikat po 5 sekundach
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
			loadOrgData()
		} catch (error) {
			console.error('Błąd anulowania:', error)
			alert('❌ Błąd anulowania subskrypcji')
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

				{/* SUBSKRYPCJA */}
				{activeTab === 'subscription' && (
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

						{/* ZMIANA HASŁA - FORMULARZ */}
						<div className="security-item password-change-section">
							<h3>Zmiana hasła</h3>
							<p>Zaktualizuj swoje hasło aby zachować bezpieczeństwo konta</p>

							<form onSubmit={handleChangePassword} className="password-change-form">
								{/* Aktualne hasło */}
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

								{/* Nowe hasło */}
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

								{/* Powtórz nowe hasło */}
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

								{/* Błąd */}
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

								{/* Sukces */}
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

								{/* Przycisk */}
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
		</div>
	)
}