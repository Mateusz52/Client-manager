import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from './firebase'
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	sendPasswordResetEmail,
	sendEmailVerification,
} from 'firebase/auth'
import { doc, getDoc, setDoc, collection, addDoc, onSnapshot, updateDoc } from 'firebase/firestore'

const AuthContext = createContext()

export function useAuth() {
	return useContext(AuthContext)
}

const DEFAULT_OWNER_PERMISSIONS = {
	canAddOrders: true,
	canEditOrders: true,
	canDeleteOrders: true,
	canViewStatistics: true,
	canExportPDF: true,
	canConfigureProducts: true,
	canManageTeam: true,
	canChangePlan: true,
}

export function AuthProvider({ children }) {
	const [currentUser, setCurrentUser] = useState(null)
	const [userProfile, setUserProfile] = useState(null)
	const [permissions, setPermissions] = useState(null)
	const [loading, setLoading] = useState(true)
	const [organizationId, setOrganizationId] = useState(null)

	// Rejestracja BEZ organizacji
	const signupAsOwner = async (email, password, displayName) => {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password)
			const user = userCredential.user

			console.log('Tworzę profil użytkownika BEZ organizacji...')
			
			await setDoc(doc(db, 'users', user.uid), {
				email: user.email,
				displayName: displayName,
				organizations: [],
				currentOrganizationId: null,
				createdAt: new Date().toISOString(),
			})

			try {
				await sendEmailVerification(user)
				console.log('Email weryfikacyjny wysłany!')
			} catch (emailError) {
				console.warn('Nie udało się wysłać emaila:', emailError)
			}

			return user
		} catch (error) {
			console.error('Błąd rejestracji:', error)
			throw error
		}
	}

	// Rejestracja z kodem zaproszenia
	// WAŻNE: Najpierw tworzymy usera, POTEM sprawdzamy kod (bo Firestore wymaga auth)
	const signupWithInviteCode = async (email, password, displayName, inviteCode) => {
		let user = null
		
		try {
			// 1. NAJPIERW utwórz użytkownika
			console.log('Tworzę użytkownika...')
			const userCredential = await createUserWithEmailAndPassword(auth, email, password)
			user = userCredential.user
			console.log('Użytkownik utworzony:', user.uid)

			// 2. TERAZ sprawdź kod zaproszenia (user jest już zalogowany)
			console.log('Sprawdzam kod zaproszenia...')
			const inviteDoc = await getDoc(doc(db, 'inviteCodes', inviteCode))

			if (!inviteDoc.exists()) {
				// Kod nie istnieje - utwórz profil bez organizacji
				console.log('Kod nie istnieje, tworzę profil bez org')
				await setDoc(doc(db, 'users', user.uid), {
					email: user.email,
					displayName: displayName,
					organizations: [],
					currentOrganizationId: null,
					createdAt: new Date().toISOString(),
				})
				throw new Error('Nieprawidłowy kod zaproszenia')
			}

			const inviteData = inviteDoc.data()

			if (inviteData.status !== 'active') {
				await setDoc(doc(db, 'users', user.uid), {
					email: user.email,
					displayName: displayName,
					organizations: [],
					currentOrganizationId: null,
					createdAt: new Date().toISOString(),
				})
				throw new Error('Ten kod został już wykorzystany')
			}

			if (new Date(inviteData.expiresAt) < new Date()) {
				await setDoc(doc(db, 'users', user.uid), {
					email: user.email,
					displayName: displayName,
					organizations: [],
					currentOrganizationId: null,
					createdAt: new Date().toISOString(),
				})
				throw new Error('Ten kod wygasł')
			}

			// 3. Pobierz nazwę organizacji
			const orgDoc = await getDoc(doc(db, 'organizations', inviteData.organizationId))
			const orgName = orgDoc.exists() ? orgDoc.data().name : 'Nieznana organizacja'

			// 4. Utwórz profil z organizacją
			console.log('Tworzę profil z organizacją...')
			await setDoc(doc(db, 'users', user.uid), {
				email: user.email,
				displayName: displayName,
				organizations: [
					{
						id: inviteData.organizationId,
						name: orgName,
						role: inviteData.role,
						permissions: inviteData.permissions,
						isDefault: true,
						joinedAt: new Date().toISOString(),
					},
				],
				currentOrganizationId: inviteData.organizationId,
				createdAt: new Date().toISOString(),
			})

			// 5. Oznacz kod jako wykorzystany
			await updateDoc(doc(db, 'inviteCodes', inviteCode), {
				status: 'used',
				usedBy: user.uid,
				usedAt: new Date().toISOString(),
			})

			try {
				await sendEmailVerification(user)
			} catch (emailError) {
				console.warn('Nie udało się wysłać emaila:', emailError)
			}

			console.log('Rejestracja z kodem zakończona sukcesem!')
			return user
			
		} catch (error) {
			console.error('Błąd rejestracji z kodem:', error)
			throw error
		}
	}

	// Dołączenie do organizacji (dla zalogowanych)
	const joinOrganizationWithCode = async inviteCode => {
		try {
			if (!currentUser) throw new Error('Musisz być zalogowany')

			const inviteDoc = await getDoc(doc(db, 'inviteCodes', inviteCode))

			if (!inviteDoc.exists()) {
				throw new Error('Nieprawidłowy kod zaproszenia')
			}

			const inviteData = inviteDoc.data()

			if (inviteData.status !== 'active') {
				throw new Error('Ten kod został już wykorzystany')
			}

			if (new Date(inviteData.expiresAt) < new Date()) {
				throw new Error('Ten kod wygasł')
			}

			const userRef = doc(db, 'users', currentUser.uid)
			const userSnap = await getDoc(userRef)

			if (!userSnap.exists()) {
				throw new Error('Profil użytkownika nie istnieje')
			}

			const userData = userSnap.data()
			const organizations = userData.organizations || []

			if (organizations.some(org => org.id === inviteData.organizationId)) {
				throw new Error('Jesteś już członkiem tej organizacji')
			}

			const orgDoc = await getDoc(doc(db, 'organizations', inviteData.organizationId))
			const orgName = orgDoc.exists() ? orgDoc.data().name : 'Nieznana organizacja'

			const updatedOrganizations = [
				...organizations,
				{
					id: inviteData.organizationId,
					name: orgName,
					role: inviteData.role,
					permissions: inviteData.permissions,
					isDefault: organizations.length === 0,
					joinedAt: new Date().toISOString(),
				},
			]

			await updateDoc(userRef, {
				organizations: updatedOrganizations,
				currentOrganizationId: inviteData.organizationId,
				updatedAt: new Date().toISOString(),
			})

			await updateDoc(doc(db, 'inviteCodes', inviteCode), {
				status: 'used',
				usedBy: currentUser.uid,
				usedAt: new Date().toISOString(),
			})

			console.log('Dołączono do organizacji')
		} catch (error) {
			console.error('Błąd dołączania:', error)
			throw error
		}
	}

	const switchOrganization = async orgId => {
		try {
			if (!currentUser) return

			const userRef = doc(db, 'users', currentUser.uid)
			await updateDoc(userRef, {
				currentOrganizationId: orgId,
				updatedAt: new Date().toISOString(),
			})

			setOrganizationId(orgId)
		} catch (error) {
			console.error('Błąd przełączania:', error)
			throw error
		}
	}

	const login = async (email, password) => {
		return signInWithEmailAndPassword(auth, email, password)
	}

	const logout = async () => {
		setUserProfile(null)
		setPermissions(null)
		setOrganizationId(null)
		return signOut(auth)
	}

	const resetPassword = async email => {
		return sendPasswordResetEmail(auth, email)
	}

	// Listener profilu
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, async user => {
			console.log('AUTH STATE:', user?.email || 'No user')
			setCurrentUser(user)

			if (user) {
				const userDocRef = doc(db, 'users', user.uid)
				
				let retries = 0
				const maxRetries = 10

				const unsubscribeProfile = onSnapshot(
					userDocRef,
					docSnap => {
						if (docSnap.exists()) {
							const profile = docSnap.data()
							retries = 0

							const currentOrgId = profile.currentOrganizationId
							const hasAccessToCurrentOrg = profile.organizations?.some(org => org.id === currentOrgId)

							if (!hasAccessToCurrentOrg && profile.organizations?.length > 0) {
								const firstOrg = profile.organizations[0]
								switchOrganization(firstOrg.id)
								return
							}

							// Użytkownik bez organizacji - OK
							if (!profile.organizations || profile.organizations.length === 0) {
								console.log('Użytkownik bez organizacji - OK')
								setUserProfile({
									...profile,
									role: null,
									organizationId: null,
								})
								setPermissions({})
								setOrganizationId(null)
								setLoading(false)
								return
							}

							const currentOrg = profile.organizations.find(org => org.id === currentOrgId)

							setUserProfile({
								...profile,
								role: currentOrg?.role || 'Brak roli',
								organizationId: currentOrgId,
							})
							setPermissions(currentOrg?.permissions || {})
							setOrganizationId(currentOrgId)
							setLoading(false)
						} else {
							retries++
							if (retries > maxRetries) {
								console.warn('Brak profilu')
								signOut(auth)
								setUserProfile(null)
								setPermissions(null)
								setLoading(false)
							}
						}
					},
					error => {
						console.error('Błąd:', error)
						setLoading(false)
					}
				)

				return () => unsubscribeProfile()
			} else {
				setUserProfile(null)
				setPermissions(null)
				setOrganizationId(null)
				setLoading(false)
			}
		})

		return () => unsubscribeAuth()
	}, [])

	const value = {
		currentUser,
		userProfile,
		permissions,
		organizationId,
		signupAsOwner,
		signupWithInviteCode,
		joinOrganizationWithCode,
		switchOrganization,
		login,
		logout,
		resetPassword,
		loading,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}