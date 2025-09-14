import { db } from "../../../services/firestore.client.js";
import crypto from "crypto";

const serviceId = "southAfrica";

/**
 * Get reference to people collection
 * @returns {FirebaseFirestore.CollectionReference}
 */
function peopleCol() {
  return db.collection(`touchAfrica/${serviceId}/people`);
}

/**
 * Get reference to person counters document
 * @returns {FirebaseFirestore.DocumentReference}
 */
function countersDoc() {
  return db.doc(`touchAfrica/${serviceId}/counters/person`);
}

/**
 * Generate next person sequence number
 * @returns {Promise<number>} Next sequence number
 */
async function nextPersonSequence() {
  const ref = countersDoc();
  let next;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current =
      snap.exists && typeof snap.data().sequence === "number"
        ? snap.data().sequence
        : 0;
    next = current + 1;
    tx.set(ref, { sequence: next }, { merge: true });
  });
  return next;
}

/**
 * Create a new person record
 * @param {Object} model - Person data model
 * @returns {Promise<Object>} Created person with ID
 */
export async function createPerson(model) {
  try {
    // Check for duplicate SA ID number if provided
    if (model.idNumber) {
      const duplicateQuery = await peopleCol()
        .where("idNumber", "==", model.idNumber)
        .limit(1)
        .get();

      if (!duplicateQuery.empty) {
        const error = new Error(
          `Person with SA ID number ${model.idNumber} already exists`
        );
        error.code = "DUPLICATE_PERSON";
        error.status = 409;
        error.details = { field: "idNumber", value: model.idNumber };
        throw error;
      }
    }

    // Passport number removed

    // Generate personId if not provided
    if (!model.personId) {
      model.personId = crypto.randomUUID();
    }

    // Set audit timestamps
    const now = new Date().toISOString();
    model.audit = {
      ...model.audit,
      createdAt: now,
      updatedAt: now,
      recordVersion: 1,
    };

    // Create document with generated ID
    const docRef = peopleCol().doc(model.id);
    await docRef.set(model, { merge: true });

    console.log(`✅ Person created: ${model.id}`);
    return model;
  } catch (error) {
    console.error(`❌ Failed to create person:`, error);
    throw error;
  }
}

/**
 * Get person by ID
 * @param {string} id - Person ID
 * @returns {Promise<Object|null>} Person data or null if not found
 */
export async function getPersonById(id) {
  try {
    const doc = await peopleCol().doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return { id: doc.id, ...data };
  } catch (error) {
    console.error(`❌ Failed to get person ${id}:`, error);
    throw error;
  }
}

/**
 * Update person by ID
 * @param {string} id - Person ID
 * @param {Object} data - Updated person data
 * @returns {Promise<Object>} Updated person data
 */
export async function updatePersonById(id, data) {
  try {
    const docRef = peopleCol().doc(id);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Person with ID ${id} not found`);
    }

    // Check for duplicate SA ID number if being updated
    if (data.idNumber) {
      const duplicateQuery = await peopleCol()
        .where("idNumber", "==", data.idNumber)
        .limit(2) // Get up to 2 to check if any other than current
        .get();

      const duplicates = duplicateQuery.docs.filter((doc) => doc.id !== id);
      if (duplicates.length > 0) {
        const error = new Error(
          `Person with SA ID number ${data.idNumber} already exists`
        );
        error.code = "DUPLICATE_PERSON";
        error.status = 409;
        error.details = { field: "idNumber", value: data.idNumber };
        throw error;
      }
    }

    // Passport number removed

    // Update audit information
    const existingData = doc.data();
    const currentVersion = existingData.audit?.recordVersion || 1;

    data.audit = {
      ...existingData.audit,
      ...data.audit,
      updatedAt: new Date().toISOString(),
      recordVersion: currentVersion + 1,
    };

    // Update document
    await docRef.update(data);

    // Return updated document
    const updatedDoc = await docRef.get();
    const result = { id: updatedDoc.id, ...updatedDoc.data() };

    console.log(`✅ Person updated: ${id}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to update person ${id}:`, error);
    throw error;
  }
}

/**
 * Delete person by ID
 * @param {string} id - Person ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deletePersonById(id) {
  try {
    const docRef = peopleCol().doc(id);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Person with ID ${id} not found`);
    }

    // Delete the document
    await docRef.delete();

    console.log(`✅ Person deleted: ${id}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete person ${id}:`, error);
    throw error;
  }
}

/**
 * Get all persons with pagination
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results (default: 100)
 * @param {string} options.startAfter - Document ID to start after (for pagination)
 * @param {string} options.orderBy - Field to order by (default: created_at)
 * @param {string} options.orderDirection - Order direction: 'asc' or 'desc' (default: 'desc')
 * @returns {Promise<Object>} Object with persons array and pagination info
 */
export async function getAllPersons(options = {}) {
  try {
    const {
      limit = 100,
      startAfter = null,
      orderBy = "audit.createdAt",
      orderDirection = "desc",
    } = options;

    let query = peopleCol().orderBy(orderBy, orderDirection).limit(limit);

    // Add pagination if startAfter provided
    if (startAfter) {
      const startAfterDoc = await peopleCol().doc(startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    const persons = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get total count (expensive operation, use carefully)
    const totalSnapshot = await peopleCol().get();
    const total = totalSnapshot.size;

    const result = {
      persons,
      pagination: {
        total,
        count: persons.length,
        hasMore: persons.length === limit,
        lastId: persons.length > 0 ? persons[persons.length - 1].id : null,
      },
    };

    console.log(`✅ Retrieved ${persons.length} persons (total: ${total})`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to get all persons:`, error);
    throw error;
  }
}

/**
 * Search persons by various criteria
 * @param {Object} criteria - Search criteria
 * @param {string} criteria.idNumber - SA ID number
 * @param {string} criteria.passportNumber - [removed]
 * @param {string} criteria.email - Email address
 * @param {string} criteria.mobile - Mobile phone number
 * @returns {Promise<Array>} Array of matching persons
 */
export async function searchPersons(criteria) {
  try {
    const results = [];

    // Search by SA ID number
    if (criteria.idNumber) {
      const snapshot = await peopleCol()
        .where("idNumber", "==", criteria.idNumber)
        .get();

      snapshot.docs.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
    }

    // passportNumber search removed

    // Search by email (in contact.email field)
    if (criteria.email) {
      const snapshot = await peopleCol()
        .where("contact.email", "==", criteria.email)
        .get();

      snapshot.docs.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
    }

    // Search by mobile (in contact.mobile field)
    if (criteria.mobile) {
      const snapshot = await peopleCol()
        .where("contact.mobile", "==", criteria.mobile)
        .get();

      snapshot.docs.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
    }

    // Remove duplicates based on ID
    const uniqueResults = results.filter(
      (person, index, self) =>
        index === self.findIndex((p) => p.id === person.id)
    );

    console.log(`✅ Found ${uniqueResults.length} persons matching criteria`);
    return uniqueResults;
  } catch (error) {
    console.error(`❌ Failed to search persons:`, error);
    throw error;
  }
}
