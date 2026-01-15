import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { auth } from './firebase'
import { applyActionCode } from 'firebase/auth'
import './Auth.css'

export default function EmailAction() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const [status, setStatus] = useState('loading') // loading, success, error
	const [error, setError] = useState('')

	useEffect(() => {
		const handleEmailAction = async () => {
			const mode = searchParams.get('mode')
			const actionCode = searchParams.get('oobCode')

			console.log('📧 EMAIL ACTION:', mode, actionCode)

			if (mode === 'verifyEmail' && actionCode) {
				try {
					// Weryfikuj email
					await applyActionCode(auth, actionCode)
					console.log('✅ Email zweryfikowany!')
					setStatus('success')
					
					// Przekieruj na wybór planu po 2 sekundach
					setTimeout(() => {
						navigate('/choose-plan')
					}, 2000)
				} catch (err) {
					console.error('❌ Błąd weryfikacji:', err)
					setError(err.message)
					setStatus('error')
				}
			} else {
				setError('Nieprawidłowy link weryfikacyjny')
				setStatus('error')
			}
		}

		handleEmailAction()
	}, [searchParams, navigate])

	if (status === 'loading') {
		return (
			<div className="auth-container">
				<div className="auth-card">
					<div className="auth-header">
						<div style={{ fontSize: '64px', textAlign: 'center', marginBottom: '20px' }}>⏳</div>
						<h1 className="auth-title">Weryfikuję email...</h1>
						<p className="auth-subtitle">Proszę czekać</p>
					</div>
				</div>
			</div>
		)
	}

	if (status === 'success') {
		return (
			<div className="auth-container">
				<div className="auth-card">
					<div className="auth-header">
						<div style={{ fontSize: '64px', textAlign: 'center', marginBottom: '20px' }}>✅</div>
						<h1 className="auth-title">Email zweryfikowany!</h1>
						<p className="auth-subtitle">
							Za chwilę przekierujemy Cię na stronę wyboru planu...
						</p>
					</div>

					<div className="auth-info" style={{ marginTop: '32px', background: '#d4edda', border: '1px solid #c3e6cb' }}>
						<p>
							🎯 Teraz możesz <strong>wybrać plan</strong> i rozpocząć korzystanie z aplikacji!
						</p>
					</div>
				</div>
			</div>
		)
	}

	if (status === 'error') {
		return (
			<div className="auth-container">
				<div className="auth-card">
					<div className="auth-header">
						<div style={{ fontSize: '64px', textAlign: 'center', marginBottom: '20px' }}>❌</div>
						<h1 className="auth-title">Błąd weryfikacji</h1>
						<p className="auth-subtitle">{error}</p>
					</div>

					<div className="auth-info" style={{ marginTop: '32px' }}>
						<p>Link weryfikacyjny może być:</p>
						<ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
							<li>Wygasły (stare linki tracą ważność)</li>
							<li>Już użyty</li>
							<li>Nieprawidłowy</li>
						</ul>
					</div>

					<button 
						onClick={() => navigate('/register')}
						className="auth-button"
						style={{ marginTop: '24px' }}>
						Zarejestruj się ponownie
					</button>
				</div>
			</div>
		)
	}
}
