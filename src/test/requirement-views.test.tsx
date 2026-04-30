import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  RequirementDetailCard,
  SearchResultList,
} from '../components/requirements/RequirementDataViews'
import type { RequirementDTO, SearchResponse } from '../types/requirements'

const MOCK_REQUIREMENT: RequirementDTO = {
  id: 'req-1',
  code: 'RF-001',
  title: 'Login de Usuario',
  description: 'El sistema debe permitir a los usuarios iniciar sesión.',
  actors: ['Cliente', 'Administrador'],
  acceptanceCriteria: ['Debe aceptar email y password', 'Debe bloquear tras 3 intentos'],
  isoClassification: 'Functional',
  projectId: 'proj-1',
  relatedCodes: ['RF-002', 'RNF-001'],
}

const MOCK_EMPTY_REQUIREMENT: RequirementDTO = {
  id: 'req-empty',
  code: '',
  title: 'Requisito Vacío',
  description: '',
  actors: [],
  acceptanceCriteria: [],
  isoClassification: '',
  projectId: 'proj-1',
  relatedCodes: [],
}

describe('RequirementDataViews Components', () => {
  describe('RequirementDetailCard', () => {
    it('renders empty state if title is empty', () => {
      render(<RequirementDetailCard requirement={{ ...MOCK_REQUIREMENT, title: '' }} />)
      expect(screen.getByText('No hay un requisito cargado.')).toBeInTheDocument()
    })

    it('renders full requirement details correctly', () => {
      render(<RequirementDetailCard requirement={MOCK_REQUIREMENT} />)

      // Title & Code
      expect(screen.getByText('Login de Usuario')).toBeInTheDocument()
      expect(screen.getByText('RF-001')).toBeInTheDocument()

      // Description
      expect(screen.getByText('El sistema debe permitir a los usuarios iniciar sesión.')).toBeInTheDocument()

      // Tags (Actors, ISO)
      expect(screen.getByText('Cliente')).toBeInTheDocument()
      expect(screen.getByText('Administrador')).toBeInTheDocument()
      expect(screen.getByText('Functional')).toBeInTheDocument()

      // Related codes
      expect(screen.getByText('RF-002')).toBeInTheDocument()
      expect(screen.getByText('RNF-001')).toBeInTheDocument()

      // Acceptance Criteria List
      expect(screen.getByText('Debe aceptar email y password')).toBeInTheDocument()
      expect(screen.getByText('Debe bloquear tras 3 intentos')).toBeInTheDocument()
    })

    it('renders correctly when optional array fields are empty', () => {
      render(<RequirementDetailCard requirement={MOCK_EMPTY_REQUIREMENT} />)

      expect(screen.getByText('Requisito Vacío')).toBeInTheDocument()
      expect(screen.getByText('Sin actores definidos')).toBeInTheDocument()
      expect(screen.getByText('Sin clasificación')).toBeInTheDocument()
      expect(screen.getByText('Sin criterios definidos')).toBeInTheDocument()
      
      // Related codes should completely omit the section if empty
      expect(screen.queryByText('Códigos Relacionados')).not.toBeInTheDocument()
    })
  })

  describe('SearchResultList', () => {
    it('renders empty state when array is empty', () => {
      render(<SearchResultList results={[]} />)
      expect(screen.getByText('Sin resultados de búsqueda.')).toBeInTheDocument()
    })

    it('renders results with similarity badge when provided', () => {
      const results: SearchResponse[] = [
        { id: '1', code: 'RF-1', title: 'Test 1', description: 'Desc 1', similarity: 0.95 },
      ]
      
      render(<SearchResultList results={results} />)
      
      expect(screen.getByText('Test 1')).toBeInTheDocument()
      expect(screen.getByText('RF-1')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
    })
  })
})
