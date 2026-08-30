// Import packages we need
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isMongoAvailable } from "../config/db.js";

const memoryUsers = [];

async function ensureMemoryAdmin() {
  if (memoryUsers.length > 0) return memoryUsers[0];

  const hash = await bcrypt.hash("Admin123!", 10);
  const admin = {
    email: "admin@metrosync.com",
    passwordHash: hash,
    role: "admin",
    _id: { toString: () => "memory-admin-id" },
  };
  memoryUsers.push(admin);
  return admin;
}

// Create default admin user if it doesn't exist
export async function ensureAdminSeed() {
  if (!isMongoAvailable()) {
    await ensureMemoryAdmin();
    console.log("Seeded default admin in memory: admin@metrosync.com / Admin123!");
    return;
  }

  const adminEmail = "admin@metrosync.com";

  // Check if admin already exists
  const existing = await User.findOne({ email: adminEmail });
  if (existing) return; // Admin exists, do nothing

  // Hash (encrypt) the password for security
  const hash = await bcrypt.hash("Admin123!", 10);

  // Create new admin user in database
  await User.create({
    email: adminEmail,
    passwordHash: hash,
    role: "admin",
  });

  console.log("Seeded default admin: admin@metrosync.com / Admin123!");
}

// Login function - check if email and password are correct
export async function login(email, password) {
  if (!isMongoAvailable()) {
    const user = await ensureMemoryAdmin();
    if (user.email.toLowerCase() !== email.toLowerCase()) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    const payload = { userId: user._id.toString(), role: user.role };
    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign(payload, secret, { expiresIn: "2h" });
    return { token, role: user.role, email: user.email };
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) return null; // User not found

  // Compare provided password with hashed password in database
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null; // Wrong password

  // Create JWT token with user info
  const payload = { userId: user._id.toString(), role: user.role };
  const secret = process.env.JWT_SECRET || "dev-secret";
  const token = jwt.sign(payload, secret, { expiresIn: "2h" });

  // Return token and user info
  return { token, role: user.role, email: user.email };
}
