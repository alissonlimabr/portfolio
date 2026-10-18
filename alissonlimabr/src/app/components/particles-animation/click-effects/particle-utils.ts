import type { Container, Particle } from '@tsparticles/engine';

export interface Point {
  x: number;
  y: number;
}

export interface CanvasOrigin {
  left: number;
  top: number;
  ratio: number;
}

const INTERACTIVE_SELECTOR = [
  'a', 'button', 'input', 'textarea', 'select', 'label', 'summary', '[role="button"]', '[contenteditable]',
  '[appspotlight]', 'article', 'img', 'svg', 'header', 'footer', 'nav', 'mat-sidenav',
].join(', ');

export function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(INTERACTIVE_SELECTOR);
}

export function canvasOrigin(container: Container): CanvasOrigin | null {
  const rect = container.canvas.element?.getBoundingClientRect();
  return rect ? { left: rect.left, top: rect.top, ratio: container.retina.pixelRatio } : null;
}

export function toViewport(particle: Particle, origin: CanvasOrigin): Point {
  return {
    x: particle.position.x / origin.ratio + origin.left,
    y: particle.position.y / origin.ratio + origin.top,
  };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function setBubble(particle: Particle, radius: number, opacity: number): void {
  particle.bubble.inRange = true;
  particle.bubble.radius = radius;
  particle.bubble.opacity = opacity;
}

export function clearBubble(particle: Particle): void {
  particle.bubble.inRange = false;
  delete particle.bubble.opacity;
  delete particle.bubble.radius;
}

export function baseOpacity(particle: Particle): number {
  return particle.opacity?.value ?? 0.4;
}

export function createSpan(document: Document, styles: Partial<CSSStyleDeclaration>): HTMLSpanElement {
  const element = document.createElement('span');
  Object.assign(element.style, styles);
  return element;
}

export class OverlayCanvas {
  private ctx?: CanvasRenderingContext2D;

  constructor(private readonly layer: HTMLElement) {}

  context(): CanvasRenderingContext2D | undefined {
    const window = this.layer.ownerDocument.defaultView;
    if (!window) {
      return undefined;
    }
    if (!this.ctx) {
      const canvas = this.layer.ownerDocument.createElement('canvas');
      Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '1' });
      this.layer.append(canvas);
      this.ctx = canvas.getContext('2d') ?? undefined;
    }

    const ratio = window.devicePixelRatio || 1;
    const canvas = this.ctx?.canvas;
    if (canvas && (canvas.width !== window.innerWidth * ratio || canvas.height !== window.innerHeight * ratio)) {
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      this.ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    this.clear();
    return this.ctx;
  }

  clear(): void {
    this.ctx?.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
}
