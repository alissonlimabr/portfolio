import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-json-ld',
  templateUrl: './json-ld.component.html',
  styleUrls: ['./json-ld.component.scss'],
})
export class JsonLdComponent implements OnInit {
  jsonLD!: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    const json = {
      '@context': 'http://www.schema.org',
      '@type': 'Person',
      '@id': 'https://www.alissonlimadev.com/#sobre',
      name: 'Alisson Lima',
      about:
        'Nasci em Rio Branco, Acre, sou Graduado em Análise e Desenvolvimento de Sistemas e Pós-graduado em Engenharia de Software pela Faculdade Cruzeiro do Sul - FASUL. Tenho experiência com desenvolvimento em Java, Spring Boot, Angular, AWS e outras tecnologias, além de metodologias ágeis como Scrum e Kanban. Desse modo, estou sempre procurando refinar meus conhecimentos e habilidades, seja participando de bootcamps ou realizando um projeto novo.',
      nationality: 'Brasileiro',
      birthPlace: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Rio Branco',
          addressRegion: 'AC',
          addressCountry: 'BR',
        },
      },
      alumniOf: [
        {
          '@type': 'CollegeOrUniversity',
          name: 'Engenharia de Software',
          sameAs: 'https://fasuleducacional.edu.br',
        },
        {
          '@type': 'CollegeOrUniversity',
          name: 'Capacitação em Desenvolvimento Full Stack',
          sameAs: 'https://www.ufac.br/',
        },
        {
          '@type': 'CollegeOrUniversity',
          name: 'Análise e Desenvolvimento de Sistemas',
          sameAs: 'https://www.unigran.br/',
        },
      ],
      gender: 'Masculino',
      description:
        'Desenvolvedor Full Stack pós-graduado em Engenharia de Software com experiência em JavaScript, Java, Spring Boot, Angular, AWS, Azure e Git.',
      jobTitle: 'Desenvolvedor Full Stack',
      url: 'https://www.alissonlimadev.com',
      image: 'https://i.imgur.com/JLom84P.png',
      email: 'mailto:alissonlimabr.dev@gmail.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Rio Branco',
        addressRegion: 'AC',
        addressCountry: 'BR',
      },
      sameAs: [
        'https://www.linkedin.com/in/alissonlimadev/',
        'https://github.com/alissonlimabr',
        'https://www.facebook.com/alisson.mendoncalima/',
        'https://www.youtube.com/@alisson_ml',
        'https://www.instagram.com/alisson_ml/',
      ],
      skills: [
        'HTML5',
        'CSS3',
        'Java',
        'JavaScript',
        'Typescript',
        'Angular',
        'Spring',
        'AWS',
        'Azure',
        'Docker',
        'SASS',
        'MySQL',
        'Git',
        'Figma',
      ],
      workExample: [
        {
          '@type': 'CreativeWork',
          name: 'Motovoice',
          description:
            'Sistema de coleta de ideias e feedbacks de produtos Motorola, desenvolvido em Spring Boot e Angular. Conta com um painel de gerenciamento e insights da plataforma para o admin. Este foi um produto sob demanda para a conclusão da 1ª turma do curso WebAcademy.',
        },
        {
          '@type': 'CreativeWork',
          name: 'Autenticação JWT',
          description:
            'Microsserviço de autenticação JWT desenvolvido em Java, Spring Boot, Spring Security 6 e Java 17. Orquestrado no Azure utilizando Kubernetes e Docker. Também possui um front-end em Angular para consumir esse microsserviço.',
        },
        {
          '@type': 'CreativeWork',
          name: 'Portfólio Desenvolvedor',
          description:
            'O site foi prototipado no Figma e teve seu front-end desenvolvido utilizando o framework Angular, juntamente com Angular Material e SCSS. O projeto visa demonstrar meu projetos front-end e back-end, habilidades, trabalhos desenvolvidos e muito mais.',
        },
        {
          '@type': 'CreativeWork',
          name: 'Reset Password',
          description:
            'Módulo de recuperação de senhas via e-mail com back-end desenvolvido em Spring Boot e front-end desenvolvido com framework Angular. Conta com um pipeline de CI/CD via GitHub Actions para deploy na AWS.',
        },
        {
          '@type': 'CreativeWork',
          name: 'Plataforma de eventos',
          description:
            'Plataforma de hospedagem de vídeos e aulas desenvolvida utilizando ReactJs, Vite, GraphQL e Tailwind. Fomentado pela Rocketseat através do curso Ignite Lab.',
        },
      ],
    };

    this.jsonLD = this.getSafeHTML(json);
  }

  getSafeHTML(value: {}) {
    const json = JSON.stringify(value, null, 2).replace(/\//g, '\\/');
    const html = `<script type="application/ld+json">${json}</script>`;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
