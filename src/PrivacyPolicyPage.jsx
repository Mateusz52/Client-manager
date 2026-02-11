import { Link } from 'react-router-dom'
import './LegalPages.css'

export default function PrivacyPolicyPage() {
	return (
		<div className="legal-page">
			<div className="legal-container">
				<div className="legal-header">
					<Link to="/landing" className="legal-back-btn">
						← Powrót
					</Link>
					<h1>Polityka Prywatności</h1>
					<p className="legal-subtitle">OrderManager.pl</p>
				</div>

				<div className="legal-content">
					<section className="legal-section">
						<h2>1. Administrator danych osobowych</h2>
						<p>Administratorem Twoich danych osobowych jest:</p>
						<div className="legal-box">
							<p><strong>OrderManager.pl</strong></p>
							<p>Siedziba: Skrzynki 37, 63-520 Grabów nad Prosną</p>
							<p>Adres e-mail: kontakt@ordermanager.pl</p>
						</div>
					</section>

					<section className="legal-section">
						<h2>2. Zakres i cele przetwarzania danych</h2>
						<p>Przetwarzamy Twoje dane w następującym zakresie i celach:</p>
						
						<h3>a) Kontakt poprzez formularz kontaktowy</h3>
						<ul>
							<li><strong>Dane:</strong> imię, adres e-mail, treść wiadomości</li>
							<li><strong>Cel:</strong> obsługa zapytania</li>
							<li><strong>Podstawa prawna:</strong> art. 6 ust. 1 lit. b RODO</li>
						</ul>

						<h3>b) Rejestracja / konto użytkownika</h3>
						<ul>
							<li><strong>Dane:</strong> imię, nazwisko, e-mail, hasło (zaszyfrowane), dane płatnicze (jeśli dotyczy)</li>
							<li><strong>Cel:</strong> realizacja usług dostępnych po zalogowaniu</li>
							<li><strong>Podstawa prawna:</strong> art. 6 ust. 1 lit. b RODO</li>
						</ul>

						<h3>c) Newsletter (jeśli dotyczy)</h3>
						<ul>
							<li><strong>Dane:</strong> adres e-mail</li>
							<li><strong>Cel:</strong> wysyłka informacji marketingowych</li>
							<li><strong>Podstawa prawna:</strong> art. 6 ust. 1 lit. a RODO (zgoda)</li>
						</ul>

						<h3>d) Pliki cookies i dane analityczne</h3>
						<ul>
							<li><strong>Dane:</strong> pliki cookies, adres IP (anonimizowany), informacje o przeglądaniu</li>
							<li><strong>Cel:</strong> poprawa działania strony, statystyki</li>
							<li><strong>Podstawa prawna:</strong> art. 6 ust. 1 lit. f RODO</li>
						</ul>
					</section>

					<section className="legal-section">
						<h2>3. Podstawy prawne przetwarzania</h2>
						<p>Dane przetwarzane są na podstawie:</p>
						<ul>
							<li>zgody osoby, której dane dotyczą (np. newsletter),</li>
							<li>niezbędności do realizacji umowy lub świadczenia usług,</li>
							<li>prawnie uzasadnionych interesów administratora (jak statystyki, bezpieczeństwo, marketing).</li>
						</ul>
					</section>

					<section className="legal-section">
						<h2>4. Odbiorcy danych</h2>
						<p>Twoje dane mogą być przekazywane:</p>
						<ul>
							<li>podmiotom przetwarzającym dane na nasze zlecenie (np. dostawcy hostingu, narzędzia do e-mail marketingu),</li>
							<li>organom państwowym, jeżeli wymaga tego prawo.</li>
						</ul>
					</section>

					<section className="legal-section">
						<h2>5. Okres przechowywania danych</h2>
						<p>Dane osobowe będą przechowywane:</p>
						<ul>
							<li><strong>Dane kontaktowe z formularza</strong> – przez okres niezbędny do obsługi zapytania,</li>
							<li><strong>Dane konta użytkownika</strong> – do czasu usunięcia konta przez użytkownika lub po okresie wymaganym przepisami,</li>
							<li><strong>Dane z newslettera</strong> – do czasu wycofania zgody,</li>
							<li><strong>Dane cookies</strong> – zgodnie z ustawionym czasem przechowywania w plikach cookies.</li>
						</ul>
					</section>

					<section className="legal-section">
						<h2>6. Prawa osób, których dane dotyczą</h2>
						<p>Masz prawo do:</p>
						<ul>
							<li>dostępu do swoich danych,</li>
							<li>sprostowania,</li>
							<li>usunięcia („prawo do bycia zapomnianym"),</li>
							<li>ograniczenia przetwarzania,</li>
							<li>przenoszenia danych,</li>
							<li>wniesienia sprzeciwu przeciw przetwarzaniu,</li>
							<li>wycofania zgody w dowolnym momencie (bez wpływu na zgodność z prawem przetwarzania przed wycofaniem),</li>
							<li>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</li>
						</ul>
					</section>

					<section className="legal-section">
						<h2>7. Pliki cookies</h2>
						<p>Strona korzysta z plików cookies w celu:</p>
						<ul>
							<li>zapewnienia prawidłowego działania serwisu,</li>
							<li>analityki (np. Google Analytics),</li>
							<li>optymalizacji działania i personalizacji treści.</li>
						</ul>
						<p>Możesz zarządzać ustawieniami cookies w swojej przeglądarce.</p>
					</section>

					<section className="legal-section">
						<h2>8. Dane kontaktowe Inspektora Ochrony Danych</h2>
						<p>Jeżeli powołano Inspektora Ochrony Danych, jego dane kontaktowe:</p>
						<div className="legal-box">
							<p>E-mail: kontakt@ordermanager.pl</p>
						</div>
					</section>

					<section className="legal-section">
						<h2>9. Informacje o zautomatyzowanym podejmowaniu decyzji</h2>
						<p>
							Nie podejmujemy decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu danych, 
							w tym profilowaniu, które miałyby skutki prawne lub w podobny sposób istotnie na Ciebie wpływały.
						</p>
					</section>

					<section className="legal-section">
						<h2>10. Zmiany polityki prywatności</h2>
						<p>
							Polityka Prywatności może być aktualizowana. Aktualna wersja zawsze dostępna jest na tej stronie.
						</p>
						<p className="legal-date">
							<em>Ostatnia aktualizacja: luty 2026</em>
						</p>
					</section>
				</div>

				<div className="legal-footer">
					<Link to="/landing" className="btn btn-primary">
						← Powrót na stronę główną
					</Link>
				</div>
			</div>
		</div>
	)
}
