const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = 8080;
app.use(express.static("public"));

let users = {};
let sockets = {};
let messageHistory = []; // 💬 история сообщений

io.on("connection", (socket) => {
  let currentNick = null;

  // 🧠 При коннекте отправляем юзеров и историю
  socket.emit("user-list", Object.values(users));
  socket.emit("message-history", messageHistory); // ⚡️ Отправляем историю

  socket.on("new-user", (nick) => {
    currentNick = nick;
    users[socket.id] = nick;
    sockets[nick] = socket;
    io.emit("user-list", Object.values(users));
  });

  socket.on("chat-message", (data) => {
    io.emit("chat-message", data);

    // 💾 Сохраняем в историю
    messageHistory.push(data);
    if (messageHistory.length > 100) messageHistory.shift(); // максимум 100 сообщений
  });

  socket.on("change-nick", ({ oldNick, newNick }) => {
    if (users[socket.id] !== oldNick) return;

    users[socket.id] = newNick;
    delete sockets[oldNick];
    sockets[newNick] = socket;

    io.emit("system-message", `Пользователь ${oldNick} изменил ник на ${newNick}, обновите страницу для корректного отображения!`);
    io.emit("user-list", Object.values(users));
  });

  socket.on("disconnect", () => {
    delete sockets[users[socket.id]];
    delete users[socket.id];
    io.emit("user-list", Object.values(users));
  });
});

http.listen(PORT, () => {
  console.log(`Сервер делает грязь на http://localhost:${PORT}`);
});