import express from "express";
import { loginController } from "../controllers/authController.js";

// Create router for authentication routes
const router = express.Router();

// POST /api/v1/auth/login - Login endpoint
router.post("/login", loginController);

export default router;
