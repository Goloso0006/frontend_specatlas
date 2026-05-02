import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

export const EmptyProjectsState: React.FC<{ onCreate: () => void }> = ({ onCreate }) => {
  return (
    <Card className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-app-surface rounded-full flex items-center justify-center mb-4">
        <span className="text-xl">📁</span>
      </div>
      <h3 className="text-lg font-medium app-text-primary mb-2">Aún no tienes proyectos</h3>
      <p className="app-text-secondary text-[15px] max-w-md mb-6">
        Crea tu primer proyecto para comenzar a analizar requisitos y modelar arquitecturas de software.
      </p>
      <Button onClick={onCreate}>Crear proyecto</Button>
    </Card>
  )
}

export default EmptyProjectsState
