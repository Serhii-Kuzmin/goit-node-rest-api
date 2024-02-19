import * as contactsServices from "../services/contactsServices.js";

import ctrlWrapper from "../decorators/ctrWrapper.js";

import HttpError from "../helpers/HttpError.js";

export const getAllContacts = async (_, res) => {
  const result = await contactsServices.listContacts();
  res.json(result);
};

export const getOneContact = async (req, res) => {
  const { id } = req.params;
  const result = await contactsServices.getContactById(id);

  if (!result) {
    throw HttpError(404, `Contact with id=${id} not found`);
  }

  res.json(result);
};

export const deleteContact = async (req, res) => {
  const { id } = req.params;
  const result = await contactsServices.removeContact(id);

  if (!result) {
    throw HttpError(404, `Contact with id=${id} not found`);
  }

  res.json({
    message: "Delete success",
  });
};

export const createContact = async (req, res) => {
  const result = await contactsServices.addContact(req.body);

  res.status(201).json(result);
};

export const updateContact = async (req, res) => {
  const { id } = req.params;

  if (Object.keys(req.body).length === 0) {
    throw HttpError(400, `Contact with id=${id} not found`);
  }
  const result = await contactsServices.updateContact(id, req.body);
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
