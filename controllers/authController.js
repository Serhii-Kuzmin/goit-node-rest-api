import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

import "dotenv/config.js";

import * as authServices from "../services/authSevices.js";

import * as userServices from "../services/userServices.js";

import ctrlWrapper from "../decorators/ctrWrapper.js";

import HttpError from "../helpers/HttpError.js";

import sendEmail from "../helpers/sendEmail.js";
import { nanoid } from "nanoid";
import ctrWrapper from "../decorators/ctrWrapper.js";

const { JWT_SECRET, BASE_URL } = process.env;

const signup = async (req, res) => {
  const { email } = req.body;

  const user = await userServices.findUser({ email });

  if (user) {
    throw HttpError(409, "Email already in use");
  }

  const verificationCode = nanoid();

  const newUser = await authServices.signup({ ...req.body, verificationCode });

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${verificationCode}">CLick to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(201).json({
    email: newUser.email,
    subscription: newUser.subscription,
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
    message: `Account verified successfully!`,
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await userServices.findUser({ email });

  if (!user) {
    throw HttpError(400, "User not found");
  }
  if (user.verify) {
    throw HttpError(400, "This account is already verified");
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
    throw HttpError(401, "Email not verify");
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

export default {
  signup: ctrlWrapper(signup),
  verify: ctrlWrapper(verify),
  resendVerifyEmail: ctrWrapper(resendVerifyEmail),
  signin: ctrlWrapper(signin),
  getCurrent: ctrlWrapper(getCurrent),
  signout: ctrlWrapper(signout),
};
