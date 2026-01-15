import { useState } from 'react'
import { useAuth } from './AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'

export default function Login() {
	const { login, resetPassword } = useAuth()
	const navigate = useNavigate()
	const [showResetPassword, setShowResetPassword] = useState(false)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const [resetEmailSent, setResetEmailSent] = useState(false)

	const handleSubmit = async (e) => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			if (showResetPassword) {
				await resetPassword(email)
				setResetEmailSent(true)
				setLoading(false)
				return
			}

			await login(email, password)
			
			// WYMUSZONY REDIRECT
			console.log('✅ Zalogowany - przekierowuję na /')
			setTimeout(() => {
				window.location.href = '/'
			}, 500)

		} catch (err) {
			console.error(err)
			
			let errorMessage = 'Wystąpił błąd'
			
			if (err.code === 'auth/user-not-found') {
				errorMessage = '❌ Nie znaleziono użytkownika z tym emailem'
			} else if (err.code === 'auth/wrong-password') {
				errorMessage = '❌ Nieprawidłowe hasło'
			} else if (err.code === 'auth/invalid-credential') {
				errorMessage = '❌ Nieprawidłowy email lub hasło'
			} else if (err.code === 'auth/too-many-requests') {
				errorMessage = '❌ Za dużo prób logowania. Spróbuj ponownie za chwilę.'
			} else if (err.message) {
				errorMessage = err.message
			}
			
			setError(errorMessage)
			setLoading(false)
		}
	}

	if (showResetPassword) {
		return (
			<div className="auth-container">
				<div className="auth-card">
					<div className="auth-header">
						<h1 className="auth-title">🔒 Reset hasła</h1>
						<p className="auth-subtitle">
							Wyślemy Ci link do zresetowania hasła
						</p>
					</div>
					
					{resetEmailSent ? (
						<div style={{ textAlign: 'center' }}>
							<div className="auth-info" style={{ background: '#d4edda', border: '1px solid #c3e6cb' }}>
								<p>
									✅ Email z linkiem resetującym został wysłany!<br/>
									Sprawdź swoją skrzynkę: <strong>{email}</strong>
								</p>
								<p style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
									⚠️ Email może trafić do folderu SPAM
								</p>
							</div>
							<button 
								onClick={() => {
									setShowResetPassword(false)
									setResetEmailSent(false)
									setEmail('')
								}}
								className="auth-button"
								style={{ marginTop: '20px' }}>
								Wróć do logowania
							</button>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="auth-form">
							<div className="form-group">
								<label>Email</label>
								<input
									type="email"
									placeholder="twoj@email.pl"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="auth-input"
									required
								/>
							</div>

							{error && <div className="auth-error">{error}</div>}

							<button type="submit" className="auth-button" disabled={loading}>
								{loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
							</button>

							<div className="auth-link">
								<a 
									href="#"
									onClick={(e) => {
										e.preventDefault()
										setShowResetPassword(false)
										setError('')
									}}>
									← Wróć do logowania
								</a>
							</div>
						</form>
					)}
				</div>
			</div>
		)
	}

	return (
		<div className="auth-container">
			<div className="auth-card">
				<div className="auth-header">
					<h1 className="auth-title">Zaloguj się</h1>
					<p className="auth-subtitle">
						Witaj ponownie! Zaloguj się do swojego konta
					</p>
				</div>

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="form-group">
						<label>Email</label>
						<input
							type="email"
							placeholder="twoj@email.pl"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="auth-input"
							required
						/>
					</div>

					<div className="form-group">
						<label>Hasło</label>
						<input
							type="password"
							placeholder="Twoje hasło"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="auth-input"
							required
							minLength={6}
						/>
					</div>

					{error && <div className="auth-error">{error}</div>}

					<button type="submit" className="auth-button" disabled={loading}>
						{loading ? 'Logowanie...' : 'Zaloguj się'}
					</button>

					<div className="auth-link">
						<a 
							href="#"
							onClick={(e) => {
								e.preventDefault()
								setShowResetPassword(true)
								setError('')
							}}>
							Zapomniałeś hasła?
						</a>
					</div>

					<div className="auth-footer">
						Nie masz konta? <Link to="/register">Zarejestruj się</Link>
					</div>
				</form>
			</div>
		</div>
	)
}