export const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
  },
  projects: {
    base: '/api/projects',
    byId: (id: string) => `/api/projects/${id}`,
    byUser: (ownerId: string) => `/api/projects/user/${ownerId}`,
  },
  requirements: {
    base: '/api/requirements',
    convert: '/api/requirements/convert',
    save: '/api/requirements/save',
    byProject: (projectId: string) => `/api/requirements/project/${projectId}`,
    search: '/api/requirements/search',
    duplicates: '/api/requirements/check-duplicates',
    impact: (id: string) => `/api/requirements/${id}/impact`,
    dependency: '/api/requirements/dependency',
    conflicts: (id: string) => `/api/requirements/${id}/conflicts`,
  },
  diagrams: {
    base: '/api/diagrams',
    manual: '/api/diagrams/manual',
    classAuto: (projectId: string) => `/api/diagrams/class/auto/${projectId}`,
    useCaseManual: '/api/diagrams/use-case/manual',
    useCaseAuto: (projectId: string) => `/api/diagrams/use-case/auto/${projectId}`,
    byId: (diagramId: string) => `/api/diagrams/${diagramId}`,
    byProject: (projectId: string) => `/api/diagrams/project/${projectId}`,
    plantUml: (diagramId: string) => `/api/diagrams/${diagramId}/plantuml`,
    exportPlantUml: (diagramId: string) => `/api/diagrams/${diagramId}/export/puml`,
    exportText: (diagramId: string) => `/api/diagrams/${diagramId}/export/txt`,
  },
  graph: {
    base: '/api/graph',
    impact: (id: string) => `/api/graph/impact/${id}`,
    inferRelations: (projectId: string) => `/api/graph/infer-relations/${projectId}`,
  },
  validationRules: {
    base: '/api/validation-rules',
    byId: (id: string) => `/api/validation-rules/${id}`,
    byProject: (projectId: string) => `/api/validation-rules/project/${projectId}`,
  },
} as const
