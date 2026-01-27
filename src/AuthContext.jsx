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
import { doc, getDoc, setDoc, collection, addDoc, onSnapshot, updateDoc, getDocs } from 'firebase/firestore'

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

	// ✅ NOWA FUNKCJA - Sprawdź czy user ma płatny plan w którejkolwiek organizacji którą założył
	const checkIfUserHasPaidPlan = async (userId) => {
		try {
			const orgsSnapshot = await getDocs(collection(db, 'organizations'))
			
			for (const orgDoc of orgsSnapshot.docs) {
				const orgData = orgDoc.data()
				
				// Sprawdź czy user jest ownerem tej organizacji
				if (orgData.ownerId === userId) {
					const plan = orgData.subscription?.plan || orgData.plan || 'free'
					
					// Jeśli ma płatny plan - zwróć true
					if (plan !== 'free') {
						console.log(`✅ User ma płatny plan: ${plan} w org: ${orgDoc.id}`)
						return { hasPaidPlan: true, plan, orgId: orgDoc.id }
					}
				}
			}
			
			console.log('❌ User nie ma płatnego planu')
			return { hasPaidPlan: false }
		} catch (error) {
			console.error('Błąd sprawdzania płatnego planu:', error)
			return { hasPaidPlan: false }
		}
	}

	// Rejestracja jako Owner (nowa organizacja)
	const signupAsOwner = async (email, password, displayName) => {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password)
			const user = userCredential.user

			console.log('🏢 Tworzę organizację...')
			const orgRef = await addDoc(collection(db, 'organizations'), {
				name: `${displayName}'s Organization`,
				ownerId: user.uid,
				plan: 'free',
				maxUsers: 5,
				createdAt: new Date().toISOString(),
			})

			console.log('👤 Tworzę profil użytkownika...')
			await setDoc(doc(db, 'users', user.uid), {
				email: user.email,
				displayName: displayName,
				organizations: [
					{
						id: orgRef.id,
						role: 'Właściciel',
						permissions: DEFAULT_OWNER_PERMISSIONS,
						isDefault: true,
					},
				],
				currentOrganizationId: orgRef.id,
				createdAt: new Date().toISOString(),
			})

			// 📧 WYSYŁAMY EMAIL WERYFIKACYJNY
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

			console.log('👤 Tworzę profil użytkownika z kodem...')
			await setDoc(doc(db, 'users', user.uid), {
				email: user.email,
				displayName: displayName,
				organizations: [
					{
						id: inviteData.organizationId,
						role: inviteData.role || 'Członek',
						permissions: inviteData.permissions || {},
						isDefault: true,
					},
				],
				currentOrganizationId: inviteData.organizationId,
				createdAt: new Date().toISOString(),
			})

			await updateDoc(doc(db, 'inviteCodes', inviteCode), {
				status: 'used',
				usedBy: user.uid,
				usedAt: new Date().toISOString(),
			})

			// 📧 WYSYŁAMY EMAIL WERYFIKACYJNY
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

	const joinOrganizationWithCode = async inviteCode => {
		try {
			if (!currentUser) {
				throw new Error('Musisz być zalogowany')
			}

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
			const userDoc = await getDoc(userRef)

			if (!userDoc.exists()) {
				throw new Error('Profil użytkownika nie istnieje')
			}

			const userData = userDoc.data()
			const existingOrgs = userData.organizations || []

			const alreadyMember = existingOrgs.some(org => org.id === inviteData.organizationId)

			if (alreadyMember) {
				throw new Error('Już należysz do tej organizacji')
			}

			await updateDoc(userRef, {
				organizations: [
					...existingOrgs,
					{
						id: inviteData.organizationId,
						role: inviteData.role || 'Członek',
						permissions: inviteData.permissions || {},
						isDefault: false,
					},
				],
				currentOrganizationId: inviteData.organizationId,
				updatedAt: new Date().toISOString(),
			})

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

	// Real-time listener dla profilu użytkownika Z RETRY LOGIC
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
					async docSnap => {
						console.log('👤 PROFILE SNAPSHOT:', docSnap.exists(), 'Retry:', retries)

						if (docSnap.exists()) {
							const profile = docSnap.data()
							console.log('✅ Profile data:', profile)
							
							retries = 0

							const currentOrgId = profile.currentOrganizationId
							const hasAccessToCurrentOrg = profile.organizations?.some(org => org.id === currentOrgId)

							// ✅ NOWE - Sprawdź czy obecna organizacja nie jest usunięta
							if (currentOrgId && hasAccessToCurrentOrg) {
								const currentOrgDoc = await getDoc(doc(db, 'organizations', currentOrgId))
								if (currentOrgDoc.exists() && currentOrgDoc.data().deleted === true) {
									console.warn('⚠️ Obecna organizacja jest usunięta')
									// Przełącz na pierwszą nieusunietą organizację
									if (profile.organizations?.length > 0) {
										const firstOrg = profile.organizations[0]
										switchOrganization(firstOrg.id)
										return
									}
									// Jeśli nie ma innych org, traktuj jako brak organizacji
									const paidPlanCheck = await checkIfUserHasPaidPlan(user.uid)
									
									if (paidPlanCheck.hasPaidPlan) {
										console.log('✅ User ma płatny plan - pozwalam na dostęp')
										setUserProfile({
											...profile,
											hasNoOrganizations: true,
											canCreateOrganization: true,
											paidPlan: paidPlanCheck.plan,
											organizationId: null,
										})
										setPermissions({})
										setLoading(false)
										return
									}
									
									console.warn('❌ Użytkownik bez organizacji i bez płatnego planu - wylogowuję')
									alert('❌ Zostałeś usunięty ze wszystkich organizacji.\n\nSkontaktuj się z administratorem.')
									signOut(auth)
									setUserProfile(null)
									setPermissions(null)
									setLoading(false)
									return
								}
							}

							if (!hasAccessToCurrentOrg && profile.organizations?.length > 0) {
								// Przełącz na pierwszą dostępną organizację
								const firstOrg = profile.organizations[0]
								switchOrganization(firstOrg.id)
								return
							}

							// ✅ NOWA LOGIKA - Sprawdź czy user ma płatny plan
							if (profile.organizations?.length === 0 || !hasAccessToCurrentOrg) {
								console.warn('⚠️ Użytkownik bez organizacji')
								
								// Sprawdź czy user ma płatny plan w którejkolwiek organizacji którą założył
								const paidPlanCheck = await checkIfUserHasPaidPlan(user.uid)
								
								if (paidPlanCheck.hasPaidPlan) {
									// ✅ User ma płatny plan - pozwól mu się zalogować
									console.log('✅ User ma płatny plan - pozwalam na dostęp')
									
									// Ustaw specjalny profil "bez organizacji ale z planem"
									setUserProfile({
										...profile,
										hasNoOrganizations: true,
										canCreateOrganization: true,
										paidPlan: paidPlanCheck.plan,
										organizationId: null,
									})
									setPermissions({})
									setLoading(false)
									return
								}
								
								// ❌ User nie ma płatnego planu - wyloguj
								console.warn('❌ Użytkownik bez organizacji i bez płatnego planu - wylogowuję')
								alert('❌ Zostałeś usunięty ze wszystkich organizacji.\n\nSkontaktuj się z administratorem.')
								signOut(auth)
								setUserProfile(null)
								setPermissions(null)
								setLoading(false)
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
							// Profil nie istnieje - daj czas na utworzenie
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

		return unsubscribeAuth
	}, [])

	const value = {
		currentUser,
		userProfile,
		organizationId: userProfile?.organizationId,
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

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}