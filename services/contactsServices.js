import Contact from "../models/Contact.js";

export const listContacts = () => Contact.find();

export const getContactById = async (contactId) => {
  return Contact.findById(contactId);
};

export const removeContact = async (contactId) =>
  Contact.findByIdAndDelete(contactId);

export const addContact = async ({ name, email, phone }) =>
  Contact.create({ name, email, phone });

export const updateContact = async (contactId, body) =>
  Contact.findByIdAndUpdate(contactId, body);

export const updateStatus = async (contactId, body) => {
  return Contact.findByIdAndUpdate(contactId, body);
};
