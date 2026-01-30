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