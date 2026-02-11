import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import OrganizationSwitcher from './OrganizationSwitcher'
import { db } from './firebase'
import { collection, addDoc, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore'
import woodIcon from './assets/wood.png'
import './Navbar.css'
import './OrganizationSwitcher.css'

// Funkcja sprawdzająca czy subskrypcja jest aktywna
function isSubscriptionActive(sub) {
	if (!sub) return false
	if (!sub.plan) return false
	if (sub.status === 'canceled') return false
	if (!sub.currentPeriodEnd) return false
	
	const endDate = new Date(sub.currentPeriodEnd)
	const now = new Date()
	
	return endDate > now
}

// Komponent dropdown dla użytkownika BEZ organizacji
function NoOrgSwitcher({ onCreateOrg, onJoinTeam, hasSubscription }) {
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef(null)

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	return (
		<div className="organization-switcher" ref={dropdownRef}>
			<button 
				className={`org-switcher-button ${isOpen ? 'open' : ''}`}
				onClick={() => setIsOpen(!isOpen)}>
				<span className="org-icon">🏢</span>
				<div className="org-info">
					<span className="org-role">BRAK FIRMY</span>
					<span className="org-name">Wybierz opcję</span>
				</div>
				<span className="dropdown-arrow">▼</span>
			</button>

			{isOpen && (
				<div className="org-dropdown">
					<div className="org-dropdown-header">
						Nie masz jeszcze firmy
					</div>

					<div className="org-list">
						{hasSubscription ? (
							<button
								className="org-item"
								onClick={() => { setIsOpen(false); onCreateOrg() }}
							>
								<span className="org-item-icon">🏢</span>
								<div className="org-item-info">
									<span className="org-item-name">Utwórz organizację</span>
									<span className="org-item-role">Masz aktywny plan</span>
								</div>
							</button>
						) : (
							<Link
								to="/pricing"
								className="org-item"
								onClick={() => setIsOpen(false)}
								style={{ textDecoration: 'none' }}
							>
								<span className="org-item-icon">💳</span>
								<div className="org-item-info">
									<span className="org-item-name">Wybierz plan</span>
									<span className="org-item-role">Kup subskrypcję</span>
								</div>
							</Link>
						)}

						<button
							className="org-item"
							onClick={() => { setIsOpen(false); onJoinTeam() }}
						>
							<span className="org-item-icon">➕</span>
							<div className="org-item-info">
								<span className="org-item-name">Dołącz do zespołu</span>
								<span className="org-item-role">Mam kod zaproszenia</span>
							</div>
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

export default function Navbar() {
	const { currentUser, userProfile, logout, joinOrganizationWithCode } = useAuth()
	const location = useLocation()
	const [showJoinModal, setShowJoinModal] = useState(false)
	const [showNewOrgModal, setShowNewOrgModal] = useState(false)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [joinCode, setJoinCode] = useState('')
	const [joinLoading, setJoinLoading] = useState(false)
	const [joinError, setJoinError] = useState('')
	const [newOrgName, setNewOrgName] = useState('')
	const [newOrgLoading, setNewOrgLoading] = useState(false)
	const [ownedSubscription, setOwnedSubscription] = useState(null)
	const [, setSubscriptionChecked] = useState(false)

	// Sprawdź subskrypcję - TYLKO jeśli user jest WŁAŚCICIELEM organizacji z planem
	useEffect(() => {
		const checkOwnedSubscription = async () => {
			if (!currentUser) {
				setSubscriptionChecked(true)
				return
			}

			console.log('🔍 [Navbar] Sprawdzam subskrypcję dla:', currentUser.email)

			// 1. Sprawdź w profilu użytkownika
			if (userProfile?.subscription) {
				console.log('📋 [Navbar] Subskrypcja w profilu:', userProfile.subscription)
				if (isSubscriptionActive(userProfile.subscription)) {
					console.log('✅ [Navbar] Aktywna subskrypcja w profilu!')
					setOwnedSubscription(userProfile.subscription)
					setSubscriptionChecked(true)
					return
				} else {
					console.log('❌ [Navbar] Subskrypcja w profilu nieaktywna lub brak planu')
				}
			} else {
				console.log('❌ [Navbar] Brak subskrypcji w profilu')
			}

			// 2. Szukaj organizacji gdzie user jest WŁAŚCICIELEM (ownerId)
			try {
				console.log('🔍 [Navbar] Szukam organizacji gdzie jestem właścicielem...')
				const orgsRef = collection(db, 'organizations')
				const q = query(orgsRef, where('ownerId', '==', currentUser.uid))
				const querySnapshot = await getDocs(q)

				console.log('📋 [Navbar] Znaleziono organizacji:', querySnapshot.size)

				for (const docSnap of querySnapshot.docs) {
					const orgData = docSnap.data()
					console.log('📋 [Navbar] Sprawdzam org:', orgData.name, 'subscription:', orgData.subscription)
					
					if (isSubscriptionActive(orgData.subscription)) {
						console.log('✅ [Navbar] Znaleziono aktywną subskrypcję w organizacji:', orgData.name)
						
						// Przepisz do profilu
						const userRef = doc(db, 'users', currentUser.uid)
						await setDoc(userRef, {
							subscription: orgData.subscription,
							limits: orgData.limits || { maxOrganizations: 1 },
						}, { merge: true })
						
						setOwnedSubscription(orgData.subscription)
						setSubscriptionChecked(true)
						return
					}
				}

				console.log('❌ [Navbar] Brak własnej aktywnej subskrypcji')
				setOwnedSubscription(null)
				setSubscriptionChecked(true)
			} catch (error) {
				console.error('❌ [Navbar] Błąd sprawdzania subskrypcji:', error)
				setSubscriptionChecked(true)
			}
		}

		checkOwnedSubscription()
	}, [currentUser, userProfile])

	const scrollToSection = (sectionId) => {
		if (location.pathname !== '/landing') {
			window.location.href = `/landing#${sectionId}`
			return
		}

		const element = document.getElementById(sectionId)
		if (element) {
			const navbarHeight = 80
			const elementPosition = element.getBoundingClientRect().top
			const offsetPosition = elementPosition + window.pageYOffset - navbarHeight

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			})
		}
		setMobileMenuOpen(false)
	}

	const handleJoinTeam = async (e) => {
		e.preventDefault()
		setJoinError('')
		setJoinLoading(true)

		try {
			await joinOrganizationWithCode(joinCode.toUpperCase())
			setShowJoinModal(false)
			setJoinCode('')
			alert('✅ Pomyślnie dołączyłeś do nowej organizacji!')
			window.location.href = '/'
		} catch (error) {
			setJoinError(error.message || 'Błąd dołączania do zespołu')
			setJoinLoading(false)
		}
	}

	const handleCreateNewOrg = async (e) => {
		e.preventDefault()
		if (!newOrgName.trim()) {
			alert('Wpisz nazwę firmy!')
			return
		}

		console.log('🏢 [Navbar] Tworzenie nowej organizacji...')
		console.log('📋 [Navbar] ownedSubscription:', ownedSubscription)
		console.log('📋 [Navbar] userProfile?.subscription:', userProfile?.subscription)

		setNewOrgLoading(true)

		try {
			let subscriptionData = null
			let limitsData = { maxOrganizations: 1 }

			// Dla użytkownika Z organizacją - pobierz z aktualnej org (jeśli jest właścicielem)
			if (userProfile?.organizations?.length > 0) {
				const currentOrg = userProfile.organizations.find(org => org.id === userProfile.currentOrganizationId)
				
				if (!currentOrg) {
					throw new Error('Nie znaleziono aktualnej organizacji')
				}

				// Sprawdź czy jest właścicielem
				if (currentOrg.role !== 'Właściciel') {
					alert('❌ Tylko właściciel może tworzyć nowe organizacje.\n\nJeśli chcesz utworzyć własną firmę, najpierw kup plan.')
					setNewOrgLoading(false)
					window.location.href = '/pricing'
					return
				}

				const userOwnedOrgs = userProfile?.organizations?.filter(org => org.role === 'Właściciel') || []
				const orgDoc = await getDoc(doc(db, 'organizations', currentOrg.id))
				
				if (!orgDoc.exists()) {
					throw new Error('Nie znaleziono danych organizacji')
				}

				const orgData = orgDoc.data()
				
				if (!isSubscriptionActive(orgData.subscription)) {
					alert('❌ Twoja subskrypcja wygasła lub jest nieaktywna.\n\nOdnów subskrypcję aby tworzyć nowe organizacje.')
					setNewOrgLoading(false)
					return
				}

				const maxOrgs = orgData.limits?.maxOrganizations || 1

				if (userOwnedOrgs.length >= maxOrgs) {
					alert(`❌ Osiągnąłeś limit organizacji (${maxOrgs}).\n\nAby utworzyć więcej firm, zmień plan na Półroczny lub Roczny z nielimitowanymi organizacjami.`)
					setNewOrgLoading(false)
					return
				}

				subscriptionData = orgData.subscription
				limitsData = orgData.limits || { maxOrganizations: 1 }
			} else {
				// Dla użytkownika BEZ organizacji - użyj ownedSubscription
				if (isSubscriptionActive(ownedSubscription)) {
					subscriptionData = ownedSubscription
					limitsData = userProfile?.limits || { maxOrganizations: 1 }
				}
			}

			// WAŻNE: BLOKADA - jeśli nie ma aktywnej subskrypcji
			if (!subscriptionData || !isSubscriptionActive(subscriptionData)) {
				console.log('❌ [Navbar] BLOKADA - brak aktywnej subskrypcji!')
				alert('❌ Nie masz aktywnej subskrypcji.\n\nAby utworzyć własną organizację, musisz najpierw kupić plan.')
				setNewOrgLoading(false)
				window.location.href = '/pricing'
				return
			}

			console.log('✅ [Navbar] Tworzę organizację z subskrypcją:', subscriptionData)

			const newOrgRef = await addDoc(collection(db, 'organizations'), {
				name: newOrgName,
				ownerId: currentUser.uid,
				ownerEmail: currentUser.email,
				subscription: subscriptionData,
				limits: limitsData,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})

			const userRef = doc(db, 'users', currentUser.uid)
			const userDoc = await getDoc(userRef)
			const userData = userDoc.data() || {}
			const existingOrgs = userData?.organizations || []

			await setDoc(userRef, {
				...userData,
				subscription: subscriptionData,
				limits: limitsData,
				organizations: [
					...existingOrgs,
					{
						id: newOrgRef.id,
						name: newOrgName,
						role: 'Właściciel',
						permissions: {
							canAddOrders: true,
							canEditOrders: true,
							canDeleteOrders: true,
							canViewStatistics: true,
							canExportPDF: true,
							canConfigureProducts: true,
							canManageTeam: true,
							canChangePlan: true
						},
						isDefault: existingOrgs.length === 0,
						joinedAt: new Date().toISOString()
					}
				],
				currentOrganizationId: newOrgRef.id,
				updatedAt: new Date().toISOString()
			}, { merge: true })

			alert(`✅ Utworzono nową organizację: ${newOrgName}`)
			setShowNewOrgModal(false)
			setNewOrgName('')
			window.location.reload()

		} catch (error) {
			console.error('❌ [Navbar] Błąd tworzenia organizacji:', error)
			alert(`❌ Błąd: ${error.message}`)
			setNewOrgLoading(false)
		}
	}

	const hasOrganization = userProfile?.organizations?.length > 0
	
	// Czy user ma WŁASNĄ aktywną subskrypcję
	const hasOwnSubscription = isSubscriptionActive(ownedSubscription)
	
	console.log('🔄 [Navbar] Render - hasOwnSubscription:', hasOwnSubscription, 'ownedSubscription:', ownedSubscription)
	
	const canAddOrganizations = () => {
		if (!userProfile?.organizations) return false
		const currentOrg = userProfile.organizations.find(org => org.id === userProfile.currentOrganizationId)
		return currentOrg?.role === 'Właściciel'
	}

	const isInDashboard = location.pathname === '/' && currentUser && hasOrganization
	const isOnLanding = location.pathname === '/landing'

	return (
		<>
			<nav className="navbar">
				<div className="navbar-container">
					<Link to="/landing" className="navbar-logo">
						<img src={woodIcon} alt="ORDER MANAGER" />
						<span>ORDER MANAGER</span>
					</Link>

					{/* DESKTOP LINKS */}
					<div className="navbar-links navbar-links-desktop">
						{isOnLanding && (
							<>
								<a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about') }}>O nas</a>
								<a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing') }}>Plany</a>
								<a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}>Kontakt</a>
							</>
						)}

						{isInDashboard && (
							<>
								<Link to="/landing" className="navbar-dashboard">🏠 Strona główna</Link>
								<Link to="/" className="navbar-dashboard" style={{ background: 'linear-gradient(135deg, #94c11e 0%, #7ea518 100%)' }}>📊 Aplikacja</Link>
							</>
						)}
					</div>

					{/* DESKTOP AUTH */}
					<div className="navbar-auth navbar-auth-desktop">
						{currentUser && hasOrganization ? (
							// ZALOGOWANY Z ORGANIZACJĄ
							<>
								<OrganizationSwitcher />
								
								{canAddOrganizations() && (
									<button 
										onClick={() => setShowNewOrgModal(true)}
										className="navbar-btn navbar-btn-new-org"
										title="Dodaj nową firmę">
										🏢
									</button>
								)}
								
								<button 
									onClick={() => setShowJoinModal(true)}
									className="navbar-btn navbar-btn-join"
									title="Dołącz do zespołu">
									➕
								</button>

								<Link to="/settings" className="navbar-btn navbar-btn-settings">⚙️</Link>

								{!isInDashboard && (
									<Link to="/" className="navbar-btn navbar-btn-app-main">📊 Panel zarządzania</Link>
								)}

								<button onClick={logout} className="navbar-btn navbar-btn-logout">Wyloguj</button>
							</>
						) : currentUser && !hasOrganization ? (
							// ZALOGOWANY BEZ ORGANIZACJI
							<>
								<NoOrgSwitcher 
									onCreateOrg={() => setShowNewOrgModal(true)}
									onJoinTeam={() => setShowJoinModal(true)}
									hasSubscription={hasOwnSubscription}
								/>

								<Link to="/settings" className="navbar-btn navbar-btn-settings">⚙️</Link>
								<button onClick={logout} className="navbar-btn navbar-btn-logout">Wyloguj</button>
							</>
						) : (
							// NIEZALOGOWANY
							<>
								<Link to="/login" className="navbar-btn navbar-btn-login">Zaloguj się</Link>
								<Link to="/register" className="navbar-btn navbar-btn-register">Zarejestruj się</Link>
							</>
						)}
					</div>

					{/* MOBILE BURGER */}
					<button 
						className={`navbar-burger ${mobileMenuOpen ? 'open' : ''}`}
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
						<span></span>
						<span></span>
						<span></span>
					</button>
				</div>

				{/* MOBILE MENU */}
				{mobileMenuOpen && (
					<div className="navbar-mobile-menu">
						{isOnLanding && (
							<div className="mobile-menu-section">
								<a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about') }}>📖 O nas</a>
								<a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing') }}>💳 Plany</a>
								<a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}>📞 Kontakt</a>
							</div>
						)}

						{isInDashboard && (
							<div className="mobile-menu-section">
								<Link to="/landing" onClick={() => setMobileMenuOpen(false)}>🏠 Strona główna</Link>
								<Link to="/" onClick={() => setMobileMenuOpen(false)}>📊 Aplikacja</Link>
							</div>
						)}

						{currentUser && hasOrganization ? (
							<div className="mobile-menu-section">
								<div className="mobile-org-info">
									<OrganizationSwitcher />
								</div>
								
								{canAddOrganizations() && (
									<button onClick={() => { setShowNewOrgModal(true); setMobileMenuOpen(false) }} className="mobile-menu-btn">
										🏢 Nowa firma
									</button>
								)}
								
								<button onClick={() => { setShowJoinModal(true); setMobileMenuOpen(false) }} className="mobile-menu-btn">
									➕ Dołącz do zespołu
								</button>

								<Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-btn">
									⚙️ Ustawienia
								</Link>

								{!isInDashboard && (
									<Link to="/" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-btn mobile-menu-btn-primary">
										📊 Panel zarządzania
									</Link>
								)}

								<button onClick={() => { logout(); setMobileMenuOpen(false) }} className="mobile-menu-btn mobile-menu-btn-logout">
									Wyloguj
								</button>
							</div>
						) : currentUser && !hasOrganization ? (
							<div className="mobile-menu-section">
								<div style={{ padding: '12px 16px', color: '#666', fontSize: '14px', fontWeight: '600' }}>
									🏢 Brak firmy
								</div>
								
								{hasOwnSubscription ? (
									<button onClick={() => { setShowNewOrgModal(true); setMobileMenuOpen(false) }} className="mobile-menu-btn mobile-menu-btn-primary">
										🏢 Utwórz organizację
									</button>
								) : (
									<Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-btn mobile-menu-btn-primary">
										💳 Wybierz plan
									</Link>
								)}

								<button onClick={() => { setShowJoinModal(true); setMobileMenuOpen(false) }} className="mobile-menu-btn">
									➕ Dołącz do zespołu
								</button>

								<Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-btn">
									⚙️ Ustawienia
								</Link>

								<button onClick={() => { logout(); setMobileMenuOpen(false) }} className="mobile-menu-btn mobile-menu-btn-logout">
									Wyloguj
								</button>
							</div>
						) : (
							<div className="mobile-menu-section">
								<Link to="/login" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-btn">
									Zaloguj się
								</Link>
								<Link to="/register" onClick={() => setMobileMenuOpen(false)} className="mobile-menu-btn mobile-menu-btn-primary">
									Zarejestruj się
								</Link>
							</div>
						)}
					</div>
				)}
			</nav>

			{/* MODAL DOŁĄCZANIA */}
			{showJoinModal && (
				<div className='modal-overlay' onClick={() => setShowJoinModal(false)}>
					<div className='modal-card' onClick={(e) => e.stopPropagation()}>
						<h2>➕ Dołącz do zespołu</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Wpisz kod zaproszenia otrzymany od właściciela firmy
						</p>

						<form onSubmit={handleJoinTeam}>
							<input
								type='text'
								placeholder='Kod zaproszenia (np. XY4K9P)'
								value={joinCode}
								onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
								className='modal-input'
								maxLength={6}
								style={{ 
									textTransform: 'uppercase',
									letterSpacing: '2px',
									fontWeight: '600',
									fontSize: '18px',
									textAlign: 'center'
								}}
								required
								autoFocus
							/>

							{joinError && (
								<div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '8px', fontSize: '14px', marginTop: '12px' }}>
									{joinError}
								</div>
							)}

							<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
								<button type='submit' className='modal-btn-primary' disabled={joinLoading}>
									{joinLoading ? 'Dołączanie...' : 'Dołącz'}
								</button>
								<button type='button' className='modal-btn-secondary' onClick={() => { setShowJoinModal(false); setJoinCode(''); setJoinError('') }}>
									Anuluj
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL TWORZENIA ORGANIZACJI */}
			{showNewOrgModal && (
				<div className='modal-overlay' onClick={() => setShowNewOrgModal(false)}>
					<div className='modal-card' onClick={(e) => e.stopPropagation()}>
						<h2>🏢 Utwórz nową firmę</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Dodaj nową organizację do swojego konta
						</p>

						<form onSubmit={handleCreateNewOrg}>
							<input
								type='text'
								placeholder='Nazwa firmy'
								value={newOrgName}
								onChange={(e) => setNewOrgName(e.target.value)}
								className='modal-input'
								required
								autoFocus
							/>

							<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
								<button type='submit' className='modal-btn-primary' disabled={newOrgLoading}>
									{newOrgLoading ? 'Tworzenie...' : 'Utwórz'}
								</button>
								<button type='button' className='modal-btn-secondary' onClick={() => { setShowNewOrgModal(false); setNewOrgName('') }}>
									Anuluj
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	)
}