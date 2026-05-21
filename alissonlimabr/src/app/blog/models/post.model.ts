export interface PortableTextMark {
  _key: string;
  _type: string;
  href?: string;
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
}

export interface Post extends PostSummary {
  body: PortableTextBlock[];
}
