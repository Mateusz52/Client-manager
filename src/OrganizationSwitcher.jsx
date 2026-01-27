import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import './OrganizationSwitcher.css'

export default function OrganizationSwitcher() {
	const { userProfile, organizationId, switchOrganization } = useAuth()
	const [isOpen, setIsOpen] = useState(false)
	const [orgsWithNames, setOrgsWithNames] = useState([])  // ✅ NOWE - organizacje z nazwami z Firestore
	const [loading, setLoading] = useState(true)
	const dropdownRef = useRef(null)

	// ✅ NOWE - Ładowanie nazw organizacji z Firestore
	useEffect(() => {
		const loadOrgNames = async () => {
			if (!userProfile?.organizations) {
				setLoading(false)
				return
			}

			try {
				const orgsWithData = await Promise.all(
					userProfile.organizations.map(async (org) => {
						try {
							const orgRef = doc(db, 'organizations', org.id)
							const orgSnap = await getDoc(orgRef)
							
							if (orgSnap.exists()) {
								return {
									...org,
									name: orgSnap.data().name || org.name || 'Bez nazwy'
								}
							}
							return { ...org, name: org.name || 'Bez nazwy' }
						} catch (error) {
							console.error(`Błąd ładowania nazwy org ${org.id}:`, error)
							return { ...org, name: org.name || 'Bez nazwy' }
						}
					})
				)
				
				setOrgsWithNames(orgsWithData)
				setLoading(false)
			} catch (error) {
				console.error('Błąd ładowania nazw organizacji:', error)
				setOrgsWithNames(userProfile.organizations)
				setLoading(false)
			}
		}

		loadOrgNames()
	}, [userProfile])

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const organizations = orgsWithNames  // ✅ Używamy organizacji z nazwami z Firestore
	const currentOrg = organizations.find(org => org.id === organizationId)

	// ✅ NOWE - Pokaż zawsze, nawet jeśli brak organizacji
	// if (organizations.length <= 1) {
	// 	return null
	// }

	const handleSwitch = async (orgId) => {
		if (orgId === organizationId) {
			setIsOpen(false)
			return
		}

		try {
			await switchOrganization(orgId)
			setIsOpen(false)
			window.location.reload()
		} catch (error) {
			console.error('Błąd przełączania organizacji:', error)
			alert('Nie udało się przełączyć organizacji')
		}
	}

	if (loading) {
		return (
			<div className="organization-switcher">
				<button className="org-switcher-button">
					<span className="org-icon">🏢</span>
					<div className="org-info">
						<span className="org-role">Ładowanie...</span>
						<span className="org-name">...</span>
					</div>
				</button>
			</div>
		)
	}

	return (
		<div className="organization-switcher" ref={dropdownRef}>
			<button 
				className={`org-switcher-button ${isOpen ? 'open' : ''}`}
				onClick={() => setIsOpen(!isOpen)}>
				<span className="org-icon">🏢</span>
				<div className="org-info">
					{organizations.length > 0 ? (
						<>
							<span className="org-role">{currentOrg?.role || 'Wybierz'}</span>
							<span className="org-name">{currentOrg?.name || 'Wybierz'}</span>
						</>
					) : (
						<>
							<span className="org-role">Brak organizacji</span>
							<span className="org-name">Kliknij aby utworzyć</span>
						</>
					)}
				</div>
				<span className="dropdown-arrow">▼</span>
			</button>

			{isOpen && (
				<div className="org-dropdown">
					<div className="org-dropdown-header">
						{organizations.length > 0 ? (
							`Twoje organizacje (${organizations.length})`
						) : (
							'Brak organizacji'
						)}
					</div>

					{organizations.length > 0 ? (
						<div className="org-list">
							{organizations.map(org => (
								<button
									key={org.id}
									className={`org-item ${org.id === organizationId ? 'active' : ''}`}
									onClick={() => handleSwitch(org.id)}>
									<span className="org-item-icon">
										{org.id === organizationId ? '✓' : '🏢'}
									</span>
									<div className="org-item-info">
										<span className="org-item-name">{org.name}</span>
										<span className="org-item-role">{org.role}</span>
									</div>
									{org.id === organizationId && (
										<span className="org-item-check">✓</span>
									)}
								</button>
							))}
						</div>
					) : (
						<div className="org-list">
							<button
								className="org-item"
								onClick={() => window.location.href = '/create-first-organization'}
								style={{ 
									background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
									color: 'white',
									fontWeight: '600',
									justifyContent: 'center'
								}}>
								<span className="org-item-icon">✨</span>
								<div className="org-item-info">
									<span className="org-item-name">Utwórz nową organizację</span>
								</div>
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	)
}