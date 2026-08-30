import mongoose from "mongoose";

// Define structure for User documents in database
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Must be unique
  passwordHash: { type: String, required: true }, // Encrypted password
  role: { type: String, enum: ["admin"], default: "admin" }, // Can only be admin
});

// Export User model (creates "users" collection)
export default mongoose.models.User || mongoose.model("User", userSchema);
