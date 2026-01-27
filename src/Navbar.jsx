import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import OrganizationSwitcher from './OrganizationSwitcher'
import { db } from './firebase'
import { collection, addDoc, getDoc, doc } from 'firebase/firestore'
import woodIcon from './assets/wood.png'
import './Navbar.css'

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

	// ✅ ZMODYFIKOWANA FUNKCJA - sprawdzanie czy można dodać organizację
	const canAddOrganizations = async () => {
		if (!userProfile?.organizations || !currentUser) {
			return { canAdd: false, reason: 'Brak organizacji' }
		}
		
		// Znajdź organizacje gdzie user jest FOUNDER (ownerId)
		const foundedOrgs = []
		
		for (const org of userProfile.organizations) {
			try {
				const orgDoc = await getDoc(doc(db, 'organizations', org.id))
				if (orgDoc.exists()) {
					const orgData = orgDoc.data()
					
					// Sprawdź czy user jest FOUNDER (utworzył organizację)
					if (orgData.ownerId === currentUser.uid) {
						foundedOrgs.push({ ...org, orgData })
					}
				}
			} catch (error) {
				console.error('Błąd sprawdzania organizacji:', error)
			}
		}
		
		if (foundedOrgs.length === 0) {
			return { 
				canAdd: false, 
				reason: '💼 Aby utworzyć własną organizację, musisz wykupić plan.\n\n✨ Dostępne plany już od 59 zł/miesiąc!' 
			}
		}

		// Sprawdź czy któraś z ZAŁOŻONYCH organizacji ma płatny plan
		for (const org of foundedOrgs) {
			const orgData = org.orgData
			const plan = orgData.subscription?.plan || orgData.plan || 'free'
			
			// Jeśli ma płatny plan (monthly, yearly, etc.) - może dodać organizację
			if (plan !== 'free') {
				// Sprawdź limit organizacji
				const maxOrgs = orgData.limits?.maxOrganizations || 1
				if (foundedOrgs.length >= maxOrgs) {
					return {
						canAdd: false,
						reason: `⚠️ Osiągnąłeś limit organizacji (${maxOrgs}).\n\nZmień plan na Półroczny lub Roczny aby utworzyć więcej firm.`
					}
				}
				
				return { canAdd: true, orgData }
			}
		}

		// Żadna ZAŁOŻONA organizacja nie ma płatnego planu
		return { 
			canAdd: false, 
			reason: '💼 Aby utworzyć nową organizację, musisz mieć aktywny plan.\n\n✨ Dostępne plany już od 59 zł/miesiąc!' 
		}
	}

	// ✅ ZMODYFIKOWANA FUNKCJA - z przekierowaniem na /pricing
	const handleCreateNewOrgClick = async () => {
		const checkResult = await canAddOrganizations()
		
		if (!checkResult.canAdd) {
			// ✅ Pytaj użytkownika czy chce przejść do wyboru planu
			const userWantsToBuy = window.confirm(
				checkResult.reason + '\n\n🛒 Przejść do wyboru planu?'
			)
			
			if (userWantsToBuy) {
				window.location.href = '/pricing'
			}
			return
		}
		
		setShowNewOrgModal(true)
	}

	const handleCreateNewOrg = async (e) => {
		e.preventDefault()
		if (!newOrgName.trim()) {
			alert('Wpisz nazwę firmy!')
			return
		}

		setNewOrgLoading(true)

		try {
			// DODATKOWE SPRAWDZENIE przed utworzeniem
			const checkResult = await canAddOrganizations()
			
			if (!checkResult.canAdd) {
				alert(checkResult.reason)
				setNewOrgLoading(false)
				return
			}

			const orgData = checkResult.orgData
			const userOwnedOrgs = userProfile?.organizations?.filter(org => org.role === 'Właściciel') || []

			// Utwórz nową organizację z tym samym planem co obecna
			const newOrgRef = await addDoc(collection(db, 'organizations'), {
				name: newOrgName,
				ownerId: currentUser.uid,
				ownerEmail: currentUser.email,
				subscription: {
					plan: orgData.subscription.plan,
					status: 'active',
					trialEndsAt: null,
					currentPeriodStart: new Date().toISOString(),
					currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
					cancelAtPeriodEnd: false,
					price: orgData.subscription.price,
					interval: orgData.subscription.interval,
					stripeCustomerId: `cus_mock_${Date.now()}`,
					stripeSubscriptionId: `sub_mock_${Date.now()}`
				},
				limits: {
					maxOrganizations: orgData.limits?.maxOrganizations || 1
				},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})

			const { updateDoc } = await import('firebase/firestore')
			const userRef = doc(db, 'users', currentUser.uid)
			
			await updateDoc(userRef, {
				organizations: [
					...userProfile.organizations,
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
							canChangePlan: true,
						},
						isDefault: false,
						joinedAt: new Date().toISOString()
					}
				],
				currentOrganizationId: newOrgRef.id,
				updatedAt: new Date().toISOString()
			})

			alert(`✅ Utworzono nową organizację: ${newOrgName}`)
			setShowNewOrgModal(false)
			setNewOrgName('')
			window.location.reload()

		} catch (error) {
			console.error('Błąd tworzenia organizacji:', error)
			alert(`❌ Błąd: ${error.message}`)
			setNewOrgLoading(false)
		}
	}

	const hasOrganization = userProfile?.organizations?.length > 0

	const isInDashboard = location.pathname === '/' && currentUser && hasOrganization
	const isOnLanding = location.pathname === '/landing'

	return (
		<>
			<nav className="navbar">
				<div className="navbar-container">
					<Link to="/landing" className="navbar-logo">
						<img src={woodIcon} alt="CLIENT MANAGER" />
						<span>ORDER MANAGER</span>
					</Link>

					{/* DESKTOP LINKS */}
					<div className="navbar-links navbar-links-desktop">
						{isOnLanding && (
							<>
								<a 
									href="#about" 
									onClick={(e) => {
										e.preventDefault()
										scrollToSection('about')
									}}>
									O nas
								</a>
								<a 
									href="#pricing" 
									onClick={(e) => {
										e.preventDefault()
										scrollToSection('pricing')
									}}>
									Plany
								</a>
								<a 
									href="#contact" 
									onClick={(e) => {
										e.preventDefault()
										scrollToSection('contact')
									}}>
									Kontakt
								</a>
							</>
						)}

						{isInDashboard && (
							<>
								<Link to="/landing" className="navbar-dashboard">
									🏠 Strona główna
								</Link>
								<Link to="/" className="navbar-dashboard" style={{ background: 'linear-gradient(135deg, #94c11e 0%, #7ea518 100%)' }}>
									📊 Aplikacja
								</Link>
							</>
						)}
					</div>

					{/* DESKTOP AUTH */}
					<div className="navbar-auth navbar-auth-desktop">
						{currentUser && hasOrganization ? (
							<>
								<OrganizationSwitcher />
								
								{/* ✅ ZMIENIONE - przycisk widoczny dla WSZYSTKICH */}
								{hasOrganization && (
									<button 
										onClick={handleCreateNewOrgClick}
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

								<Link to="/settings" className="navbar-btn navbar-btn-settings">
									⚙️
								</Link>

								{!isInDashboard && (
									<Link to="/" className="navbar-btn navbar-btn-app-main">
										📊 Panel zarządzania
									</Link>
								)}

								<button onClick={logout} className="navbar-btn navbar-btn-logout">
									Wyloguj
								</button>
							</>
						) : (
							<>
								<Link to="/login" className="navbar-btn navbar-btn-login">
									Zaloguj się
								</Link>
								<Link to="/register" className="navbar-btn navbar-btn-register">
									Zarejestruj się
								</Link>
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
						{/* MOBILE LINKS */}
						{isOnLanding && (
							<div className="mobile-menu-section">
								<a 
									href="#about" 
									onClick={(e) => {
										e.preventDefault()
										scrollToSection('about')
									}}>
									📖 O nas
								</a>
								<a 
									href="#pricing" 
									onClick={(e) => {
										e.preventDefault()
										scrollToSection('pricing')
									}}>
									💳 Plany
								</a>
								<a 
									href="#contact" 
									onClick={(e) => {
										e.preventDefault()
										scrollToSection('contact')
									}}>
									📞 Kontakt
								</a>
							</div>
						)}

						{isInDashboard && (
							<div className="mobile-menu-section">
								<Link to="/landing" onClick={() => setMobileMenuOpen(false)}>
									🏠 Strona główna
								</Link>
								<Link to="/" onClick={() => setMobileMenuOpen(false)}>
									📊 Aplikacja
								</Link>
							</div>
						)}

						{/* MOBILE AUTH */}
						{currentUser && hasOrganization ? (
							<div className="mobile-menu-section">
								<div className="mobile-org-info">
									<OrganizationSwitcher />
								</div>
								
								{/* ✅ ZMIENIONE - przycisk widoczny dla WSZYSTKICH */}
								{hasOrganization && (
									<button 
										onClick={() => {
											setMobileMenuOpen(false)
											handleCreateNewOrgClick()
										}}
										className="mobile-menu-btn">
										🏢 Nowa firma
									</button>
								)}
								
								<button 
									onClick={() => {
										setShowJoinModal(true)
										setMobileMenuOpen(false)
									}}
									className="mobile-menu-btn">
									➕ Dołącz do zespołu
								</button>

								<Link 
									to="/settings" 
									onClick={() => setMobileMenuOpen(false)}
									className="mobile-menu-btn">
									⚙️ Ustawienia
								</Link>

								{!isInDashboard && (
									<Link 
										to="/" 
										onClick={() => setMobileMenuOpen(false)}
										className="mobile-menu-btn mobile-menu-btn-primary">
										📊 Panel zarządzania
									</Link>
								)}

								<button 
									onClick={() => {
										logout()
										setMobileMenuOpen(false)
									}}
									className="mobile-menu-btn mobile-menu-btn-logout">
									Wyloguj
								</button>
							</div>
						) : (
							<div className="mobile-menu-section">
								<Link 
									to="/login" 
									onClick={() => setMobileMenuOpen(false)}
									className="mobile-menu-btn">
									Zaloguj się
								</Link>
								<Link 
									to="/register" 
									onClick={() => setMobileMenuOpen(false)}
									className="mobile-menu-btn mobile-menu-btn-primary">
									Zarejestruj się
								</Link>
							</div>
						)}
					</div>
				)}
			</nav>

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
								<div style={{ 
									padding: '12px', 
									background: '#fee', 
									color: '#c00', 
									borderRadius: '8px', 
									fontSize: '14px',
									marginTop: '12px'
								}}>
									{joinError}
								</div>
							)}

							<div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
								<button 
									type='submit' 
									className='modal-btn-primary'
									disabled={joinLoading}>
									{joinLoading ? 'Dołączanie...' : 'Dołącz'}
								</button>
								<button 
									type='button' 
									className='modal-btn-secondary'
									onClick={() => {
										setShowJoinModal(false)
										setJoinCode('')
										setJoinError('')
									}}>
									Anuluj
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{showNewOrgModal && (
				<div className='modal-overlay' onClick={() => setShowNewOrgModal(false)}>
					<div className='modal-card' onClick={(e) => e.stopPropagation()}>
						<h2>🏢 Utwórz nową firmę</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Dodaj kolejną organizację do swojego konta
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
								<button 
									type='submit' 
									className='modal-btn-primary'
									disabled={newOrgLoading}>
									{newOrgLoading ? 'Tworzenie...' : 'Utwórz'}
								</button>
								<button 
									type='button' 
									className='modal-btn-secondary'
									onClick={() => {
										setShowNewOrgModal(false)
										setNewOrgName('')
									}}>
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