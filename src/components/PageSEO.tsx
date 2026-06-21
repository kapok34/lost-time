import { Helmet } from "react-helmet-async";

interface PageSEOProps {
  title?: string;
  description?: string;
  path?: string;
  ogTitle?: string;
  ogDescription?: string;
}

const BASE_URL = "https://lost-time.org";

export const PageSEO = ({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
}: PageSEOProps) => {
  const fullTitle = title ? `${title} · lost time` : "lost time";
  const canonical = path ? `${BASE_URL}${path}` : BASE_URL;
  const ogTitleResolved = ogTitle || title || "lost time";
  const ogDescResolved = ogDescription || description || "an asocial network";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={ogTitleResolved} />
      <meta property="og:description" content={ogDescResolved} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={ogTitleResolved} />
      <meta name="twitter:description" content={ogDescResolved} />
    </Helmet>
  );
};
