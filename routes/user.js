const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const User = require("../models/User");
const Video = require("../models/Video");
const authentified = require("../middleware/authentified");

// 1ere étape : route sign up

router.post("/signup", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.fields.email });

    if (user) {
      res.status(409).json({ message: "This email already has an account" });
    } else {
      if (
        req.fields.email &&
        req.fields.password &&
        req.fields.username &&
        req.fields.name &&
        req.fields.surname
      ) {
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

        res.status(200).json(body);
      } else {
        res.status(400).json({ error: "Missing parameters" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 2e étape : route log in

router.post("/login", async (req, res) => {
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

router.get("/users", async (req, res) => {
  try {
    const user = await User.find();

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 4e étape : route pour mettre à jour / modifier les infos utilisateurs

router.post("/user/update", authentified, async (req, res) => {
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

router.get("/user", authentified, async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
