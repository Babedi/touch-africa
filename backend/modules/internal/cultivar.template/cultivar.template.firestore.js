import { db } from "../../../services/firestore.client.js";

const COLLECTION_PATH = "touchAfrica";
const DOCUMENT_PATH = "templates";

/**
 * Create a new cultivar template
 * @param {Object} model - The cultivar template data
 * @returns {Promise<Object>} Created template
 */
export const createCultivarTemplate = async (model) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${DOCUMENT_PATH}`);
    const doc = await docRef.get();

    let existingData = {};
    if (doc.exists) {
      existingData = doc.data();
    }

    // Add the new template to the existing data
    const updatedData = {
      ...existingData,
      [model.id]: model,
    };

    await docRef.set(updatedData, { merge: true });
    return model;
  } catch (error) {
    console.error("Error creating cultivar template:", error);
    throw new Error(`Failed to create cultivar template: ${error.message}`);
  }
};

/**
 * Get cultivar template by ID
 * @param {string} id - Template ID
 * @returns {Promise<Object|null>} Template data or null
 */
export const getCultivarTemplateById = async (id) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${DOCUMENT_PATH}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return data[id] || null;
  } catch (error) {
    console.error("Error getting cultivar template:", error);
    throw new Error(`Failed to get cultivar template: ${error.message}`);
  }
};

/**
 * Update cultivar template by ID
 * @param {string} id - Template ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated template
 */
export const updateCultivarTemplateById = async (id, updateData) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${DOCUMENT_PATH}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Templates document not found");
    }

    const data = doc.data();
    if (!data[id]) {
      throw new Error("Template not found");
    }

    // Merge the update data with existing template
    const updatedTemplate = {
      ...data[id],
      ...updateData,
    };

    const updatedData = {
      ...data,
      [id]: updatedTemplate,
    };

    await docRef.set(updatedData, { merge: true });
    return updatedTemplate;
  } catch (error) {
    console.error("Error updating cultivar template:", error);
    throw new Error(`Failed to update cultivar template: ${error.message}`);
  }
};

/**
 * Delete cultivar template by ID
 * @param {string} id - Template ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteCultivarTemplateById = async (id) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${DOCUMENT_PATH}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Templates document not found");
    }

    const data = doc.data();
    if (!data[id]) {
      throw new Error("Template not found");
    }

    // Remove the template from the data
    const { [id]: removed, ...remainingData } = data;

    await docRef.set(remainingData, { merge: false });
    return true;
  } catch (error) {
    console.error("Error deleting cultivar template:", error);
    throw new Error(`Failed to delete cultivar template: ${error.message}`);
  }
};

/**
 * Get all cultivar templates
 * @returns {Promise<Array>} Array of all templates
 */
export const getAllCultivarTemplates = async () => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${DOCUMENT_PATH}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return [];
    }

    const data = doc.data();
    return Object.values(data);
  } catch (error) {
    console.error("Error getting all cultivar templates:", error);
    throw new Error(`Failed to get cultivar templates: ${error.message}`);
  }
};
