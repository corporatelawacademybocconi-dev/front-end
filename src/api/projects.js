import client from './client'

export const getProjects = () => client.get('/projects/')
export const createProject = (data) => client.post('/projects/', data)
export const updateProject = (id, data) => client.patch(`/projects/${id}/`, data)
export const deleteProject = (id) => client.delete(`/projects/${id}/`)

export const getTasks = () => client.get('/tasks/')
export const createTask = (data) => client.post('/tasks/', data)
export const updateTask = (id, data) => client.patch(`/tasks/${id}/`, data)
export const deleteTask = (id) => client.delete(`/tasks/${id}/`)