import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useSearchParams, Link } from 'react-router-dom'
import './Auth.css'

export default function Register() {
	const { signupAsOwner, signupWithInviteCode, joinOrganizationWithCode, currentUser } = useAuth()
	const [searchParams, setSearchParams] = useSearchParams()
	const codeFromUrl = searchParams.get('code')
	
	const [hasInviteCode, setHasInviteCode] = useState(!!codeFromUrl)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [displayName, setDisplayName] = useState('')
	const [inviteCode, setInviteCode] = useState(codeFromUrl || '')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const [success, setSuccess] = useState(false)

	// Jesli user jest zalogowany i ma kod - dolacz do organizacji
	useEffect(() => {
		const handleCodeForLoggedInUser = async () => {
			if (currentUser && codeFromUrl) {
				try {
					setLoading(true)
					await joinOrganizationWithCode(codeFromUrl)
					setSearchParams({})
					window.location.href = '/'
				} catch (err) {
					setError(err.message || 'Blad dolaczania do organizacji')
					setLoading(false)
				}
			}
		}

		handleCodeForLoggedInUser()
	}, [currentUser, codeFromUrl])

	useEffect(() => {
		if (codeFromUrl && !currentUser) {
			setHasInviteCode(true)
			setInviteCode(codeFromUrl)
		}
	}, [codeFromUrl, currentUser])

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			if (!displayName.trim()) {
				throw new Error('Wpisz swoje imie')
			}

			if (hasInviteCode) {
				if (!inviteCode.trim()) {
					throw new Error('Wpisz kod zaproszenia')
				}
				await signupWithInviteCode(email, password, displayName, inviteCode.toUpperCase())
			} else {
				await signupAsOwner(email, password, displayName)
			}

			console.log('Rejestracja pomyslna!')
			setSuccess(true)
			// NIE robimy recznego przekierowania - App.jsx to obsluzy automatycznie

		} catch (err) {
			console.error('Blad rejestracji:', err)
			
			let errorMessage = 'Wystapil blad'
			
			if (err.code === 'auth/email-already-in-use') {
				errorMessage = 'Ten email jest juz zarejestrowany. Masz juz konto? Zaloguj sie.'
			} else if (err.code === 'auth/weak-password') {
				errorMessage = 'Haslo jest za slabe (minimum 6 znakow)'
			} else if (err.code === 'auth/invalid-email') {
				errorMessage = 'Nieprawidlowy format emaila'
			} else if (err.message) {
				errorMessage = err.message
			}
			
			setError(errorMessage)
			setLoading(false)
		}
	}

	// Po sukcesie pokaz komunikat (przekierowanie nastapi automatycznie)
	if (success) {
		return (
			<div className="auth-container">
				<div className="auth-card" style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
					<h2>Rejestracja pomyslna!</h2>
					<p style={{ color: '#666' }}>Przekierowuje...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="auth-container">
			<div className="auth-card">
				<div className="auth-header">
					<h1 className="auth-title">Zarejestruj sie</h1>
					<p className="auth-subtitle">
						Utworz konto i zacznij zarzadzac zamowieniami
					</p>
				</div>

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="form-group">
						<label>Twoje imie</label>
						<input
							type="text"
							placeholder="Jan Kowalski"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							className="auth-input"
							required
						/>
					</div>

					<div className="form-group">
						<label>Email</label>
						<input
							type="email"
							placeholder="jan@firma.pl"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="auth-input"
							required
						/>
					</div>

					<div className="form-group">
						<label>Haslo</label>
						<input
							type="password"
							placeholder="Minimum 6 znakow"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="auth-input"
							required
							minLength={6}
						/>
					</div>

					<div className="invite-section">
						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={hasInviteCode}
								onChange={(e) => setHasInviteCode(e.target.checked)}
							/>
							<span>Mam kod zaproszenia do zespolu</span>
						</label>

						{hasInviteCode && (
							<div className="form-group" style={{ marginTop: '12px' }}>
								<input
									type="text"
									placeholder="Wpisz kod (np. XY4K9P)"
									value={inviteCode}
									onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
									className="auth-input auth-input-code"
									maxLength={6}
									required
								/>
							</div>
						)}
					</div>

					{error && <div className="auth-error">{error}</div>}

					<button type="submit" className="auth-button" disabled={loading}>
						{loading ? 'Rejestrowanie...' : 'Zarejestruj sie'}
					</button>

					<div className="auth-footer">
						Masz juz konto? <Link to="/login">Zaloguj sie</Link>
					</div>
				</form>

				{!hasInviteCode && (
					<div className="auth-info">
						<p>
							💡 <strong>Rejestracja jako wlasciciel</strong> - po rejestracji wybierzesz plan i utworzysz firme
						</p>
					</div>
				)}

				{hasInviteCode && (
					<div className="auth-info">
						<p>
							👥 <strong>Dolaczenie do zespolu</strong> - kod otrzymales od wlasciciela firmy
						</p>
					</div>
				)}
			</div>
		</div>
	)
}