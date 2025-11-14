import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs-extra";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const PORT = process.env.PORT || 3000;

// СЕКРЕТИ
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Файли бази
const USERS_FILE = "./data/users.json";
const MESSAGES_FILE = "./data/messages.json";

// Переконуємось що файли є
await fs.ensureFile(USERS_FILE);
await fs.ensureFile(MESSAGES_FILE);

if (!(await fs.readFile(USERS_FILE, "utf8")).trim()) {
  await fs.writeJson(USERS_FILE, []);
}
if (!(await fs.readFile(MESSAGES_FILE, "utf8")).trim()) {
  await fs.writeJson(MESSAGES_FILE, []);
}

// ------------------ JWT Перевірка ------------------
function auth(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "TOKEN_REQUIRED" });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: "INVALID_TOKEN" });
  }
}

// ------------------ AUTH API ------------------
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "MISSING_FIELDS" });

  const users = await fs.readJson(USERS_FILE);
  if (users.find(u => u.email === email))
    return res.status(400).json({ error: "EMAIL_EXISTS" });

  const hash = bcrypt.hashSync(password, 10);

  const user = {
    id: users.length + 1,
    name,
    email,
    password: hash
  };

  users.push(user);
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });

  res.json({ success: true });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const users = await fs.readJson(USERS_FILE);
  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: "USER_NOT_FOUND" });

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(400).json({ error: "WRONG_PASSWORD" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "30d"
  });

  res.json({ token });
});

// ------------------ МESSAGES (захищені) ------------------
app.get("/api/messages", auth, async (req, res) => {
  const messages = await fs.readJson(MESSAGES_FILE);
  res.json(messages);
});

app.post("/api/messages", auth, async (req, res) => {
  const { text } = req.body;
  const sender = req.user.email;

  if (!text) return res.status(400).json({ error: "EMPTY_MESSAGE" });

  const messages = await fs.readJson(MESSAGES_FILE);

  const msg = {
    id: messages.length + 1,
    sender,
    text,
    createdAt: new Date().toISOString(),
  };

  messages.push(msg);
  await fs.writeJson(MESSAGES_FILE, messages, { spaces: 2 });

  res.json(msg);
});

// ------------------- АДМІН-ПАНЕЛЬ --------------------
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) return res.json({ ok: true });
  res.status(403).json({ ok: false });
});

// ------------------- START --------------------
app.listen(PORT, () => console.log(`🚀 MyWebBase running on PORT ${PORT}`));
