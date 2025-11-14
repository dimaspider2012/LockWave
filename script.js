async function loadUsers() {
  const res = await fetch("/api/users");
  const data = await res.json();
  const list = document.getElementById("users");
  list.innerHTML = "";
  data.forEach(u => {
    const li = document.createElement("li");
    li.textContent = `#${u.id}: ${u.name}`;
    list.appendChild(li);
  });
}

async function addUser() {
  const name = document.getElementById("username").value.trim();
  if (!name) return alert("Введіть ім’я!");
  await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  document.getElementById("username").value = "";
  loadUsers();
}

async function loadMessages() {
  const res = await fetch("/api/messages");
  const data = await res.json();
  const list = document.getElementById("messages");
  list.innerHTML = "";
  data.forEach(m => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
    list.appendChild(li);
  });
}

async function addMessage() {
  const sender = document.getElementById("sender").value.trim();
  const text = document.getElementById("message").value.trim();
  if (!sender || !text) return alert("Заповни поля!");
  await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender, text })
  });
  document.getElementById("message").value = "";
  loadMessages();
}

loadUsers();
loadMessages();