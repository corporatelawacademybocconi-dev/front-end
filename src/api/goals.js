import client from './client'

export const getGoals = () => client.get('/goals/')
export const createGoal = (data) => client.post('/goals/', data)
export const updateGoal = (id, data) => client.patch(`/goals/${id}/`, data)
