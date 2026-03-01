const mongoose = require("mongoose");

const BoardSchema = new mongoose.Schema({
  roomId: String,
  elements: Array,
});

module.exports = mongoose.model("Board", BoardSchema);