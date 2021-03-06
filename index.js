const express = require("express");
const formidable = require("express-formidable");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(formidable());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

const user = require("./routes/user");
const video = require("./routes/video");
app.use(user, video);

app.get("/", (req, res) => {
  res.send("Welcome to my DataVOD api");
});

app.all("*", (req, res) => {
  res.status(404).send("page not found");
});
app.listen(process.env.PORT || 4000, (req, res) => {
  console.log("Server started");
});
