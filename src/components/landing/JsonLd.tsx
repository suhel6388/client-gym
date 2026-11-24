export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://darkgoldgym.duckdns.org/#organization",
        "name": "DarkGold Gym CRM",
        "url": "https://darkgoldgym.duckdns.org/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://darkgoldgym.duckdns.org/darkgold.png",
          "caption": "DarkGold Gym Management Software"
        },
        "sameAs": []
      },
      {
        "@type": "WebSite",
        "@id": "https://darkgoldgym.duckdns.org/#website",
        "url": "https://darkgoldgym.duckdns.org/",
        "name": "DarkGold Gym CRM",
        "description": "Smart Gym Management Software & CRM to Grow Your Fitness Business",
        "publisher": {
          "@id": "https://darkgoldgym.duckdns.org/#organization"
        },
        "inLanguage": "en-IN"
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://darkgoldgym.duckdns.org/#software",
        "name": "DarkGold Gym Management Software",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, iOS, Android",
        "url": "https://darkgoldgym.duckdns.org/",
        "offers": {
          "@type": "Offer",
          "price": "499",
          "priceCurrency": "INR",
          "priceValidUntil": "2027-12-31",
          "availability": "https://schema.org/InStock"
        },
        "featureList": [
          "Gym Member Management",
          "Automated Attendance Tracking",
          "Fee & Membership Billing",
          "Trainer & Staff Allocation",
          "Workout & Diet Plan Assignment",
          "Real-time Analytics Dashboard"
        ],
        "description": "Comprehensive gym management software and gym CRM in India designed to simplify memberships, billing, attendance, and member retention."
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

