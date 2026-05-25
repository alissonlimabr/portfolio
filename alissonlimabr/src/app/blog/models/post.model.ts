export interface PortableTextMark {
  _key: string;
  _type: string;
  href?: string;
  blank?: boolean;
}

export interface PortableTextChild {
  _type: string;
  _key: string;
  text: string;
  marks: string[];
}

export interface PortableTextBlock {
  _type: string;
  _key: string;
  style?: string;
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

export interface PostSummary {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  publishedAt: string;
  imageUrl?: string;
  estimatedReadingTime?: number;
  tags?: string[];
  categories?: Category[];
  featured?: boolean;
}

export interface Post extends PostSummary {
  body: PortableTextBlock[];
  seoDescription?: string;
  ogImageUrl?: string;
}
