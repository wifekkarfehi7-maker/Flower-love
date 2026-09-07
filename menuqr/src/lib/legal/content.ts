import type { Locale } from "@/lib/i18n/config";

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDocument {
  title: string;
  intro: string;
  sections: LegalSection[];
}

/**
 * Plain-language policies that describe what the application actually does —
 * anonymous menu analytics, no advertising, no data sale, and no online
 * payment gateway. Kept out of the UI dictionaries because it is long-form
 * prose rather than interface copy.
 */
export const PRIVACY: Record<Locale, LegalDocument> = {
  ar: {
    title: "سياسة الخصوصية",
    intro: "هذه السياسة تشرح شنوّة نجمعوا من معطيات، علاش، وكيفاش نحافظوا عليها.",
    sections: [
      {
        heading: "معطيات أصحاب المطاعم",
        body: [
          "كي تنشئ حساب، نخزنوا بريدك الإلكتروني، اسمك، ورقم هاتفك إذا زدته.",
          "المحتوى اللي تدخّله (اسم المطعم، الأقسام، المنتجات، الأسعار، الصور، الطاولات) يتخزن باش يظهر في المنيو متاعك.",
        ],
      },
      {
        heading: "زوّار المنيو",
        body: [
          "ما نجمعوش أي معطيات شخصية على الحرفاء اللي يمسحوا رمز QR: لا اسم، لا بريد، لا عنوان IP للتتبّع، ولا ملفات تعريف إعلانية.",
          "نخزنوا معرّف عشوائي في متصفح الزائر وحده باش ما نحسبوش نفس الزيارة برشا مرات. هذا المعرّف ما يعرّفش بأي شخص.",
          "الإحصائيات اللي يشوفها صاحب المطعم هي أرقام مجمّعة فقط: عدد المشاهدات، المسحات، والمنتجات الأكثر مشاهدة.",
        ],
      },
      {
        heading: "الصور",
        body: ["الصور اللي ترفعها للمنيو تولّي متاحة للعموم عبر رابط مباشر، لأن المنيو في حد ذاته عام."],
      },
      {
        heading: "أين تُخزَّن المعطيات",
        body: [
          "المعطيات تتخزن في قاعدة بيانات Postgres مستضافة عند Supabase.",
          "كل مطعم معزول على مستوى قاعدة البيانات بسياسات أمان على مستوى الصفوف: ما ينجّمش مطعم يقرا معطيات مطعم آخر.",
        ],
      },
      {
        heading: "المشاركة",
        body: ["ما نبيعوش ولا نكروا المعطيات لأي طرف ثالث، وما نستعملوهاش في الإعلانات."],
      },
      {
        heading: "حقوقك",
        body: [
          "تنجّم تشوف، تصحّح ولا تحذف معطياتك في أي وقت من لوحة التحكم، ولا بمراسلتنا.",
          "كي تحذف مطعمك، يتحذفوا معاه الأقسام، المنتجات، الطاولات ورموز QR.",
        ],
      },
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    intro: "Cette page explique quelles données nous collectons, pourquoi, et comment elles sont protégées.",
    sections: [
      {
        heading: "Données des restaurateurs",
        body: [
          "À la création du compte, nous conservons votre e-mail, votre nom et votre téléphone si vous le renseignez.",
          "Le contenu que vous saisissez (établissement, catégories, produits, prix, images, tables) est stocké pour afficher votre menu.",
        ],
      },
      {
        heading: "Visiteurs du menu",
        body: [
          "Aucune donnée personnelle n'est collectée sur les clients qui scannent un QR code : ni nom, ni e-mail, ni adresse IP de suivi, ni profil publicitaire.",
          "Un identifiant aléatoire est conservé uniquement dans le navigateur du visiteur, afin de ne pas compter plusieurs fois la même visite. Il n'identifie personne.",
          "Les statistiques visibles par le restaurateur sont uniquement des compteurs agrégés : vues, scans et produits les plus consultés.",
        ],
      },
      {
        heading: "Images",
        body: ["Les images ajoutées au menu sont accessibles publiquement par lien direct, puisque le menu lui-même est public."],
      },
      {
        heading: "Hébergement des données",
        body: [
          "Les données sont stockées dans une base Postgres hébergée chez Supabase.",
          "Chaque établissement est isolé au niveau de la base par des politiques de sécurité par ligne : un établissement ne peut pas lire les données d'un autre.",
        ],
      },
      {
        heading: "Partage",
        body: ["Nous ne vendons ni ne louons vos données à des tiers, et nous ne les utilisons pas à des fins publicitaires."],
      },
      {
        heading: "Vos droits",
        body: [
          "Vous pouvez consulter, corriger ou supprimer vos données à tout moment depuis le tableau de bord ou en nous contactant.",
          "La suppression d'un établissement entraîne celle de ses catégories, produits, tables et QR codes.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy policy",
    intro: "This page explains what data we collect, why, and how it is protected.",
    sections: [
      {
        heading: "Venue owner data",
        body: [
          "When you create an account we store your email, your name, and your phone number if you provide one.",
          "The content you enter (venue, categories, products, prices, images, tables) is stored in order to render your menu.",
        ],
      },
      {
        heading: "Menu visitors",
        body: [
          "No personal data is collected about guests who scan a QR code: no name, no email, no tracking IP, no advertising profile.",
          "A random identifier is kept in the visitor's own browser only, so the same visit is not counted repeatedly. It identifies nobody.",
          "The analytics a venue owner sees are aggregate counters only: views, scans and most-viewed products.",
        ],
      },
      {
        heading: "Images",
        body: ["Images added to a menu are publicly reachable by direct link, because the menu itself is public."],
      },
      {
        heading: "Where data is stored",
        body: [
          "Data is stored in a Postgres database hosted on Supabase.",
          "Every venue is isolated at the database level by row-level security policies: one venue cannot read another venue's data.",
        ],
      },
      {
        heading: "Sharing",
        body: ["We do not sell or rent your data to third parties, and we do not use it for advertising."],
      },
      {
        heading: "Your rights",
        body: [
          "You can view, correct or delete your data at any time from the dashboard or by contacting us.",
          "Deleting a venue also deletes its categories, products, tables and QR codes.",
        ],
      },
    ],
  },
};

export const TERMS: Record<Locale, LegalDocument> = {
  ar: {
    title: "شروط الاستعمال",
    intro: "باستعمالك للمنصة، إنت توافق على الشروط هذي.",
    sections: [
      {
        heading: "الخدمة",
        body: ["المنصة توفّر منيو رقمي يتفتح برمز QR، مع أدوات لتسيير الأقسام، المنتجات، الطاولات والإحصائيات."],
      },
      {
        heading: "الحساب",
        body: [
          "إنت مسؤول على المحافظة على كلمة السر متاعك وعلى كل نشاط يصير في حسابك.",
          "لازم المعلومات اللي تدخّلها تكون صحيحة.",
        ],
      },
      {
        heading: "المحتوى متاعك",
        body: [
          "المحتوى اللي تنشره (أسماء، أسعار، صور) يبقى ملكك، وإنت مسؤول عليه وعلى صحّته.",
          "ممنوع نشر محتوى غير قانوني ولا محتوى ما عندكش الحق فيه.",
        ],
      },
      {
        heading: "الخطط والدفع",
        body: [
          "الخطة المجانية تخدم مباشرة بحدودها المذكورة في صفحة الأسعار.",
          "ما فماش بوابة دفع إلكتروني مربوطة بالمنصة للتوّ: الترقية للخطط المدفوعة تتم بالتنسيق المباشر معانا وتنطبق يدوياً على حسابك.",
        ],
      },
      {
        heading: "الإيقاف",
        body: ["ننجّموا نوقّفوا حساب ولا مطعم في صورة خرق واضح للشروط، ونعلموك بالسبب."],
      },
      {
        heading: "التوفّر والمسؤولية",
        body: [
          "نخدموا باش الخدمة تبقى متوفّرة، أما ما نضمنوش خدمة بلا انقطاع.",
          "المنصة تتقدّم كما هي، وما نتحمّلوش مسؤولية الخسائر غير المباشرة الناتجة عن الاستعمال.",
        ],
      },
      {
        heading: "تعديل الشروط",
        body: ["ننجّموا نبدّلوا الشروط هذي، ونعلموك بالتغييرات المهمة."],
      },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    intro: "En utilisant la plateforme, vous acceptez les conditions ci-dessous.",
    sections: [
      {
        heading: "Le service",
        body: ["La plateforme fournit un menu digital accessible par QR code, avec des outils de gestion des catégories, produits, tables et statistiques."],
      },
      {
        heading: "Votre compte",
        body: [
          "Vous êtes responsable de la confidentialité de votre mot de passe et de toute activité effectuée depuis votre compte.",
          "Les informations que vous saisissez doivent être exactes.",
        ],
      },
      {
        heading: "Votre contenu",
        body: [
          "Le contenu que vous publiez (noms, prix, images) reste le vôtre ; vous en êtes responsable, y compris de son exactitude.",
          "Il est interdit de publier un contenu illicite ou dont vous ne détenez pas les droits.",
        ],
      },
      {
        heading: "Plans et paiement",
        body: [
          "Le plan gratuit fonctionne immédiatement, dans les limites indiquées sur la page des tarifs.",
          "Aucune passerelle de paiement en ligne n'est connectée à ce jour : le passage à un plan payant se fait en direct avec nous, puis est appliqué manuellement à votre compte.",
        ],
      },
      {
        heading: "Suspension",
        body: ["Nous pouvons suspendre un compte ou un établissement en cas de manquement manifeste aux présentes conditions, en vous en indiquant le motif."],
      },
      {
        heading: "Disponibilité et responsabilité",
        body: [
          "Nous mettons tout en œuvre pour maintenir le service disponible, sans pour autant garantir une continuité sans interruption.",
          "La plateforme est fournie en l'état ; nous ne saurions être tenus responsables des dommages indirects liés à son utilisation.",
        ],
      },
      {
        heading: "Modification des conditions",
        body: ["Ces conditions peuvent évoluer ; les changements importants vous seront signalés."],
      },
    ],
  },
  en: {
    title: "Terms of use",
    intro: "By using the platform you agree to the terms below.",
    sections: [
      {
        heading: "The service",
        body: ["The platform provides a digital menu opened by QR code, with tools to manage categories, products, tables and analytics."],
      },
      {
        heading: "Your account",
        body: [
          "You are responsible for keeping your password confidential and for activity carried out from your account.",
          "The information you enter must be accurate.",
        ],
      },
      {
        heading: "Your content",
        body: [
          "Content you publish (names, prices, images) remains yours, and you are responsible for it, including its accuracy.",
          "Publishing unlawful content, or content you do not hold the rights to, is not permitted.",
        ],
      },
      {
        heading: "Plans and payment",
        body: [
          "The free plan works immediately, within the limits shown on the pricing page.",
          "No online payment gateway is connected today: moving to a paid plan is arranged directly with us and then applied manually to your account.",
        ],
      },
      {
        heading: "Suspension",
        body: ["We may suspend an account or a venue in case of a clear breach of these terms, and will tell you the reason."],
      },
      {
        heading: "Availability and liability",
        body: [
          "We work to keep the service available, but do not guarantee uninterrupted operation.",
          "The platform is provided as is; we are not liable for indirect losses arising from its use.",
        ],
      },
      {
        heading: "Changes to these terms",
        body: ["These terms may change; significant changes will be communicated to you."],
      },
    ],
  },
};
