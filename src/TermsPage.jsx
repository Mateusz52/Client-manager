import { Link } from 'react-router-dom'
import './TermsPage.css'

export default function TermsPage() {
	return (
		<div className="terms-page">
			<div className="terms-container">
				<div className="terms-header">
					<Link to="/" className="terms-back-link">
						← Powrót do strony głównej
					</Link>
					<h1>Regulamin serwisu OrderManager</h1>
					<p className="terms-update">Ostatnia aktualizacja: Styczeń 2026</p>
				</div>

				<div className="terms-content">
					<section className="terms-section">
						<h2>§1. Postanowienia ogólne</h2>
						<ol>
							<li>Niniejszy Regulamin określa zasady korzystania z serwisu internetowego OrderManager, dostępnego pod adresem ordermanager.pl, zwanego dalej „Serwisem".</li>
							<li>Właścicielem i administratorem Serwisu jest właściciel domeny ordermanager.pl, zwany dalej „Usługodawcą".</li>
							<li>Serwis jest aplikacją webową typu SaaS (Software as a Service), umożliwiającą w szczególności zarządzanie zamówieniami, klientami oraz danymi związanymi z działalnością Użytkownika.</li>
							<li>Akceptacja Regulaminu jest warunkiem koniecznym do korzystania z Serwisu.</li>
						</ol>
					</section>

					<section className="terms-section">
						<h2>§2. Definicje</h2>
						<ul>
							<li><strong>Użytkownik</strong> – osoba fizyczna, osoba prawna lub jednostka organizacyjna korzystająca z Serwisu.</li>
							<li><strong>Konto</strong> – indywidualny dostęp do Serwisu przypisany do Użytkownika.</li>
							<li><strong>Abonament</strong> – płatny plan umożliwiający korzystanie z określonych funkcjonalności Serwisu.</li>
							<li><strong>Dane</strong> – wszelkie informacje wprowadzane, przechowywane lub przetwarzane w Serwisie przez Użytkownika.</li>
						</ul>
					</section>

					<section className="terms-section">
						<h2>§3. Zakres i warunki korzystania z Serwisu</h2>
						<ol>
							<li>Korzystanie z Serwisu jest dobrowolne.</li>
							<li>Użytkownik zobowiązuje się do korzystania z Serwisu zgodnie z:
								<ul>
									<li>obowiązującymi przepisami prawa,</li>
									<li>niniejszym Regulaminem,</li>
									<li>dobrymi obyczajami.</li>
								</ul>
							</li>
							<li>Użytkownik ponosi wyłączną odpowiedzialność za dane oraz treści wprowadzane do Serwisu.</li>
							<li>Zabronione jest wykorzystywanie Serwisu w sposób mogący zakłócić jego działanie lub naruszać prawa osób trzecich.</li>
						</ol>
					</section>

					<section className="terms-section">
						<h2>§4. Konto Użytkownika</h2>
						<ol>
							<li>Utworzenie Konta wymaga podania prawdziwych i aktualnych danych.</li>
							<li>Użytkownik zobowiązany jest do zabezpieczenia dostępu do Konta oraz nieudostępniania danych logowania osobom trzecim.</li>
							<li>Usługodawca nie ponosi odpowiedzialności za działania wykonane w ramach Konta Użytkownika.</li>
						</ol>
					</section>

					<section className="terms-section">
						<h2>§5. Płatności i subskrypcja</h2>
						<ol>
							<li>Dostęp do pełnej funkcjonalności Serwisu może wymagać wykupienia Abonamentu.</li>
							<li>Opłaty pobierane są z góry za określony okres rozliczeniowy.</li>
							<li>Ceny Abonamentów prezentowane są w Serwisie i mogą ulegać zmianom.</li>
							<li>Brak opłacenia Abonamentu może skutkować:
								<ul>
									<li>ograniczeniem funkcjonalności,</li>
									<li>czasowym zawieszeniem dostępu do Konta,</li>
									<li>usunięciem Konta po upływie określonego czasu.</li>
								</ul>
							</li>
							<li>Opłaty nie podlegają zwrotowi, o ile bezwzględnie obowiązujące przepisy prawa nie stanowią inaczej.</li>
						</ol>
					</section>

					<section className="terms-section">
						<h2>§6. Dane i RODO</h2>
						<ol>
							<li>Administratorem danych osobowych jest Usługodawca.</li>
							<li>Dane osobowe przetwarzane są zgodnie z:
								<ul>
									<li>Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO),</li>
									<li>obowiązującymi przepisami prawa.</li>
								</ul>
							</li>
							<li>Dane przetwarzane są wyłącznie w celu:
								<ul>
									<li>świadczenia usług drogą elektroniczną,</li>
									<li>realizacji płatności,</li>
									<li>obsługi Konta Użytkownika.</li>
								</ul>
							</li>
							<li>Użytkownik, wprowadzając dane do Serwisu, oświadcza, że posiada podstawę prawną do ich przetwarzania.</li>
							<li>Usługodawca nie weryfikuje treści danych wprowadzanych przez Użytkownika.</li>
							<li>Szczegółowe informacje dotyczące przetwarzania danych znajdują się w Polityce Prywatności.</li>
						</ol>
					</section>

					<section className="terms-section">
						<h2>§7. Bezpieczeństwo danych</h2>
						<ol>
							<li>Usługodawca stosuje środki techniczne i organizacyjne mające na celu ochronę danych.</li>
							<li>Użytkownik przyjmuje do wiadomości, że korzystanie z Serwisu wiąże się z ryzykiem wynikającym z charakteru usług elektronicznych.</li>
							<li>Usługodawca nie gwarantuje:
								<ul>
									<li>pełnej ciągłości działania Serwisu,</li>
									<li>całkowitego wyeliminowania ryzyka utraty danych.</li>
								</ul>
							</li>
							<li>Użytkownik zobowiązany jest do samodzielnego wykonywania kopii zapasowych danych.</li>
						</ol>
					</section>

					<section className="terms-section">
						<h2>§8. Odpowiedzialność</h2>
						<ol>
							<li>Serwis udostępniany jest w aktualnym stanie technicznym.</li>
							<li>Usługodawca nie ponosi odpowiedzialności za:
								<ul>
									<li>utratę danych spowodowaną czynnikami niezależnymi,</li>
									<li>przerwy w dostępie do Serwisu,</li>
									<li>skutki decyzji podejmowanych przez Użytkownika na podstawie danych z Serwisu,</li>
									<li>szkody pośrednie oraz utracone korzyści.</li>
								</ul>
							</li>
							<li>Odpowiedzialność Usługodawcy, w zakresie dopuszczalnym przez prawo, ograniczona jest do szkody rzeczywistej.</li>
						</ol>
					</section>

					<section className="terms-section">
						<h2>§9. Zawieszenie i usunięcie Konta</h2>
						<ol>
							<li>Usługodawca może zawiesić lub usunąć Konto w przypadku naruszenia Regulaminu.</li>
							<li>Usunięcie Konta może skutkować trwałym usunięciem danych.</li>
							<li>Usługodawca nie ponosi odpowiedzialności za utratę danych po usunięciu Konta.</li>
						</ol>
					</section>

					<section className="terms-section">
						<h2>§10. Prawa autorskie</h2>
						<ol>
							<li>Wszelkie prawa do Serwisu należą do Usługodawcy.</li>
							<li>Użytkownik otrzymuje niewyłączną, czasową licencję na korzystanie z Serwisu.</li>
						</ol>
					</section>

					<section className="terms-section">
						<h2>§11. Zmiany Regulaminu</h2>
						<ol>
							<li>Usługodawca zastrzega sobie prawo do zmiany Regulaminu.</li>
							<li>Zmiany obowiązują od momentu opublikowania w Serwisie.</li>
							<li>Dalsze korzystanie z Serwisu oznacza akceptację zmian.</li>
						</ol>
					</section>

					<section className="terms-section">
						<h2>§12. Postanowienia końcowe</h2>
						<ol>
							<li>W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa polskiego.</li>
							<li>Regulamin obowiązuje od momentu jego akceptacji przez Użytkownika.</li>
						</ol>
					</section>
				</div>

				<div className="terms-footer">
					<Link to="/" className="btn-back-home">
						← Powrót do strony głównej
					</Link>
					<Link to="/register" className="btn-register">
						Zarejestruj się
					</Link>
				</div>
			</div>
		</div>
	)
}
