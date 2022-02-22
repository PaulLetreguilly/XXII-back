const User = require("../models/User");

// l'utilisateur devra être connecté afin de modifier ses données personnelles et / ou vidéo

const authentified = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace("Bearer ", "");
      const user = await User.findOne({ token: token });
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(401).json({ message: "Unauthorized, didnt find user" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized, bad authorisation" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = authentified;
