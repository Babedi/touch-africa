import {
  createLookup,
  getLookupById,
  updateLookupById,
  deleteLookupById,
  getAllLookups,
} from "./lookup.firestore.js";
import { newLookupId } from "./lookup.validation.js";

/**
 * Create a new lookup with metadata
 * @param {Object} lookupData - The lookup data
 * @param {string} actor - The user creating the lookup
 * @returns {Promise<Object>} - The created lookup with metadata
 */
export async function createLookupService(lookupData, actor) {
  const id = newLookupId();
  const now = new Date().toISOString();

  const lookupWithMetadata = {
    id,
    ...lookupData,
    created: {
      by: actor,
      when: now,
    },
    updated: {
      by: actor,
      when: now,
    },
    active: true,
  };

  await createLookup(lookupWithMetadata);
  return lookupWithMetadata;
}

/**
 * Get lookup by ID
 * @param {string} id - The lookup ID
 * @returns {Promise<Object|null>} - The lookup data or null
 */
export async function getLookupService(id) {
  return await getLookupById(id);
}

/**
 * Update lookup by ID
 * @param {string} id - The lookup ID
 * @param {Object} updateData - The data to update
 * @param {string} actor - The user updating the lookup
 * @returns {Promise<Object>} - The updated lookup
 */
export async function updateLookupService(id, updateData, actor) {
  const now = new Date().toISOString();

  const updateWithMetadata = {
    ...updateData,
    updated: {
      by: actor,
      when: now,
    },
  };

  await updateLookupById(id, updateWithMetadata);
  return await getLookupById(id);
}

/**
 * Delete lookup by ID
 * @param {string} id - The lookup ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteLookupService(id) {
  return await deleteLookupById(id);
}

/**
 * Get all lookups
 * @returns {Promise<Array>} - Array of all lookups
 */
export async function getAllLookupsService() {
  return await getAllLookups();
}
