// server.js
const { Server } = require("socket.io");
const http = require("http");

// server.js
const PORT = process.env.PORT || 3001; // Render provides the port

const server = http.createServer();
const io = new Server(server, {
  cors: {
    // Replace with your actual Vercel URL once you have it
    origin: ["http://localhost:3000", "https://collabdraw-seven.vercel.app"],
    methods: ["GET", "POST"]
  }
});

const boardStates = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-board", (boardId) => {
    if (!boardId) return;
    [...socket.rooms].forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });
    socket.join(boardId);
    console.log(`User ${socket.id} joined: ${boardId}`);
    if (boardStates[boardId]) {
      socket.emit("full-state", boardStates[boardId]);
    }
  });

  // Single new object added
  socket.on("add-object", ({ id, obj }) => {
    if (!id || !obj) return;
    if (!boardStates[id]) boardStates[id] = { version: "6.0.0", objects: [] };
    boardStates[id].objects.push(obj);
    socket.to(id).emit("add-object", obj);
    console.log(`[add-object] type:${obj.type} → room:${id}`);
  });

  // Position/property updates (no new objects, just moves/resizes)
  socket.on("update-all", ({ id, objects }) => {
    if (!id || !objects) return;
    if (boardStates[id]) boardStates[id].objects = objects;
    socket.to(id).emit("update-all", objects);
    console.log(`[update-all] ${objects.length} objects → room:${id}`);
  });

  socket.on("clear-board", (boardId) => {
    boardStates[boardId] = { version: "6.0.0", objects: [] };
    socket.to(boardId).emit("clear-canvas");
  });

  socket.on("disconnect", () => console.log("Disconnected:", socket.id));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});