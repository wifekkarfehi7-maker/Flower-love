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
    builderTitle: string;
    builderDescription: string;
    builderWhatsappMessage: string;
  };
  auth: {
    orDivider: string;
    continueWithGoogle: string;
    backToHome: string;
    notConfiguredTitle: string;
    notConfiguredDescription: string;

    registerTitle: string;
    registerSubtitle: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    whatsappLabel: string;
    whatsappHelper: string;
    whatsappPlaceholder: string;
    countryLabel: string;
    languageLabel: string;
    agreeTermsPrefix: string;
    agreeTermsPrivacy: string;
    agreeTermsAnd: string;
    agreeTermsTerms: string;
    registerCta: string;
    registerCtaLoading: string;
    haveAccount: string;
    loginLink: string;
    registerSuccessTitle: string;
    registerSuccessDescription: string;

    loginTitle: string;
    loginSubtitle: string;
    loginCta: string;
    loginCtaLoading: string;
    noAccount: string;
    registerLink: string;
    forgotPasswordLink: string;

    completeProfileTitle: string;
    completeProfileDescription: string;
    completeProfileCta: string;
    completeProfileCtaLoading: string;

    forgotPasswordTitle: string;
    forgotPasswordDescription: string;
    forgotPasswordCta: string;
    forgotPasswordCtaLoading: string;
    forgotPasswordSuccessTitle: string;
    forgotPasswordSuccessDescription: string;

    resetPasswordTitle: string;
    resetPasswordDescription: string;
    newPasswordLabel: string;
    resetPasswordCta: string;
    resetPasswordCtaLoading: string;
    resetPasswordSuccessTitle: string;
    resetPasswordSuccessDescription: string;
    goToLogin: string;

    myInvitations: string;
    signOut: string;
    welcomeBack: string;

    errorInvalidCredentials: string;
    errorEmailInUse: string;
    errorWeakPassword: string;
    errorPasswordMismatch: string;
    errorWhatsappInvalid: string;
    errorRequiredField: string;
    errorInvalidEmail: string;
    errorMustAgreeTerms: string;
    errorGeneric: string;
  };
  dashboard: {
    title: string;
    welcomePrefix: string;
    emptyTitle: string;
    emptyDescription: string;
    createCta: string;
    profileIncompleteBanner: string;
    completeProfileCta: string;
    statusDraft: string;
    statusPendingPayment: string;
    statusPaymentReview: string;
    statusPaid: string;
    statusActive: string;
    statusCancelled: string;
    statusExpired: string;
  };
  common: {
    langSwitcherLabel: string;
  };
}
