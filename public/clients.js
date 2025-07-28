const socket = io();
let nickname = localStorage.getItem("nickname") || null;
let hasChangedNick = true;

while (!nickname) {
  nickname = prompt("Введите ваш ник:").trim();
  if (nickname) {
    localStorage.setItem("nickname", nickname);
    socket.emit("new-user", nickname);
  }
}

socket.emit("new-user", nickname);

const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
const userList = document.getElementById("userList");

function sendMessage() {
  const msg = messageInput.value.trim();
  if (msg === "") return;

  if (msg.startsWith('!cgnk="') && msg.endsWith('"')) {
    if (!hasChangedNick) {
      alert("Ты уже менял ник, второй раз не катит.");
      return;
    }

    const newNick = msg.match(/!cgnk="(.*)"/)[1];
    if (newNick) {
      socket.emit("change-nick", { oldNick: nickname, newNick });
      localStorage.setItem("nickname", newNick);
      nickname = newNick;
      hasChangedNick = true;
      addSystemMessage(`Здравствуйте ${nickname}! Ваше имя изменено на ${newNick}`);
    }
  } else {
    socket.emit("chat-message", { nick: nickname, message: msg });
  }

  messageInput.value = "";
}

socket.on("chat-message", ({ nick, message }) => {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");

  if (nick === nickname) {
    msgDiv.classList.add("my-message");
  } else {
    msgDiv.classList.add("other-message");
  }

  const nickDiv = document.createElement("div");
  nickDiv.classList.add("nick");
  nickDiv.textContent = nick;

  const textDiv = document.createElement("div");
  textDiv.classList.add("text");
  textDiv.textContent = message;

  msgDiv.appendChild(nickDiv);
  msgDiv.appendChild(textDiv);

  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

socket.on("system-message", (text) => {
  addSystemMessage(text);
});

function addSystemMessage(text) {
  const div = document.createElement("div");
  div.textContent = text;
  div.className = "system";
  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

socket.on("user-list", (users) => {
  userList.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u;
    userList.appendChild(li);
  });
});

socket.on("message-history", (history) => {
  messagesContainer.innerHTML = "";
  history.forEach(({ nick, message }) => {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message");
    msgDiv.classList.add(nick === nickname ? "my-message" : "other-message");

    const nickDiv = document.createElement("div");
    nickDiv.classList.add("nick");
    nickDiv.textContent = nick;

    const textDiv = document.createElement("div");
    textDiv.classList.add("text");
    textDiv.textContent = message;

    msgDiv.appendChild(nickDiv);
    msgDiv.appendChild(textDiv);
    messagesContainer.appendChild(msgDiv);
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});