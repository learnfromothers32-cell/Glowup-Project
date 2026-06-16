import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  locale?: string;
}

export default function SEOHead({ title, description, canonical, image, locale = "en" }: SEOHeadProps) {
  const siteName = "Hairstyle Studio AI";
  const fullTitle = `${title} | ${siteName}`;
  const url = canonical || "https://hairstyle-studio.app";
  const ogImage = image || "https://hairstyle-studio.app/og-image.png";

  const localeMap: Record<string, string> = {
    en: "en_US", "zh-TW": "zh_TW", "zh-CN": "zh_CN", ja: "ja_JP",
    ko: "ko_KR", fr: "fr_FR", de: "de_DE", es: "es_ES", pt: "pt_BR", ar: "ar_AE"
  };

  return (
    <Helmet>
      <html lang={locale} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={localeMap[locale] || "en_US"} />
      <meta property="og:site_name" content={siteName} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      <link rel="alternate" hrefLang="en" href="https://hairstyle-studio.app" />
      <link rel="alternate" hrefLang="zh-TW" href="https://hairstyle-studio.app/zh-TW" />
      <link rel="alternate" hrefLang="zh-CN" href="https://hairstyle-studio.app/zh-CN" />
      <link rel="alternate" hrefLang="ja" href="https://hairstyle-studio.app/ja" />
      <link rel="alternate" hrefLang="ko" href="https://hairstyle-studio.app/ko" />
      <link rel="alternate" hrefLang="fr" href="https://hairstyle-studio.app/fr" />
      <link rel="alternate" hrefLang="de" href="https://hairstyle-studio.app/de" />
      <link rel="alternate" hrefLang="es" href="https://hairstyle-studio.app/es" />
      <link rel="alternate" hrefLang="pt" href="https://hairstyle-studio.app/pt" />
      <link rel="alternate" hrefLang="ar" href="https://hairstyle-studio.app/ar" />
      <link rel="alternate" hrefLang="x-default" href="https://hairstyle-studio.app" />
    </Helmet>
  );
}
