import fs from "fs/promises";

import path from "path";

import * as contactsServices from "../services/contactsServices.js";

import ctrlWrapper from "../decorators/ctrWrapper.js";

import HttpError from "../helpers/HttpError.js";

export const getAllContacts = async (req, res) => {
  const { _id: owner } = req.user;

  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;
  const result = await contactsServices.getContactsByFilter(
    { owner },
    { skip, limit }
  );

  const total = await contactsServices.getContactsCountByFilter({ owner });
  res.json({
    total,
    result,
  });
};

export const getOneContact = async (req, res) => {
  const { id } = req.params;
  const { _id: owner } = req.user;

  const result = await contactsServices.getContactByFilter({ _id: id, owner });

  if (!result) {
    throw HttpError(404, `Contact with id=${id} not found`);
  }

  res.json(result);
};

export const deleteContact = async (req, res) => {
  const { id } = req.params;
  const { _id: owner } = req.user;

  const result = await contactsServices.deleteContactByFilter({
    _id: id,
    owner,
  });

  if (!result) {
    throw HttpError(404, `Contact with id=${id} not found`);
  }

  res.json({
    message: "Delete success",
  });
};

export const createContact = async (req, res) => {
  const { path: oldPath, filename } = req.file;
  const newPath = path.join(contactsDir, filename);

  await fs.rename(oldPath, newPath);
  const { _id: owner } = req.user;
  const photo = path.join("contacts", filename);
  const result = await contactsServices.addContact({
    ...req.body,
    photo,
    owner,
  });
  res.status(201).json(result);
};

export const updateContact = async (req, res) => {
  const { id } = req.params;
  const { _id: owner } = req.user;

  if (Object.keys(req.body).length === 0) {
    throw HttpError(400, `Contact with id=${id} not found`);
  }
  const result = await contactsServices.updateContactByFilter(
    { _id: id, owner },
    req.body
  );
  if (!result) {
    throw HttpError(404);
  }

  return res.json(result);
};

export const updateStatusContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (Object.keys(req.body).length === 0) {
      throw HttpError(400, `Contact with id=${id} not found`);
    }

    const result = await contactsServices.updateStatus(id, req.body);
    if (!result) {
      throw HttpError(404);
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
};

export default {
  getAllContacts: ctrlWrapper(getAllContacts),
  getOneContact: ctrlWrapper(getOneContact),
  createContact: ctrlWrapper(createContact),
  updateContact: ctrlWrapper(updateContact),
  deleteContact: ctrlWrapper(deleteContact),
  updateStatusContact: ctrlWrapper(updateStatusContact),
};
