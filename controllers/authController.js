import { login } from "../services/authService.js";

// Handle login requests
export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await login(email.trim(), password);
    if (!result) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
}
