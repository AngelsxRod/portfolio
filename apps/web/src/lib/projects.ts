export type ProjectCategory = 'freelance' | 'personal' | 'universidad';
export type ProjectStatus = 'publicado' | 'borrador';

export interface Project {
  slug: string;
  title: string;
  role: string;
  year: string;
  category: ProjectCategory;
  featured: boolean;
  status: ProjectStatus;
  summary: string;
  problem: string;
  solution: string;
  result: string;
  stack: string[];
  siteUrl?: string;
  repoUrl?: string;
}

export const projects: Project[] = [
  {
    slug: 'portafolio-personal',
    title: 'Portafolio personal',
    role: 'Fullstack',
    year: '2026',
    category: 'personal',
    featured: true,
    status: 'publicado',
    summary:
      'Monorepo con Next.js, NestJS y Drizzle ORM sobre Neon, desplegado en Vercel — el mismo sitio en el que estás navegando ahora.',
    problem: '[Qué necesidad o contexto motivó este proyecto — una o dos oraciones.]',
    solution: '[Cómo lo resolviste: decisiones técnicas y de producto más relevantes.]',
    result: '[Impacto o aprendizaje concreto — con una métrica si la tienes.]',
    stack: ['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'Vercel'],
    siteUrl: '#',
    repoUrl: '#',
  },
  {
    slug: 'proyecto-freelance',
    title: '[Nombre del proyecto]',
    role: '[Rol]',
    year: '[Año]',
    category: 'freelance',
    featured: false,
    status: 'borrador',
    summary: '[Descripción breve del problema que resuelve y tu rol en el proyecto]',
    problem: '[Qué necesidad o contexto motivó este proyecto — una o dos oraciones.]',
    solution: '[Cómo lo resolviste: decisiones técnicas y de producto más relevantes.]',
    result: '[Impacto o aprendizaje concreto — con una métrica si la tienes.]',
    stack: ['[Tecnología]', '[Tecnología]', '[Tecnología]'],
    siteUrl: '#',
    repoUrl: '#',
  },
  {
    slug: 'proyecto-universidad',
    title: '[Nombre del proyecto]',
    role: '[Rol]',
    year: '[Año]',
    category: 'universidad',
    featured: false,
    status: 'publicado',
    summary: '[Descripción breve del problema que resuelve y tu rol en el proyecto]',
    problem: '[Qué necesidad o contexto motivó este proyecto — una o dos oraciones.]',
    solution: '[Cómo lo resolviste: decisiones técnicas y de producto más relevantes.]',
    result: '[Impacto o aprendizaje concreto — con una métrica si la tienes.]',
    stack: ['[Tecnología]', '[Tecnología]', '[Tecnología]'],
    siteUrl: '#',
    repoUrl: '#',
  },
];
