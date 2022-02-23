const express = require("express");
const formidable = require("express-formidable");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
require("dotenv").config();

const app = express();
app.use(formidable());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const User = require("./models/User");
const Video = require("./models/Video");
const authentified = require("./middleware/authentified");

app.get("/", (req, res) => {
  res.send("Welcome to my DataVOD api");
});

// *************************************************************************************
// ALL ROUTES ARE TEMPORARELY HERE, I'LL PUT THEM INTO FOLDERS ONCE EVERYTHING IS WORKING
// *************************************************************************************

//-----------------------------------------------------------------//
//--------------------------- CRUD user ---------------------------//
//-----------------------------------------------------------------//

// 1ere étape : route sign up

app.post("/signup", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });

    if (user) {
      res.status(409).json({ message: "This email already has an account" });
      //   console.log("not ok");
    } else {
      if (
        req.fields.email &&
        req.fields.password &&
        req.fields.username &&
        req.fields.name &&
        req.fields.surname
      ) {
        // console.log("okay");
        // console.log(req.fields);
        const token = uid2(64);
        const salt = uid2(64);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);
        const user = new User({
          email: req.fields.email,
          username: req.fields.username,
          password: req.fields.password,
          name: req.fields.name,
          surname: req.fields.surname,
          hash: hash,
          salt: salt,
          token: token,
        });

        const body = {
          _id: user._id,
          token: user.token,
          username: user.username,
        };

        await user.save();
        // console.log(user);

        res.status(200).json(body);
      } else {
        // console.log("okayish");

        res.status(400).json({ error: "Missing parameters" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 2e étape : route log in

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });
    if (user) {
      if (
        SHA256(req.fields.password + user.salt).toString(encBase64) ===
        user.hash
      ) {
        res.status(200).json({
          _id: user._id,
          token: user.token,
          username: user.username,
        });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 3e étape : route pour renvoyer la liste des utilisateurs

app.get("/users", async (req, res) => {
  try {
    const user = await User.find();

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 4e étape : route pour mettre à jour / modifier les infos utilisateurs

app.post("/user/update", authentified, async (req, res) => {
  try {
    const user = req.user;
    if (req.fields.username) {
      user.username = req.fields.username;
      user.markModified("username");
    }
    if (req.fields.email) {
      user.email = req.fields.email;
      user.markModified("email");
    }
    if (req.fields.password) {
      user.hash = SHA256(req.fields.password + user.salt).toString(encBase64);
      user.markModified("hash");
    }
    if (req.fields.name) {
      user.name = req.fields.name;
      user.markModified("name");
    }
    if (req.fields.surname) {
      user.surname = req.fields.surname;
      user.markModified("surname");
    }

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 5e étape : trouver les données d'un utilisateur particulier via son id

app.get("/user", authentified, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//-----------------------------------------------------------------------//
//--------------------------- CRUD user (fin) --------------------------//
//---------------------------------------------------------------------//

//-----------------------------------------------------------------------//
//----------------------------- CRUD video  ----------------------------//
//---------------------------------------------------------------------//

app.post("/upload", authentified, async (req, res) => {
  try {
    const user = req.user;
    // console.log(req.fields);
    // console.log(req.files.video.path);
    let videoToUpload = req.files.video.path;
    const uploaded = await cloudinary.uploader.upload(videoToUpload, {
      resource_type: "video",
      folder: `XXII/user-${user._id}`,
      public_id: "my-video",
      chunk_size: 6000000,
    });
    console.log(uploaded.secure_url);
    const video = new Video({
      user: user._id,
      title: req.fields.title,
      description: req.fields.description,
      url: uploaded.secure_url,
      view: 0,
      like: [],
      dislike: [],
    });
    await video.save();

    res.status(200).json(video);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/myvideos", authentified, async (req, res) => {
  try {
    const user = req.user;
    const videos = await Video.find({ user: user._id });
    // console.log(videos);
    res.status(200).json(videos);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/update/video", authentified, async (req, res) => {
  try {
    const user = req.user;
    // console.log(req.fields);
    const video = await Video.findById(req.fields.id);
    console.log(video);

    if (req.fields.title) {
      video.title = req.fields.title;
      video.markModified("title");
    }
    if (req.fields.description) {
      video.description = req.fields.description;
      video.markModified("description");
    }
    await video.save();

    res.status(200).json(video);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//-------------------------------------------------------------------------//
//---------------------------- CRUD video (fin)  -------------------------//
//-----------------------------------------------------------------------//

app.all("*", (req, res) => {
  res.status(404).send("page not found");
});
app.listen(process.env.PORT || 4000, (req, res) => {
  console.log("Server started");
});
