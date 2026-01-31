const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ============================================
// USUŃ ORGANIZACJĘ (tylko właściciel)
// ============================================
exports.deleteOrganization = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Musisz być zalogowany");
  }

  const { organizationId, confirmName } = data;
  const userId = context.auth.uid;

  if (!organizationId) {
    throw new functions.https.HttpsError("invalid-argument", "Brak ID organizacji");
  }

  try {
    const orgRef = db.collection("organizations").doc(organizationId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Organizacja nie istnieje");
    }

    const orgData = orgDoc.data();

    if (orgData.ownerId !== userId) {
      throw new functions.https.HttpsError("permission-denied", "Tylko właściciel może usunąć organizację");
    }

    if (confirmName !== orgData.name) {
      throw new functions.https.HttpsError("invalid-argument", "Nazwa organizacji nie zgadza się");
    }

    const usersSnap = await db.collection("users").get();
    const batch = db.batch();
    let membersCount = 0;

    usersSnap.forEach((userDoc) => {
      const userData = userDoc.data();
      const userOrgs = userData.organizations || [];
      const hasOrg = userOrgs.some((org) => org.id === organizationId);

      if (hasOrg) {
        membersCount++;
        const updatedOrgs = userOrgs.filter((org) => org.id !== organizationId);
        let newCurrentOrgId = userData.currentOrganizationId;
        if (newCurrentOrgId === organizationId) {
          newCurrentOrgId = updatedOrgs.length > 0 ? updatedOrgs[0].id : null;
        }
        batch.update(userDoc.ref, {
          organizations: updatedOrgs,
          currentOrganizationId: newCurrentOrgId,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    const inviteCodesSnap = await db.collection("inviteCodes")
      .where("organizationId", "==", organizationId).get();
    inviteCodesSnap.forEach((doc) => batch.delete(doc.ref));

    batch.delete(orgRef);
    await batch.commit();

    return {
      success: true,
      message: `Organizacja "${orgData.name}" została usunięta`,
      membersRemoved: membersCount - 1,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Błąd: " + error.message);
  }
});

// ============================================
// OPUŚĆ ORGANIZACJĘ (dla członków)
// ============================================
exports.leaveOrganization = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Musisz być zalogowany");
  }

  const { organizationId } = data;
  const userId = context.auth.uid;

  if (!organizationId) {
    throw new functions.https.HttpsError("invalid-argument", "Brak ID organizacji");
  }

  try {
    const orgRef = db.collection("organizations").doc(organizationId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Organizacja nie istnieje");
    }

    const orgData = orgDoc.data();

    if (orgData.ownerId === userId) {
      throw new functions.https.HttpsError("permission-denied", "Właściciel nie może opuścić własnej organizacji");
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Profil nie istnieje");
    }

    const userData = userDoc.data();
    const userOrgs = userData.organizations || [];

    if (!userOrgs.some((org) => org.id === organizationId)) {
      throw new functions.https.HttpsError("not-found", "Nie należysz do tej organizacji");
    }

    const updatedOrgs = userOrgs.filter((org) => org.id !== organizationId);
    let newCurrentOrgId = userData.currentOrganizationId;
    if (newCurrentOrgId === organizationId) {
      newCurrentOrgId = updatedOrgs.length > 0 ? updatedOrgs[0].id : null;
    }

    await userRef.update({
      organizations: updatedOrgs,
      currentOrganizationId: newCurrentOrgId,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: `Opuściłeś organizację "${orgData.name}"` };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Błąd: " + error.message);
  }
});

// ============================================
// USUŃ CZŁONKA Z ORGANIZACJI (NOWA FUNKCJA)
// ============================================
exports.removeMemberFromOrganization = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Musisz być zalogowany");
  }

  const { memberId, organizationId } = data;
  const callerId = context.auth.uid;

  if (!memberId || !organizationId) {
    throw new functions.https.HttpsError("invalid-argument", "Brak wymaganych danych");
  }

  if (memberId === callerId) {
    throw new functions.https.HttpsError("invalid-argument", "Nie możesz usunąć siebie");
  }

  try {
    // Sprawdź czy caller ma uprawnienia
    const callerDoc = await db.collection("users").doc(callerId).get();
    if (!callerDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Użytkownik nie istnieje");
    }

    const callerData = callerDoc.data();
    const callerOrg = callerData.organizations?.find((org) => org.id === organizationId);

    if (!callerOrg) {
      throw new functions.https.HttpsError("permission-denied", "Nie należysz do tej organizacji");
    }

    // Sprawdź czy jest właścicielem lub ma uprawnienia
    const orgDoc = await db.collection("organizations").doc(organizationId).get();
    const isOwner = orgDoc.exists && orgDoc.data().ownerId === callerId;
    const canManage = callerOrg.permissions?.canManageTeam === true;

    if (!isOwner && !canManage) {
      throw new functions.https.HttpsError("permission-denied", "Brak uprawnień do zarządzania zespołem");
    }

    // Pobierz dane członka do usunięcia
    const memberDoc = await db.collection("users").doc(memberId).get();
    if (!memberDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Członek nie istnieje");
    }

    const memberData = memberDoc.data();

    // Nie można usunąć właściciela organizacji
    if (orgDoc.exists && orgDoc.data().ownerId === memberId) {
      throw new functions.https.HttpsError("permission-denied", "Nie można usunąć właściciela organizacji");
    }

    // Usuń organizację z profilu członka
    const updatedOrgs = (memberData.organizations || []).filter(
      (org) => org.id !== organizationId
    );

    const updateData = {
      organizations: updatedOrgs,
      updatedAt: new Date().toISOString(),
    };

    if (memberData.currentOrganizationId === organizationId) {
      updateData.currentOrganizationId = updatedOrgs.length > 0 ? updatedOrgs[0].id : null;
    }

    await db.collection("users").doc(memberId).update(updateData);

    return {
      success: true,
      message: "Członek został usunięty z organizacji",
    };
  } catch (error) {
    console.error("Błąd usuwania członka:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Nie udało się usunąć członka");
  }
});