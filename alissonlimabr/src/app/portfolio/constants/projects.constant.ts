import { AUTH_JWT_SKILLS } from './auth-jwt-skills.constant';
import { PORTFOLIO_SKILLS } from './portfolio-skills.constant';
import { RESET_PASSWORD_SKILLS } from './reset-password-skills.constant';
import { VOZEIRO_SKILLS } from './vozeiro-skills.constant';

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
    subtitle: 'Angular 22 · SSR · Sanity CMS',
    description:
      'Portfólio com SSR para performance e SEO e blog integrado ao Sanity CMS, com busca, paginação, categorias, RSS e syntax highlighting. Partículas animadas com TsParticles e tema claro/escuro na leitura.',
    url: 'https://github.com/alissonlimabr/portfolio',
    skills: PORTFOLIO_SKILLS,
    size: 'featured',
  },
  {
    title: 'Vozeiro',
    subtitle: 'Python · aiohttp · edge-tts',
    description:
      'Servidor local que gera narração em MP3 a partir de um texto, com as vozes neurais do edge-tts. Fila de narrações em paralelo, histórico de áudios e instalação com uv.',
    url: 'https://github.com/alissonlimabr/vozeiro',
    skills: VOZEIRO_SKILLS,
    size: 'standard',
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
    title: 'Reset Password',
    subtitle: 'Java · GitHub Actions · AWS',
    description:
      'Módulo de recuperação de senhas via email com pipeline CI/CD GitHub Actions para deploy AWS. Frontend Angular consumindo a API.',
    url: 'https://github.com/alissonlimabr/forgotPassword',
    skills: RESET_PASSWORD_SKILLS,
    size: 'standard',
  },
];
