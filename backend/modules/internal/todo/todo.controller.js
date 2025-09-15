/**
 * Todo Controller
 * HTTP request handlers for todo endpoints
 */

import * as todoService from "./todo.service.js";

/**
 * Create a new todo
 * POST /api/todos
 */
export async function createTodo(req, res) {
  try {
    const result = await todoService.createTodo(req.body);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in createTodo controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Get a todo by ID
 * GET /api/todos/:id
 */
export async function getTodoById(req, res) {
  try {
    const { id } = req.params;
    const result = await todoService.getTodoById(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      const statusCode = result.error === "Todo not found" ? 404 : 400;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error("Error in getTodoById controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Get all todos with optional filtering
 * GET /api/todos
 */
export async function getAllTodos(req, res) {
  try {
    const filters = {
      completed: req.query.completed
        ? req.query.completed === "true"
        : undefined,
      priority: req.query.priority,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      orderBy: req.query.orderBy,
      orderDirection: req.query.orderDirection,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await todoService.getAllTodos(filters);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in getAllTodos controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Update a todo
 * PUT /api/todos/:id
 */
export async function updateTodo(req, res) {
  try {
    const { id } = req.params;
    const result = await todoService.updateTodo(id, req.body);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in updateTodo controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Toggle todo completion status
 * PATCH /api/todos/:id/toggle
 */
export async function toggleTodoCompletion(req, res) {
  try {
    const { id } = req.params;
    const result = await todoService.toggleTodoCompletion(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in toggleTodoCompletion controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Delete a todo
 * DELETE /api/todos/:id
 */
export async function deleteTodo(req, res) {
  try {
    const { id } = req.params;
    const result = await todoService.deleteTodo(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in deleteTodo controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Get todo statistics
 * GET /api/todos/stats
 */
export async function getTodoStats(req, res) {
  try {
    const result = await todoService.getTodoStats();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in getTodoStats controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Bulk update todos
 * PATCH /api/todos/bulk
 */
export async function bulkUpdateTodos(req, res) {
  try {
    const { todoIds, updateData } = req.body;

    if (!todoIds || !updateData) {
      return res.status(400).json({
        success: false,
        error: "Todo IDs and update data are required",
      });
    }

    const result = await todoService.bulkUpdateTodos(todoIds, updateData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in bulkUpdateTodos controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Get todos by priority
 * GET /api/todos/priority/:priority
 */
export async function getTodosByPriority(req, res) {
  try {
    const { priority } = req.params;
    const result = await todoService.getAllTodos({ priority });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in getTodosByPriority controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Get completed todos
 * GET /api/todos/completed
 */
export async function getCompletedTodos(req, res) {
  try {
    const result = await todoService.getAllTodos({ completed: true });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in getCompletedTodos controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

/**
 * Get pending todos
 * GET /api/todos/pending
 */
export async function getPendingTodos(req, res) {
  try {
    const result = await todoService.getAllTodos({ completed: false });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in getPendingTodos controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
