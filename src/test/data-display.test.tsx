import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataCard, DataField, EmptyState, SimilarityBadge, TagList } from '../components/ui/DataDisplay'

describe('DataDisplay Components', () => {
  describe('EmptyState', () => {
    it('renders default message', () => {
      render(<EmptyState />)
      expect(screen.getByText('No se encontraron datos.')).toBeInTheDocument()
    })

    it('renders custom message', () => {
      render(<EmptyState message="Datos no disponibles." />)
      expect(screen.getByText('Datos no disponibles.')).toBeInTheDocument()
    })
  })

  describe('DataField', () => {
    it('renders label and children', () => {
      render(<DataField label="Usuario">Juan Perez</DataField>)
      expect(screen.getByText('Usuario')).toBeInTheDocument()
      expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    })

    it('renders fallback when children are falsy', () => {
      render(<DataField label="Vacío">{null}</DataField>)
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  describe('TagList', () => {
    it('renders empty message when array is empty', () => {
      render(<TagList items={[]} emptyMessage="Sin tags" />)
      expect(screen.getByText('Sin tags')).toBeInTheDocument()
    })

    it('renders all items as tags', () => {
      render(<TagList items={['React', 'TypeScript', 'Vite']} />)
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Vite')).toBeInTheDocument()
    })
  })

  describe('SimilarityBadge', () => {
    it('renders high similarity (>= 80%) with green color', () => {
      const { container } = render(<SimilarityBadge value={0.85} />)
      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument()
    })

    it('renders medium similarity (>= 50%) with yellow color', () => {
      const { container } = render(<SimilarityBadge value={0.65} />)
      expect(screen.getByText('65%')).toBeInTheDocument()
      expect(container.querySelector('.bg-amber-500')).toBeInTheDocument()
    })

    it('renders low similarity (< 50%) with red color', () => {
      const { container } = render(<SimilarityBadge value={0.3} />)
      expect(screen.getByText('30%')).toBeInTheDocument()
      expect(container.querySelector('.bg-rose-500')).toBeInTheDocument()
    })
  })

  describe('DataCard', () => {
    it('renders title, subtitle and children', () => {
      render(
        <DataCard title="Card Title" subtitle="Subtitle">
          <p>Card Content</p>
        </DataCard>
      )
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Subtitle')).toBeInTheDocument()
      expect(screen.getByText('Card Content')).toBeInTheDocument()
    })

    it('handles click events when onClick is provided', () => {
      const onClick = vi.fn()
      render(<DataCard title="Clickable" onClick={onClick} />)
      
      const card = screen.getByRole('button')
      card.click()
      
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(card).toHaveClass('cursor-pointer')
    })
  })
})
