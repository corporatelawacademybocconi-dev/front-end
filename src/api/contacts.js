import client from './client'

export const getContacts = () => client.get('/contacts/')
export const createContact = (data) => client.post('/contacts/', data)
export const updateContact = (id, data) => client.patch(`/contacts/${id}/`, data)
export const deleteContact = (id) => client.delete(`/contacts/${id}/`)

export const getCompanies = () => client.get('/companies/')
export const createCompany = (data) => client.post('/companies/', data)
export const getContactsFiltered = (params = {}) => {
  const qs = new URLSearchParams()
  if (params.search)    qs.set('search', params.search)
  if (params.company)   qs.set('company', params.company)
  if (params.role)      qs.set('role', params.role)
  if (params.page)      qs.set('page', params.page)
  if (params.page_size) qs.set('page_size', params.page_size)
  if (params.ordering)  qs.set('ordering', params.ordering)
  return client.get(`/contacts/?${qs.toString()}`)
}

export const getTopContacts = (limit = 5) =>
  getContactsFiltered({ ordering: '-relationship_score', page_size: limit })