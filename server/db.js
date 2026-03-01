const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI);

const db = mongoose.connection;

db.on("connected", () => {
  console.log("MongoDB Atlas connected");
});

db.on("error", (err) => {
  console.log("Mongo error:", err);
});