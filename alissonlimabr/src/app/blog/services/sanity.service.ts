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
  PortableTextMark,
} from '../models/post.model';

export interface ImageOptions {
  w?: number;
  h?: number;
  fit?: 'crop' | 'fill' | 'max' | 'min' | 'scale';
  q?: number;
  rect?: string;
}

const CALLOUT_ICONS = {
  tip: '💡',
  info: 'ℹ️',
  warning: '⚠️',
  danger: '🚫',
} as const;

const TEXT_BLOCK_TAGS: Record<string, string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  blockquote: 'blockquote',
};

@Injectable({ providedIn: 'root' })
export class SanityService {
  constructor(private http: HttpClient) {}

  private get baseUrl(): string {
    const { projectId, dataset, apiVersion, useCdn } = environment.sanity;
    const host = useCdn ? 'apicdn' : 'api';
    return `https://${projectId}.${host}.sanity.io/v${apiVersion}/data/query/${dataset}`;
  }

  private query<T>(
    groq: string,
    params?: Record<string, unknown>,
  ): Observable<T> {
    let httpParams = new HttpParams().set('query', groq);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        httpParams = httpParams.set(`$${k}`, JSON.stringify(v));
      });
    }
    return this.http
      .get<{ result: T }>(this.baseUrl, { params: httpParams })
      .pipe(map((r) => r.result));
  }

  optimizeImageUrl(
    url: string | undefined,
    opts: ImageOptions = {},
  ): string | undefined {
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
      dimensions.width *
        (1 -
          this.clamp(crop.left ?? 0, 0, 1) -
          this.clamp(crop.right ?? 0, 0, 1)),
    );
    const height = Math.max(
      1,
      dimensions.height *
        (1 -
          this.clamp(crop.top ?? 0, 0, 1) -
          this.clamp(crop.bottom ?? 0, 0, 1)),
    );
    const side = Math.min(width, height);
    const focusX =
      this.clamp(author.imageHotspot?.x ?? 0.5, 0, 1) * dimensions.width;
    const focusY =
      this.clamp(author.imageHotspot?.y ?? 0.5, 0, 1) * dimensions.height;
    const rectLeft = this.clamp(focusX - side / 2, left, left + width - side);
    const rectTop = this.clamp(focusY - side / 2, top, top + height - side);
    const rect = [rectLeft, rectTop, side, side]
      .map((value) => Math.round(value))
      .join(',');

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
            { "name": "Alisson Lima", "url": "https://www.alissonlimadev.com" }
          ),
          defined(author) => { "name": author },
          { "name": "Alisson Lima", "url": "https://www.alissonlimadev.com" }
        ),
        publishedAt, tags, featured,
        updatedAt,
        "systemCreatedAt": _createdAt,
        "systemUpdatedAt": _updatedAt,
        seoDescription,
        "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180),
        "imageUrl": mainImage.asset->url,
        "imageAlt": mainImage.alt,
        "ogImageUrl": ogImage.asset->url,
        "categories": categories[]->{ _id, title, slug, description, color },
        body[] {
          ...,
          markDefs[] {
            ...,
            _type == "internalLink" => {
              ...,
              "slug": reference->slug,
              "documentType": reference->_type
            }
          },
          _type == "image" => { ..., "url": asset->url }
        }
      }
    `;
    return this.query<Post>(groq, { slug });
  }

  getRelatedPosts(
    slug: string,
    tags: string[],
    limit: number,
  ): Observable<PostSummary[]> {
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
      switchMap((results) =>
        results.length > 0
          ? of(results)
          : this.getRecentPostsExcluding(slug, limit),
      ),
    );
  }

  private getRecentPostsExcluding(
    slug: string,
    limit: number,
  ): Observable<PostSummary[]> {
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
    const html: string[] = [];
    let index = 0;

    while (index < blocks.length) {
      const block = blocks[index];

      if (this.isListBlock(block)) {
        const renderedList = this.renderList(blocks, index);
        if (renderedList.html) {
          html.push(renderedList.html);
        }
        index = renderedList.nextIndex;
        continue;
      }

      const renderedBlock = this.renderBlock(block);
      if (renderedBlock) {
        html.push(renderedBlock);
      }
      index += 1;
    }

    return html.join('\n');
  }

  private renderBlock(block: PortableTextBlock): string {
    switch (block._type) {
      case 'image':
        return this.renderImageBlock(block);
      // codeBlock = legacy schema; code = @sanity/code-input (new)
      case 'codeBlock':
      case 'code':
        return this.renderCodeBlock(block);
      case 'callout':
        return this.renderCalloutBlock(block);
      case 'divider':
        return this.renderDividerBlock(block);
      case 'markdownBlock':
        return this.renderMarkdownBlock(block);
      case 'youtube':
        return this.renderYoutubeBlock(block);
      case 'block':
        return this.renderTextBlock(block);
      default:
        return '';
    }
  }

  private renderImageBlock(block: PortableTextBlock): string {
    const url = this.safeUrl(block.url);
    if (!url) return '';
    const alt = this.escapeAttr(block.alt || '');
    const caption = this.renderCaption(block.caption);
    return `<figure><img src="${url}" alt="${alt}" loading="lazy" />${caption}</figure>`;
  }

  private renderCodeBlock(block: PortableTextBlock): string {
    const raw = block as PortableTextBlock & {
      code?: string;
      language?: string;
      filename?: string;
    };
    const lang = this.normalizeCodeLanguage(raw.language);
    const code = this.escapeHtml(raw.code || '');
    return this.renderCodeBlockShell(code, lang, raw.filename);
  }

  private renderCodeBlockShell(
    code: string,
    language: string,
    filename?: string,
  ): string {
    const header = this.renderCodeBlockHeader(filename, language);
    return `<div class="code-block">${header}<pre class="language-${language}"><code class="language-${language}">${code}</code></pre></div>`;
  }

  private renderCodeBlockHeader(
    filename: string | undefined,
    language: string,
  ): string {
    const filenameMarkup = filename
      ? `<span class="code-block-filename">${this.escapeHtml(filename)}</span>`
      : '';
    const safeLanguage = this.escapeHtml(language);
    const headerClass = filename
      ? 'code-block-header'
      : 'code-block-header code-block-header--compact';
    return `<div class="${headerClass}">${filenameMarkup}<div class="code-block-actions"><span class="code-block-lang">${safeLanguage}</span>${this.renderCodeCopyButton()}</div></div>`;
  }

  private renderCodeCopyButton(): string {
    return '<button type="button" class="code-copy-btn" aria-label="Copiar código">Copiar</button>';
  }

  private normalizeCodeLanguage(language?: string): string {
    return (
      (language || 'text').replace(/[^a-z0-9_+-]/gi, '').toLowerCase() ||
      'text'
    );
  }

  private renderCalloutBlock(block: PortableTextBlock): string {
    const raw = block as PortableTextBlock & { type?: string; text?: string };
    const type = raw.type || 'info';
    const icon = this.getCalloutIcon(type);
    const text = this.escapeHtml(raw.text || '');
    return `<div class="callout callout--${type}"><span class="callout-icon">${icon}</span><div class="callout-body">${text}</div></div>`;
  }

  private getCalloutIcon(type: string): string {
    if (type in CALLOUT_ICONS) {
      return CALLOUT_ICONS[type as keyof typeof CALLOUT_ICONS];
    }
    return CALLOUT_ICONS.info;
  }

  private renderDividerBlock(block: PortableTextBlock): string {
    const style = block.style || 'line';
    return style === 'space'
      ? '<div class="divider divider--space"></div>'
      : '<hr class="divider" />';
  }

  private renderMarkdownBlock(block: PortableTextBlock): string {
    const markdown =
      (block as PortableTextBlock & { markdown?: string }).markdown || '';
    if (!markdown.trim()) return '';
    const html = marked.parse(markdown, {
      async: false,
      gfm: true,
      breaks: false,
    }) as string;
    return `<div class="markdown-block">${html}</div>`;
  }

  private renderYoutubeBlock(block: PortableTextBlock): string {
    const raw = block as PortableTextBlock & { url?: string; caption?: string };
    const videoId = this.extractYouTubeId(raw.url || '');
    if (!videoId) return '';
    const caption = this.renderCaption(raw.caption);
    const title = raw.caption ? this.escapeAttr(raw.caption) : 'YouTube video';
    return `<figure class="video-embed"><div class="video-wrapper"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" loading="lazy" allowfullscreen title="${title}"></iframe></div>${caption}</figure>`;
  }

  private renderCaption(caption?: string): string {
    return caption
      ? `<figcaption>${this.escapeHtml(caption)}</figcaption>`
      : '';
  }

  private renderTextBlock(
    block: PortableTextBlock,
    unwrapNormal = false,
  ): string {
    const style = block.style || 'normal';

    if (this.isDividerTextBlock(block)) {
      return this.renderDividerBlock({
        _type: 'divider',
        _key: block._key,
        style: 'line',
      });
    }

    if (style === 'code') {
      const text = this.escapeHtml(this.extractPlainText(block.children));
      return text ? this.renderCodeBlockShell(text, 'text') : '';
    }

    const children = this.renderTextChildren(block);
    if (!children) return '';

    const tag = TEXT_BLOCK_TAGS[style];
    if (tag) {
      return `<${tag}>${children}</${tag}>`;
    }

    return unwrapNormal ? children : `<p>${children}</p>`;
  }

  private renderTextChildren(block: PortableTextBlock): string {
    const defs = block.markDefs || [];

    return (block.children || [])
      .map((child) => this.renderTextChild(child, defs))
      .join('');
  }

  private renderTextChild(
    child: PortableTextChild,
    defs: PortableTextMark[],
  ): string {
    if (child._type === 'hardBreak') {
      return '<br />';
    }

    const text = this.escapeHtml(child.text || '').replace(/\n/g, '<br />');
    return (child.marks || []).reduce(
      (currentText, mark) => this.applyMark(currentText, mark, defs),
      text,
    );
  }

  private applyMark(
    text: string,
    mark: string,
    defs: PortableTextMark[],
  ): string {
    switch (mark) {
      case 'strong':
        return `<strong>${text}</strong>`;
      case 'em':
        return `<em>${text}</em>`;
      case 'code':
        return `<code>${text}</code>`;
      case 'underline':
        return `<u>${text}</u>`;
      case 'strike-through':
      case 'strike':
        return `<del>${text}</del>`;
      case 'highlight':
        return `<mark>${text}</mark>`;
      default:
        return this.applyLinkMark(text, mark, defs);
    }
  }

  private applyLinkMark(
    text: string,
    mark: string,
    defs: PortableTextMark[],
  ): string {
    const def = defs.find((definition) => definition._key === mark);

    if (!def) {
      return text;
    }

    if (def._type === 'internalLink') {
      const safeHref = this.safeUrl(this.resolveInternalLinkHref(def));
      return safeHref ? `<a href="${safeHref}">${text}</a>` : text;
    }

    if (def._type !== 'link' || !def.href) {
      return text;
    }

    const safeHref = this.safeUrl(def.href);
    if (!safeHref) {
      return text;
    }

    const attrs =
      def.blank !== false ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${safeHref}"${attrs}>${text}</a>`;
  }

  private resolveInternalLinkHref(def: PortableTextMark): string | null {
    const slug = def.slug?.current?.trim();
    if (!slug) {
      return null;
    }

    switch (def.documentType) {
      case 'post':
        return `/blog/${slug}`;
      case 'category':
        return `/blog/categoria/${slug}`;
      default:
        return null;
    }
  }

  private renderList(
    blocks: PortableTextBlock[],
    startIndex: number,
  ): { html: string; nextIndex: number } {
    return this.renderListLevel(
      blocks,
      startIndex,
      this.normalizeListLevel(blocks[startIndex]?.level),
    );
  }

  private renderListLevel(
    blocks: PortableTextBlock[],
    startIndex: number,
    level: number,
  ): { html: string; nextIndex: number } {
    const firstBlock = blocks[startIndex];

    if (!this.isListBlock(firstBlock)) {
      return { html: '', nextIndex: startIndex + 1 };
    }

    const listTag = this.getListTag(firstBlock.listItem);
    const items: string[] = [];
    let index = startIndex;

    while (index < blocks.length) {
      const block = blocks[index];

      if (!this.isListBlock(block)) break;

      const blockLevel = this.normalizeListLevel(block.level);
      if (blockLevel < level) break;
      if (blockLevel > level) break;
      if (this.getListTag(block.listItem) !== listTag) break;

      index += 1;

      let nestedHtml = '';
      while (
        index < blocks.length &&
        this.isListBlock(blocks[index]) &&
        this.normalizeListLevel(blocks[index].level) > level
      ) {
        const nested = this.renderListLevel(
          blocks,
          index,
          this.normalizeListLevel(blocks[index].level),
        );
        nestedHtml += nested.html;
        index = nested.nextIndex;
      }

      const content = this.renderTextBlock(block, true);
      items.push(`<li>${content}${nestedHtml}</li>`);
    }

    return items.length
      ? { html: `<${listTag}>${items.join('')}</${listTag}>`, nextIndex: index }
      : { html: '', nextIndex: startIndex + 1 };
  }

  private isListBlock(
    block: PortableTextBlock | undefined,
  ): block is PortableTextBlock & { listItem: string } {
    return block?._type === 'block' && typeof block.listItem === 'string';
  }

  private getListTag(listItem: string): 'ul' | 'ol' {
    return listItem === 'number' ? 'ol' : 'ul';
  }

  private normalizeListLevel(level?: number): number {
    return typeof level === 'number' && level > 0 ? Math.floor(level) : 1;
  }

  private extractPlainText(children: PortableTextChild[] = []): string {
    return children
      .map((child) => {
        if (child._type === 'hardBreak') {
          return '\n';
        }
        return child.text || '';
      })
      .join('');
  }

  private isDividerTextBlock(block: PortableTextBlock): boolean {
    if (block._type !== 'block' || (block.style && block.style !== 'normal')) {
      return false;
    }

    const hasMarks = (block.children || []).some((child) => child.marks?.length);
    if (hasMarks) {
      return false;
    }

    const text = this.extractPlainText(block.children).trim();
    return /^(?:-{3,}|\*{3,}|_{3,})$/.test(text);
  }

  private extractYouTubeId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    );
    return match ? match[1] : null;
  }

  private safeUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    const lower = trimmed.toLowerCase();
    const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
    const allowed = ['http:', 'https:', 'mailto:'];
    if (isAbsolute && !allowed.some((p) => lower.startsWith(p))) {
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
