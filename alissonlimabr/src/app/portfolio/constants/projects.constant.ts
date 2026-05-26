import { AUTH_JWT_SKILLS } from './auth-jwt-skills.constant';
import { EVENT_PLATAFORM_SKILLS } from './event-plataform-skills.constant';
import { MOTOVOICE_SKILLS } from './motovoice-skills.constant';
import { PORTFOLIO_SKILLS } from './portfolio-skills.constant';
import { RESET_PASSWORD_SKILLS } from './reset-password-skills.constant';

interface Project {
  title: string;
  subtitle: string;
  description: string;
  url?: string;
  skills: { icon: string; alt: string; name?: string }[];
  size: 'featured' | 'standard' | 'placeholder';
}

export const PROJECTS: Project[] = [
  {
    title: 'Portfólio Desenvolvedor',
    subtitle: 'Angular 21 · SSR · Sanity CMS',
    description:
      'Portfólio com SSR para performance e SEO, blog integrado ao Sanity CMS com busca, paginação, categorias, posts relacionados, RSS feed e syntax highlighting com Prism.js. Animações de partículas com TsParticles, marquee infinito de tecnologias e preferências de leitura com tema claro/escuro no blog.',
    url: 'https://github.com/alissonlimabr/portfolio',
    skills: PORTFOLIO_SKILLS,
    size: 'featured',
  },
  {
    title: 'Autenticação JWT',
    subtitle: 'Java · Spring Security 6 · Kubernetes',
    description:
      'Microsserviço de autenticação JWT orquestrado no Azure com Kubernetes e Docker. Frontend Angular consumindo a API.',
    url: 'https://github.com/alissonlimabr/microservice-login-jwt',
    skills: AUTH_JWT_SKILLS,
    size: 'standard',
  },
    {
    title: 'Motovoice',
    subtitle: 'Spring Boot · Angular · Admin Panel',
    description:
      'Sistema de coleta de ideias e feedbacks de produtos Motorola, com painel de gerenciamento e insights da plataforma. Produto sob demanda para a conclusão da 1ª turma do WebAcademy.',
    url: 'https://motovoice.alissonlimadev.com/',
    skills: MOTOVOICE_SKILLS,
    size: 'standard',
  },
  {
    title: 'Reset Password',
    subtitle: 'Java 17 · GitHub Actions · AWS',
    description:
      'Módulo de recuperação de senhas via email com pipeline CI/CD GitHub Actions para deploy AWS. Frontend Angular consumindo a API.',
    url: 'https://github.com/alissonlimabr/forgotPassword',
    skills: RESET_PASSWORD_SKILLS,
    size: 'standard',
  },
  {
    title: 'Plataforma de eventos',
    subtitle: 'React · Vite · GraphQL · Tailwind',
    description:
      'Plataforma de hospedagem de vídeos e aulas desenvolvida no Ignite Lab da Rocketseat.',
    url: 'https://github.com/alissonlimabr/event-plataform-reactjs',
    skills: EVENT_PLATAFORM_SKILLS,
    size: 'standard',
  },
];
