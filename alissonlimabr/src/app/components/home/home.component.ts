import { Component, OnInit } from '@angular/core';
import { faBars, faCode, faXmark } from '@fortawesome/free-solid-svg-icons';
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

  skills = [
    {
      name: 'Java',
      icon: 'assets/icons/java-icon.svg',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Springboot',
      icon: 'assets/icons/springboot-icon.svg',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Typescript',
      icon: 'assets/icons/typescript-icon.svg',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Angular',
      icon: 'assets/icons/angular-icon.svg',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Nodejs',
      icon: 'assets/icons/nodejs-icon.svg',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Aws Cloud',
      icon: 'assets/icons/aws-icon.svg',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Azure',
      icon: 'assets/icons/azure-icon.svg',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Docker',
      icon: 'assets/icons/docker-icon.svg',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Git',
      icon: 'assets/icons/git-icon.svg',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Figma',
      icon: 'assets/icons/figma-icon.svg',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Bootstrap',
      icon: 'assets/icons/bootstrap-icon.svg',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'Angular Material',
      icon: 'assets/icons/angular-material-icon.svg',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Tailwind',
      icon: 'assets/icons/tailwind-icon.svg',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'MySQL',
      icon: 'assets/icons/mysql-icon.svg',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'GraphQL',
      icon: 'assets/icons/graphql-icon.svg',
      aosAnimation: 'zoom-out-up',
    },
    {
      name: 'RxJs',
      icon: 'assets/icons/rxjs-icon.svg',
      aosAnimation: 'zoom-out-down',
    },
    {
      name: 'Junit',
      icon: 'assets/icons/junit5-icon.svg',
      aosAnimation: 'zoom-out-up',
    },
  ];

  ngOnInit(): void {
    AOS.init();
  }
}
