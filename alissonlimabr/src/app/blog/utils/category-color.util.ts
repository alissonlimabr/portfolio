import { Category } from '../models/post.model';

const CATEGORY_FALLBACK_PALETTE = [
  '#a855f7',
  '#f59e0b',
  '#06b6d4',
  '#3b82f6',
  '#10b981',
  '#ec4899',
] as const;

type CategoryColorSource = Pick<Category, 'color' | 'slug' | 'title'>;

export function resolveCategoryColor(
  category: CategoryColorSource | null | undefined,
): string | null {
  const explicitColor = category?.color?.trim();
  if (explicitColor) {
    return explicitColor;
  }

  const seed = category?.slug?.current?.trim() || category?.title?.trim();
  if (!seed) {
    return null;
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return CATEGORY_FALLBACK_PALETTE[hash % CATEGORY_FALLBACK_PALETTE.length];
}
