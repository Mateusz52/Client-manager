import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
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

	// ✅ FIX 1: useCallback dla loadOrgData
	const loadOrgData = useCallback(async () => {
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
	}, [userProfile?.currentOrganizationId])

	// ✅ FIX 2: Poprawne dependencies
	useEffect(() => {
		if (currentUser && userProfile) {
			setDisplayName(userProfile.displayName || '')
			setEmail(currentUser.email || '')
			loadOrgData()
		}
	}, [currentUser, userProfile, loadOrgData])

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

	// ✅ FIX 3: Walidacja przed anulowaniem
	const handleCancelSubscription = async () => {
		if (!userProfile?.currentOrganizationId) {
			alert('❌ Brak aktywnej organizacji')
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
			loadOrgData()
		} catch (error) {
			console.error('Błąd anulowania:', error)
			alert('❌ Błąd anulowania subskrypcji')
		}
	}

	// ✅ FIX 4: Zmień plan - przekieruj na pricing
	const handleChangePlan = () => {
		window.location.href = '/pricing'
	}

	// ✅ FIX 5: Usuń konto - todo
	const handleDeleteAccount = () => {
		alert('⚠️ Funkcja usuwania konta zostanie wkrótce dodana.\n\nAby usunąć konto, skontaktuj się z supportem.')
	}

	// ✅ FIX 6: Zmień hasło - todo
	const handleChangePassword = () => {
		alert('⚠️ Funkcja zmiany hasła zostanie wkrótce dodana.\n\nUżyj opcji "Zapomniałem hasła" na stronie logowania.')
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
							<button className="btn-danger" onClick={handleDeleteAccount}>
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
										{/* ✅ FIX: Działający przycisk */}
										<button className="btn-secondary" onClick={handleChangePlan}>
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
								{/* ✅ FIX: Działający przycisk */}
								<button className="btn-primary" onClick={() => window.location.href = '/pricing'}>
									💳 Wybierz plan
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
							{/* ✅ FIX: Informacyjny przycisk */}
							<button className="btn-secondary" onClick={handleChangePassword}>
								🔑 Zmień hasło
							</button>
						</div>

						<div className="security-item">
							<h3>Dwuetapowa weryfikacja (2FA)</h3>
							<p>Dodaj dodatkową warstwę zabezpieczeń do swojego konta</p>
							<button className="btn-secondary" onClick={() => alert('⚠️ Funkcja 2FA zostanie dodana w przyszłej aktualizacji')}>
								🛡️ Włącz 2FA
							</button>
						</div>

						<div className="security-item">
							<h3>Aktywne sesje</h3>
							<p>Zarządzaj urządzeniami zalogowanymi do Twojego konta</p>
							<button className="btn-secondary" onClick={() => alert('⚠️ Funkcja zarządzania sesjami zostanie dodana w przyszłej aktualizacji')}>
								📱 Pokaż sesje
							</button>
						</div>

						<div className="security-item">
							<h3>Wyloguj się</h3>
							<p>Wyloguj się z tego urządzenia</p>
							{/* ✅ FIX: Poprawny opis */}
							<button className="btn-danger" onClick={logout}>
								🚪 Wyloguj się
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}