import axios from 'axios'
import { handleUnauthorized, withAuthHeader } from './interceptors'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

apiClient.interceptors.request.use(withAuthHeader)
apiClient.interceptors.response.use((response) => response, handleUnauthorized)
