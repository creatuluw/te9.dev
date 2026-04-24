/**
 * Type definitions for UI components
 * Extracted from homepage for reusability across the application
 */

/**
 * GardenCard - Represents a card in the garden section
 * @property icon - Lucide icon name (e.g. "code", "package", "heart")
 * @property title - Card title
 * @property desc - Card description
 * @property tag - Category tag for the card
 * @property slug - URL-friendly identifier
 * @property href - Optional link destination
 */
export interface GardenCard {
  icon: string;
  title: string;
  desc: string;
  tag: string;
  slug?: string;
  href?: string | null;
}

/**
 * QuickLink - Represents a quick link item
 * @property href - URL destination
 * @property name - Display name for the link
 * @property desc - Brief description of the link destination
 */
export interface QuickLink {
  href: string;
  name: string;
  desc: string;
}
