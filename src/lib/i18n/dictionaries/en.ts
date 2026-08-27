import type { Dictionary } from "../types";

const en: Dictionary = {
  meta: {
    title: "Flower & Love — Luxury Digital Wedding Invitations",
    description:
      "Create your digital wedding invitation in minutes. Choose your design, add your details and photos, and share your most beautiful moments with your loved ones.",
  },
  nav: {
    home: "Home",
    templates: "Templates",
    howItWorks: "How it works",
    pricing: "Pricing",
    faq: "FAQ",
    contact: "Contact",
    login: "Log in",
    createInvitation: "Create invitation",
  },
  hero: {
    badge: "A first in Tunisia",
    title: "Create your digital wedding invitation in minutes ❤️",
    description:
      "Choose your design, add your details and photos, and share your most beautiful moments with your loved ones.",
    ctaPrimary: "Create invitation",
    ctaSecondary: "View templates",
    stat1Value: "8+",
    stat1Label: "luxury designs",
    stat2Value: "100%",
    stat2Label: "customizable",
    stat3Value: "WhatsApp",
    stat3Label: "simple, secure payment",
    previewCoupleNames: "Mohamed & Sirine",
    previewDate: "09 / 09 / 2026",
    previewOpen: "Open Invitation ❤️",
  },
  howItWorks: {
    eyebrow: "Wonderfully simple",
    title: "How the platform works",
    description: "Just seven steps stand between you and a digital wedding invitation that feels truly yours.",
    steps: [
      { title: "Create your account", description: "Sign up with your email and WhatsApp number in under a minute." },
      { title: "Choose your template", description: "Browse our collection of luxury designs and pick the one that fits your style." },
      { title: "Customize your invitation", description: "Add your names, photos, event date and your favorite music." },
      { title: "Preview your invitation", description: "Watch your invitation come to life, live, right in front of you." },
      { title: "Contact us on WhatsApp", description: "Choose your package and send us your order directly on WhatsApp." },
      { title: "Complete payment", description: "We'll agree with you on the simplest payment method for you." },
      { title: "Get your invitation link", description: "Receive your invitation link, ready to share with everyone you love." },
    ],
  },
  templates: {
    eyebrow: "Luxury designs",
    title: "Templates crafted with care",
    description:
      "Every template has a completely independent visual identity: colors, typography, layout and animations. Not just a different color swap.",
    viewAll: "View all templates",
    useTemplate: "Use this template",
    items: [
      { name: "Luxury Gold", nameAr: "ذهبي فاخر", category: "Classic" },
      { name: "Elegant White", nameAr: "أبيض أنيق", category: "Minimal" },
      { name: "Floral", nameAr: "زهري", category: "Romantic" },
      { name: "Romantic", nameAr: "رومانسي", category: "Emotional" },
      { name: "Modern", nameAr: "عصري", category: "Contemporary" },
      { name: "Black & Gold", nameAr: "أسود وذهبي", category: "Prestige" },
      { name: "Traditional Arabic", nameAr: "تراث عربي", category: "Heritage" },
      { name: "Minimal", nameAr: "بسيط ونقي", category: "Minimalist" },
    ],
  },
  features: {
    eyebrow: "Platform features",
    title: "Everything you need for an unforgettable wedding",
    description: "Professional tools designed to make your experience simple and enjoyable, start to finish.",
    items: [
      { title: "Multi-step invitation builder", description: "Add your details, photos and music step by step, with instant auto-save." },
      { title: "Professional Arabic typography", description: "Diwani, Thuluth, Naskh and modern fonts, with flawless RTL support." },
      { title: "RSVP confirmation", description: "Know exactly who's attending, how many guests, and their sweetest messages." },
      { title: "Guest management", description: "Add, edit and search your guests with ease, and export the list to CSV or Excel." },
      { title: "Full WhatsApp integration", description: "Payment, communication and sharing, all through the WhatsApp everyone already uses." },
      { title: "Live countdown", description: "An elegant countdown of days, hours and minutes until your big day." },
      { title: "Maps & venue location", description: "Share the exact venue location via Google Maps with a single tap." },
      { title: "Invitation QR code", description: "An elegant QR code, ready to print or share digitally." },
    ],
  },
  pricing: {
    eyebrow: "Flexible plans",
    title: "Simple, transparent pricing",
    description: "Choose the plan that fits your needs — payment is handled simply through WhatsApp.",
    currency: "TND",
    mostPopular: "Most popular",
    choosePlan: "Choose this plan",
    plans: [
      {
        name: "Free",
        price: "0",
        period: "trial",
        description: "Try the platform and explore what it can do.",
        features: ["Limited templates", "Limited pages", "Watermark", "Draft only (no publishing)"],
      },
      {
        name: "Standard",
        price: "89",
        period: "per invitation",
        description: "A complete invitation, ready to publish and share.",
        features: ["All templates", "All pages", "No watermark", "Publish and share your invitation"],
      },
      {
        name: "Premium",
        price: "149",
        period: "per invitation",
        description: "A complete luxury experience with advanced features.",
        features: [
          "Everything in Standard",
          "Custom invitation URL",
          "RSVP confirmation",
          "Detailed analytics",
          "Background music",
          "Invitation QR code",
          "Advanced customization",
        ],
      },
    ],
  },
  testimonials: {
    eyebrow: "Stories of joy",
    title: "What our customers say",
    description: "Dozens of couples across Tunisia chose Flower & Love to share their joy.",
    items: [
      {
        name: "Ahmed & Yasmine",
        location: "Tunis",
        text: "The invitation was far more beautiful than we imagined. Our whole family loved the design, and coordinating over WhatsApp was so easy.",
      },
      {
        name: "Seifeddine & Marwa",
        location: "Sfax",
        text: "The RSVP feature made organizing our wedding so much easier. We knew exactly how many guests were coming.",
      },
      {
        name: "Karim & Ines",
        location: "Sousse",
        text: "The design was luxurious and elegant, with beautiful Arabic calligraphy. Best of all, payment through WhatsApp was simple, no hassle at all.",
      },
    ],
  },
  faq: {
    eyebrow: "Frequently asked questions",
    title: "Everything you need to know",
    items: [
      {
        q: "How do I pay for my invitation?",
        a: "After customizing your invitation and choosing a plan, tap the WhatsApp button and we'll agree directly with you on the payment method that works best. No bank card required.",
      },
      {
        q: "Can I edit my invitation after it's published?",
        a: "Yes, you can access your dashboard anytime and edit the content — changes appear instantly on your invitation link.",
      },
      {
        q: "Do you support Tunisian dialect?",
        a: "Absolutely. Your invitation text is fully editable, and we keep your writing exactly as you wrote it — whether in Modern Standard Arabic, Tunisian dialect, French or English.",
      },
      {
        q: "How long does activation take after payment?",
        a: "Once payment is confirmed, our team activates your invitation very quickly, and you'll receive a confirmation message with your final link.",
      },
      {
        q: "Is my data and my guests' data secure?",
        a: "Your privacy is our priority. Your guests' data and phone numbers are never shown publicly and are never shared with third parties.",
      },
    ],
  },
  whatsapp: {
    title: "Need help? Contact us on WhatsApp",
    description: "Our team is on hand to answer every question and guide you step by step, all week long.",
    cta: "Contact us on WhatsApp",
    supportMessage: "Hello, I need help with my wedding invitation.",
  },
  footer: {
    tagline: "Luxury digital wedding invitations, crafted with love for couples across Tunisia and the Arab world.",
    productTitle: "Product",
    companyTitle: "Company",
    legalTitle: "Legal",
    about: "About",
    contact: "Contact",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    rights: "All rights reserved.",
    madeWith: "Made with love in Tunisia 🇹🇳",
  },
  comingSoon: {
    badge: "Coming soon",
    loginTitle: "Log in",
    registerTitle: "Create an account",
    description:
      "Accounts and the database are being finalized in the next development phase. Contact us on WhatsApp and we'll personally help you create your invitation in the meantime.",
    backHome: "Back to home",
    whatsappCta: "Contact us on WhatsApp",
    whatsappMessage: "Hello, I'd like to create a digital wedding invitation. Can you help me?",
  },
  common: {
    langSwitcherLabel: "Language",
  },
};

export default en;
