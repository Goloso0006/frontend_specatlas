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
    base: '/requirements',
    convert: '/requirements/convert',
    save: '/requirements/save',
    search: '/requirements/search',
    duplicates: '/requirements/check-duplicates',
    impact: (id: string) => `/requirements/${id}/impact`,
    dependency: '/requirements/dependency',
    conflicts: (id: string) => `/requirements/${id}/conflicts`,
  },
  diagrams: {
    base: '/api/diagrams',
  },
  validationRules: {
    base: '/api/validation-rules',
    byProject: (projectId: string) => `/api/validation-rules/project/${projectId}`,
  },
} as const
