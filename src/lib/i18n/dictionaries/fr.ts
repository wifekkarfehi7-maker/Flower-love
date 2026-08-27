import type { Dictionary } from "../types";

const fr: Dictionary = {
  meta: {
    title: "Flower & Love — Faire-part de mariage numériques de luxe",
    description:
      "Créez votre faire-part de mariage numérique en quelques minutes. Choisissez votre design, ajoutez vos informations et vos photos, et partagez vos plus beaux moments avec vos proches.",
  },
  nav: {
    home: "Accueil",
    templates: "Modèles",
    howItWorks: "Comment ça marche",
    pricing: "Tarifs",
    faq: "FAQ",
    contact: "Contact",
    login: "Connexion",
    createInvitation: "Créer une invitation",
  },
  hero: {
    badge: "Une première en Tunisie",
    title: "Créez votre faire-part de mariage numérique en quelques minutes ❤️",
    description:
      "Choisissez votre design, ajoutez vos informations et vos photos, et partagez vos plus beaux moments avec vos proches.",
    ctaPrimary: "Créer une invitation",
    ctaSecondary: "Voir les modèles",
    stat1Value: "+8",
    stat1Label: "designs de luxe",
    stat2Value: "100%",
    stat2Label: "personnalisable",
    stat3Value: "WhatsApp",
    stat3Label: "paiement simple et sûr",
    previewCoupleNames: "Mohamed & Sirine",
    previewDate: "09 / 09 / 2026",
    previewOpen: "Ouvrir l'invitation ❤️",
  },
  howItWorks: {
    eyebrow: "En toute simplicité",
    title: "Comment fonctionne la plateforme",
    description: "Seulement sept étapes vous séparent d'une invitation de mariage numérique à votre image.",
    steps: [
      { title: "Créez votre compte", description: "Inscrivez-vous avec votre email et votre numéro WhatsApp en moins d'une minute." },
      { title: "Choisissez le design", description: "Parcourez notre collection de designs de luxe et trouvez celui qui vous ressemble." },
      { title: "Personnalisez votre invitation", description: "Ajoutez vos noms, vos photos, la date de la fête et votre musique préférée." },
      { title: "Prévisualisez votre invitation", description: "Voyez votre invitation prendre vie en direct, sous vos yeux." },
      { title: "Contactez-nous sur WhatsApp", description: "Choisissez votre formule et envoyez-nous votre commande directement sur WhatsApp." },
      { title: "Finalisez le paiement", description: "Nous convenons ensemble du mode de paiement le plus simple pour vous." },
      { title: "Recevez le lien de votre invitation", description: "Recevez votre lien prêt à être partagé avec tous vos proches." },
    ],
  },
  templates: {
    eyebrow: "Designs de luxe",
    title: "Des modèles conçus avec soin",
    description:
      "Chaque modèle possède une identité visuelle totalement indépendante : couleurs, typographies, mise en page et animations. Pas seulement une palette différente.",
    viewAll: "Voir tous les modèles",
    useTemplate: "Utiliser ce modèle",
    items: [
      { name: "Luxury Gold", nameAr: "Doré Luxe", category: "Classique" },
      { name: "Elegant White", nameAr: "Blanc Élégant", category: "Épuré" },
      { name: "Floral", nameAr: "Floral", category: "Romantique" },
      { name: "Romantic", nameAr: "Romantique", category: "Émotion" },
      { name: "Modern", nameAr: "Moderne", category: "Contemporain" },
      { name: "Black & Gold", nameAr: "Noir & Or", category: "Prestige" },
      { name: "Traditional Arabic", nameAr: "Arabe Traditionnel", category: "Héritage" },
      { name: "Minimal", nameAr: "Minimaliste", category: "Sobre" },
    ],
  },
  features: {
    eyebrow: "Fonctionnalités",
    title: "Tout ce qu'il faut pour un mariage inoubliable",
    description: "Des outils professionnels conçus pour rendre votre expérience simple et agréable, du début à la fin.",
    items: [
      { title: "Créateur multi-étapes", description: "Ajoutez vos informations, photos et musique étape par étape, avec sauvegarde automatique instantanée." },
      { title: "Typographies arabes professionnelles", description: "Diwani, Thuluth, Naskh et polices modernes, parfaitement adaptées au RTL." },
      { title: "Confirmation de présence RSVP", description: "Sachez précisément qui sera présent, le nombre d'invités et leurs plus beaux messages." },
      { title: "Gestion des invités", description: "Ajoutez, modifiez et recherchez vos invités facilement, exportez la liste en CSV ou Excel." },
      { title: "Intégration WhatsApp complète", description: "Paiement, communication et partage de l'invitation, tout via WhatsApp que tout le monde connaît." },
      { title: "Compte à rebours en direct", description: "Un compteur élégant des jours et heures restants jusqu'au grand jour." },
      { title: "Carte et lieu de la fête", description: "Partagez l'emplacement exact via Google Maps en un clic." },
      { title: "QR Code de l'invitation", description: "Un QR code élégant, imprimable ou partageable numériquement." },
    ],
  },
  pricing: {
    eyebrow: "Formules flexibles",
    title: "Des tarifs simples et transparents",
    description: "Choisissez la formule adaptée à vos besoins ; le paiement se fait simplement via WhatsApp.",
    currency: "TND",
    mostPopular: "Le plus demandé",
    choosePlan: "Choisir cette formule",
    plans: [
      {
        name: "Gratuite",
        price: "0",
        period: "essai",
        description: "Pour découvrir la plateforme et ses possibilités.",
        features: ["Modèles limités", "Pages limitées", "Filigrane", "Brouillon uniquement (sans publication)"],
      },
      {
        name: "Standard",
        price: "89",
        period: "par invitation",
        description: "Une invitation complète prête à être publiée et partagée.",
        features: ["Tous les modèles", "Toutes les pages", "Sans filigrane", "Publication et partage de l'invitation"],
      },
      {
        name: "Premium",
        price: "149",
        period: "par invitation",
        description: "Une expérience de luxe complète avec des fonctionnalités avancées.",
        features: [
          "Tous les avantages Standard",
          "Lien personnalisé",
          "Confirmation de présence RSVP",
          "Statistiques détaillées",
          "Musique de fond",
          "QR Code de l'invitation",
          "Personnalisation avancée",
        ],
      },
    ],
  },
  testimonials: {
    eyebrow: "Histoires de bonheur",
    title: "Ce que disent nos clients",
    description: "Des dizaines de mariés en Tunisie ont choisi Flower & Love pour partager leur joie.",
    items: [
      {
        name: "Ahmed & Yasmine",
        location: "Tunis",
        text: "L'invitation était bien plus belle que ce que nous imaginions. Toute notre famille a adoré le design, et l'échange via WhatsApp était très simple.",
      },
      {
        name: "Seifeddine & Marwa",
        location: "Sfax",
        text: "La confirmation de présence nous a énormément facilité l'organisation. Nous savions exactement combien d'invités venaient.",
      },
      {
        name: "Karim & Ines",
        location: "Sousse",
        text: "Un design luxueux et élégant, avec une très belle calligraphie arabe. Le paiement via WhatsApp était simple, sans aucune complication.",
      },
    ],
  },
  faq: {
    eyebrow: "Questions fréquentes",
    title: "Tout ce que vous devez savoir",
    items: [
      {
        q: "Comment payer mon invitation ?",
        a: "Après avoir personnalisé votre invitation et choisi votre formule, cliquez sur le bouton WhatsApp et nous convenons directement avec vous du mode de paiement le plus adapté. Aucune carte bancaire nécessaire.",
      },
      {
        q: "Puis-je modifier mon invitation après publication ?",
        a: "Oui, vous pouvez accéder à votre tableau de bord à tout moment et modifier le contenu ; les changements apparaissent immédiatement sur le lien de l'invitation.",
      },
      {
        q: "Prenez-vous en charge le dialecte tunisien ?",
        a: "Absolument. Le texte de l'invitation est entièrement modifiable, et nous respectons votre écriture telle quelle, en arabe classique, dialecte tunisien, français ou anglais.",
      },
      {
        q: "Combien de temps pour activer l'invitation après paiement ?",
        a: "Dès confirmation du paiement, notre équipe active votre invitation très rapidement, et vous recevez un message de confirmation avec le lien final.",
      },
      {
        q: "Mes données et celles de mes invités sont-elles sécurisées ?",
        a: "Votre vie privée est notre priorité. Les données et numéros de vos invités ne sont jamais affichés publiquement ni partagés avec des tiers.",
      },
    ],
  },
  whatsapp: {
    title: "Besoin d'aide ? Contactez-nous sur WhatsApp",
    description: "Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner étape par étape.",
    cta: "Contactez-nous sur WhatsApp",
    supportMessage: "Bonjour, j'ai besoin d'aide concernant mon invitation de mariage.",
  },
  footer: {
    tagline: "Des faire-part de mariage numériques de luxe, conçus avec amour pour les mariés de Tunisie et du monde arabe.",
    productTitle: "Produit",
    companyTitle: "Entreprise",
    legalTitle: "Légal",
    about: "À propos",
    contact: "Contact",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    rights: "Tous droits réservés.",
    madeWith: "Fait avec amour en Tunisie 🇹🇳",
  },
  comingSoon: {
    badge: "Bientôt disponible",
    loginTitle: "Connexion",
    registerTitle: "Créer un compte",
    description:
      "Le système de comptes et la base de données sont en cours de finalisation dans la prochaine phase de développement. Contactez-nous sur WhatsApp et nous vous aiderons personnellement à créer votre invitation en attendant.",
    backHome: "Retour à l'accueil",
    whatsappCta: "Contactez-nous sur WhatsApp",
    whatsappMessage: "Bonjour, je souhaite créer une invitation de mariage numérique. Pouvez-vous m'aider ?",
  },
  common: {
    langSwitcherLabel: "Langue",
  },
};

export default fr;
