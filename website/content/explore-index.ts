import { exploreEntries, heroStats, toolCatalog, commandCatalog, featureCatalog } from './explore'

export const featuredDeepDives = exploreEntries.map(entry => ({
  slug: entry.slug,
  title: entry.title,
  eyebrow: entry.eyebrow,
  summary: entry.summary,
  href: `/explore/${entry.slug}`,
  sourceCount: entry.sourceRefs.length,
}))

export const exploreNavigation = exploreEntries.map(entry => ({
  slug: entry.slug,
  title: entry.title,
  summary: entry.summary,
}))

export const exploreContentIndex = {
  heroStats,
  toolCatalog,
  commandCatalog,
  featureCatalog,
}

