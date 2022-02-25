const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const Video = require("../models/Video");
const authentified = require("../middleware/authentified");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// upload video route
router.post("/upload", authentified, async (req, res) => {
  try {
    const user = req.user;
    let videoToUpload = req.files.video.path;
    const uploaded = await cloudinary.uploader.upload(videoToUpload, {
      resource_type: "video",
      folder: `XXII/user-${user._id}`,
      public_id: "my-video",
      chunk_size: 6000000,
    });
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

    user.videos.push(video._id);
    user.markModified("videos");
    await user.save();

    res.status(200).json(video);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// list of a user's videos route
router.get("/myvideos", authentified, async (req, res) => {
  try {
    const user = req.user;
    const videos = await Video.find({ user: user._id });
    res.status(200).json(videos);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// update title/description of videos route
router.post("/update/video", authentified, async (req, res) => {
  try {
    const user = req.user;
    const video = await Video.findById(req.fields.id);

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

// route for like / dislike buttons on videos
router.post("/video/like", authentified, async (req, res) => {
  try {
    const user = req.user;
    const video = await Video.findById(req.fields.id);
    const liked = user.token;
    if (req.fields.like) {
      // if user clicked on like
      if (
        video.like.indexOf(liked) === -1 &&
        video.dislike.indexOf(liked) === -1
      ) {
        // if this user didn't use like or dislike on this video before
        video.like.push(liked);
      } else if (video.dislike.indexOf(liked) !== -1) {
        // if this user already used dislike
        const arr = [];
        for (let i = 0; i < video.dislike.length; i++) {
          if (video.dislike[i] !== liked) {
            // we push all other id's in a new array
            arr.push(video.dislike[i]);
          }
        }
        // replace the array dislike with the new one, "deleting" the previous dislike
        video.dislike = arr;
        video.markModified("dislike");
        video.like.push(liked);
      } else if (video.like.indexOf(liked) !== -1) {
        // if this user already used like
        const arr = [];
        for (let i = 0; i < video.like.length; i++) {
          if (video.like[i] !== liked) {
            // we push all other id's in a new array
            arr.push(video.like[i]);
          }
        }
        // replace the array like with the new one, "deleting" the previous like
        video.like = arr;
        video.markModified("like");
      }
      await video.save();
    }
    if (req.fields.dislike) {
      // if user clicked on dislike
      if (
        video.like.indexOf(liked) === -1 &&
        video.dislike.indexOf(liked) === -1
      ) {
        // if this user didn't use like or dislike on this video before
        video.dislike.push(liked);
      } else if (video.like.indexOf(liked) !== -1) {
        // if this user already used like
        const arr = [];
        for (let i = 0; i < video.like.length; i++) {
          if (video.like[i] !== liked) {
            // we push all other id's in a new array
            arr.push(video.like[i]);
          }
        }
        // replace the array like with the new one, "deleting" the previous like
        video.like = arr;
        video.markModified("like");
        video.dislike.push(liked);
      } else if (video.dislike.indexOf(liked) !== -1) {
        // if this user already used dislike
        const arr = [];
        for (let i = 0; i < video.dislike.length; i++) {
          if (video.dislike[i] !== liked) {
            // we push all other id's in a new array
            arr.push(video.dislike[i]);
          }
        }
        // replace the array dislike with the new one, "deleting" the previous dislike
        video.dislike = arr;
        video.markModified("dislike");
      }
      await video.save();
    }
    res.status(200).send("registered");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// video delete route
router.post("/video/delete", authentified, async (req, res) => {
  try {
    const user = req.user;
    if (req.fields.id) {
      // first delete the video from user.videos
      const arr = [];
      for (let i = 0; i < user.videos.length; i++) {
        if (req.fields.id !== user.videos) {
          arr.push(user.videos[i]);
        }
      }
      user.videos = arr;
      user.markModified("videos");
      user.save();

      // then delete it from video database folder
      const videoToDelete = await Video.findByIdAndDelete(req.fields.id);

      res.status(200).json({ message: "Video removed" });
    } else {
      res.status(400).json({ message: "Missing id" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// view counter route
router.post("/video/views", async (req, res) => {
  try {
    const videoViewed = await Video.findById(req.fields.id);

    const count = videoViewed.view + 1;
    videoViewed.view = count;

    videoViewed.markModified("view");
    await videoViewed.save();

    res.status(200).json({ message: "View counted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//list of videos route
router.get("/videos", async (req, res) => {
  try {
    const videos = await Video.find();
    res.status(200).json(videos);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
