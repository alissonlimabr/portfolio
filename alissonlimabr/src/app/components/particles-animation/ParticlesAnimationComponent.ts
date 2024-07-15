import { Component, OnInit } from '@angular/core';
import { NgParticlesService } from '@tsparticles/angular';
import { animate, style, transition, trigger } from '@angular/animations';
import {
  IOptions,
  InteractivityDetect,
  MoveDirection,
} from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';

@Component({
  selector: 'app-particles-animation',
  templateUrl: './particles-animation.component.html',
  styleUrls: ['./particles-animation.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('15s', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class ParticlesAnimationComponent implements OnInit {
  id = 'tsparticles';
  particlesOptions = {
    fpsLimit: 24,
    interactivity: {
      detectsOn: 'window' as InteractivityDetect,
      events: {
        onClick: {
          enable: true,
          mode: 'push',
        },
        onHover: {
          enable: true,
          mode: 'grab',
        },
      },
      modes: {
        push: {
          quantity: 1,
        },
      },
    },
    particles: {
      color: {
        value: '#982FCB',
        opacity: 0.3,
      },
      links: {
        color: '#ffffff',
        distance: 150,
        enable: true,
        opacity: 0.3,
        width: 1,
      },
      collisions: {
        enable: true,
      },
      move: {
        direction: 'none' as MoveDirection,
        enable: true,
        outMode: 'bounce',
        speed: 0.5,
      },
      number: {
        density: {
          enable: true,
          value_area: 800,
        },
        value: 60,
      },
      opacity: {
        value: 0.4,
      },
      shape: {
        type: 'circle',
      },
      size: {
        random: true,
        value: 3,
      },
    },
    detectRetina: true,
  };

  constructor(private readonly ngParticlesService: NgParticlesService) {}

  async ngOnInit(): Promise<void> {
    await this.loadParticles();
  }

  private async loadParticles(): Promise<void> {
    await this.ngParticlesService.init(async (engine) => {
      await loadSlim(engine);
    });
  }
}
