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
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [displayName, setDisplayName] = useState('')
	const [inviteCode, setInviteCode] = useState(codeFromUrl || '')
	const [acceptedTerms, setAcceptedTerms] = useState(false)
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const [success, setSuccess] = useState(false)

	// Jeśli user jest zalogowany i ma kod - dołącz do organizacji
	useEffect(() => {
		const handleCodeForLoggedInUser = async () => {
			if (currentUser && codeFromUrl) {
				try {
					setLoading(true)
					await joinOrganizationWithCode(codeFromUrl)
					setSearchParams({})
					window.location.href = '/'
				} catch (err) {
					setError(err.message || 'Błąd dołączania do organizacji')
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

		// Walidacja hasła
		if (password !== confirmPassword) {
			setError('Hasła nie są identyczne')
			return
		}

		if (password.length < 6) {
			setError('Hasło musi mieć minimum 6 znaków')
			return
		}

		// Walidacja akceptacji regulaminu
		if (!acceptedTerms) {
			setError('Musisz zaakceptować regulamin, aby się zarejestrować')
			return
		}

		setLoading(true)

		try {
			if (!displayName.trim()) {
				throw new Error('Wpisz swoje imię')
			}

			if (hasInviteCode) {
				if (!inviteCode.trim()) {
					throw new Error('Wpisz kod zaproszenia')
				}
				await signupWithInviteCode(email, password, displayName, inviteCode.toUpperCase())
			} else {
				await signupAsOwner(email, password, displayName)
			}

			console.log('Rejestracja pomyślna!')
			setSuccess(true)

		} catch (err) {
			console.error('Błąd rejestracji:', err)
			
			let errorMessage = 'Wystąpił błąd'
			
			if (err.code === 'auth/email-already-in-use') {
				errorMessage = 'Ten email jest już zarejestrowany. Masz już konto? Zaloguj się.'
			} else if (err.code === 'auth/weak-password') {
				errorMessage = 'Hasło jest za słabe (minimum 6 znaków)'
			} else if (err.code === 'auth/invalid-email') {
				errorMessage = 'Nieprawidłowy format emaila'
			} else if (err.message) {
				errorMessage = err.message
			}
			
			setError(errorMessage)
			setLoading(false)
		}
	}

	// Po sukcesie pokaż komunikat
	if (success) {
		return (
			<div className="auth-container">
				<div className="auth-card" style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
					<h2>Rejestracja pomyślna!</h2>
					<p style={{ color: '#666' }}>Przekierowuję...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="auth-container">
			<div className="auth-card">
				<div className="auth-header">
					<h1 className="auth-title">Zarejestruj się</h1>
					<p className="auth-subtitle">
						Utwórz konto i zacznij zarządzać zamówieniami
					</p>
				</div>

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="form-group">
						<label>Twoje imię</label>
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
						<label>Hasło</label>
						<div className="password-input-wrapper">
							<input
								type={showPassword ? 'text' : 'password'}
								placeholder="Minimum 6 znaków"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="auth-input"
								required
								minLength={6}
							/>
							<button
								type="button"
								className="password-toggle-btn"
								onClick={() => setShowPassword(!showPassword)}
								tabIndex={-1}
								aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
							>
								{showPassword ? (
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
										<line x1="1" y1="1" x2="23" y2="23"/>
									</svg>
								) : (
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
										<circle cx="12" cy="12" r="3"/>
									</svg>
								)}
							</button>
						</div>
					</div>

					<div className="form-group">
						<label>Powtórz hasło</label>
						<div className="password-input-wrapper">
							<input
								type={showConfirmPassword ? 'text' : 'password'}
								placeholder="Wpisz hasło ponownie"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className={`auth-input ${confirmPassword && password !== confirmPassword ? 'input-error' : ''}`}
								required
								minLength={6}
							/>
							<button
								type="button"
								className="password-toggle-btn"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								tabIndex={-1}
								aria-label={showConfirmPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
							>
								{showConfirmPassword ? (
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
										<line x1="1" y1="1" x2="23" y2="23"/>
									</svg>
								) : (
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
										<circle cx="12" cy="12" r="3"/>
									</svg>
								)}
							</button>
						</div>
						{confirmPassword && password !== confirmPassword && (
							<small className="field-error">Hasła nie są identyczne</small>
						)}
						{confirmPassword && password === confirmPassword && confirmPassword.length >= 6 && (
							<small className="field-success">✓ Hasła są zgodne</small>
						)}
					</div>

					<div className="invite-section">
						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={hasInviteCode}
								onChange={(e) => setHasInviteCode(e.target.checked)}
							/>
							<span>Mam kod zaproszenia do zespołu</span>
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

					{/* CHECKBOX AKCEPTACJI REGULAMINU */}
					<div className="terms-section">
						<label className={`checkbox-label terms-checkbox ${!acceptedTerms && error ? 'terms-error' : ''}`}>
							<input
								type="checkbox"
								checked={acceptedTerms}
								onChange={(e) => {
									setAcceptedTerms(e.target.checked)
									if (error && e.target.checked) setError('')
								}}
							/>
							<span>
								Akceptuję{' '}
								<Link to="/regulamin" target="_blank" className="terms-link">
									Regulamin serwisu
								</Link>
								<span className="required-star">*</span>
							</span>
						</label>
					</div>

					{error && <div className="auth-error">{error}</div>}

					<button 
						type="submit" 
						className="auth-button" 
						disabled={loading || !acceptedTerms || (confirmPassword && password !== confirmPassword)}
						title={!acceptedTerms ? 'Zaakceptuj regulamin, aby kontynuować' : ''}
					>
						{loading ? 'Rejestrowanie...' : 'Zarejestruj się'}
					</button>

					<div className="auth-footer">
						Masz już konto? <Link to="/login">Zaloguj się</Link>
					</div>
				</form>

				{!hasInviteCode && (
					<div className="auth-info">
						<p>
							💡 <strong>Rejestracja jako właściciel</strong> - po rejestracji wybierzesz plan i utworzysz firmę
						</p>
					</div>
				)}

				{hasInviteCode && (
					<div className="auth-info">
						<p>
							👥 <strong>Dołączenie do zespołu</strong> - kod otrzymałeś od właściciela firmy
						</p>
					</div>
				)}
			</div>
		</div>
	)
}