import { create } from 'zustand'
import { authApi, tasksApi, userApi } from '../api'

// ── Auth Store ─────────────────────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('ff_token'),
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await authApi.login({ email, password })
      localStorage.setItem('ff_token', data.token)
      set({ token: data.token, user: data.user, loading: false })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  register: async (name, email, password) => {
    set({ loading: true })
    try {
      const { data } = await authApi.register({ name, email, password })
      localStorage.setItem('ff_token', data.token)
      set({ token: data.token, user: data.user, loading: false })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  fetchMe: async () => {
    try {
      const { data } = await userApi.me()
      set({ user: data })
    } catch {}
  },

  logout: () => {
    localStorage.removeItem('ff_token')
    set({ user: null, token: null })
  },

  setUser: (user) => set({ user }),
}))

// ── Task Store ─────────────────────────────────────────────────────────────
export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true })
    const { data } = await tasksApi.getAll()
    set({ tasks: data, loading: false })
  },

  create: async (taskData) => {
    const { data } = await tasksApi.create(taskData)
    set((s) => ({ tasks: [...s.tasks, data] }))
    return data
  },

  update: async (id, taskData) => {
    const { data } = await tasksApi.update(id, taskData)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? data : t)) }))
  },

  toggleDone: async (id) => {
    const { data } = await tasksApi.toggleDone(id)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? data : t)) }))
  },

  updateEndTime: async (id, taskData) => {
    const { data } = await tasksApi.updateEndTime(id, taskData)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? data : t)) }))
    return data
  },

  markStartReminderShown: async (id) => {
    const { data } = await tasksApi.markStartReminderShown(id)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? data : t)) }))
    return data
  },

  delete: async (id) => {
    await tasksApi.delete(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },

  addMany: (newTasks) => {
    set((s) => ({ tasks: [...s.tasks, ...newTasks] }))
  },
}))
