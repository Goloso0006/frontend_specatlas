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
  },
  validationRules: {
    base: '/api/validation-rules',
    byProject: (projectId: string) => `/api/validation-rules/project/${projectId}`,
  },
} as const
