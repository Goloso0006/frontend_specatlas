import axios from 'axios'
import { handleUnauthorized, withAuthHeader } from './interceptors'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const API_TIMEOUT_MS = 90000

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
})

apiClient.interceptors.request.use(withAuthHeader)
apiClient.interceptors.response.use((response) => response, handleUnauthorized)
