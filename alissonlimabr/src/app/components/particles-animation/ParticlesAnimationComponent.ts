import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectionStrategy, ElementRef, inject, signal } from '@angular/core';
import { NgParticlesService, NgxParticlesComponent, NgxParticlesModule } from '@tsparticles/angular';
import { isPlatformBrowser } from '@angular/common';
import type { Container } from '@tsparticles/engine';
import { InteractivityDetect, MoveDirection } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { BlackHoleEffect } from './click-effects/black-hole.effect';
import { Point, distance, isInteractiveTarget } from './click-effects/particle-utils';

const FPS_LIMIT = 24;
const DRAG_TOLERANCE = 5;

@Component({
  selector: 'app-particles-animation',
  templateUrl: './particles-animation.component.html',
  styleUrls: ['./particles-animation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, // 🔹 adicionado
  standalone: true,
  imports: [
    NgxParticlesModule,
  ],
  host: {
    '[class.is-ready]': 'ready()',
    '(window:pointerdown)': 'onPointerDown($event)',
    '(window:click)': 'onClick($event)',
  },
})
export class ParticlesAnimationComponent implements OnInit {
  id = 'tsparticles';
  readonly isBrowser: boolean;
  readonly ready = signal(false);
  particlesOptions = {
    fpsLimit: FPS_LIMIT,
    interactivity: {
      detectsOn: 'window' as InteractivityDetect,
      events: {
        onHover: { enable: true, mode: 'grab' },
      },
    },
    particles: {
      color: { value: '#982FCB', opacity: 0.3 },
      links: { color: '#ffffff', distance: 150, enable: true, opacity: 0.3, width: 1 },
      collisions: { enable: true },
      move: { direction: 'none' as MoveDirection, enable: true, outMode: 'bounce', speed: 0.5 },
      number: { density: { enable: true, value_area: 800 }, value: 60 },
      opacity: { value: 0.4 },
      shape: { type: 'circle' },
      size: { random: true, value: 3 },
    },
    detectRetina: true,
  };

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private blackHoles?: BlackHoleEffect;
  private pointerDown?: Point;

  constructor(
    private readonly ngParticlesService: NgParticlesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit(): Promise<void> {
    if (this.isBrowser) {
      await this.loadParticles();
    }
  }

  onParticlesLoaded(container?: Container): void {
    if (container) {
      this.blackHoles = new BlackHoleEffect(container, this.host.nativeElement, FPS_LIMIT);
    }
    this.ready.set(true);
  }

  onPointerDown(event: PointerEvent): void {
    this.pointerDown = { x: event.clientX, y: event.clientY };
  }

  onClick(event: MouseEvent): void {
    const point = { x: event.clientX, y: event.clientY };
    const dragged = this.pointerDown && distance(point, this.pointerDown) > DRAG_TOLERANCE;
    if (
      this.blackHoles &&
      !dragged &&
      !isInteractiveTarget(event.target) &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.blackHoles.trigger(point);
    }
  }

  private async loadParticles(): Promise<void> {
    await this.ngParticlesService.init(async (engine) => {
      await loadSlim(engine);
    });
  }
}
