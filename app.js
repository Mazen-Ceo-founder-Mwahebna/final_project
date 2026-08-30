// Import packages we need
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { rateLimit } from "express-rate-limit";
import { fileURLToPath } from "url";
import announcementRoutes from "./routes/announcementRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import stationRoutes from "./routes/stationRoutes.js";

// Get current file and directory paths (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express application
const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 250,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "ws:", "wss:"],
        imgSrc: ["'self'", "data:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

app.use(compression());

// Allow requests from configured websites (CORS)
app.use(cors({ origin: allowedOrigins }));

// Parse incoming JSON data in request bodies
app.use(express.json({ limit: "64kb" }));

// Serve static files (HTML, CSS, JS) from public folder
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", apiLimiter);
app.use("/api/v1/auth/login", loginLimiter);

// Set up authentication routes (login, etc.)
app.use("/api/v1/auth", authRoutes);

// Set up announcement feed routes
app.use("/api/v1/announcements", announcementRoutes);

// Set up station routes (get stations, announcements, etc.)
app.use("/api/v1/stations", stationRoutes);

// Health check endpoint to test if server is running
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// API 404 response
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Error handler - catches any errors and sends response
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message:
      statusCode === 500 ? "Internal server error" : err.message || "Request failed",
  });
});

export default app;
