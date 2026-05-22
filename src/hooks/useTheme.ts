import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import type { ThemeContextType } from '../context/ThemeContext'

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider')
  }
  return context
}
