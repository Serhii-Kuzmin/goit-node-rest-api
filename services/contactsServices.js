import Contact from "../models/Contact.js";

export const listContacts = () => Contact.find();

export const getContactsByFilter = (filter, query = {}) =>
  Contact.find(filter, "", query);

export const getContactById = async (contactId) => {
  return Contact.findById(contactId);
};

export const getContactByFilter = (filter) => Contact.findOne(filter);

export const getContactsCountByFilter = (filter) =>
  Contact.countDocuments(filter);

export const removeContact = async (contactId) =>
  Contact.findByIdAndDelete(contactId);

export const deleteContactByFilter = (filter) =>
  Contact.findOneAndDelete(filter);

export const addContact = async ({ name, email, phone, avatarURL, owner }) =>
  Contact.create({ name, email, phone, avatarURL, owner });

export const updateContact = async (contactId, body) =>
  Contact.findByIdAndUpdate(contactId, body);

export const updateContactByFilter = (filter, contactId, body) =>
  Contact.findOneAndUpdate(filter, contactId, body);

export const updateStatus = async (contactId, body) => {
  return Contact.findByIdAndUpdate(contactId, body);
};
