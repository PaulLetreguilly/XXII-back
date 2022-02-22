const mongoose = require("mongoose");

const User = mongoose.model("User", {
  username: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "",
  },
  surname: {
    type: String,
    default: "",
  },
  email: { type: String, unique: true },
  //   image: { type: mongoose.Schema.Types.Mixed, default: {} },
  videos: [{ ref: "Video", type: mongoose.Schema.Types.Mixed }],
  salt: String,
  token: String,
  hash: String,
});

module.exports = User;
