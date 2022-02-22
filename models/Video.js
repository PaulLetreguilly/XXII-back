const mongoose = require("mongoose");

const Video = mongoose.model("Video", {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  like: [{ type: mongoose.Schema.Types.Mixed, ref: "User" }],
  dislike: [{ type: mongoose.Schema.Types.Mixed, ref: "User" }],
  view: Number,
  title: String,
  description: String,
  url: String,
  //   comments: [{ type: mongoose.Schema.Types.Mixed, ref: "User" }],
});
module.exports = Video;
