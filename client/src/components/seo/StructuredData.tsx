import { Helmet } from "react-helmet-async";

export default function StructuredData() {
  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "AI Hairstyle Generator",
        applicationCategory: "Multimedia",
        operatingSystem: "Web",
        description: "Upload a photo and try on 150+ hairstyles virtually using AI technology. Get face shape analysis and personalized recommendations.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free tier with 5 credits"
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          bestRating: "5",
          ratingCount: "1045098"
        }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://hairstyle-studio.app" },
          { "@type": "ListItem", position: 2, name: "AI Hairstyle Generator", item: "https://hairstyle-studio.app" }
        ]
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How does the AI hairstyle generator work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Upload your photo, choose from 150+ hairstyles, and our AI generates a realistic preview of how you would look with that hairstyle."
            }
          },
          {
            "@type": "Question",
            name: "Is the AI hairstyle generator free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "New users receive 5 free credits to try the service. Additional credits can be purchased as needed."
            }
          },
          {
            "@type": "Question",
            name: "What face shapes can be analyzed?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Our AI analyzes oval, round, square, heart, diamond, and oblong face shapes to provide personalized hairstyle recommendations."
            }
          }
        ]
      },
      {
        "@type": "Organization",
        name: "Hairstyle Studio AI",
        url: "https://hairstyle-studio.app",
        description: "AI-powered virtual hairstyle try-on platform with 150+ styles"
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
    </Helmet>
  );
}
