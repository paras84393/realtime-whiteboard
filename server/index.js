require("dotenv").config();
require("./db");

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const Board = require("./BoardModel");

const app = express();

app.use(cors({
  origin: "https://realtime-whiteboard-lime.vercel.app",
  methods: ["GET", "POST"],
  credentials: true,
}));

app.get("/", (req, res) => {
  res.send("Whiteboard backend running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://realtime-whiteboard-lime.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// ================= SOCKET LOGIC =================

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // JOIN ROOM
  socket.on("join-room", async (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    try {
      let board = await Board.findOne({ roomId });

      if (!board) {
        board = await Board.create({
          roomId,
          elements: [],
        });
      }

      socket.emit("load-board", board.elements);
    } catch (err) {
      console.log("Load board error:", err);
    }
  });

  // DRAW
  socket.on("draw", async ({ roomId, element }) => {
    socket.to(roomId).emit("draw", element);

    try {
      await Board.updateOne(
        { roomId },
        { $push: { elements: element } }
      );
    } catch (err) {
      console.log("Draw DB error:", err);
    }
  });

  // ERASE
  socket.on("erase", async ({ roomId, id }) => {
    socket.to(roomId).emit("erase", id);

    try {
      await Board.updateOne(
        { roomId },
        { $pull: { elements: { id } } }
      );
    } catch (err) {
      console.log("Erase DB error:", err);
    }
  });

  // UNDO
  socket.on("undo", async ({ roomId, id }) => {
    socket.to(roomId).emit("undo", id);

    try {
      await Board.updateOne(
        { roomId },
        { $pull: { elements: { id } } }
      );
    } catch (err) {
      console.log("Undo DB error:", err);
    }
  });

  // REDO
  socket.on("redo", async ({ roomId, element }) => {
    socket.to(roomId).emit("redo", element);

    try {
      await Board.updateOne(
        { roomId },
        { $push: { elements: element } }
      );
    } catch (err) {
      console.log("Redo DB error:", err);
    }
  });

  // CURSOR MOVEMENT
  socket.on("cursor", ({ roomId, x, y }) => {
    socket.to(roomId).emit("cursor", {
      id: socket.id,
      x,
      y,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// ================= SERVER START =================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});