/**
 * Todo Firestore Operations
 * Handles CRUD operations for todos in Firestore
 */

import { db } from "../../../services/firestore.client.js";

export const COLLECTION_PATH = "touchAfrica/southAfrica/todos";

/**
 * Create a new todo in Firestore
 * @param {Object} todoData - Todo data to store
 * @param {string} customId - Optional custom document ID to use
 * @returns {Promise<Object>} Created todo data
 */
export async function createTodo(todoData, customId = null) {
  try {
    const documentId = customId || todoData.id || todoData.todoId;
    if (!documentId) {
      throw new Error("No document ID provided for todo");
    }

    const now = new Date();
    const todoWithTimestamps = {
      ...todoData,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = db.doc(`${COLLECTION_PATH}/${documentId}`);
    await docRef.set(todoWithTimestamps, { merge: true });

    return { ...todoWithTimestamps, todoId: documentId };
  } catch (error) {
    console.error("Error creating todo:", error);
    throw new Error(`Failed to create todo: ${error.message}`);
  }
}

/**
 * Get a todo by ID from Firestore
 * @param {string} todoId - Todo ID to retrieve
 * @returns {Promise<Object|null>} Todo data or null if not found
 */
export async function getTodoById(todoId) {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${todoId}`);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      return {
        todoId: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting todo:", error);
    throw new Error(`Failed to get todo: ${error.message}`);
  }
}

/**
 * Get all todos from Firestore with optional filtering
 * @param {Object} filters - Filtering options
 * @returns {Promise<Array>} Array of todo data
 */
export async function getAllTodos(filters = {}) {
  try {
    let query = db.collection(COLLECTION_PATH);

    // Apply filters
    if (filters.completed !== undefined) {
      query = query.where("completed", "==", filters.completed);
    }

    if (filters.priority) {
      query = query.where("priority", "==", filters.priority);
    }

    // Apply search filter (simple title contains search)
    if (filters.search) {
      // Note: Firestore doesn't support full-text search, so we'll filter client-side
      // In production, consider using Algolia or similar for better search
    }

    // Order by creation date (newest first)
    query = query.orderBy("createdAt", "desc");

    // Apply limit
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    let todos = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        todoId: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      };
    });

    // Apply client-side search filter if needed
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      todos = todos.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchTerm) ||
          todo.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply offset after search filtering
    if (filters.offset && filters.offset > 0) {
      todos = todos.slice(filters.offset);
    }

    return todos;
  } catch (error) {
    console.error("Error getting todos:", error);
    throw new Error(`Failed to get todos: ${error.message}`);
  }
}

/**
 * Update a todo in Firestore
 * @param {string} todoId - Todo ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated todo data
 */
export async function updateTodo(todoId, updateData) {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${todoId}`);

    // Check if todo exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Todo not found");
    }

    const updatedData = {
      ...updateData,
      updatedAt: new Date(),
    };

    await docRef.update(updatedData);

    // Return the updated todo
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data();

    return {
      todoId: updatedDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    };
  } catch (error) {
    console.error("Error updating todo:", error);
    throw new Error(`Failed to update todo: ${error.message}`);
  }
}

/**
 * Toggle todo completion status
 * @param {string} todoId - Todo ID to toggle
 * @returns {Promise<Object>} Updated todo data
 */
export async function toggleTodoCompletion(todoId) {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${todoId}`);

    // Check if todo exists and get current status
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Todo not found");
    }

    const currentData = doc.data();
    const newCompletedStatus = !currentData.completed;

    const updatedData = {
      completed: newCompletedStatus,
      updatedAt: new Date(),
    };

    await docRef.update(updatedData);

    // Return the updated todo
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data();

    return {
      todoId: updatedDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    };
  } catch (error) {
    console.error("Error toggling todo completion:", error);
    throw new Error(`Failed to toggle todo completion: ${error.message}`);
  }
}

/**
 * Delete a todo from Firestore
 * @param {string} todoId - Todo ID to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTodo(todoId) {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${todoId}`);

    // Check if todo exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Todo not found");
    }

    await docRef.delete();
    return true;
  } catch (error) {
    console.error("Error deleting todo:", error);
    throw new Error(`Failed to delete todo: ${error.message}`);
  }
}

/**
 * Get todo statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function getTodoStats() {
  try {
    const snapshot = await db.collection(COLLECTION_PATH).get();

    let total = 0;
    let completed = 0;
    let byPriority = { low: 0, medium: 0, high: 0 };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      total++;

      if (data.completed) {
        completed++;
      }

      if (data.priority && byPriority.hasOwnProperty(data.priority)) {
        byPriority[data.priority]++;
      }
    });

    return {
      total,
      completed,
      pending: total - completed,
      byPriority,
    };
  } catch (error) {
    console.error("Error getting todo stats:", error);
    throw new Error(`Failed to get todo stats: ${error.message}`);
  }
}
