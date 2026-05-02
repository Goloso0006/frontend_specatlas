import React from 'react'
import { Input } from '../ui/Input'

export const ProjectSearchBar: React.FC<{
  value: string
  onChange: (v: string) => void
}> = ({ value, onChange }) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Input
        placeholder="Buscar proyectos por nombre..."
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="h-14 text-lg"
      />
    </div>
  )
}

export default ProjectSearchBar
