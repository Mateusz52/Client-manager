import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './CookieConsent.css'

export default function CookieConsent() {
	const [visible, setVisible] = useState(false)
	const [showSettings, setShowSettings] = useState(false)

	const [preferences, setPreferences] = useState({
		necessary: true, // Zawsze włączone
		analytics: false,
		marketing: false
	})

	useEffect(() => {
		const consent = localStorage.getItem('cookieConsent')
		if (!consent) {
			setVisible(true)
		} else {
			const saved = JSON.parse(consent)
			setPreferences(saved)
		}
	}, [])

	const handleAcceptAll = () => {
		const allAccepted = {
			necessary: true,
			analytics: true,
			marketing: true
		}
		localStorage.setItem('cookieConsent', JSON.stringify(allAccepted))
		setPreferences(allAccepted)
		setVisible(false)
	}

	const handleAcceptSelected = () => {
		localStorage.setItem('cookieConsent', JSON.stringify(preferences))
		setVisible(false)
	}

	const handleRejectAll = () => {
		const onlyNecessary = {
			necessary: true,
			analytics: false,
			marketing: false
		}
		localStorage.setItem('cookieConsent', JSON.stringify(onlyNecessary))
		setPreferences(onlyNecessary)
		setVisible(false)
	}

	if (!visible) return null

	return (
		<div className="cookie-consent-overlay">
			<div className="cookie-consent">
				{!showSettings ? (
					/* GŁÓWNY EKRAN */
					<>
						<div className="cookie-header">
							<h3>🍪 Ta strona używa plików cookie</h3>
						</div>

						<div className="cookie-body">
							<p>
								Używamy plików cookie aby zapewnić najlepsze doświadczenie na naszej stronie. 
								Niektóre są niezbędne do działania serwisu, inne pomagają nam analizować ruch i dostosować treści.
							</p>
						</div>

						<div className="cookie-actions">
							<button onClick={handleAcceptAll} className="btn-cookie btn-accept">
								✅ Akceptuj wszystkie
							</button>
							<button onClick={handleRejectAll} className="btn-cookie btn-reject">
								❌ Tylko niezbędne
							</button>
							<button onClick={() => setShowSettings(true)} className="btn-cookie btn-settings">
								⚙️ Ustawienia
							</button>
						</div>

						<div className="cookie-footer">
							<Link to="/privacy-policy">
								Polityka prywatności
							</Link>
							{' • '}
							<Link to="/privacy-policy">
								Polityka cookies
							</Link>
						</div>
					</>
				) : (
					/* EKRAN USTAWIEŃ */
					<>
						<div className="cookie-header">
							<h3>⚙️ Ustawienia cookies</h3>
						</div>

						<div className="cookie-body">
							<div className="cookie-category">
								<div className="category-header">
									<input 
										type="checkbox" 
										checked={preferences.necessary} 
										disabled 
										id="necessary"
									/>
									<label htmlFor="necessary">
										<strong>Niezbędne</strong>
										<span className="required-badge">Wymagane</span>
									</label>
								</div>
								<p className="category-description">
									Te pliki cookie są konieczne do prawidłowego działania strony. 
									Umożliwiają logowanie, zarządzanie sesją i podstawową funkcjonalność.
								</p>
							</div>

							<div className="cookie-category">
								<div className="category-header">
									<input 
										type="checkbox" 
										checked={preferences.analytics} 
										onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
										id="analytics"
									/>
									<label htmlFor="analytics">
										<strong>Analityczne</strong>
									</label>
								</div>
								<p className="category-description">
									Pomagają nam zrozumieć jak użytkownicy korzystają ze strony, 
									aby móc ją ulepszać. Wszystkie dane są anonimowe.
								</p>
							</div>

							<div className="cookie-category">
								<div className="category-header">
									<input 
										type="checkbox" 
										checked={preferences.marketing} 
										onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
										id="marketing"
									/>
									<label htmlFor="marketing">
										<strong>Marketingowe</strong>
									</label>
								</div>
								<p className="category-description">
									Służą do personalizacji reklam i śledzenia efektywności kampanii marketingowych.
								</p>
							</div>
						</div>

						<div className="cookie-actions">
							<button onClick={handleAcceptSelected} className="btn-cookie btn-accept">
								✅ Zapisz wybór
							</button>
							<button onClick={() => setShowSettings(false)} className="btn-cookie btn-back">
								← Wróć
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	)
}