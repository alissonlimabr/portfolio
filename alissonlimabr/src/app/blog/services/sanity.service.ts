import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { marked } from 'marked';
import { environment } from '../../../environments/environment';
import {
  Category,
  Author,
  Post,
  PostSummary,
  PortableTextBlock,
  PortableTextChild,
} from '../models/post.model';

export interface ImageOptions {
  w?: number;
  h?: number;
  fit?: 'crop' | 'fill' | 'max' | 'min' | 'scale';
  q?: number;
  rect?: string;
}

@Injectable({ providedIn: 'root' })
export class SanityService {
  constructor(private http: HttpClient) {}

  private get baseUrl(): string {
    const { projectId, dataset, apiVersion, useCdn } = environment.sanity;
    const host = useCdn ? 'apicdn' : 'api';
    return `https://${projectId}.${host}.sanity.io/v${apiVersion}/data/query/${dataset}`;
  }

  private query<T>(groq: string, params?: Record<string, unknown>): Observable<T> {
    let httpParams = new HttpParams().set('query', groq);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        httpParams = httpParams.set(`$${k}`, JSON.stringify(v));
      });
    }
    return this.http
      .get<{ result: T }>(this.baseUrl, { params: httpParams })
      .pipe(map(r => r.result));
  }

  optimizeImageUrl(url: string | undefined, opts: ImageOptions = {}): string | undefined {
    if (!url || !/^https?:\/\/cdn\.sanity\.io\//i.test(url)) return url;
    const { w, h, fit = 'crop', q = 75, rect } = opts;
    const params: string[] = ['auto=format', `q=${q}`];
    if (rect) params.push(`rect=${rect}`);
    if (w) params.push(`w=${w}`);
    if (h) params.push(`h=${h}`);
    if (w || h) params.push(`fit=${fit}`);
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}${params.join('&')}`;
  }

  optimizeAuthorImageUrl(author: Author, size = 96): string | undefined {
    const dimensions = author.imageDimensions;
    if (!author.imageUrl || !dimensions?.width || !dimensions.height) {
      return this.optimizeImageUrl(author.imageUrl, { w: size, h: size });
    }

    const crop = author.imageCrop ?? {};
    const left = this.clamp(crop.left ?? 0, 0, 1) * dimensions.width;
    const top = this.clamp(crop.top ?? 0, 0, 1) * dimensions.height;
    const width = Math.max(
      1,
      dimensions.width * (1 - this.clamp(crop.left ?? 0, 0, 1) - this.clamp(crop.right ?? 0, 0, 1))
    );
    const height = Math.max(
      1,
      dimensions.height * (1 - this.clamp(crop.top ?? 0, 0, 1) - this.clamp(crop.bottom ?? 0, 0, 1))
    );
    const side = Math.min(width, height);
    const focusX = this.clamp(author.imageHotspot?.x ?? 0.5, 0, 1) * dimensions.width;
    const focusY = this.clamp(author.imageHotspot?.y ?? 0.5, 0, 1) * dimensions.height;
    const rectLeft = this.clamp(focusX - side / 2, left, left + width - side);
    const rectTop = this.clamp(focusY - side / 2, top, top + height - side);
    const rect = [rectLeft, rectTop, side, side].map(value => Math.round(value)).join(',');

    return this.optimizeImageUrl(author.imageUrl, { w: size, h: size, rect });
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private readonly postSummaryProjection = `
    _id, title, slug, excerpt, publishedAt, tags, featured,
    "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180),
    "imageUrl": mainImage.asset->url,
    "imageAlt": mainImage.alt,
    "categories": categories[]->{ _id, title, slug, description, color }
  `;

  getPosts(): Observable<PostSummary[]> {
    const groq = `
      *[_type == "post"] | order(publishedAt desc) {
        ${this.postSummaryProjection}
      }
    `;
    return this.query<PostSummary[]>(groq);
  }

  getPost(slug: string): Observable<Post> {
    const groq = `
      *[_type == "post" && slug.current == $slug][0] {
        _id, title, slug, excerpt,
        "author": select(
          author._type == "reference" => coalesce(
            author->{
              name,
              bio,
              url,
              "imageUrl": image.asset->url,
              "imageAlt": image.alt,
              "imageCrop": image.crop,
              "imageHotspot": image.hotspot,
              "imageDimensions": image.asset->metadata.dimensions
            },
            { "name": "Alisson Lima", "url": "https://alissonlimadev.com" }
          ),
          defined(author) => { "name": author },
          { "name": "Alisson Lima", "url": "https://alissonlimadev.com" }
        ),
        publishedAt, tags, featured,
        "updatedAt": _updatedAt,
        seoDescription,
        "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180),
        "imageUrl": mainImage.asset->url,
        "imageAlt": mainImage.alt,
        "ogImageUrl": ogImage.asset->url,
        "categories": categories[]->{ _id, title, slug, description, color },
        body[] { ..., _type == "image" => { ..., "url": asset->url } }
      }
    `;
    return this.query<Post>(groq, { slug });
  }

  getRelatedPosts(slug: string, tags: string[], limit: number): Observable<PostSummary[]> {
    if (!tags?.length) {
      return this.getRecentPostsExcluding(slug, limit);
    }
    const groq = `
      *[_type == "post" && slug.current != $slug && count(tags[@ in $tags]) > 0]
      | order(count(tags[@ in $tags]) desc, publishedAt desc) [0...$limit] {
        ${this.postSummaryProjection}
      }
    `;
    return this.query<PostSummary[]>(groq, { slug, tags, limit }).pipe(
      switchMap(results =>
        results.length > 0 ? of(results) : this.getRecentPostsExcluding(slug, limit)
      )
    );
  }

  private getRecentPostsExcluding(slug: string, limit: number): Observable<PostSummary[]> {
    const groq = `
      *[_type == "post" && slug.current != $slug]
      | order(publishedAt desc) [0...$limit] {
        ${this.postSummaryProjection}
      }
    `;
    return this.query<PostSummary[]>(groq, { slug, limit });
  }

  getCategories(): Observable<Category[]> {
    const groq = `
      *[_type == "category"] | order(title asc) {
        _id, title, slug, description, color
      }
    `;
    return this.query<Category[]>(groq);
  }

  getCategoriesWithCount(): Observable<Category[]> {
    const groq = `
      *[_type == "category"] | order(title asc) {
        _id, title, slug, description, color,
        "postCount": count(*[_type == "post" && references(^._id)])
      }
    `;
    return this.query<Category[]>(groq);
  }

  getCategoryBySlug(slug: string): Observable<Category | null> {
    const groq = `
      *[_type == "category" && slug.current == $slug][0] {
        _id, title, slug, description, color
      }
    `;
    return this.query<Category | null>(groq, { slug });
  }

  getPostsByCategory(slug: string): Observable<PostSummary[]> {
    const groq = `
      *[_type == "post" && $slug in categories[]->slug.current]
      | order(publishedAt desc) {
        ${this.postSummaryProjection}
      }
    `;
    return this.query<PostSummary[]>(groq, { slug });
  }

  portableTextToHtml(blocks: PortableTextBlock[]): string {
    if (!Array.isArray(blocks)) return '';
    return blocks
      .map(block => {
        if (block._type === 'image') {
          const url = this.safeUrl(block['url']);
          if (!url) return '';
          const alt = this.escapeAttr(block.alt || '');
          const caption = block['caption'] ? `<figcaption>${this.escapeHtml(block['caption'])}</figcaption>` : '';
          return `<figure><img src="${url}" alt="${alt}" loading="lazy" />${caption}</figure>`;
        }

        // codeBlock = legacy schema; code = @sanity/code-input (new)
        if (block._type === 'codeBlock' || block._type === 'code') {
          const raw = block as unknown as { code?: string; language?: string; filename?: string };
          const lang = (raw.language || 'text').replace(/[^a-z0-9_+-]/gi, '').toLowerCase() || 'text';
          const code = this.escapeHtml(raw.code || '');
          const filename = raw.filename ? this.escapeHtml(raw.filename) : '';
          const header = filename
            ? `<div class="code-block-header"><span class="code-block-filename">${filename}</span><span class="code-block-lang">${this.escapeHtml(lang)}</span></div>`
            : '';
          return `<div class="code-block">${header}<pre class="language-${lang}"><code class="language-${lang}">${code}</code></pre></div>`;
        }

        if (block._type === 'callout') {
          const raw = block as unknown as { type?: string; text?: string };
          const icons: Record<string, string> = { tip: '💡', info: 'ℹ️', warning: '⚠️', danger: '🚫' };
          const type = raw.type || 'info';
          const text = this.escapeHtml(raw.text || '');
          const icon = icons[type] ?? 'ℹ️';
          return `<div class="callout callout--${type}"><span class="callout-icon">${icon}</span><div class="callout-body">${text}</div></div>`;
        }

        if (block._type === 'divider') {
          const style = (block as unknown as { style?: string }).style || 'line';
          return style === 'space'
            ? '<div class="divider divider--space"></div>'
            : '<hr class="divider" />';
        }

        if (block._type === 'markdownBlock') {
          const md = (block as unknown as { markdown?: string }).markdown || '';
          if (!md.trim()) return '';
          // marked.parse com gfm + breaks; sync mode (string)
          const html = marked.parse(md, { async: false, gfm: true, breaks: false }) as string;
          return `<div class="markdown-block">${html}</div>`;
        }

        if (block._type === 'youtube') {
          const raw = block as unknown as { url?: string; caption?: string };
          const videoId = this.extractYouTubeId(raw.url || '');
          if (!videoId) return '';
          const caption = raw.caption ? `<figcaption>${this.escapeHtml(raw.caption)}</figcaption>` : '';
          return `<figure class="video-embed"><div class="video-wrapper"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" loading="lazy" allowfullscreen title="${caption ? this.escapeAttr(raw.caption!) : 'YouTube video'}"></iframe></div>${caption}</figure>`;
        }

        if (block._type !== 'block') return '';

        const defs = block.markDefs || [];
        const children = (block.children || [])
          .map((child: PortableTextChild) => {
            let text = this.escapeHtml(child.text || '');
            (child.marks || []).forEach(mark => {
              if (mark === 'strong') text = `<strong>${text}</strong>`;
              else if (mark === 'em') text = `<em>${text}</em>`;
              else if (mark === 'code') text = `<code>${text}</code>`;
              else if (mark === 'underline') text = `<u>${text}</u>`;
              else if (mark === 'strike-through') text = `<del>${text}</del>`;
              else if (mark === 'highlight') text = `<mark>${text}</mark>`;
              else {
                const def = defs.find(d => d._key === mark);
                if (def?._type === 'link' && def.href) {
                  const safeHref = this.safeUrl(def.href);
                  if (safeHref) {
                    const external = def['blank'] !== false;
                    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
                    text = `<a href="${safeHref}"${attrs}>${text}</a>`;
                  }
                }
              }
            });
            return text;
          })
          .join('');

        switch (block.style) {
          case 'h1': return `<h1>${children}</h1>`;
          case 'h2': return `<h2>${children}</h2>`;
          case 'h3': return `<h3>${children}</h3>`;
          case 'h4': return `<h4>${children}</h4>`;
          case 'blockquote': return `<blockquote>${children}</blockquote>`;
          case 'code': return `<pre class="language-typescript"><code class="language-typescript">${children}</code></pre>`;
          default: return children ? `<p>${children}</p>` : '';
        }
      })
      .join('\n');
  }

  private extractYouTubeId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  }

  private safeUrl(url: string | undefined): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    const lower = trimmed.toLowerCase();
    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
    const allowed = ['http:', 'https:', 'mailto:'];
    if (isAbsolute && !allowed.some(p => lower.startsWith(p))) {
      return null;
    }
    return this.escapeAttr(trimmed);
  }

  private escapeAttr(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
