import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useSearchParams, Link } from 'react-router-dom'
import { showToast } from './simpleAlerts'
import './Auth.css'
import './auth-password.css'

export default function Register() {
	const { signupAsOwner, signupWithInviteCode, joinOrganizationWithCode, currentUser } = useAuth()
	const [searchParams, setSearchParams] = useSearchParams()
	const codeFromUrl = searchParams.get('code')

	const [hasInviteCode, setHasInviteCode] = useState(!!codeFromUrl)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [displayName, setDisplayName] = useState('')
	const [inviteCode, setInviteCode] = useState(codeFromUrl || '')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	// Stany dla pokazywania hasła
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)

	// Jeśli użytkownik jest ZALOGOWANY i ma kod - dołącz do organizacji
	useEffect(() => {
		const handleCodeForLoggedInUser = async () => {
			if (currentUser && codeFromUrl) {
				try {
					setLoading(true)
					await joinOrganizationWithCode(codeFromUrl)
					setSearchParams({})
					showToast('Pomyślnie dołączyłeś do nowej organizacji!', 'success')
					window.location.href = '/dashboard'
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

	const handleSubmit = async e => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			if (!displayName.trim()) {
				throw new Error('Wpisz swoje imię')
			}

			// Walidacja hasła
			if (password.length < 6) {
				throw new Error('Hasło musi mieć minimum 6 znaków')
			}

			// Sprawdź czy hasła się zgadzają
			if (password !== confirmPassword) {
				showToast('Hasła nie są identyczne!', 'error')
				setLoading(false)
				return
			}

			if (hasInviteCode) {
				if (!inviteCode.trim()) {
					throw new Error('Wpisz kod zaproszenia')
				}
				await signupWithInviteCode(email, password, displayName, inviteCode.toUpperCase())
			} else {
				await signupAsOwner(email, password, displayName)
			}

			console.log('✅ Rejestracja pomyślna - przekierowuję...')
			showToast('Konto utworzone pomyślnie!', 'success')

			// Przekieruj na wybór planu
			setTimeout(() => {
				window.location.href = '/select-plan'
			}, 500)
		} catch (err) {
			console.error('❌ Błąd rejestracji:', err)

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

	return (
		<div className='auth-container'>
			<div className='auth-card'>
				<div className='auth-header'>
					<h1 className='auth-title'>Zarejestruj się</h1>
					<p className='auth-subtitle'>Utwórz konto i zacznij zarządzać zamówieniami</p>
				</div>

				<form onSubmit={handleSubmit} className='auth-form'>
					<div className='form-group'>
						<label>Twoje imię</label>
						<input
							type='text'
							placeholder='Jan Kowalski'
							value={displayName}
							onChange={e => setDisplayName(e.target.value)}
							className='auth-input'
							required
						/>
					</div>

					<div className='form-group'>
						<label>Email</label>
						<input
							type='email'
							placeholder='jan@firma.pl'
							value={email}
							onChange={e => setEmail(e.target.value)}
							className='auth-input'
							required
						/>
					</div>

					<div className='form-group'>
						<label>Hasło</label>
						<div className='password-input-wrapper'>
							<input
								type={showPassword ? 'text' : 'password'}
								placeholder='Minimum 6 znaków'
								value={password}
								onChange={e => setPassword(e.target.value)}
								className='auth-input'
								required
								minLength={6}
							/>
							<button
								type='button'
								className='password-toggle'
								onClick={() => setShowPassword(!showPassword)}
								tabIndex='-1'>
								{showPassword ? '👁️' : '👁️‍🗨️'}
							</button>
						</div>
					</div>

					<div className='form-group'>
						<label>Potwierdź hasło</label>
						<div className='password-input-wrapper'>
							<input
								type={showConfirmPassword ? 'text' : 'password'}
								placeholder='Wpisz hasło ponownie'
								value={confirmPassword}
								onChange={e => setConfirmPassword(e.target.value)}
								className='auth-input'
								required
								minLength={6}
							/>
							<button
								type='button'
								className='password-toggle'
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								tabIndex='-1'>
								{showConfirmPassword ? '👁️' : '👁️‍🗨️'}
							</button>
						</div>
						{password && confirmPassword && password !== confirmPassword && (
							<span className='password-mismatch'>❌ Hasła nie są identyczne</span>
						)}
						{password && confirmPassword && password === confirmPassword && (
							<span className='password-match'>✅ Hasła są identyczne</span>
						)}
					</div>

					<div className='invite-section'>
						<label className='checkbox-label'>
							<input type='checkbox' checked={hasInviteCode} onChange={e => setHasInviteCode(e.target.checked)} />
							<span>Mam kod zaproszenia do zespołu</span>
						</label>

						{hasInviteCode && (
							<div className='form-group' style={{ marginTop: '12px' }}>
								<input
									type='text'
									placeholder='Wpisz kod (np. XY4K9P)'
									value={inviteCode}
									onChange={e => setInviteCode(e.target.value.toUpperCase())}
									className='auth-input auth-input-code'
									maxLength={6}
									required
								/>
							</div>
						)}
					</div>

					{error && <div className='auth-error'>{error}</div>}

					<button type='submit' className='auth-button' disabled={loading}>
						{loading ? 'Rejestrowanie...' : 'Zarejestruj się'}
					</button>

					<div className='auth-footer'>
						Masz już konto? <Link to='/login'>Zaloguj się</Link>
					</div>
				</form>

				{!hasInviteCode && (
					<div className='auth-info'>
						<p>
							💡 <strong>Rejestracja jako właściciel</strong> - utworzysz nową firmę/organizację
						</p>
					</div>
				)}

				{hasInviteCode && (
					<div className='auth-info'>
						<p>
							👥 <strong>Dołączenie do zespołu</strong> - kod otrzymałeś od właściciela firmy
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
