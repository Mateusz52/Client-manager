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

	// Rejestracja jako Owner - tworzy TYLKO profil użytkownika (BEZ organizacji!)
	// Organizacja zostanie utworzona po zakupie planu w CheckoutPage
	const signupAsOwner = async (email, password, displayName) => {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password)
			const user = userCredential.user

			console.log('🔐 Tworzę profil użytkownika (bez organizacji)...')
			
			// Tworzymy TYLKO profil - bez organizacji!
			await setDoc(doc(db, 'users', user.uid), {
				email: user.email,
				displayName: displayName,
				organizations: [], // Pusta tablica - brak organizacji
				currentOrganizationId: null,
				createdAt: new Date().toISOString(),
			})

			// 📧 Wysyłamy email weryfikacyjny
			console.log('📧 Wysyłam email weryfikacyjny...')
			try {
				await sendEmailVerification(user)
				console.log('✅ Email weryfikacyjny wysłany!')
			} catch (emailError) {
				console.warn('⚠️ Nie udało się wysłać emaila weryfikacyjnego:', emailError)
			}

			return user
		} catch (error) {
			console.error('❌ Błąd rejestracji:', error)
			throw error
		}
	}

	// Rejestracja z kodem (dołączenie do organizacji)
	const signupWithInviteCode = async (email, password, displayName, inviteCode) => {
		try {
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

			const userCredential = await createUserWithEmailAndPassword(auth, email, password)
			const user = userCredential.user

			console.log('🔐 Tworzę profil z kodem zaproszenia...')
			await setDoc(doc(db, 'users', user.uid), {
				email: user.email,
				displayName: displayName,
				organizations: [
					{
						id: inviteData.organizationId,
						role: inviteData.role,
						permissions: inviteData.permissions,
						isDefault: true,
					},
				],
				currentOrganizationId: inviteData.organizationId,
				createdAt: new Date().toISOString(),
			})

			// Oznacz kod jako wykorzystany
			await updateDoc(doc(db, 'inviteCodes', inviteCode), {
				status: 'used',
				usedBy: user.uid,
				usedAt: new Date().toISOString(),
			})

			// 📧 Wysyłamy email weryfikacyjny
			console.log('📧 Wysyłam email weryfikacyjny...')
			try {
				await sendEmailVerification(user)
				console.log('✅ Email weryfikacyjny wysłany!')
			} catch (emailError) {
				console.warn('⚠️ Nie udało się wysłać emaila weryfikacyjnego:', emailError)
			}

			return user
		} catch (error) {
			console.error('❌ Błąd rejestracji z kodem:', error)
			throw error
		}
	}

	// Dodaj organizację do istniejącego użytkownika (przez kod)
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

			// Pobierz profil użytkownika
			const userRef = doc(db, 'users', currentUser.uid)
			const userSnap = await getDoc(userRef)

			if (!userSnap.exists()) {
				throw new Error('Profil użytkownika nie istnieje')
			}

			const userData = userSnap.data()
			const organizations = userData.organizations || []

			// Sprawdź czy już jest w tej organizacji
			if (organizations.some(org => org.id === inviteData.organizationId)) {
				throw new Error('Jesteś już członkiem tej organizacji')
			}

			// Dodaj nową organizację
			const updatedOrganizations = [
				...organizations,
				{
					id: inviteData.organizationId,
					role: inviteData.role,
					permissions: inviteData.permissions,
					isDefault: false,
				},
			]

			// Zaktualizuj profil
			await updateDoc(userRef, {
				organizations: updatedOrganizations,
				currentOrganizationId: inviteData.organizationId,
				updatedAt: new Date().toISOString(),
			})

			// Oznacz kod jako wykorzystany
			await updateDoc(doc(db, 'inviteCodes', inviteCode), {
				status: 'used',
				usedBy: currentUser.uid,
				usedAt: new Date().toISOString(),
			})

			console.log('✅ Dołączono do nowej organizacji')
		} catch (error) {
			console.error('❌ Błąd dołączania do organizacji:', error)
			throw error
		}
	}

	// Przełącz organizację
	const switchOrganization = async organizationId => {
		try {
			if (!currentUser) return

			const userRef = doc(db, 'users', currentUser.uid)
			await updateDoc(userRef, {
				currentOrganizationId: organizationId,
				updatedAt: new Date().toISOString(),
			})

			console.log('✅ Przełączono organizację:', organizationId)
		} catch (error) {
			console.error('❌ Błąd przełączania organizacji:', error)
			throw error
		}
	}

	const login = async (email, password) => {
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password)
			return userCredential
		} catch (error) {
			console.error('❌ Błąd logowania:', error)
			throw error
		}
	}

	const logout = async () => {
		try {
			await signOut(auth)
			setUserProfile(null)
			setPermissions(null)
		} catch (error) {
			console.error('Logout error:', error)
			throw error
		}
	}

	const resetPassword = async email => {
		try {
			await sendPasswordResetEmail(auth, email)
		} catch (error) {
			console.error('Reset password error:', error)
			throw error
		}
	}

	// Real-time listener dla profilu użytkownika
	useEffect(() => {
		const unsubscribeAuth = onAuthStateChanged(auth, async user => {
			console.log('🔐 AUTH STATE CHANGED:', user?.email || 'No user')
			setCurrentUser(user)

			if (user) {
				const userDocRef = doc(db, 'users', user.uid)
				
				let retries = 0
				const maxRetries = 10

				const unsubscribeProfile = onSnapshot(
					userDocRef,
					docSnap => {
						console.log('👤 PROFILE SNAPSHOT:', docSnap.exists(), 'Retry:', retries)

						if (docSnap.exists()) {
							const profile = docSnap.data()
							console.log('✅ Profile data:', profile)
							
							retries = 0

							// Użytkownik BEZ organizacji - to jest OK, może przeglądać landing
							if (!profile.organizations || profile.organizations.length === 0) {
								console.log('ℹ️ Użytkownik bez organizacji - czeka na zakup planu')
								setUserProfile({
									...profile,
									role: null,
									organizationId: null,
								})
								setPermissions({})
								setLoading(false)
								return
							}

							// Sprawdź czy użytkownik ma dostęp do aktualnej organizacji
							const currentOrgId = profile.currentOrganizationId
							const hasAccessToCurrentOrg = profile.organizations?.some(org => org.id === currentOrgId)

							if (!hasAccessToCurrentOrg && profile.organizations?.length > 0) {
								// Przełącz na pierwszą dostępną organizację
								const firstOrg = profile.organizations[0]
								switchOrganization(firstOrg.id)
								return
							}

							// Znajdź aktualną organizację i ustaw uprawnienia
							const currentOrg = profile.organizations.find(org => org.id === currentOrgId)

							setUserProfile({
								...profile,
								role: currentOrg?.role || 'Brak roli',
								organizationId: currentOrgId,
							})
							setPermissions(currentOrg?.permissions || {})
							setLoading(false)
						} else {
							retries++
							
							if (retries <= maxRetries) {
								console.log(`⏳ Czekam na profil... (${retries}/${maxRetries})`)
							} else {
								console.warn('⚠️ Użytkownik bez profilu po 10 próbach - wylogowuję')
								alert('❌ Twoje konto nie ma profilu.')
								signOut(auth)
								setUserProfile(null)
								setPermissions(null)
								setLoading(false)
							}
						}
					},
					error => {
						console.error('Error listening to profile:', error)
						setLoading(false)
					}
				)

				return () => {
					unsubscribeProfile()
				}
			} else {
				setUserProfile(null)
				setPermissions(null)
				setLoading(false)
			}
		})

		return () => {
			unsubscribeAuth()
		}
	}, [])

	const value = {
		currentUser,
		userProfile,
		organizationId: userProfile?.organizationId,
		organizations: userProfile?.organizations || [],
		role: userProfile?.role,
		permissions,
		signupAsOwner,
		signupWithInviteCode,
		joinOrganizationWithCode,
		switchOrganization,
		login,
		logout,
		resetPassword,
		loading,
	}

	return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}