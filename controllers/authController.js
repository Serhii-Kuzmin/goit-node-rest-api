import fs from "fs/promises";
import path from "path";
import gravatar from "gravatar";
import Jimp from "jimp";
import { nanoid } from "nanoid";

import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import "dotenv/config.js";

import * as authServices from "../services/authSevices.js";

import * as userServices from "../services/userServices.js";

import ctrlWrapper from "../decorators/ctrWrapper.js";

import HttpError from "../helpers/HttpError.js";

import sendEmail from "../helpers/sendEmail.js";

const { JWT_SECRET, BASE_URL } = process.env;

const avatarsDir = path.resolve("public", "avatars");

const signup = async (req, res) => {
  const { email } = req.body;

  const user = await userServices.findUser({ email });

  if (user) {
    throw HttpError(409, "Email already in use");
  }

  const verificationCode = nanoid();

  const avatarURL = gravatar.url(email);

  const newUser = await authServices.signup({
    ...req.body,
    avatarURL,
    verificationCode,
  });

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${verificationCode}">CLick to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    email: newUser.email,
    subscription: newUser.subscription,
    avatarURL: newUser.avatarURL,
  });
};

const verify = async (req, res) => {
  const { verificationCode } = req.params;
  const user = await userServices.findUser({ verificationCode });
  if (!user) {
    throw HttpError(404, "User not found");
  }
  await userServices.updateUser(
    { _id: user._id },
    { verify: true, verificationCode: "" }
  );

  res.json({
    message: "Verify success",
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await userServices.findUser({ email });
  if (!user) {
    throw HttpError(404, "User not found");
  }
  if (user.verify) {
    throw HttpError(400, "User already verify");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${user.verificationCode}">CLick to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.json({
    message: "Verify email send success",
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;

  const user = await userServices.findUser({ email });

  if (!user) {
    throw HttpError(401, "Email or password invalid"); // "Email invalid"
  }
  if (!user.verify) {
    throw HttpError(401, "Please check your email for the verification code");
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
  verify: ctrlWrapper(verify),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  getCurrent: ctrlWrapper(getCurrent),
  signout: ctrlWrapper(signout),
  updateAvatar: ctrlWrapper(updateAvatar),
};
