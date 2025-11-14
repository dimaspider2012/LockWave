import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs-extra";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Шляхи до файлів бази
const USERS_FILE = "./data/users.json";
const MESSAGES_FILE = "./data/messages.json";

await fs.ensureFile(USERS_FILE);
await fs.ensureFile(MESSAGES_FILE);

if (!(await fs.readFile(USERS_FILE, "utf8")).trim()) await fs.writeJson(USERS_FILE, []);
if (!(await fs.readFile(MESSAGES_FILE, "utf8")).trim()) await fs.writeJson(MESSAGES_FILE, []);

// === API ===

// Отримати користувачів
app.get("/api/users", async (req, res) => {
  const users = await fs.readJson(USERS_FILE);
  res.json(users);
});

// Створити користувача
app.post("/api/users", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Ім'я обов'язкове" });
  const users = await fs.readJson(USERS_FILE);
  const user = { id: users.length + 1, name };
  users.push(user);
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });
  res.json(user);
});

// Повідомлення
app.get("/api/messages", async (req, res) => {
  const messages = await fs.readJson(MESSAGES_FILE);
  res.json(messages);
});

app.post("/api/messages", async (req, res) => {
  const { sender, text } = req.body;
  if (!sender || !text) return res.status(400).json({ error: "Немає даних" });
  const messages = await fs.readJson(MESSAGES_FILE);
  const msg = { id: messages.length + 1, sender, text, createdAt: new Date().toISOString() };
  messages.push(msg);
  await fs.writeJson(MESSAGES_FILE, messages, { spaces: 2 });
  res.json(msg);
});

app.listen(PORT, () => {
  console.log(`🌍 MyWebBase працює на http://localhost:${PORT}`);
});