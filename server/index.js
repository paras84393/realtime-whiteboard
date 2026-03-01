require("dotenv").config();
require("./db");

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const Board = require("./BoardModel");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  let roomId = null;

  // JOIN ROOM + LOAD
  socket.on("join-room", async (id) => {
    roomId = id;
    socket.join(roomId);

    let board = await Board.findOne({ roomId });
    if (!board) board = await Board.create({ roomId, elements: [] });

    socket.emit("load-board", board.elements);
  });

  // DRAW
  socket.on("draw", async (data) => {
    socket.to(roomId).emit("draw", data);
    await Board.updateOne({ roomId }, { $push: { elements: data } });
  });

  // ERASE
  socket.on("erase", async (id) => {
    socket.to(roomId).emit("erase", id);
    await Board.updateOne({ roomId }, { $pull: { elements: { id } } });
  });

  // UNDO
  socket.on("undo", async (id) => {
    socket.to(roomId).emit("undo", id);
    await Board.updateOne({ roomId }, { $pull: { elements: { id } } });
  });

  // REDO
  socket.on("redo", async (el) => {
    socket.to(roomId).emit("redo", el);
    await Board.updateOne({ roomId }, { $push: { elements: el } });
  });

  // CURSOR
  socket.on("cursor", (data) => {
    socket.to(roomId).emit("cursor", {
      id: socket.id,
      x: data.x,
      y: data.y,
    });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});