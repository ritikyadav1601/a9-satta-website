export const SITE_DOMAIN = "sattatodayresult.com";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
export const SITE_URL =
  configuredSiteUrl && /^https?:\/\/[^\s]+$/i.test(configuredSiteUrl)
    ? configuredSiteUrl.replace(
        /^https?:\/\/sattatodayresult\.com(?=\/|$)/i,
        `https://www.${SITE_DOMAIN}`,
      )
    : `https://www.${SITE_DOMAIN}`;
export const SITE_NAME = "Satta Today Result";
export const SITE_DISPLAY_DOMAIN = "SattaTodayResult.com";
