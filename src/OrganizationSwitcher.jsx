import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import './OrganizationSwitcher.css'

export default function OrganizationSwitcher() {
	const { userProfile, organizationId, switchOrganization } = useAuth()
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

	const organizations = userProfile?.organizations || []
	const currentOrg = organizations.find(org => org.id === organizationId)

	if (organizations.length <= 1) {
		return null
	}

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

	return (
		<div className="organization-switcher" ref={dropdownRef}>
			<button 
				className={`org-switcher-button ${isOpen ? 'open' : ''}`}
				onClick={() => setIsOpen(!isOpen)}>
				<span className="org-icon">🏢</span>
				<div className="org-info">
					<span className="org-role">{currentOrg?.role}</span>
					<span className="org-name">{currentOrg?.name || 'Wybierz'}</span>
				</div>
				<span className="dropdown-arrow">▼</span>
			</button>

			{isOpen && (
				<div className="org-dropdown">
					<div className="org-dropdown-header">
						Twoje organizacje ({organizations.length})
					</div>

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
				</div>
			)}
		</div>
	)
}