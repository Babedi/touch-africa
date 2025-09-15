/**
 * Todo Service
 * Business logic layer for todo operations
 */

import * as todoFirestore from "./todo.firestore.js";
import {
  newTodoId,
  TodoCreateSchema,
  TodoUpdateSchema,
  TodoToggleSchema,
  TodoFilterSchema,
} from "./todo.validation.js";

/**
 * Create a new todo
 * @param {Object} todoData - Todo data to create
 * @returns {Promise<Object>} Created todo
 */
export async function createTodo(todoData) {
  try {
    // Validate input data
    const validatedData = TodoCreateSchema.parse(todoData);

    // Generate unique todo ID
    const todoId = newTodoId();

    // Create todo in Firestore
    const createdTodo = await todoFirestore.createTodo(validatedData, todoId);

    return {
      success: true,
      data: createdTodo,
      message: "Todo created successfully",
    };
  } catch (error) {
    console.error("Error in createTodo service:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: "Validation error",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || "Failed to create todo",
    };
  }
}

/**
 * Get a todo by ID
 * @param {string} todoId - Todo ID to retrieve
 * @returns {Promise<Object>} Todo data or error
 */
export async function getTodoById(todoId) {
  try {
    if (!todoId) {
      throw new Error("Todo ID is required");
    }

    const todo = await todoFirestore.getTodoById(todoId);

    if (!todo) {
      return {
        success: false,
        error: "Todo not found",
      };
    }

    return {
      success: true,
      data: todo,
    };
  } catch (error) {
    console.error("Error in getTodoById service:", error);
    return {
      success: false,
      error: error.message || "Failed to get todo",
    };
  }
}

/**
 * Get all todos with optional filtering
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Array of todos or error
 */
export async function getAllTodos(filters = {}) {
  try {
    // Validate filter parameters
    const validatedFilters = TodoFilterSchema.parse(filters);

    const todos = await todoFirestore.getAllTodos(validatedFilters);

    return {
      success: true,
      data: todos,
      count: todos.length,
    };
  } catch (error) {
    console.error("Error in getAllTodos service:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: "Invalid filter parameters",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || "Failed to get todos",
    };
  }
}

/**
 * Update a todo
 * @param {string} todoId - Todo ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated todo or error
 */
export async function updateTodo(todoId, updateData) {
  try {
    if (!todoId) {
      throw new Error("Todo ID is required");
    }

    // Validate update data
    const validatedData = TodoUpdateSchema.parse(updateData);

    const updatedTodo = await todoFirestore.updateTodo(todoId, validatedData);

    return {
      success: true,
      data: updatedTodo,
      message: "Todo updated successfully",
    };
  } catch (error) {
    console.error("Error in updateTodo service:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: "Validation error",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || "Failed to update todo",
    };
  }
}

/**
 * Toggle todo completion status
 * @param {string} todoId - Todo ID to toggle
 * @returns {Promise<Object>} Updated todo or error
 */
export async function toggleTodoCompletion(todoId) {
  try {
    if (!todoId) {
      throw new Error("Todo ID is required");
    }

    const updatedTodo = await todoFirestore.toggleTodoCompletion(todoId);

    return {
      success: true,
      data: updatedTodo,
      message: "Todo completion status toggled successfully",
    };
  } catch (error) {
    console.error("Error in toggleTodoCompletion service:", error);
    return {
      success: false,
      error: error.message || "Failed to toggle todo completion",
    };
  }
}

/**
 * Delete a todo
 * @param {string} todoId - Todo ID to delete
 * @returns {Promise<Object>} Success status or error
 */
export async function deleteTodo(todoId) {
  try {
    if (!todoId) {
      throw new Error("Todo ID is required");
    }

    await todoFirestore.deleteTodo(todoId);

    return {
      success: true,
      message: "Todo deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteTodo service:", error);
    return {
      success: false,
      error: error.message || "Failed to delete todo",
    };
  }
}

/**
 * Get todo statistics
 * @returns {Promise<Object>} Statistics or error
 */
export async function getTodoStats() {
  try {
    const stats = await todoFirestore.getTodoStats();

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error in getTodoStats service:", error);
    return {
      success: false,
      error: error.message || "Failed to get todo stats",
    };
  }
}

/**
 * Bulk update todos (e.g., mark multiple as completed)
 * @param {Array} todoIds - Array of todo IDs
 * @param {Object} updateData - Data to apply to all todos
 * @returns {Promise<Object>} Result of bulk update
 */
export async function bulkUpdateTodos(todoIds, updateData) {
  try {
    if (!Array.isArray(todoIds) || todoIds.length === 0) {
      throw new Error("Todo IDs array is required");
    }

    // Validate update data
    const validatedData = TodoUpdateSchema.parse(updateData);

    const results = await Promise.allSettled(
      todoIds.map((todoId) => todoFirestore.updateTodo(todoId, validatedData))
    );

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );
    const failed = results.filter((result) => result.status === "rejected");

    return {
      success: true,
      data: {
        successful: successful.length,
        failed: failed.length,
        total: todoIds.length,
        updatedTodos: successful.map((result) => result.value),
        errors: failed.map(
          (result) => result.reason?.message || "Unknown error"
        ),
      },
      message: `Bulk update completed: ${successful.length}/${todoIds.length} todos updated`,
    };
  } catch (error) {
    console.error("Error in bulkUpdateTodos service:", error);

    if (error.name === "ZodError") {
      return {
        success: false,
        error: "Validation error",
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || "Failed to bulk update todos",
    };
  }
}
