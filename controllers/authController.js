import fs from "fs/promises";
import path from "path";
import gravatar from "gravatar";
import Jimp from "jimp";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import "dotenv/config.js";

import * as authServices from "../services/authSevices.js";

import * as userServices from "../services/userServices.js";

import ctrlWrapper from "../decorators/ctrWrapper.js";

import HttpError from "../helpers/HttpError.js";

const { JWT_SECRET } = process.env;

const avatarsDir = path.resolve("public", "avatars");

const signup = async (req, res) => {
  const { email } = req.body;

  const user = await userServices.findUser({ email });

  if (user) {
    throw HttpError(409, "Email already in use");
  }

  const avatarURL = gravatar.url(email);

  const newUser = await authServices.signup({ ...req.body, avatarURL });

  res.status(201).json({
    email: newUser.email,
    subscription: newUser.subscription,
    avatarURL: newUser.avatarURL,
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;

  const user = await userServices.findUser({ email });

  if (!user) {
    throw HttpError(401, "Email or password invalid"); // "Email invalid"
  }

  const passwordCompare = await bcrypt.compare(password, user.password);

  if (!passwordCompare) {
    throw HttpError(401, "Email or password invalid"); // "Password invalid"
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
  await authServices.setToken(user._id, token);

  res.json({
    token,
    user: { email: user.email, subscription: user.subscription },
  });
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  });
};

const signout = async (req, res) => {
  const { _id } = req.user;
  await authServices.setToken(_id);

  res.json({
    message: "Signout success",
  });
};

const updateAvatar = async (req, res) => {
  const { email } = req.user;

  const { path: oldPath, filename } = req.file;
  const newPath = path.join(avatarsDir, filename);

  const file = await Jimp.read(oldPath);
  file.resize(250, 250);

  await fs.rename(oldPath, newPath);
  const avatarURL = path.join("avatars", filename);

  const result = await userServices.updateByFilter(
    { email },
    { ...req.body, avatarURL }
  );
  if (!result) {
    throw HttpError(401, "Not authorized");
  }
  res.status(200).json({
    avatarURL,
  });
};

export default {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  getCurrent: ctrlWrapper(getCurrent),
  signout: ctrlWrapper(signout),
  updateAvatar: ctrlWrapper(updateAvatar),
};
