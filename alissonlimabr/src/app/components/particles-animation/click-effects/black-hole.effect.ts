import type { Container, Particle } from '@tsparticles/engine';
import {
  CanvasOrigin,
  OverlayCanvas,
  Point,
  baseOpacity,
  canvasOrigin,
  clearBubble,
  createSpan,
  distance,
  setBubble,
  toViewport,
} from './particle-utils';

const DURATION = 3200;
const COLLAPSE = 640;
const RELEASE_DELAY = 320;
const SIZE = 110;
const MOBILE_SCALE = 0.75;
const MOBILE_WIDTH = 600;
const MAX_HOLES = 6;
const REACH = 380;
const REACH_VIEWPORT = 0.55;
const HORIZON = 14;
const SHRINK_DISTANCE = 60;
const PULL_MIN = 25;
const PULL_MAX = 240;
const SWIRL = 0.9;
const RAMP_UP = 380;
const ORBIT_SPIN = 6000;

const MAX_CLICKS = 4; // 3 erros ficam em órbita; o 4º clique estoura em 500
const MASS_GROWTH = 0.3;
const MERGE_TRAVEL_MIN = 350;
const MERGE_TRAVEL_PER_PX = 1.4;
const MERGE_EXTRA_TIME = 1400;
const MERGE_REACH_GAIN = 1.1;
const MERGE_PULL_GAIN = 1.15;
const CRASH_DELAY = 900;
const CRASH_FLICKER = 900;

const CAPACITY_PER_MASS = 5;
const ORBIT_RADIUS = 34;
const ORBIT_CAPTURE = 1.8;
const ORBIT_SPEED = 2.4;
const MAX_ORBITING = 10;
const SPAWN_INTERVAL = 450;
const SPAWN_FADE = 700;

const TETHER_FROM = 0.35;
const TETHER_COLOR = '201, 161, 240';
const ERROR_ORBIT = 56;
const SWEEP = 320;
const STREAK_COUNT = 3;
const STREAK_GRADIENT =
  'conic-gradient(rgba(201, 161, 240, 0) 0deg 170deg, rgba(201, 161, 240, 0.9) 290deg, rgba(240, 225, 252, 1) 296deg, rgba(201, 161, 240, 0) 297deg)';
const STREAK_MASK = 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))';
const ERRORS = ['400', '403', '404', 'NaN', 'null', 'undefined', 'TypeError', 'None', 'KeyError'];

interface Hole {
  center: Point;
  start: number;
  end: number;
  reach: number;
  base: number;
  mass: number;
  clicks: number;
  pull: number;
  wrapper: HTMLElement;
  body: HTMLElement;
  errors: HTMLElement;
  labels: string[];
  consumed: number;
  orbiting: Map<Particle, number>;
  shrinking: Set<Particle>;
  critical: boolean;
  collapsing: boolean;
  releaseAt: number;
}

export class BlackHoleEffect {
  private holes: Hole[] = [];
  private readonly spawning = new Map<Particle, number>();
  private readonly overlay: OverlayCanvas;
  private readonly linkOpacity: number;
  private frame: number | null = null;
  private lastTick = 0;
  private lastError = '';
  private debt = 0;
  private lastSpawn = 0;
  private flickerUntil = 0;

  constructor(
    private readonly container: Container,
    private readonly layer: HTMLElement,
    private readonly fpsLimit: number,
  ) {
    this.overlay = new OverlayCanvas(layer);
    this.linkOpacity = linkOptions(container.actualOptions.particles)?.opacity ?? 0;
  }

  private get document(): Document {
    return this.layer.ownerDocument;
  }

  trigger(point: Point): void {
    // Funde no buraco mais próximo que ainda aceita cliques; se nenhum aceita, nasce um novo no ponto,
    // desde que não fique por cima de um buraco existente
    const target = this.holes
      .filter((hole) => !hole.collapsing && hole.clicks < MAX_CLICKS && distance(hole.center, point) < hole.reach)
      .sort((a, b) => distance(a.center, point) - distance(b.center, point))[0];
    const overlaps = this.holes.some((hole) => distance(hole.center, point) < (SIZE / 2) * (scale(hole) + hole.base));
    if (target) {
      this.merge(target, point);
    } else if (!overlaps && this.holes.length < MAX_HOLES) {
      this.holes.push(this.createHole(point));
      if (this.frame === null) {
        this.lastTick = performance.now();
        this.frame = requestAnimationFrame((now) => this.tick(now));
      }
    }
  }

  private createHole(center: Point): Hole {
    const viewportWidth = this.document.defaultView?.innerWidth ?? REACH;
    const base = viewportWidth <= MOBILE_WIDTH ? MOBILE_SCALE : 1;
    const wrapper = createSpan(this.document, {
      position: 'fixed',
      left: `${center.x - SIZE / 2}px`,
      top: `${center.y - SIZE / 2}px`,
      width: `${SIZE}px`,
      height: `${SIZE}px`,
      pointerEvents: 'none',
      zIndex: '1',
      transform: `scale(${base})`,
    });
    const body = createSpan(this.document, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
    const errors = createSpan(this.document, { position: 'absolute', inset: '0' });
    spin(errors, 360);
    wrapper.append(body, errors);
    this.addVortex(body);
    this.layer.append(wrapper);
    const labels: string[] = [];
    this.addError(errors, this.nextError(labels));
    glitch(body, 480);

    const now = performance.now();
    return {
      center,
      start: now,
      end: now + DURATION,
      reach: Math.min(REACH, viewportWidth * REACH_VIEWPORT),
      base,
      mass: 1,
      clicks: 1,
      pull: 1,
      wrapper,
      body,
      errors,
      labels,
      consumed: 0,
      orbiting: new Map(),
      shrinking: new Set(),
      critical: false,
      collapsing: false,
      releaseAt: 0,
    };
  }

  private addVortex(body: HTMLElement): void {
    const orbit = this.circle(90, { border: '1px solid rgba(168, 85, 247, 0.3)' });
    orbit.append(this.circle(6, { top: '-3px', left: 'calc(50% - 3px)', background: '#a855f7', boxShadow: '0 0 10px #a855f7' }));
    spin(orbit, 360);
    body.append(orbit);

    for (let index = 0; index < STREAK_COUNT; index++) {
      const streak = this.circle(78, {
        background: STREAK_GRADIENT,
        maskImage: STREAK_MASK,
        webkitMaskImage: STREAK_MASK,
        opacity: '0',
      } as Partial<CSSStyleDeclaration>);
      const turn = (index * 360) / STREAK_COUNT;
      streak.animate(
        [
          { transform: `rotate(${turn}deg) scale(1)`, opacity: 0 },
          { transform: `rotate(${turn + 90}deg) scale(0.75)`, opacity: 1, offset: 0.35 },
          { transform: `rotate(${turn + 260}deg) scale(0.42)`, opacity: 0.8, offset: 0.75 },
          { transform: `rotate(${turn + 520}deg) scale(0.15)`, opacity: 0 },
        ],
        { duration: 1500, delay: index * 500, iterations: Infinity, easing: 'ease-in' },
      );
      body.append(streak);
    }

    body.append(
      this.circle(26, {
        background: 'radial-gradient(circle, rgba(10, 8, 20, 0.95) 55%, rgba(124, 58, 237, 0.35))',
        boxShadow: '0 0 14px rgba(168, 85, 247, 0.55)',
      }),
    );
  }

  private circle(size: number, styles: Partial<CSSStyleDeclaration>): HTMLSpanElement {
    return createSpan(this.document, { position: 'absolute', width: `${size}px`, height: `${size}px`, borderRadius: '50%', ...styles });
  }

  private expandRing(parent: HTMLElement, center: Point, size: number, toScale: number, duration: number): void {
    const ring = this.circle(size, {
      left: `${center.x - size / 2}px`,
      top: `${center.y - size / 2}px`,
      border: '1px solid rgba(232, 121, 249, 0.85)',
      boxShadow: '0 0 14px rgba(168, 85, 247, 0.7)',
      pointerEvents: 'none',
      zIndex: '1',
    });
    parent.append(ring);
    ring.animate(
      [
        { transform: 'scale(0.3)', opacity: 1 },
        { transform: `scale(${toScale})`, opacity: 0 },
      ],
      { duration, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
    ).onfinish = () => ring.remove();
  }

  // Sorteia um erro que ainda não está neste buraco e difere do último exibido
  private nextError(used: string[]): string {
    const pool = ERRORS.filter((error) => error !== this.lastError && !used.includes(error));
    this.lastError = pool[Math.floor(Math.random() * pool.length)];
    used.push(this.lastError);
    return this.lastError;
  }

  private addError(ring: HTMLElement, text: string): void {
    const holder = createSpan(this.document, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%) scale(0.2)',
      opacity: '0',
      transition: 'transform 450ms cubic-bezier(0.33, 1, 0.68, 1), opacity 450ms',
    });
    const label = createSpan(this.document, {
      display: 'block',
      font: "600 9px 'Fira Code', monospace",
      color: '#c9a1f0',
      textShadow: '0 0 6px rgba(168, 85, 247, 0.9)',
      whiteSpace: 'nowrap',
    });
    label.textContent = text;
    // Gira ao contrário, em fase com o anel, para o texto ficar sempre na horizontal
    spin(label, -360).currentTime = ring.getAnimations()[0]?.currentTime ?? 0;
    holder.append(label);
    ring.append(holder);
    holder.getBoundingClientRect();

    const items = Array.from(ring.children) as HTMLElement[];
    items.forEach((item, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / items.length;
      item.style.transform = `translate(-50%, -50%) translate(${(Math.cos(angle) * ERROR_ORBIT).toFixed(1)}px, ${(Math.sin(angle) * ERROR_ORBIT).toFixed(1)}px)`;
      item.style.opacity = '1';
    });
  }

  private merge(hole: Hole, from: Point): void {
    const last = ++hole.clicks >= MAX_CLICKS;
    const error = this.nextError(hole.labels);
    const satellite = this.circle(30, {
      position: 'fixed',
      left: `${from.x - 15}px`,
      top: `${from.y - 15}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid rgba(201, 161, 240, 0.8)',
      boxShadow: '0 0 12px rgba(168, 85, 247, 0.6), inset 0 0 8px rgba(168, 85, 247, 0.5)',
      font: "600 8px 'Fira Code', monospace",
      color: '#c9a1f0',
      pointerEvents: 'none',
      zIndex: '1',
    });
    satellite.textContent = error;
    this.layer.append(satellite);
    satellite.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${hole.center.x - from.x}px, ${hole.center.y - from.y}px) scale(0.2)`, opacity: 0.4 },
      ],
      { duration: MERGE_TRAVEL_MIN + distance(hole.center, from) * MERGE_TRAVEL_PER_PX, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)' },
    ).onfinish = () => {
      satellite.remove();
      if (hole.collapsing || hole.critical) {
        return;
      }
      this.addError(hole.errors, error);
      if (last) {
        this.crash(hole);
        return;
      }
      const from = scale(hole);
      hole.mass++;
      hole.end += MERGE_EXTRA_TIME;
      hole.reach *= MERGE_REACH_GAIN;
      hole.pull *= MERGE_PULL_GAIN;
      hole.wrapper.animate([{ transform: `scale(${from})` }, { transform: `scale(${scale(hole)})` }], {
        duration: 350,
        easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
        fill: 'forwards',
      });
      glitch(hole.body, 200);
    };
  }

  private crash(hole: Hole): void {
    hole.critical = true;
    hole.end = performance.now() + CRASH_DELAY + COLLAPSE * 2;
    for (const item of Array.from(hole.errors.children) as HTMLElement[]) {
      item.style.transform = 'translate(-50%, -50%) scale(0.2)';
      item.style.opacity = '0';
    }

    const code = createSpan(this.document, {
      position: 'absolute',
      font: "700 11px 'Fira Code', monospace",
      color: '#e879f9',
      textShadow: '0 0 8px rgba(232, 121, 249, 0.9)',
    });
    code.textContent = '500';
    hole.body.append(code);
    code.animate([{ transform: 'scale(0.4)' }, { transform: 'scale(1)' }], { duration: 250, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' });
    code.animate([{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }], { duration: 220, iterations: Infinity, easing: 'steps(2, jump-none)' });
    glitch(code, 300);
    hole.body.animate(
      Array.from({ length: 10 }, (_, i) => ({
        translate: `${((Math.random() - 0.5) * (2 + i)).toFixed(1)}px ${((Math.random() - 0.5) * (2 + i)).toFixed(1)}px`,
      })),
      { duration: CRASH_DELAY, easing: 'steps(10)' },
    );

    setTimeout(() => {
      hole.consumed += hole.orbiting.size;
      hole.orbiting.forEach((_, particle) => this.container.particles.remove(particle));
      hole.orbiting.clear();
      this.flickerUntil = performance.now() + CRASH_FLICKER;
      glitch(hole.body, 600);
      this.expandRing(this.layer, hole.center, 60, 9, 800);
      this.collapse(hole, performance.now());
    }, CRASH_DELAY);
  }

  private collapse(hole: Hole, now: number): void {
    hole.collapsing = true;
    hole.releaseAt = now + RELEASE_DELAY;
    this.expandRing(hole.wrapper, { x: SIZE / 2, y: SIZE / 2 }, 30, ((ERROR_ORBIT + 20) * 2) / 30, SWEEP);
    for (const item of Array.from(hole.errors.children) as HTMLElement[]) {
      item.animate([{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(3px)' }], {
        delay: SWEEP * 0.45,
        duration: SWEEP * 0.55,
        fill: 'forwards',
      });
    }
    glitch(hole.body, RELEASE_DELAY);
    hole.body.animate(
      [
        { transform: 'scale(1, 1)', opacity: 1 },
        { transform: 'scale(1.1, 0.02)', opacity: 1, offset: 0.45 },
        { transform: 'scale(0.02, 0.02)', opacity: 1, offset: 0.85 },
        { transform: 'scale(0, 0)', opacity: 0 },
      ],
      { duration: COLLAPSE, easing: 'ease-in', fill: 'forwards' },
    ).onfinish = () => hole.wrapper.remove();
    hole.wrapper.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(3)' }, { filter: 'brightness(1)' }], { duration: COLLAPSE });
  }

  private tick(now: number): void {
    if (now - this.lastTick < 1000 / this.fpsLimit) {
      this.frame = requestAnimationFrame((next) => this.tick(next));
      return;
    }
    const origin = canvasOrigin(this.container);
    if (!origin) {
      this.frame = null;
      return;
    }

    const seconds = Math.min(now - this.lastTick, 100) / 1000;
    this.lastTick = now;
    const particles = this.container.particles.filter((particle) => !particle.destroyed);
    const captured = new Set(this.holes.flatMap((hole) => [...hole.orbiting.keys()]));
    const ctx = this.overlay.context();

    this.flickerLinks(now, particles);
    this.spawn(now);
    this.holes = this.holes.filter((hole) => this.updateHole(hole, now, seconds, particles, captured, origin, ctx));

    if (this.holes.length || this.spawning.size || this.debt > 0 || this.flickerUntil) {
      this.frame = requestAnimationFrame((next) => this.tick(next));
    } else {
      this.overlay.clear();
      this.frame = null;
    }
  }

  private flickerLinks(now: number, particles: Particle[]): void {
    if (!this.flickerUntil) {
      return;
    }
    const active = now < this.flickerUntil;
    if (!active) {
      this.flickerUntil = 0;
    }
    for (const particle of particles) {
      const links = linkOptions(particle.options);
      if (links) {
        links.opacity = active && Math.random() < 0.5 ? 0 : this.linkOpacity * (active ? Math.random() : 1);
      }
    }
  }

  private spawn(now: number): void {
    if (this.debt > 0 && now - this.lastSpawn >= SPAWN_INTERVAL) {
      const { width, height } = this.container.canvas.size;
      const particle = this.container.particles.addParticle({ x: Math.random() * width, y: Math.random() * height });
      this.lastSpawn = now;
      this.debt--;
      if (particle) {
        this.spawning.set(particle, now);
      }
    }

    for (const [particle, spawnedAt] of this.spawning) {
      const fade = (now - spawnedAt) / SPAWN_FADE;
      if (fade >= 1 || particle.destroyed) {
        clearBubble(particle);
        this.spawning.delete(particle);
      } else {
        setBubble(particle, Math.max(particle.size.value * fade, 0.01), baseOpacity(particle) * fade);
      }
    }
  }

  private updateHole(
    hole: Hole,
    now: number,
    seconds: number,
    particles: Particle[],
    captured: Set<Particle>,
    origin: CanvasOrigin,
    ctx: CanvasRenderingContext2D | undefined,
  ): boolean {
    if (!hole.collapsing && now >= hole.end - COLLAPSE) {
      this.collapse(hole, now);
    }
    if (hole.collapsing && now >= hole.releaseAt) {
      hole.shrinking.forEach(clearBubble);
      this.debt += hole.consumed;
      return false;
    }

    const { x: hx, y: hy } = hole.center;
    const size = scale(hole);
    const orbitRadius = ORBIT_RADIUS * size;
    for (const [particle, angle] of hole.orbiting) {
      if (particle.destroyed) {
        hole.orbiting.delete(particle);
        continue;
      }
      const next = angle + ORBIT_SPEED * seconds;
      hole.orbiting.set(particle, next);
      particle.position.x = (hx + Math.cos(next) * orbitRadius - origin.left) * origin.ratio;
      particle.position.y = (hy + Math.sin(next) * orbitRadius - origin.top) * origin.ratio;
    }

    const full = hole.consumed >= CAPACITY_PER_MASS * hole.mass;
    const horizon = HORIZON * size;
    const shrinkDistance = SHRINK_DISTANCE * size;
    const strength = Math.min((now - hole.start) / RAMP_UP, 1);

    for (const particle of particles) {
      if (captured.has(particle)) {
        continue;
      }
      const position = toViewport(particle, origin);
      const dx = hx - position.x;
      const dy = hy - position.y;
      const gap = Math.hypot(dx, dy);
      if (gap > hole.reach) {
        continue;
      }
      if (full) {
        if (gap < orbitRadius * ORBIT_CAPTURE && hole.orbiting.size < MAX_ORBITING) {
          hole.orbiting.set(particle, Math.atan2(-dy, -dx));
          hole.shrinking.delete(particle);
          captured.add(particle);
          clearBubble(particle);
          continue;
        }
      } else if (gap < horizon) {
        hole.shrinking.delete(particle);
        hole.consumed++;
        this.container.particles.remove(particle);
        continue;
      } else if (gap < shrinkDistance && !this.spawning.has(particle)) {
        const remaining = (gap - horizon) / (shrinkDistance - horizon);
        hole.shrinking.add(particle);
        setBubble(particle, particle.size.value * (0.2 + 0.8 * remaining), baseOpacity(particle) * (0.3 + 0.7 * remaining));
      }

      const closeness = 1 - gap / hole.reach;
      if (ctx && closeness > TETHER_FROM) {
        ctx.strokeStyle = `rgba(${TETHER_COLOR}, ${(((closeness - TETHER_FROM) / (1 - TETHER_FROM)) * 0.45 * strength).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(hx, hy);
        ctx.stroke();
      }

      const step = Math.min((PULL_MIN + (PULL_MAX - PULL_MIN) * closeness ** 2) * hole.pull * strength * seconds, gap);
      const nx = dx / gap;
      const ny = dy / gap;
      particle.position.x += (nx - ny * SWIRL * closeness) * step * origin.ratio;
      particle.position.y += (ny + nx * SWIRL * closeness) * step * origin.ratio;
    }
    return true;
  }
}

function linkOptions(options: object): { opacity: number } | undefined {
  return (options as { links?: { opacity: number } }).links;
}

function spin(element: HTMLElement, degrees: number): Animation {
  return element.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${degrees}deg)` }], {
    duration: ORBIT_SPIN,
    iterations: Infinity,
  });
}

function scale(hole: Hole): number {
  return hole.base * (1 + MASS_GROWTH * (hole.mass - 1));
}

function glitch(element: HTMLElement, duration: number): void {
  const split = (offset: number) =>
    `drop-shadow(${-offset}px 0 rgba(124, 58, 237, 0.9)) drop-shadow(${offset}px 0 rgba(232, 121, 249, 0.85))`;
  const frames: Keyframe[] = [];
  for (let i = 0; i < 9; i++) {
    const top = Math.round(Math.random() * 40);
    const height = 30 + Math.round(Math.random() * 30);
    frames.push({
      translate: `${Math.round((Math.random() - 0.5) * 8)}px ${Math.round((Math.random() - 0.5) * 2)}px`,
      clipPath: i % 3 === 1 ? `inset(${top}% -30% ${Math.max(100 - top - height, 0)}% -30%)` : 'inset(-30%)',
      filter: split(1 + Math.round(Math.random() * 2)),
      opacity: i % 3 === 2 ? 0.6 : 1,
      easing: 'steps(1)',
    });
  }
  frames.push({ translate: '0 0', clipPath: 'inset(-30%)', filter: 'none', opacity: 1 });
  element.animate(frames, { duration });
}
