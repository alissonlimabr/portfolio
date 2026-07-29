export interface PortableTextMark {
  _key: string;
  _type: string;
  href?: string;
  blank?: boolean;
  slug?: { current: string };
  documentType?: 'post' | 'category';
}

export interface PortableTextChild {
  _type: string;
  _key: string;
  text: string;
  marks?: string[];
}

export interface PortableTextBlock {
  _type: string;
  _key: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: PortableTextChild[];
  markDefs?: PortableTextMark[];
  url?: string;
  alt?: string;
  caption?: string;
}

export interface Category {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  color?: string;
  postCount?: number;
}

export interface Author {
  name: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCrop?: { top?: number; bottom?: number; left?: number; right?: number };
  imageHotspot?: { x?: number; y?: number; width?: number; height?: number };
  imageDimensions?: { width: number; height: number };
  bio?: string;
  url?: string;
}

export interface PostSummary {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  publishedAt: string;
  imageUrl?: string;
  imageSrcSet?: string;
  imageAlt?: string;
  estimatedReadingTime?: number;
  tags?: string[];
  categories?: Category[];
  featured?: boolean;
}

export interface Post extends PostSummary {
  author: Author;
  body: PortableTextBlock[];
  seoDescription?: string;
  ogImageUrl?: string;
  updatedAt?: string;
  systemCreatedAt?: string;
  systemUpdatedAt?: string;
}
