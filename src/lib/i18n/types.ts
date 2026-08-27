export interface Dictionary {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    templates: string;
    howItWorks: string;
    pricing: string;
    faq: string;
    contact: string;
    login: string;
    createInvitation: string;
  };
  hero: {
    badge: string;
    title: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
    previewCoupleNames: string;
    previewDate: string;
    previewOpen: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    description: string;
    steps: { title: string; description: string }[];
  };
  templates: {
    eyebrow: string;
    title: string;
    description: string;
    viewAll: string;
    useTemplate: string;
    items: { name: string; nameAr: string; category: string }[];
  };
  features: {
    eyebrow: string;
    title: string;
    description: string;
    items: { title: string; description: string }[];
  };
  pricing: {
    eyebrow: string;
    title: string;
    description: string;
    currency: string;
    mostPopular: string;
    choosePlan: string;
    plans: {
      name: string;
      price: string;
      period: string;
      description: string;
      features: string[];
    }[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    description: string;
    items: { name: string; location: string; text: string }[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { q: string; a: string }[];
  };
  whatsapp: {
    title: string;
    description: string;
    cta: string;
    supportMessage: string;
  };
  footer: {
    tagline: string;
    productTitle: string;
    companyTitle: string;
    legalTitle: string;
    about: string;
    contact: string;
    privacy: string;
    terms: string;
    rights: string;
    madeWith: string;
  };
  comingSoon: {
    badge: string;
    loginTitle: string;
    registerTitle: string;
    description: string;
    backHome: string;
    whatsappCta: string;
    whatsappMessage: string;
  };
  common: {
    langSwitcherLabel: string;
  };
}
