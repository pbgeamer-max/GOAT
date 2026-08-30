import express from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { config, validateConfig } from "./config.js";
import passport from "./auth/passport.js";
import authRoutes from "./routes/auth.js";
import statsRoutes from "./routes/stats.js";
import serverRoutes from "./routes/server.js";
import { startDiscordBot } from "./services/bot.js";
import { startRconMonitor } from "./services/rconMonitor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

validateConfig();

const app = express();

// Trust reverse proxy (Railway, Cloudflare, Nginx)
app.set("trust proxy", 1);

// Enable CORS with session credentials
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session handling
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Railway proxy handles SSL
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax",
    },
  })
);

// Initialize Passport for Steam & Discord
app.use(passport.initialize());
app.use(passport.session());

// Mount API & Authentication Routes
app.use(authRoutes);
app.use(statsRoutes);
app.use(serverRoutes);

// Serve Frontend Static Assets (if built)
const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));

// Fallback for Single Page Application
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/auth/")) {
    return res.status(404).json({ error: "Endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send(`
        <html>
          <body style="background:#0a0a0f;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
            <h1 style="color:#00ffcc;">GOAT SERVERS API Ready</h1>
            <p>Frontend is running in dev mode or needs build: <code>npm run build</code></p>
          </body>
        </html>
      `);
    }
  });
});

// Start Express Server
app.listen(config.port, "0.0.0.0", () => {
  console.log("==================================================");
  console.log(`🐐 [GOAT SERVERS] Backend running on: ${config.baseUrl}`);
  console.log(`🎮 Monitoring Rust Server: ${config.rust.ip}:${config.rust.port}`);
  console.log(`🔐 Steam Auth: ${config.steam.apiKey ? "Configured ✅" : "Missing Key ⚠️"}`);
  console.log(`💬 Discord OAuth & Bot: ${config.discord.botToken ? "Configured ✅" : "Missing Token ⚠️"}`);
  console.log("==================================================");
});

// Start Discord Bot background worker
startDiscordBot().catch((err) => {
  console.error("[Bot Startup Error]:", err);
});

// Start Real-Time In-Game Stats & Combat Monitor
startRconMonitor();
