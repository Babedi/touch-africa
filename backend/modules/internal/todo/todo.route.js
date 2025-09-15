/**
 * Todo Routes
 * Express route definitions for todo endpoints
 */

import express from "express";
import * as todoController from "./todo.controller.js";

const router = express.Router();

// Statistics endpoint (must come before /:id to avoid conflict)
router.get("/internal/todos/stats", todoController.getTodoStats);

// Bulk operations endpoints
router.patch("/internal/todos/bulk", todoController.bulkUpdateTodos);

// Filter endpoints
router.get("/internal/todos/completed", todoController.getCompletedTodos);
router.get("/internal/todos/pending", todoController.getPendingTodos);
router.get(
  "/internal/todos/priority/:priority",
  todoController.getTodosByPriority
);

// CRUD endpoints
router.post("/internal/todos", todoController.createTodo);
router.get("/internal/todos", todoController.getAllTodos);
router.get("/internal/todos/:id", todoController.getTodoById);
router.put("/internal/todos/:id", todoController.updateTodo);
router.patch("/internal/todos/:id/toggle", todoController.toggleTodoCompletion);
router.delete("/internal/todos/:id", todoController.deleteTodo);

export default router;
