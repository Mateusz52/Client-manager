import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import './OrganizationSwitcher.css'

export default function OrganizationSwitcher() {
	const { currentUser, userProfile, organizationId, switchOrganization } = useAuth()
	const [isOpen, setIsOpen] = useState(false)
	const [showNewOrgModal, setShowNewOrgModal] = useState(false)
	const [newOrgName, setNewOrgName] = useState('')
	const [newOrgLoading, setNewOrgLoading] = useState(false)
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
	const hasSubscription = userProfile?.subscription != null

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

	const handleCreateNewOrg = async (e) => {
		e.preventDefault()
		if (!newOrgName.trim()) {
			alert('Wpisz nazwę firmy!')
			return
		}

		setNewOrgLoading(true)

		try {
			// Limit zawsze 15
			const maxOrgs = 15
			const userOwnedOrgs = userProfile?.organizations?.filter(org => org.role === 'Właściciel') || []

			if (userOwnedOrgs.length >= maxOrgs) {
				alert(`❌ Osiągnąłeś limit organizacji (${maxOrgs}).`)
				setNewOrgLoading(false)
				return
			}

			// Utwórz organizację
			const newOrgRef = await addDoc(collection(db, 'organizations'), {
				name: newOrgName,
				ownerId: currentUser.uid,
				ownerEmail: currentUser.email,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			})

			// Dodaj organizację do profilu użytkownika
			const userRef = doc(db, 'users', currentUser.uid)
			const existingOrgs = userProfile?.organizations || []
			
			await updateDoc(userRef, {
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
							canChangePlan: true,
						},
						isDefault: existingOrgs.length === 0,
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

	// Nie pokazuj jeśli użytkownik ma tylko 1 organizację i nie ma subskrypcji
	if (organizations.length <= 1 && !hasSubscription) {
		return null
	}

	return (
		<>
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

						{/* Przycisk dodawania nowej firmy - tylko dla userów z subskrypcją */}
						{hasSubscription && (
							<button 
								className="org-add-new"
								onClick={() => {
									setIsOpen(false)
									setShowNewOrgModal(true)
								}}>
								<span>➕</span> Dodaj nową firmę
							</button>
						)}
					</div>
				)}
			</div>

			{/* Modal tworzenia organizacji */}
			{showNewOrgModal && (
				<div 
					className='modal-overlay' 
					onClick={() => setShowNewOrgModal(false)}
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0,0,0,0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000
					}}
				>
					<div 
						onClick={(e) => e.stopPropagation()}
						style={{
							background: 'white',
							borderRadius: '16px',
							padding: '32px',
							maxWidth: '400px',
							width: '90%'
						}}
					>
						<h2 style={{ marginBottom: '8px' }}>🏢 Utwórz nową firmę</h2>
						<p style={{ color: '#6c757d', fontSize: '14px', marginBottom: '20px' }}>
							Dodaj kolejną organizację do swojego konta
							<span style={{ display: 'block', marginTop: '8px', color: '#667eea' }}>
								Limit: 15 organizacji
							</span>
						</p>

						<form onSubmit={handleCreateNewOrg}>
							<input
								type='text'
								placeholder='Nazwa firmy'
								value={newOrgName}
								onChange={(e) => setNewOrgName(e.target.value)}
								required
								autoFocus
								style={{
									width: '100%',
									padding: '12px 16px',
									fontSize: '16px',
									border: '2px solid #e0e0e0',
									borderRadius: '8px',
									marginBottom: '16px',
									boxSizing: 'border-box'
								}}
							/>

							<div style={{ display: 'flex', gap: '12px' }}>
								<button 
									type='submit' 
									disabled={newOrgLoading}
									style={{
										flex: 1,
										padding: '12px 24px',
										background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
										color: 'white',
										border: 'none',
										borderRadius: '8px',
										fontSize: '16px',
										fontWeight: '600',
										cursor: newOrgLoading ? 'not-allowed' : 'pointer',
										opacity: newOrgLoading ? 0.7 : 1
									}}
								>
									{newOrgLoading ? 'Tworzenie...' : 'Utwórz'}
								</button>
								<button 
									type='button' 
									onClick={() => {
										setShowNewOrgModal(false)
										setNewOrgName('')
									}}
									style={{
										flex: 1,
										padding: '12px 24px',
										background: '#f5f5f5',
										color: '#333',
										border: '1px solid #ddd',
										borderRadius: '8px',
										fontSize: '16px',
										fontWeight: '600',
										cursor: 'pointer'
									}}
								>
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