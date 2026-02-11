import { Link } from 'react-router-dom'
import { useState } from 'react'
import './LandingPage.css'

export default function LandingPage() {
	const [lightboxImage, setLightboxImage] = useState(null)

	const openLightbox = imageSrc => {
		setLightboxImage(imageSrc)
		document.body.style.overflow = 'hidden'
	}

	const closeLightbox = () => {
		setLightboxImage(null)
		document.body.style.overflow = 'auto'
	}

	return (
		<div className='landing'>
			{/* LIGHTBOX OVERLAY */}
			{lightboxImage && (
				<div className='lightbox-overlay active' onClick={closeLightbox}>
					<button className='lightbox-close' onClick={closeLightbox}>
						✕
					</button>
					<img src={lightboxImage} alt='Powiększony podgląd' className='lightbox-image' />
				</div>
			)}
			{/* HERO SECTION */}
			<section className='hero'>
				<div className='hero-container'>
					<div className='hero-content'>
						<h1 className='hero-title'>
							Zarządzaj <span className='gradient-text'>efektywnie</span> zamówieniami w Twojej firmie
						</h1>
						<p className='hero-subtitle'>
							Zarządzanie zamówieniami w jednym systemie. Terminy, realizacja i status zawsze pod Twoją ręką
						</p>
						<div className='hero-buttons'>
							<Link to='/pricing' className='btn btn-primary'>
								Rozpocznij za darmo
							</Link>
							<a href='#about' className='btn btn-secondary'>
								Dowiedz się więcej
							</a>
						</div>
					</div>
					<div className='hero-image'>
						<div className='hero-icons-grid'>
							<div className='icons-grid-container'>
								{/* ROW 1 */}
								<div className='icon-item'>
									<span className='icon-emoji'>📦</span>
									<span className='icon-label'>Produkty</span>
								</div>
								<div className='icon-item'>
									<span className='icon-emoji'>🎯</span>
									<span className='icon-label'>Zamówienia</span>
								</div>
								<div className='icon-item'>
									<span className='icon-emoji'>📊</span>
									<span className='icon-label'>Statystyki</span>
								</div>

								{/* ROW 2 */}
								<div className='icon-item'>
									<span className='icon-emoji'>👥</span>
									<span className='icon-label'>Zespół</span>
								</div>
								<div className='icon-item'>
									<span className='icon-emoji'>📱</span>
									<span className='icon-label'>Mobile</span>
								</div>
								<div className='icon-item'>
									<span className='icon-emoji'>⚡</span>
									<span className='icon-label'>Szybko</span>
								</div>

								{/* ROW 3 */}
								<div className='icon-item'>
									<span className='icon-emoji'>✅</span>
									<span className='icon-label'>Kontrola</span>
								</div>
								<div className='icon-item'>
									<span className='icon-emoji'>📈</span>
									<span className='icon-label'>Wzrost</span>
								</div>
								<div className='icon-item'>
									<span className='icon-emoji'>🔒</span>
									<span className='icon-label'>Bezpiecznie</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ABOUT / FEATURES SECTION */}
			<section id='about' className='features'>
				<div className='container'>
					<h2 className='section-title'>Wszystko czego potrzebujesz</h2>
					<p className='section-subtitle'>
						Profesjonalne narzędzia do zarządzania produkcją palet i produktów drewnianych
					</p>

					<div className='features-grid'>
						<div className='feature-card'>
							<div className='feature-icon'>🎯</div>
							<h3>Własne produkty</h3>
							<p>
								Dodawaj dowolne produkty - palety EUR, niestandardowe, deski paletowe, klocki, kantówki. Definiuj własne
								parametry i pola dla każdego typu.
							</p>
						</div>

						<div className='feature-card'>
							<div className='feature-icon'>📋</div>
							<h3>Kontrola zamówień</h3>
							<p>
								Śledź zamówienia od przyjęcia do realizacji. Zmieniaj statusy, dodawaj notatki, eksportuj raporty -
								wszystko w jednym miejscu.
							</p>
						</div>

						<div className='feature-card'>
							<div className='feature-icon'>📊</div>
							<h3>Statystyki produkcji</h3>
							<p>
								Zobacz które produkty są najpopularniejsze, analizuj przychody, śledzić trendy i podejmuj lepsze decyzje
								biznesowe.
							</p>
						</div>

						<div className='feature-card'>
							<div className='feature-icon'>👥</div>
							<h3>Zespół i uprawnienia</h3>
							<p>
								Zapraszaj pracowników, przydzielaj uprawnienia - kto może dodawać, edytować lub tylko przeglądać
								zamówienia.
							</p>
						</div>

						<div className='feature-card'>
							<div className='feature-icon'>📱</div>
							<h3>Dostęp mobilny</h3>
							<p>
								Zarządzaj produkcją z telefonu, tabletu lub komputera. Sprawdzaj zamówienia z dowolnego miejsca na
								świecie.
							</p>
						</div>

						<div className='feature-card'>
							<div className='feature-icon'>⚡</div>
							<h3>Szybka konfiguracja</h3>
							<p>
								Dodaj swoje produkty w kilka chwil. Bez skomplikowanych ustawień - zacznij pracę od razu po rejestracji.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* DEMO SECTION - Z PRAWDZIWYMI SCREENAMI */}
			<section className='demo'>
				<div className='container'>
					<h2 className='section-title'>Zobacz jak to działa</h2>
					<p className='section-subtitle'>6 prostych kroków do pełnej kontroli nad produkcją</p>

					<div className='demo-timeline'>
						{/* KROK 1: OBRAZ-TEKST */}
						<div className='demo-step'>
							<div className='demo-visual'>
								<div className='demo-screenshot' onClick={() => openLightbox('/step1-template.png')}>
									<img src='/step1-template.png' alt='Wybierz szablon produktu' />
								</div>
							</div>
							<div className='demo-text'>
								<div className='step-number'>01</div>
								<h3>Zacznij od gotowego szablonu</h3>
								<p>
									Wybierz szablon produktu z biblioteki lub stwórz własny. Palety EUR, niestandardowe, deski - masz
									pełną swobodę. System podpowie Ci jakie parametry dodać.
								</p>
							</div>
						</div>

						{/* KROK 2: TEKST-OBRAZ */}
						<div className='demo-step demo-step-reverse'>
							<div className='demo-visual'>
								<div className='demo-screenshot' onClick={() => openLightbox('/step2-product.png')}>
									<img src='/step2-product.png' alt='Tworzenie nowego produktu' />
								</div>
							</div>
							<div className='demo-text'>
								<div className='step-number'>02</div>
								<h3>Dodaj swoje produkty</h3>
								<p>
									Wypełnij nazwę, walutę, jednostkę miary i parametry produktu. Wszystko w jednym formularzu. Dodaj tyle
									parametrów ile potrzebujesz - wymiary, gatunek drewna, grubość.
								</p>
							</div>
						</div>

						{/* KROK 3: OBRAZ-TEKST */}
						<div className='demo-step'>
							<div className='demo-visual'>
								<div className='demo-screenshot' onClick={() => openLightbox('/step3-order.png')}>
									<img src='/step3-order.png' alt='Dodawanie nowego zamówienia' />
								</div>
							</div>
							<div className='demo-text'>
								<div className='step-number'>03</div>
								<h3>Przyjmuj zamówienia błyskawicznie</h3>
								<p>
									Wybierz produkt z listy, wpisz klienta, ilość, cenę i termin. System automatycznie obliczy wartość.
									Sprzedaż czy zakup? Wybierz jednym kliknięciem.
								</p>
							</div>
						</div>

						{/* KROK 4: TEKST-OBRAZ */}
						<div className='demo-step demo-step-reverse'>
							<div className='demo-visual'>
								<div className='demo-screenshot' onClick={() => openLightbox('/step4-list.png')}>
									<img src='/step4-list.png' alt='Lista zamówień z filtrami' />
								</div>
							</div>
							<div className='demo-text'>
								<div className='step-number'>04</div>
								<h3>Kontroluj całą produkcję</h3>
								<p>
									Wszystkie zamówienia w jednej tabeli. Filtruj po statusie, dacie, produkcie. Eksportuj do PDF jednym
									kliknięciem. Zmieniaj statusy na bieżąco - zespół widzi zmiany od razu.
								</p>
							</div>
						</div>

						{/* KROK 5: OBRAZ-TEKST */}
						<div className='demo-step'>
							<div className='demo-visual'>
								<div className='demo-screenshot' onClick={() => openLightbox('/step5-stats.png')}>
									<img src='/step5-stats.png' alt='Statystyki sprzedaży' />
								</div>
							</div>
							<div className='demo-text'>
								<div className='step-number'>05</div>
								<h3>Analizuj i optymalizuj</h3>
								<p>
									Zobacz które produkty przynoszą największy zysk. Sprawdź ilości, wartości, porównaj sprzedaż z
									zakupem. Wszystko w przejrzystych zestawieniach - bez skomplikowanych raportów.
								</p>
							</div>
						</div>

						{/* KROK 6: TEKST-OBRAZ */}
						<div className='demo-step demo-step-reverse'>
							<div className='demo-visual'>
								<div className='demo-screenshot' onClick={() => openLightbox('/step6-team.png')}>
									<img src='/step6-team.png' alt='Zarządzanie zespołem' />
								</div>
							</div>
							<div className='demo-text'>
								<div className='step-number'>06</div>
								<h3>Pracuj zespołowo</h3>
								<p>
									Zaproś pracowników emailem - dostaną kod dostępu. Ustal uprawnienia: kto może dodawać, edytować lub
									tylko przeglądać zamówienia. Pełna kontrola nad zespołem.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* STATS SECTION */}
			<section className='stats'>
				<div className='container'>
					<h2 className='stats-heading'>Dlaczego warto?</h2>
					<div className='stats-cards'>
						<div className='stat-card'>
							<div className='stat-icon'>✅</div>
							<div className='stat-number'>100%</div>
							<div className='stat-label'>Kontrola produkcji</div>
						</div>

						<div className='stat-card'>
							<div className='stat-icon'>📋</div>
							<div className='stat-number'>0</div>
							<div className='stat-label'>Zagubionych kartek</div>
						</div>

						<div className='stat-card'>
							<div className='stat-icon'>🎯</div>
							<div className='stat-number'>∞</div>
							<div className='stat-label'>Własnych produktów</div>
						</div>

						<div className='stat-card'>
							<div className='stat-icon'>⏰</div>
							<div className='stat-number'>24/7</div>
							<div className='stat-label'>Dostęp do danych</div>
						</div>
					</div>
				</div>
			</section>

			{/* PRICING SECTION */}
			<section id='pricing' className='pricing'>
				<div className='container'>
					<h2 className='section-title'>Wybierz plan dla siebie</h2>
					<p className='section-subtitle'>Pierwsze 3 miesiące za darmo! Im dłuższy plan, tym więcej oszczędzasz</p>

					<div className='pricing-grid'>
						<div className='pricing-card'>
							<h3>Miesięczny</h3>
							<div className='price'>
								<span className='amount'>129 zł</span>
								<span className='period'>/miesiąc</span>
							</div>
							<div className='pricing-total'>
								<span className='total-label'>Koszt całkowity:</span>
								<span className='total-amount'>129 zł</span>
							</div>
							<ul className='pricing-features'>
								<li>✅ Nielimitowane zamówienia</li>
								<li>✅ Nielimitowani użytkownicy</li>
								<li>✅ Własne produkty</li>
								<li>✅ Zaawansowane statystyki</li>
								<li>✅ Export PDF</li>
								<li>✅ Wsparcie email</li>
								<li>🎁 3 miesiące GRATIS</li>
							</ul>
							<Link to='/pricing' className='btn btn-secondary'>
								Wybierz plan
							</Link>
						</div>

						<div className='pricing-card pricing-card-popular'>
							<div className='popular-badge'>Oszczędzasz 15%</div>
							<h3>Półroczny</h3>
							<div className='price'>
								<span className='amount'>109 zł</span>
								<span className='period'>/miesiąc</span>
							</div>
							<div className='pricing-total'>
								<span className='total-label'>Koszt całkowity:</span>
								<span className='total-amount'>654 zł</span>
								<span className='total-save'>zamiast 774 zł</span>
							</div>
							<ul className='pricing-features'>
								<li>✅ Nielimitowane zamówienia</li>
								<li>✅ Nielimitowani użytkownicy</li>
								<li>✅ Własne produkty</li>
								<li>✅ Zaawansowane statystyki</li>
								<li>✅ Export PDF</li>
								<li>✅ Wsparcie email</li>
								<li>🎁 3 miesiące GRATIS</li>
							</ul>
							<Link to='/pricing' className='btn btn-primary'>
								Wybierz plan
							</Link>
						</div>

						<div className='pricing-card'>
							<div className='save-badge'>Oszczędzasz 25%</div>
							<h3>Roczny</h3>
							<div className='price'>
								<span className='amount'>96 zł</span>
								<span className='period'>/miesiąc</span>
							</div>
							<div className='pricing-total'>
								<span className='total-label'>Koszt całkowity:</span>
								<span className='total-amount'>1,152 zł</span>
								<span className='total-save'>zamiast 1,548 zł</span>
							</div>
							<ul className='pricing-features'>
								<li>✅ Nielimitowane zamówienia</li>
								<li>✅ Nielimitowani użytkownicy</li>
								<li>✅ Własne produkty</li>
								<li>✅ Zaawansowane statystyki</li>
								<li>✅ Export PDF</li>
								<li>✅ Wsparcie priorytetowe</li>
								<li>🎁 3 miesiące GRATIS</li>
							</ul>
							<Link to='/pricing' className='btn btn-secondary'>
								Wybierz plan
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* TESTIMONIALS */}
			<section className='testimonials'>
				<div className='container'>
					<h2 className='section-title'>Co mówią producenci palet</h2>

					<div className='testimonials-grid'>
						<div className='testimonial-card'>
							<div className='testimonial-stars'>⭐⭐⭐⭐⭐</div>
							<p className='testimonial-text'>
								Koniec z kartkami i chaosem. Teraz każde zamówienie jest w systemie, wiemy co produkujemy i kiedy.
								Rewelacja!
							</p>
							<div className='testimonial-author'>
								<strong>Tomasz Kowalczyk</strong>
							</div>
						</div>

						<div className='testimonial-card'>
							<div className='testimonial-stars'>⭐⭐⭐⭐⭐</div>
							<p className='testimonial-text'>
								Możliwość dodania własnych produktów to game changer. Mamy palety niestandardowe i system sobie z tym
								radzi bez problemu.
							</p>
							<div className='testimonial-author'>
								<strong>Anna Wiśniewska</strong>
							</div>
						</div>

						<div className='testimonial-card'>
							<div className='testimonial-stars'>⭐⭐⭐⭐⭐</div>
							<p className='testimonial-text'>
								Wreszcie widzę które produkty się opłacają. Statystyki pokazują wszystko na jednym ekranie. Polecam
								każdemu producentowi!
							</p>
							<div className='testimonial-author'>
								<strong>Piotr Nowak</strong>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA SECTION */}
			<section className='cta'>
				<div className='container'>
					<div className='cta-content'>
						<h2>Gotowy uporządkować produkcję?</h2>
						<p>Zacznij zarządzać zamówieniami bez bałaganu i kartek</p>
						<Link to='/pricing' className='btn btn-primary btn-large'>
							Rozpocznij za darmo
						</Link>
					</div>
				</div>
			</section>

			{/* FOOTER */}
			<footer id='contact' className='footer'>
				<div className='container'>
					<div className='footer-grid'>
						<div className='footer-column'>
							<h4>ORDER MANAGER</h4>
							<p>System zarządzania produkcją palet i produktów drewnianych.</p>
						</div>

						<div className='footer-column'>
							<h4>Produkt</h4>
							<a href='#pricing'>Cennik</a>
							<a href='#about'>O nas</a>
							<a href='#contact'>Kontakt</a>
						</div>

						<div className='footer-column'>
							<h4>Prawne</h4>
							<Link to='/privacy-policy'>Polityka prywatności</Link>
							<Link to='/terms'>Regulamin</Link>
						</div>

						<div className='footer-column'>
							<h4>Kontakt</h4>
							<a href='mailto:kontakt@ordermanager.pl'>kontakt@ordermanager.pl</a>
							<a href='tel:+48123456789'>+48 123 456 789</a>
						</div>
					</div>

					<div className='footer-bottom'>
						<p>&copy; 2026 CODEMATE. Wszystkie prawa zastrzeżone.</p>
					</div>
				</div>
			</footer>
		</div>
	)
}
