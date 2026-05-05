/**
 * Slug Utility for SEO
 */
export class SlugUtils {
  static generate(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w-]+/g, '')  // Remove all non-word chars
      .replace(/--+/g, '-')     // Replace multiple - with single -
      .replace(/^-+/, '')       // Trim - from start of text
      .replace(/-+$/, '');      // Trim - from end of text
  }

  static generateListingSlug(title: string, id: string): string {
    const base = this.generate(title);
    const shortId = id.split('-')[0]; // Use first part of UUID
    return `${base}-${shortId}`;
  }
}
