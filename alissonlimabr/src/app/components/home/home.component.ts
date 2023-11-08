import { Component, OnInit } from '@angular/core';
import {
  faArrowUpRightFromSquare,
  faBars,
  faCode,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import * as AOS from 'aos';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  faBars = faBars;
  faXmark = faXmark;
  faCode = faCode;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  skills = [
    {
      name: 'Java',
      icon: 'assets/icons/java-icon.svg',
      alt: 'Logo do Java',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Springboot',
      icon: 'assets/icons/springboot-icon.svg',
      alt: 'Logo do Springboot',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Typescript',
      icon: 'assets/icons/typescript-icon.svg',
      alt: 'Logo do Typescript',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Angular',
      icon: 'assets/icons/angular-icon.svg',
      alt: 'Logo do Angular',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Nodejs',
      icon: 'assets/icons/nodejs-icon.svg',
      alt: 'Logo do Nodejs',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'AWS Cloud',
      icon: 'assets/icons/aws-icon.svg',
      alt: 'Logo da AWS Cloud',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Azure',
      icon: 'assets/icons/azure-icon.svg',
      alt: 'Logo do Azure',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Docker',
      icon: 'assets/icons/docker-icon.svg',
      alt: 'Logo do Docker',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Git',
      icon: 'assets/icons/git-icon.svg',
      alt: 'Logo do Git',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Figma',
      icon: 'assets/icons/figma-icon.svg',
      alt: 'Logo do Figma',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Bootstrap',
      icon: 'assets/icons/bootstrap-icon.svg',
      alt: 'Logo do Bootstrap',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Angular Material',
      icon: 'assets/icons/angular-material-icon.svg',
      alt: 'Logo do Angular Material',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Tailwind',
      icon: 'assets/icons/tailwind-icon.svg',
      alt: 'Logo do Tailwind',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'MySQL',
      icon: 'assets/icons/mysql-icon.svg',
      alt: 'Logo do MySQL',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'GraphQL',
      icon: 'assets/icons/graphql-icon.svg',
      alt: 'Logo do GraphQL',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'RxJs',
      icon: 'assets/icons/rxjs-icon.svg',
      alt: 'Logo do Rxjs',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Junit',
      icon: 'assets/icons/junit5-icon.svg',
      alt: 'Logo do Junit',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Scss',
      icon: 'assets/icons/scss-icon.svg',
      alt: 'Logo do SCSS',
      aosAnimation: 'zoom-out-down',
    },
  ];

  ngOnInit(): void {
    AOS.init();
  }
}
