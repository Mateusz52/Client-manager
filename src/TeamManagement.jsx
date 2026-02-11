import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useAlert } from './AlertProvider'
import { db, functions } from './firebase'
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import emailjs from '@emailjs/browser'

const ROLE_PRESETS = {
	Właściciel: {
		canAddOrders: true,
		canEditOrders: true,
		canDeleteOrders: true,
		canViewStatistics: true,
		canExportPDF: true,
		canConfigureProducts: true,
		canManageTeam: true,
		canChangePlan: true,
	},
	Administrator: {
		canAddOrders: true,
		canEditOrders: true,
		canDeleteOrders: true,
		canViewStatistics: true,
		canExportPDF: true,
		canConfigureProducts: true,
		canManageTeam: false,
		canChangePlan: false,
	},
	Pracownik: {
		canAddOrders: true,
		canEditOrders: true,
		canDeleteOrders: false,
		canViewStatistics: true,
		canExportPDF: false,
		canConfigureProducts: false,
		canManageTeam: false,
		canChangePlan: false,
	},
	Widz: {
		canAddOrders: false,
		canEditOrders: false,
		canDeleteOrders: false,
		canViewStatistics: true,
		canExportPDF: false,
		canConfigureProducts: false,
		canManageTeam: false,
		canChangePlan: false,
	},
}

export default function TeamManagement({ isOpen, onClose }) {
	const { currentUser, organizationId, userProfile } = useAuth()
	const { alert, confirm, success, error, warning } = useAlert()
	
	const [teamMembers, setTeamMembers] = useState([])
	const [inviteCodes, setInviteCodes] = useState([])
	const [loading, setLoading] = useState(true)
	const [editingMember, setEditingMember] = useState(null)

	const [inviteEmail, setInviteEmail] = useState('')
	const [inviteRole, setInviteRole] = useState('Pracownik')
	const [inviting, setInviting] = useState(false)

	// Real-time listener dla członków zespołu
	useEffect(() => {
		if (!organizationId || !isOpen) return

		const usersRef = collection(db, 'users')
		
		const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
			const allUsers = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}))

			// Filtruj użytkowników którzy mają tę organizację
			const members = allUsers.filter(user => 
				user.organizations?.some(org => org.id === organizationId)
			).map(user => {
				const orgData = user.organizations.find(org => org.id === organizationId)
				return {
					id: user.id,
					email: user.email,
					displayName: user.displayName,
					role: orgData?.role || 'Brak roli',
					permissions: orgData?.permissions || {}
				}
			})

			setTeamMembers(members)
		}, (err) => {
			console.error('Error fetching team:', err)
		})

		// Real-time listener dla kodów zaproszenia
		const codesRef = collection(db, 'inviteCodes')
		const qCodes = query(codesRef, where('organizationId', '==', organizationId), where('status', '==', 'active'))

		const unsubscribeCodes = onSnapshot(qCodes, (snapshot) => {
			const codes = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			}))
			setInviteCodes(codes)
			setLoading(false)
		}, (err) => {
			console.error('Error fetching codes:', err)
			setLoading(false)
		})

		return () => {
			unsubscribeUsers()
			unsubscribeCodes()
		}
	}, [organizationId, isOpen])

	const generateInviteCode = () => {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
		let code = ''
		for (let i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length))
		}
		return code
	}

	const handleGenerateCode = async e => {
		e.preventDefault()

		if (!organizationId) {
			error('Brak organizacji!')
			return
		}

		if (!inviteEmail) {
			error('Wpisz email pracownika!', 'Brak emaila')
			return
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(inviteEmail)) {
			error('Wpisz poprawny adres email!', 'Nieprawidłowy email')
			return
		}

		setInviting(true)

		try {
			const code = generateInviteCode()

			const codeRef = doc(db, 'inviteCodes', code)
			const codeSnap = await getDoc(codeRef)

			if (codeSnap.exists()) {
				setInviting(false)
				return handleGenerateCode(e)
			}

			const codeData = {
				code: code,
				organizationId: organizationId,
				role: inviteRole,
				permissions: ROLE_PRESETS[inviteRole],
				status: 'active',
				createdBy: currentUser.uid,
				createdByName: userProfile?.displayName || currentUser.email,
				email: inviteEmail,
				createdAt: new Date().toISOString(),
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
				usedBy: null,
				usedAt: null
			}

			await setDoc(codeRef, codeData)

			const inviteLink = `${window.location.origin}/register?code=${code}`

			console.log('📧 Wysyłam email...')
			try {
				await emailjs.send(
					'service_i6xa7ko',
					'template_kxe8t16',
					{
						email: inviteEmail,
						name: userProfile?.displayName || currentUser.email,
						invite_role: inviteRole,
						invite_link: inviteLink,
						invite_code: code
					},
					{
						publicKey: 'UpW3sFx4NhdEXwWdm'
					}
				)
				console.log('✅ Email wysłany!')
				
				try {
					await navigator.clipboard.writeText(code)
					success(`✅ Zaproszenie utworzone!\n\n📧 Email wysłany na: ${inviteEmail}\n\n⚠️ UWAGA: Niektóre skrzynki (WP, Onet, Interia) blokują takie emaile.\nJeśli email nie dojdzie - wyślij kod ręcznie przez SMS lub komunikator.\n\n🔑 Kod: ${code} (skopiowany do schowka!)\n\n🔗 Link:\n${inviteLink}`, 'Zaproszenie gotowe')
				} catch (clipboardError) {
					success(`✅ Zaproszenie utworzone!\n\n📧 Email wysłany na: ${inviteEmail}\n\n⚠️ UWAGA: Niektóre skrzynki (WP, Onet, Interia) blokują takie emaile.\nJeśli email nie dojdzie - wyślij kod ręcznie przez SMS lub komunikator.\n\n🔑 Kod: ${code}\n\n🔗 Link:\n${inviteLink}`, 'Zaproszenie gotowe')
				}
				
			} catch (emailError) {
				console.error('❌ Błąd wysyłania emaila:', emailError)
				
				try {
					await navigator.clipboard.writeText(code)
					warning(`Email nie wysłany (sprawdź limit EmailJS)\n\n🔑 KOD: ${code}\n📋 Skopiowany do schowka!\n\nWyślij kod ręcznie na: ${inviteEmail}\n\nLink rejestracji:\n${inviteLink}`, 'Email nie wysłany')
				} catch (clipboardError) {
					warning(`Email nie wysłany\n\n🔑 KOD: ${code}\n\nWyślij go ręcznie na: ${inviteEmail}\n\nLink:\n${inviteLink}`, 'Email nie wysłany')
				}
			}

			setInviteEmail('')
			setInviteRole('Pracownik')

		} catch (err) {
			console.error('Error generating code:', err)
			error('Nie udało się wygenerować kodu.')
		}

		setInviting(false)
	}

	const handleDeleteCode = async (code) => {
		confirm(
			'Czy na pewno chcesz usunąć ten kod?',
			async () => {
				try {
					const codeRef = doc(db, 'inviteCodes', code)
					await deleteDoc(codeRef)
					success('Kod usunięty!')
				} catch (err) {
					console.error('Error deleting code:', err)
					error('Nie udało się usunąć kodu.')
				}
			},
			'Usuń kod'
		)
	}

	const handleCopyCode = async (code) => {
		try {
			await navigator.clipboard.writeText(code)
			success('Kod skopiowany do schowka!')
		} catch (err) {
			alert(`Kod: ${code}`)
		}
	}

	const handleEditPermissions = (member) => {
		setEditingMember({
			...member,
			tempPermissions: { ...member.permissions }
		})
	}

	const handlePermissionToggle = (permission) => {
		setEditingMember(prev => ({
			...prev,
			tempPermissions: {
				...prev.tempPermissions,
				[permission]: !prev.tempPermissions[permission]
			}
		}))
	}

	const handleSavePermissions = async () => {
		if (!editingMember || !organizationId) return

		try {
			const userRef = doc(db, 'users', editingMember.id)
			const userSnap = await getDoc(userRef)

			if (!userSnap.exists()) {
				error('Użytkownik nie istnieje')
				return
			}

			const userData = userSnap.data()
			const updatedOrgs = userData.organizations.map(org => {
				if (org.id === organizationId) {
					return {
						...org,
						permissions: editingMember.tempPermissions
					}
				}
				return org
			})

			await updateDoc(userRef, {
				organizations: updatedOrgs
			})

			success('Uprawnienia zaktualizowane!')
			setEditingMember(null)
		} catch (err) {
			console.error('Error updating permissions:', err)
			error('Nie udało się zaktualizować uprawnień.')
		}
	}

	// Usuwanie członka przez Cloud Function
	const handleRemoveMember = async (memberId) => {
		if (!organizationId) return

		confirm(
			'Czy na pewno chcesz usunąć tego członka z organizacji?\n\nZostanie automatycznie wylogowany jeśli jest zalogowany.',
			async () => {
				try {
					// Użyj Cloud Function
					const removeMember = httpsCallable(functions, 'removeMemberFromOrganization')
					await removeMember({ 
						memberId: memberId, 
						organizationId: organizationId 
					})

					success('Członek usunięty z organizacji!')
				} catch (err) {
					console.error('Error removing member:', err)
					error('Nie udało się usunąć członka.')
				}
			},
			'Usuń członka'
		)
	}

	if (!isOpen) return null

	return (
		<>
			<div className='team-overlay' onClick={onClose}></div>
			<div className={`team-panel ${isOpen ? 'open' : ''}`}>
				<div className='team-header'>
					<h2 className='team-title'>👥 Zarządzanie zespołem</h2>
					<button className='close-team-btn' onClick={onClose}>
						✕
					</button>
				</div>

				<div className='team-content'>
					{/* Sekcja generowania kodów */}
					<div className='team-section'>
						<h3 className='section-title'>📨 Zaproś nowego członka</h3>
						<form onSubmit={handleGenerateCode} className='invite-form'>
							<div className='form-row'>
								<input
									type='email'
									placeholder='Email pracownika'
									value={inviteEmail}
									onChange={(e) => setInviteEmail(e.target.value)}
									className='invite-input'
									required
								/>
								<select
									value={inviteRole}
									onChange={(e) => setInviteRole(e.target.value)}
									className='role-select'>
									<option value='Pracownik'>Pracownik</option>
									<option value='Administrator'>Administrator</option>
									<option value='Widz'>Widz</option>
									<option value='Właściciel'>Właściciel</option>
								</select>
								<button type='submit' className='generate-btn' disabled={inviting}>
									{inviting ? '⏳' : '📤 Wyślij'}
								</button>
							</div>
						</form>

						{/* Lista kodów zaproszenia */}
						{inviteCodes.length > 0 && (
							<div className='codes-list'>
								<h4 className='subsection-title'>🎟️ Aktywne kody zaproszenia</h4>
								{inviteCodes.map(code => (
									<div key={code.id} className='code-card'>
										<div className='code-info'>
											<span className='code-value'>{code.code}</span>
											<span className='code-email'>{code.email}</span>
											<span className='code-role'>{code.role}</span>
										</div>
										<div className='code-actions'>
											<button
												className='copy-code-btn'
												onClick={() => handleCopyCode(code.code)}
												title='Kopiuj kod'>
												📋
											</button>
											<button
												className='delete-code-btn'
												onClick={() => handleDeleteCode(code.code)}
												title='Usuń kod'>
												🗑️
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Sekcja członków zespołu */}
					<div className='team-section'>
						<h3 className='section-title'>👨‍💼 Członkowie zespołu ({teamMembers.length})</h3>
						{loading ? (
							<div className='loading-state'>Ładowanie...</div>
						) : teamMembers.length === 0 ? (
							<div className='empty-state'>
								<p>Brak członków zespołu</p>
							</div>
						) : (
							<div className='members-list'>
								{teamMembers.map(member => (
									<div key={member.id} className='member-card'>
										<div className='member-info'>
											<div className='member-name'>{member.displayName}</div>
											<div className='member-email'>{member.email}</div>
											<div className='member-role'>{member.role}</div>
										</div>
										<div className='member-actions'>
											<button
												className='edit-permissions-btn'
												onClick={() => handleEditPermissions(member)}
												title='Edytuj uprawnienia'>
												⚙️
											</button>
											{member.id !== currentUser?.uid && (
												<button
													className='remove-member-btn'
													onClick={() => handleRemoveMember(member.id)}
													title='Usuń z zespołu'>
													🗑️
												</button>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Modal edycji uprawnień */}
				{editingMember && (
					<>
						<div className='permissions-overlay' onClick={() => setEditingMember(null)}></div>
						<div className='permissions-modal'>
							<h3>⚙️ Uprawnienia: {editingMember.displayName}</h3>
							<div className='permissions-list'>
								<label>
									<input
										type='checkbox'
										checked={editingMember.tempPermissions.canAddOrders || false}
										onChange={() => handlePermissionToggle('canAddOrders')}
									/>
									Dodawanie zamówień
								</label>
								<label>
									<input
										type='checkbox'
										checked={editingMember.tempPermissions.canEditOrders || false}
										onChange={() => handlePermissionToggle('canEditOrders')}
									/>
									Edycja zamówień
								</label>
								<label>
									<input
										type='checkbox'
										checked={editingMember.tempPermissions.canDeleteOrders || false}
										onChange={() => handlePermissionToggle('canDeleteOrders')}
									/>
									Usuwanie zamówień
								</label>
								<label>
									<input
										type='checkbox'
										checked={editingMember.tempPermissions.canViewStatistics || false}
										onChange={() => handlePermissionToggle('canViewStatistics')}
									/>
									Przeglądanie statystyk
								</label>
								<label>
									<input
										type='checkbox'
										checked={editingMember.tempPermissions.canExportPDF || false}
										onChange={() => handlePermissionToggle('canExportPDF')}
									/>
									Export do PDF
								</label>
								<label>
									<input
										type='checkbox'
										checked={editingMember.tempPermissions.canConfigureProducts || false}
										onChange={() => handlePermissionToggle('canConfigureProducts')}
									/>
									Konfiguracja produktów
								</label>
								<label>
									<input
										type='checkbox'
										checked={editingMember.tempPermissions.canManageTeam || false}
										onChange={() => handlePermissionToggle('canManageTeam')}
									/>
									Zarządzanie zespołem
								</label>
								<label>
									<input
										type='checkbox'
										checked={editingMember.tempPermissions.canChangePlan || false}
										onChange={() => handlePermissionToggle('canChangePlan')}
									/>
									Zmiana planu
								</label>
							</div>
							<div className='permissions-actions'>
								<button onClick={() => setEditingMember(null)} className='cancel-permissions-btn'>
									Anuluj
								</button>
								<button onClick={handleSavePermissions} className='save-permissions-btn'>
									✓ Zapisz
								</button>
							</div>
						</div>
					</>
				)}
			</div>
		</>
	)
}