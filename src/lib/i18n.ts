export const LANGUES = ["fr", "ar"] as const;
export type Langue = (typeof LANGUES)[number];

export function estLangue(valeur: string | undefined): valeur is Langue {
  return valeur === "fr" || valeur === "ar";
}

export function directionDe(langue: Langue): "ltr" | "rtl" {
  return langue === "ar" ? "rtl" : "ltr";
}

const fr = {
  table: "Table",
  menu: "Menu",
  indisponible: "Indisponible",
  ajouter: "Ajouter",
  votreCommande: "Votre commande",
  panierVide: "Votre panier est vide.",
  total: "Total",
  envoyer: "Envoyer la commande",
  envoiEnCours: "Envoi…",
  devise: "DT",
  paiementCash: "Paiement en espèces ou par carte, directement à table.",
  commandeEnvoyee: "Commande envoyée !",
  commandeEnCuisine: "Votre commande est partie en cuisine.",
  nouvelleCommande: "Passer une autre commande",
  retirer: "Retirer",
  erreurIndisponible:
    "Un plat de votre panier vient de passer en rupture. Merci de le retirer.",
  erreurIntrouvable: "Cette table ou ce plat n'existe plus.",
  erreurServeur: "La commande n'a pas pu être envoyée. Réessayez.",
  erreurPanierVide: "Ajoutez au moins un plat avant d'envoyer.",
  menuVide: "Le menu n'est pas encore disponible.",
} as const;

export type Traductions = Record<keyof typeof fr, string>;

const ar: Traductions = {
  table: "طاولة",
  menu: "قائمة الطعام",
  indisponible: "غير متوفر",
  ajouter: "إضافة",
  votreCommande: "طلبك",
  panierVide: "السلة فارغة.",
  total: "المجموع",
  envoyer: "إرسال الطلب",
  envoiEnCours: "جاري الإرسال…",
  devise: "د.ت",
  paiementCash: "الدفع نقدًا أو بالبطاقة، مباشرة على الطاولة.",
  commandeEnvoyee: "تم إرسال الطلب!",
  commandeEnCuisine: "طلبك وصل للمطبخ.",
  nouvelleCommande: "طلب جديد",
  retirer: "حذف",
  erreurIndisponible: "أحد الأطباق في سلتك لم يعد متوفرًا. يرجى حذفه.",
  erreurIntrouvable: "هذه الطاولة أو هذا الطبق لم يعد موجودًا.",
  erreurServeur: "تعذّر إرسال الطلب. حاول مرة أخرى.",
  erreurPanierVide: "أضف طبقًا واحدًا على الأقل قبل الإرسال.",
  menuVide: "قائمة الطعام غير متوفرة بعد.",
};

const dictionnaires: Record<Langue, Traductions> = { fr, ar };

export function traductions(langue: Langue): Traductions {
  return dictionnaires[langue];
}
