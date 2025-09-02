import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-json-ld',
  templateUrl: './json-ld.component.html',
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
      description: 'Portfólio de Alisson Lima, desenvolvedor full stack experiente no Acre. Especialista em Java, Angular, Spring Boot, AWS e soluções web escaláveis.',
      about: 'Graduado em Análise e Desenvolvimento de Sistemas, pós-graduado em Engenharia de Software e com MBA em Gestão de Projetos PMI-PMBok. Experiência como desenvolvedor na Contax S.A e na VINT Global, atuando para a Secretaria da Fazenda do Estado do Acre. Atualmente Analista e Desenvolvedor no IFAC.',
      nationality: 'Brasileiro',
      birthPlace: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Rio Branco',
          addressRegion: 'AC',
          addressCountry: 'BR'
        }
      },
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
      gender: 'Masculino',
      url: 'https://www.alissonlimadev.com',
      image: 'https://i.imgur.com/JLom84P.png',
      email: 'alissonlimabr.dev@gmail.com',
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
        'https://www.instagram.com/alisson_ml/'
      ],
      skills: [
        'HTML5', 'CSS3', 'Java', 'Django', 'Python', 'JavaScript', 'Typescript',
        'Angular', 'Spring', 'AWS', 'Azure', 'Docker', 'SASS', 'MySQL', 'Git', 'Figma'
      ],
      knowsAbout: [
        'Portfólio dev', 'Desenvolvedor Acre', 'Full Stack', 'Java', 'Angular',
        'Spring Boot', 'AWS', 'Desenvolvedor experiente', 'Desenvolvimento Web', 'Arquitetura de Microsserviços'
      ],
      hasOccupation: [
        {
          '@type': 'Occupation',
          name: 'Software Developer',
          description: 'Desenvolvimento e integração de sistemas utilizando Python, Django, PostgreSQL, Docker, Wordpress, Elementor, Figma, Git.',
          startDate: '2025-04',
          employer: {
            '@type': 'Organization', name: 'Instituto Federal do Acre',
            alternateName: 'IFAC'
          }
        },
        {
          '@type': 'Occupation',
          name: 'Desenvolvedor Full Stack',
          description: 'APIs REST, XML/XSLT, Web Services, Angular, Spring Boot, Oracle, Docker, Nginx, Strapi.',
          startDate: '2024-08',
          endDate: '2025-04',
          employer: { '@type': 'Organization', name: 'VINT Global Tecnologia Ltda', alternateName: 'VINT Global' }
        },
        {
          '@type': 'Occupation',
          name: 'Desenvolvedor Full Stack',
          description: 'Projetos freelancer com Angular, Spring Boot, AWS, Azure/Kubernetes, Docker.',
          startDate: '2024-01',
          endDate: '2024-07',
          employer: { '@type': 'Organization', name: 'Freelancer' }
        },
        {
          '@type': 'Occupation',
          name: 'Desenvolvedor Full Stack Jr.',
          description: 'Manutenção e migração de sistemas da Caixa Econômica Federal, Azure DevOps, Docker, Java, SQL Server, PHP.',
          startDate: '2023-09',
          endDate: '2023-11',
          employer: { '@type': 'Organization', name: 'Contax S.A' }
        },
        {
          '@type': 'Occupation',
          name: 'Bolsista em Desenvolvimento Web Full Stack',
          description: 'Desenvolvimento de sistemas para Motorola e Instituto Eldorado, Java, Angular, Spring Boot, AWS, CI/CD.',
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
