const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ============================================
// USUŃ ORGANIZACJĘ (tylko właściciel)
// ============================================
exports.deleteOrganization = onCall(async (request) => {
  // Sprawdź czy user jest zalogowany
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Musisz być zalogowany"
    );
  }

  const { organizationId, confirmName } = request.data;
  const userId = request.auth.uid;

  if (!organizationId) {
    throw new HttpsError(
      "invalid-argument",
      "Brak ID organizacji"
    );
  }

  try {
    // 1. Pobierz organizację i sprawdź czy user jest właścicielem
    const orgRef = db.collection("organizations").doc(organizationId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new HttpsError(
        "not-found",
        "Organizacja nie istnieje"
      );
    }

    const orgData = orgDoc.data();

    // Sprawdź czy user jest właścicielem (ownerId)
    if (orgData.ownerId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Tylko właściciel może usunąć organizację"
      );
    }

    // Sprawdź potwierdzenie nazwy
    if (confirmName !== orgData.name) {
      throw new HttpsError(
        "invalid-argument",
        "Nazwa organizacji nie zgadza się"
      );
    }

    // 2. Znajdź wszystkich użytkowników z tą organizacją
    const usersRef = db.collection("users");
    const usersSnap = await usersRef.get();

    const batch = db.batch();
    let membersCount = 0;

    usersSnap.forEach((userDoc) => {
      const userData = userDoc.data();
      const userOrgs = userData.organizations || [];

      // Sprawdź czy user ma tę organizację
      const hasOrg = userOrgs.some((org) => org.id === organizationId);

      if (hasOrg) {
        membersCount++;

        // Usuń organizację z profilu użytkownika
        const updatedOrgs = userOrgs.filter((org) => org.id !== organizationId);

        // Jeśli to była aktualna organizacja - przełącz
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

    // 3. Usuń kody zaproszeń powiązane z organizacją
    const inviteCodesRef = db.collection("inviteCodes");
    const inviteCodesSnap = await inviteCodesRef
      .where("organizationId", "==", organizationId)
      .get();

    inviteCodesSnap.forEach((inviteDoc) => {
      batch.delete(inviteDoc.ref);
    });

    // 4. Usuń dokument organizacji
    batch.delete(orgRef);

    // Wykonaj wszystkie operacje
    await batch.commit();

    return {
      success: true,
      message: `Organizacja "${orgData.name}" została usunięta`,
      membersRemoved: membersCount - 1,
    };
  } catch (error) {
    console.error("Błąd usuwania organizacji:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Błąd usuwania organizacji: " + error.message
    );
  }
});

// ============================================
// OPUŚĆ ORGANIZACJĘ (dla członków)
// ============================================
exports.leaveOrganization = onCall(async (request) => {
  // Sprawdź czy user jest zalogowany
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Musisz być zalogowany"
    );
  }

  const { organizationId } = request.data;
  const userId = request.auth.uid;

  if (!organizationId) {
    throw new HttpsError(
      "invalid-argument",
      "Brak ID organizacji"
    );
  }

  try {
    // 1. Pobierz organizację
    const orgRef = db.collection("organizations").doc(organizationId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new HttpsError(
        "not-found",
        "Organizacja nie istnieje"
      );
    }

    const orgData = orgDoc.data();

    // Nie pozwól właścicielowi opuścić własnej organizacji
    if (orgData.ownerId === userId) {
      throw new HttpsError(
        "permission-denied",
        "Właściciel nie może opuścić własnej organizacji. Użyj opcji 'Usuń zespół'."
      );
    }

    // 2. Pobierz profil użytkownika
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpsError(
        "not-found",
        "Profil użytkownika nie istnieje"
      );
    }

    const userData = userDoc.data();
    const userOrgs = userData.organizations || [];

    // Sprawdź czy user jest w tej organizacji
    const hasOrg = userOrgs.some((org) => org.id === organizationId);

    if (!hasOrg) {
      throw new HttpsError(
        "not-found",
        "Nie należysz do tej organizacji"
      );
    }

    // 3. Usuń organizację z profilu
    const updatedOrgs = userOrgs.filter((org) => org.id !== organizationId);

    // Jeśli to była aktualna organizacja - przełącz
    let newCurrentOrgId = userData.currentOrganizationId;
    if (newCurrentOrgId === organizationId) {
      newCurrentOrgId = updatedOrgs.length > 0 ? updatedOrgs[0].id : null;
    }

    await userRef.update({
      organizations: updatedOrgs,
      currentOrganizationId: newCurrentOrgId,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Opuściłeś organizację "${orgData.name}"`,
    };
  } catch (error) {
    console.error("Błąd opuszczania organizacji:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Błąd opuszczania organizacji: " + error.message
    );
  }
});