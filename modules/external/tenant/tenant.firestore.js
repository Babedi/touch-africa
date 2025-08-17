import { db } from "../../../services/firestore.client.js";

const serviceId = "neighbourGuardService";

function tenantsCol() {
  return db.collection(`services/${serviceId}/tenants`);
}

function countersDoc() {
  return db.doc(`services/${serviceId}/counters/tenant`);
}

async function nextUssdRefId() {
  const ref = countersDoc();
  let next;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current =
      snap.exists && typeof snap.data().ussdRefId === "number"
        ? snap.data().ussdRefId
        : 0;
    next = current + 1;
    tx.set(ref, { ussdRefId: next }, { merge: true });
  });
  return next;
}

export async function createTenant(model) {
  // Enforce unique activationResponseBlockName
  const dup = await tenantsCol()
    .where(
      "activationResponseBlockName",
      "==",
      model.activationResponseBlockName
    )
    .limit(1)
    .get();
  if (!dup.empty) {
    const err = new Error("activationResponseBlockName must be unique");
    err.status = 400;
    throw err;
  }

  // Assign ussdRefId server-side
  const idToUse = model.id;
  const ussdRefId = await nextUssdRefId();
  const payload = { ...model, ussdRefId };
  await tenantsCol().doc(idToUse).set(payload, { merge: true });
  return payload;
}

export async function getTenantById(id) {
  const snap = await tenantsCol().doc(id).get();
  return snap.exists ? snap.data() : null;
}

export async function updateTenantById(id, data) {
  if (data.activationResponseBlockName) {
    const dup = await tenantsCol()
      .where(
        "activationResponseBlockName",
        "==",
        data.activationResponseBlockName
      )
      .limit(1)
      .get();
    const conflict = !dup.empty && dup.docs[0].id !== id;
    if (conflict) {
      const err = new Error("activationResponseBlockName must be unique");
      err.status = 400;
      throw err;
    }
  }
  await tenantsCol().doc(id).set(data, { merge: true });
}

export async function deleteTenantById(id) {
  await tenantsCol().doc(id).delete();
}

export async function listTenants() {
  const col = await tenantsCol().get();
  return col.docs.map((d) => d.data());
}
