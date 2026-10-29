import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-json-ld',
  templateUrl: './json-ld.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./json-ld.component.scss'],
})
export class JsonLdComponent implements OnInit {
  jsonLD!: SafeHtml;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit() {
    const json = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': 'https://www.alissonlimadev.com/#sobre',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': 'https://www.alissonlimadev.com/'
      },
      name: 'Alisson Lima',
      jobTitle: 'Desenvolvedor Full Stack',
      description: 'Portfólio de Alisson Lima, desenvolvedor full stack no Acre, com experiência em Angular, Django, Java e APIs REST, focado em sistemas web e soluções escaláveis.',
      about: 'Graduado em Análise e Desenvolvimento de Sistemas, pós-graduado em Engenharia de Software e com MBA em Gestão de Projetos PMI-PMBok. Experiência como desenvolvedor na Contax S.A e na VINT Global, atuando para a Secretaria da Fazenda do Estado do Acre. Atualmente Analista de TI e Full Stack Developer no IFAC.',
      nationality: 'Brasileiro',
      homeLocation: {
        '@type': 'Place',
        name: 'Rio Branco, Acre',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Rio Branco',
          addressRegion: 'AC',
          addressCountry: 'BR'
        }
      },
      alumniOf: [
        { '@type': 'EducationalOrganization', name: 'MBA em Gestão de Projetos PMI-PMBok', sameAs: 'https://fasuleducacional.edu.br' },
        { '@type': 'EducationalOrganization', name: 'Engenharia de Software', sameAs: 'https://fasuleducacional.edu.br' },
        { '@type': 'EducationalOrganization', name: 'Capacitação em Desenvolvimento Full Stack', sameAs: 'https://www.ufac.br/' },
        { '@type': 'CollegeOrUniversity', name: 'Análise e Desenvolvimento de Sistemas', sameAs: 'https://www.unigran.br/' }
      ],
      url: 'https://www.alissonlimadev.com',
      image: 'https://www.alissonlimadev.com/assets/img/profile.webp',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Rio Branco',
        addressRegion: 'AC',
        addressCountry: 'BR'
      },
      sameAs: [
        'https://www.linkedin.com/in/alissonlimadev/',
        'https://github.com/alissonlimabr',
        'https://www.youtube.com/@alisson_ml',
        'https://www.instagram.com/alisson_ml/',
        'https://integra.ifac.edu.br/p/alisson-mendonca-de-lima'
      ],
      knowsAbout: [
        'Desenvolvimento Full Stack', 'Desenvolvimento Web', 'Python', 'Django', 'Java', 'Spring Boot',
        'Angular', 'TypeScript', 'APIs REST', 'Docker', 'CI/CD', 'AWS', 'Arquitetura de Microsserviços'
      ],
      hasOccupation: [
        {
          '@type': 'Occupation',
          name: 'Analista de TI | Full Stack Developer',
          skills: ['Python', 'Django', 'APIs REST', 'Docker/Swarm', 'Portainer', 'Nginx', 'CI/CD', 'SonarQube', 'Git'],
          description: 'Desenvolvimento e evolução de sistemas institucionais com Python/Django e APIs REST, integração entre sistemas, CI/CD com testes automatizados e SonarQube, e operação de serviços em containers com Docker/Swarm, Portainer e Nginx.',
          startDate: '2025-04',
          employer: {
            '@type': 'Organization', name: 'Instituto Federal do Acre',
            alternateName: 'IFAC'
          }
        },
        {
          '@type': 'Occupation',
          name: 'Desenvolvedor Full Stack',
          skills: ['Java', 'Spring Boot', 'Angular', 'SOAP', 'XSLT', 'Strapi', 'Docker', 'JUnit 5', 'Nginx', 'Oracle', 'Figma'],
          description: 'Desenvolvimento full stack de sistemas web para a área fiscal, com clientes como a Secretaria da Fazenda do Acre (SEFAZ/AC): APIs REST em Java/Spring Boot, front-end em Angular e integração com web services SOAP.',
          startDate: '2024-08',
          endDate: '2025-04',
          employer: { '@type': 'Organization', name: 'VINT Global Tecnologia Ltda', alternateName: 'VINT Global' }
        },
        {
          '@type': 'Occupation',
          name: 'Desenvolvedor Full Stack',
          skills: ['Angular', 'Spring Boot', 'AWS', 'Azure', 'Kubernetes', 'Docker'],
          description: 'Projetos freelancer com Angular, Spring Boot, AWS, Azure/Kubernetes, Docker.',
          startDate: '2024-01',
          endDate: '2024-07',
          employer: { '@type': 'Organization', name: 'Freelancer' }
        },
        {
          '@type': 'Occupation',
          name: 'Desenvolvedor Full Stack Jr.',
          skills: ['Java', 'SQL Server', 'Git', 'Azure DevOps'],
          description: 'Desenvolvimento e manutenção de sistemas em equipe ágil (Scrum/Kanban), por prazo determinado.',
          startDate: '2023-09',
          endDate: '2023-11',
          employer: { '@type': 'Organization', name: 'Contax S.A' }
        },
        {
          '@type': 'Occupation',
          name: 'Desenvolvedor Full Stack (Bolsista WebAcademy)',
          skills: ['Java', 'Angular', 'Spring Boot', 'TypeScript', 'Node.js', 'CI/CD', 'Cypress', 'Jest', 'AWS', 'JUnit 5'],
          description: 'Capacitação em Desenvolvimento Web Full Stack (WebAcademy), com projetos desenvolvidos em equipe ágil. Desenvolvimento do front-end e correção de bugs.',
          startDate: '2022-03',
          endDate: '2022-10',
          employer: { '@type': 'Organization', name: 'Universidade Federal do Acre', alternateName: 'UFAC' }
        }
      ]
    };


    this.jsonLD = this.getSafeHTML(json);
  }

  getSafeHTML(value: {}) {
    const json = JSON.stringify(value, null, 2);
    const html = `<script type="application/ld+json">${json}</script>`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
