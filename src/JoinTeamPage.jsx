import { Link } from 'react-router-dom'
import './LandingPage.css'

export default function LandingPage() {
	return (
		<div className='landing'>
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
						{/* Druga karta - za pierwszą */}
						<div className='hero-card hero-card-back'>
							<div className='card-header'>
								<span className='status-badge status-completed'>Zrealizowane</span>
								<span className='card-date'>10.01.2026</span>
							</div>
							<div className='card-body'>
								<h3>Deska paletowa 145mm - Firma XYZ</h3>
								<div className='card-details'>
									<span>📦 1,200 szt</span>
									<span>💰 12,000 PLN</span>
								</div>
							</div>
						</div>

						{/* Pierwsza karta - na wierzchu */}
						<div className='hero-card'>
							<div className='card-header'>
								<span className='status-badge status-active'>W realizacji</span>
								<span className='card-date'>15.01.2026</span>
							</div>
							<div className='card-body'>
								<h3>Paleta Niestandardowa - Firma ABC</h3>
								<div className='card-details'>
									<span>📦 250 szt</span>
									<span>💰 8,750 PLN</span>
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

			{/* DEMO SECTION */}
			<section className='demo'>
				<div className='container'>
					<h2 className='section-title'>Zobacz jak to działa</h2>
					<p className='section-subtitle'>Prosty proces - od dodania produktu do analizy wyników</p>

					<div className='demo-timeline'>
						<div className='demo-step'>
							<div className='demo-visual'>
								<div className='demo-mockup demo-mockup-1'>
									<div className='mockup-header'>
										<span className='mockup-dot'></span>
										<span className='mockup-dot'></span>
										<span className='mockup-dot'></span>
									</div>
									<div className='mockup-content'>
										<div className='mockup-item'>📦 Paleta EUR 1200x800</div>
										<div className='mockup-item'>📦 Paleta niestandardowa</div>
										<div className='mockup-item'>📦 Deska paletowa 22x145</div>
										<div className='mockup-plus'>+ Dodaj produkt</div>
									</div>
								</div>
							</div>
							<div className='demo-text'>
								<div className='step-number'>01</div>
								<h3>Dodaj swoje produkty</h3>
								<p>
									Stwórz katalog swoich produktów - palety EUR, niestandardowe, deski paletowe, klocki. Definiuj własne
									parametry: wymiary, grubość, gatunek drewna.
								</p>
							</div>
						</div>

						<div className='demo-step demo-step-reverse'>
							<div className='demo-text'>
								<div className='step-number'>02</div>
								<h3>Przyjmuj zamówienia</h3>
								<p>
									Wybierz produkt, wpisz klienta, ilość, cenę i termin. System automatycznie obliczy wartość zamówienia.
									Wszystko w przejrzystym formularzu.
								</p>
							</div>
							<div className='demo-visual'>
								<div className='demo-mockup demo-mockup-2'>
									<div className='mockup-header'>
										<span className='mockup-dot'></span>
										<span className='mockup-dot'></span>
										<span className='mockup-dot'></span>
									</div>
									<div className='mockup-content'>
										<div className='mockup-form-item'>
											<span className='form-label'>Klient:</span>
											<span className='form-value'>Firma ABC</span>
										</div>
										<div className='mockup-form-item'>
											<span className='form-label'>Produkt:</span>
											<span className='form-value'>Paleta EUR</span>
										</div>
										<div className='mockup-form-item'>
											<span className='form-label'>Ilość:</span>
											<span className='form-value'>250 szt</span>
										</div>
										<div className='mockup-total'>💰 8,750 PLN</div>
									</div>
								</div>
							</div>
						</div>

						<div className='demo-step'>
							<div className='demo-visual'>
								<div className='demo-mockup demo-mockup-3'>
									<div className='mockup-header'>
										<span className='mockup-dot'></span>
										<span className='mockup-dot'></span>
										<span className='mockup-dot'></span>
									</div>
									<div className='mockup-content'>
										<div className='status-row'>
											<span className='status-chip status-new'>Nowe</span>
											<span className='status-arrow'>→</span>
											<span className='status-chip status-production'>W produkcji</span>
										</div>
										<div className='status-row'>
											<span className='status-chip status-ready'>Gotowe</span>
											<span className='status-arrow'>→</span>
											<span className='status-chip status-sent'>Wysłane</span>
										</div>
									</div>
								</div>
							</div>
							<div className='demo-text'>
								<div className='step-number'>03</div>
								<h3>Śledź realizację</h3>
								<p>
									Zmień status jednym kliknięciem: Nowe → W produkcji → Gotowe → Wysłane. Cały zespół widzi aktualny
									stan w czasie rzeczywistym.
								</p>
							</div>
						</div>

						<div className='demo-step demo-step-reverse'>
							<div className='demo-text'>
								<div className='step-number'>04</div>
								<h3>Analizuj wyniki</h3>
								<p>
									Zobacz wykresy przychodów, bestsellery produktów, najlepszych klientów. Podejmuj decyzje biznesowe w
									oparciu o konkretne dane, nie przeczucia.
								</p>
							</div>
							<div className='demo-visual'>
								<div className='demo-mockup demo-mockup-4'>
									<div className='mockup-header'>
										<span className='mockup-dot'></span>
										<span className='mockup-dot'></span>
										<span className='mockup-dot'></span>
									</div>
									<div className='mockup-content'>
										<div className='chart-bars'>
											<div className='chart-bar' style={{ height: '60%' }}></div>
											<div className='chart-bar' style={{ height: '85%' }}></div>
											<div className='chart-bar' style={{ height: '100%' }}></div>
											<div className='chart-bar' style={{ height: '75%' }}></div>
										</div>
										<div className='chart-label'>📈 Sprzedaż rośnie o 35%</div>
									</div>
								</div>
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
							<h4>CLIENT MANAGER</h4>
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
							<a
								href='#'
								onClick={e => {
									e.preventDefault()
									alert('Polityka prywatności - wkrótce')
								}}>
								Polityka prywatności
							</a>
							<a
								href='#'
								onClick={e => {
									e.preventDefault()
									alert('Regulamin - wkrótce')
								}}>
								Regulamin
							</a>
						</div>

						<div className='footer-column'>
							<h4>Kontakt</h4>
							<a href='mailto:kontakt@clientmanager.pl'>kontakt@clientmanager.pl</a>
							<a href='tel:+48123456789'>+48 123 456 789</a>
						</div>
					</div>

					<div className='footer-bottom'>
						<p>&copy; 2026 CLIENT MANAGER. Wszystkie prawa zastrzeżone.</p>
					</div>
				</div>
			</footer>
		</div>
	)
}