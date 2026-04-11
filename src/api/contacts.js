import client from './client'

export const getContacts = () => client.get('/contacts/')
export const createContact = (data) => client.post('/contacts/', data)
export const updateContact = (id, data) => client.patch(`/contacts/${id}/`, data)
export const deleteContact = (id) => client.delete(`/contacts/${id}/`)

export const getCompanies = () => client.get('/companies/')
export const createCompany = (data) => client.post('/companies/', data)