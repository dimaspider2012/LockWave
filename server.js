import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs-extra";

const app = express();

// Порт Render або локальний
const PORT = process.env.PORT || 3000;

// 🔐 Ключ доступу
const API_KEY = process.env.API_KEY || "super-secret-key";

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// --- Перевірка ключа ---
function checkKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (key !== API_KEY) {
    return res.status(403).json({ error: "Invalid API KEY" });
  }
  next();
}

// Захищаємо всі маршрути /api/*
app.use("/api", checkKey);

// Файли бази
const USERS_FILE = "./data/users.json";
const MESSAGES_FILE = "./data/messages.json";

// Переконуємося, що файли існують
await fs.ensureFile(USERS_FILE);
await fs.ensureFile(MESSAGES_FILE);

if (!(await fs.readFile(USERS_FILE, "utf8")).trim()) {
  await fs.writeJson(USERS_FILE, []);
}
if (!(await fs.readFile(MESSAGES_FILE, "utf8")).trim()) {
  await fs.writeJson(MESSAGES_FILE, []);
}

/* ========================= USERS ========================= */

app.get("/api/users", async (req, res) => {
  const users = await fs.readJson(USERS_FILE);
  res.json(users);
});

app.post("/api/users", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const users = await fs.readJson(USERS_FILE);
  const user = { id: users.length + 1, name };

  users.push(user);
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });

  res.json(user);
});

/* ======================= AUTH (REGISTER + LOGIN) ======================= */

// Реєстрація
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  const users = await fs.readJson(USERS_FILE);

  if (users.find(u => u.username === username))
    return res.status(400).json({ error: "User already exists" });

  const newUser = {
    id: users.length + 1,
    username,
    password // 🔥 у справжніх системах треба хешувати!
  };

  users.push(newUser);
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });

  res.json({ success: true, user: { id: newUser.id, username } });
});

// Логін
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const users = await fs.readJson(USERS_FILE);
  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ success: true, user: { id: user.id, username: user.username } });
});

/* ========================= MESSAGES ========================= */

app.get("/api/messages", async (req, res) => {
  const messages = await fs.readJson(MESSAGES_FILE);
  res.json(messages);
});

app.post("/api/messages", async (req, res) => {
  const { sender, text } = req.body;
  if (!sender || !text) {
    return res.status(400).json({ error: "Sender and text required" });
  }

  const messages = await fs.readJson(MESSAGES_FILE);

  const message = {
    id: messages.length + 1,
    sender,
    text,
    createdAt: new Date().toISOString()
  };

  messages.push(message);
  await fs.writeJson(MESSAGES_FILE, messages, { spaces: 2 });

  res.json(message);
});

/* ======================== SERVER START ======================== */

app.listen(PORT, () => {
  console.log(`🌍 Server running on port ${PORT}`);
});
