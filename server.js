// server.js
const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-board", (boardId) => {
    if (!boardId) return;
    // Leave any previous rooms first (except own socket room)
    [...socket.rooms].forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });
    socket.join(boardId);
    console.log(`User ${socket.id} joined: ${boardId}`);
  });

  // ... existing server code ...
socket.on("add-object", ({ id, obj }) => {
  if (!id || !obj) return;
  // Send ONLY the new object to other users in the room
  socket.to(id).emit("add-object", { obj });
});

socket.on("full-sync", ({ id, canvasData }) => {
  socket.to(id).emit("full-sync", canvasData);
});
// ... rest of server code ...
  socket.on("draw", ({ id, canvasData }) => {
    if (!id || !canvasData) return;
    // socket.to() excludes the SENDER — only other clients get this
    socket.to(id).emit("canvas-update", canvasData);
    console.log(`Draw from ${socket.id} → room ${id}`);
  });

  socket.on("clear-board", (boardId) => {
    socket.to(boardId).emit("clear-canvas");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("🚀 Real-time server active on port 3001");
});