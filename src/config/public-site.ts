export const publicSiteUrl = "https://balsa-ui.com";

export function createPublicUrl(path: string): string {
  return new URL(path, `${publicSiteUrl}/`).href;
}
