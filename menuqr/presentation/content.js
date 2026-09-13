/* ===========================================================================
   MenuQR — sales presentation content
   ---------------------------------------------------------------------------
   Two independently written decks, not a word-for-word translation:
   - ar : Tunisian business Arabic (RTL). The way a café owner in Tunis speaks.
   - fr : professional French, vouvoiement.
   Both follow the same persuasion sequence, so switching language mid-pitch
   never loses the thread.
   =========================================================================== */

/* Fill these in and they appear on the closing slide. Left empty, nothing is
   shown — the deck never displays a link that does not exist. */
var BRAND = {
  name: "MenuQR",
  whatsapp: "21694409166",          // international format, no "+", for wa.me
  whatsappDisplay: "+216 94 409 166",
  logo: "",                          // e.g. "assets/logo.svg"
  website: "",                       // e.g. "https://menuqr.tn"
  instagram: "",                     // e.g. "https://instagram.com/…"
  facebook: ""                       // e.g. "https://facebook.com/…"
};

/* The demo menu shown inside the phone. Real dishes, real Tunisian prices
   (TND, three decimals) — the same catalogue the platform ships as a demo. */
var MENU = {
  cats: [
    { id: "breakfast", key: "menu.cat.breakfast" },
    { id: "pizza",     key: "menu.cat.pizza" },
    { id: "sandwich",  key: "menu.cat.sandwich" },
    { id: "drinks",    key: "menu.cat.drinks" },
    { id: "desserts",  key: "menu.cat.desserts" }
  ],
  dishes: [
    { cat: "breakfast", ph: "lablabi",    price: "6,000",  hot: true,
      ar: { n: "لبلابي",            d: "حمّص سخون بالخبز، الهريسة والكمّون" },
      fr: { n: "Lablabi",            d: "Pois chiches chauds, harissa et cumin" } },
    { cat: "breakfast", ph: "chakchouka", price: "8,500",
      ar: { n: "شكشوكة",            d: "طماطم، فلفل وبيض على الطريقة التونسية" },
      fr: { n: "Chakchouka",         d: "Tomates, poivrons et œufs à la tunisienne" } },
    { cat: "breakfast", ph: "croissant",  price: "1,500",
      ar: { n: "كرواسون",           d: "بالزبدة، يتطيّب كل صباح" },
      fr: { n: "Croissant",          d: "Pur beurre, cuit chaque matin" } },
    { cat: "breakfast", ph: "brik",       price: "2,500",
      ar: { n: "بريك بالعظم",        d: "ملسوقة مقلية بالعظم والبقدونس" },
      fr: { n: "Brik à l’œuf",       d: "Feuille de malsouka, œuf et persil" } },

    { cat: "pizza", ph: "pizza",     price: "12,500", hot: true,
      ar: { n: "بيتزا مارغريتا",     d: "صلصة طماطم، موزاريلا وريحان" },
      fr: { n: "Pizza Margherita",   d: "Sauce tomate, mozzarella et basilic" } },
    { cat: "pizza", ph: "pizzatuna", price: "15,000",
      ar: { n: "بيتزا تُن",          d: "تُن، زيتون وموزاريلا" },
      fr: { n: "Pizza Thon",         d: "Thon, olives et mozzarella" } },
    { cat: "pizza", ph: "pizza4",    price: "17,000",
      ar: { n: "بيتزا أربعة أجبان",  d: "موزاريلا، غرويار، شيدر وجبن أزرق" },
      fr: { n: "Pizza 4 Fromages",   d: "Mozzarella, gruyère, cheddar et bleu" } },
    { cat: "pizza", ph: "merguez",   price: "14,000",
      ar: { n: "بيتزا مرقاز",        d: "مرقاز، فلفل مشوي وموزاريلا" },
      fr: { n: "Pizza Merguez",      d: "Merguez, poivrons grillés et mozzarella" } },

    { cat: "sandwich", ph: "escalope", price: "7,500", hot: true,
      ar: { n: "ساندويتش إسكالوب",  d: "إسكالوب دجاج، سلطة، جبن وصلصة" },
      fr: { n: "Sandwich Escalope",  d: "Escalope de poulet, salade et sauce" } },
    { cat: "sandwich", ph: "thon",     price: "5,500",
      ar: { n: "ساندويتش تُن",       d: "تُن، عظم، زيتون وهريسة في خبز طابونة" },
      fr: { n: "Sandwich Thon",      d: "Thon, œuf, olives et harissa, pain tabouna" } },
    { cat: "sandwich", ph: "chapati",  price: "9,000",
      ar: { n: "شاباتي دجاج",        d: "دجاج مشوي، جبن وصلصة الثوم" },
      fr: { n: "Chapati Poulet",     d: "Poulet grillé, fromage et sauce à l’ail" } },
    { cat: "sandwich", ph: "mlawi",    price: "8,000",
      ar: { n: "ملاوي دجاج",         d: "ملاوي محمّر، دجاج، جبن وسلطة" },
      fr: { n: "Mlawi Poulet",       d: "Mlawi doré, poulet, fromage et salade" } },

    { cat: "drinks", ph: "cappuccino", price: "3,500", hot: true,
      ar: { n: "كابوتشينو",          d: "إكسبرس بحليب مرغي وشويّة قرفة" },
      fr: { n: "Cappuccino",         d: "Espresso, lait mousseux, pointe de cannelle" } },
    { cat: "drinks", ph: "express",    price: "1,800",
      ar: { n: "قهوة إكسبرس",        d: "قهوة تونسية قوية" },
      fr: { n: "Café Express",       d: "Café tunisien serré" } },
    { cat: "drinks", ph: "orange",     price: "5,000",
      ar: { n: "عصير برتقال",        d: "برتقال معصور في الحين" },
      fr: { n: "Jus d’Orange",       d: "Oranges fraîchement pressées" } },
    { cat: "drinks", ph: "mint",       price: "2,500",
      ar: { n: "شاي بالنعناع",       d: "شاي أحمر بالنعناع والصنوبر" },
      fr: { n: "Thé à la Menthe",    d: "Thé à la menthe et pignons de pin" } },

    { cat: "desserts", ph: "crepe",   price: "8,500", hot: true,
      ar: { n: "كريب نوتيلا",        d: "كريب طازج بالنوتيلا والموز" },
      fr: { n: "Crêpe Nutella",      d: "Crêpe fraîche, Nutella et banane" } },
    { cat: "desserts", ph: "baklawa", price: "4,000",
      ar: { n: "بقلاوة",             d: "بقلاوة تونسية باللوز والعسل" },
      fr: { n: "Baklawa",            d: "Baklawa tunisienne aux amandes et miel" } },
    { cat: "desserts", ph: "bambalouni", price: "1,500",
      ar: { n: "بمبالوني",           d: "سخون، مرشوش بالسكّر" },
      fr: { n: "Bambalouni",         d: "Servi chaud, saupoudré de sucre" } },
    { cat: "desserts", ph: "mhalbia", price: "3,500",
      ar: { n: "مهلبية",             d: "بالحليب، ماء الزهر والفستق" },
      fr: { n: "Mhalbia",            d: "Lait, eau de fleur d’oranger et pistache" } }
  ]
};

var CONTENT = {

  /* ═══════════════════════════════════════════════════════════════════════
     العربية — لهجة أعمال تونسية عصرية
     ═══════════════════════════════════════════════════════════════════════ */
  ar: {
    dir: "rtl",
    htmlLang: "ar",
    label: "العربية",

    common: {
      whatsapp: "واتساب",
      waMsg: "سلام، نحبّ نعرف أكثر على MenuQR للمطعم متاعي."
    },

    ui: {
      overview: "محتوى العرض",
      keysNav: "تنقّل",
      keysNext: "التالي",
      keysFull: "شاشة كاملة",
      keysEsc: "خروج"
    },

    scene: { tentEyebrow: "امسح الكود" },

    menu: {
      cat: { breakfast: "فطور", pizza: "بيتزا", sandwich: "ساندويتش", drinks: "مشروبات", desserts: "حلويات" },
      venueTag: "منيو رقمي",
      featured: "مقترح",
      orderTitle: "طلبك",
      count: { one: "منتج واحد", two: "منتجين", few: "{n} منتجات", many: "{n} منتج" },
      send: "ابعث الطلب",
      currency: "د.ت"
    },

    dish: {
      margherita: "بيتزا مارغريتا",
      escalope: "ساندويتش إسكالوب",
      cappuccino: "كابوتشينو",
      lablabi: "لبلابي"
    },

    /* 01 — Hero */
    s1: {
      nav: "البداية",
      eyebrow: "منصة تونسية للمطاعم والمقاهي",
      title: "حوّل قائمة الطعام متاعك إلى تجربة رقمية عصرية",
      lede: "الحريف يمسح رمز QR على الطاولة، والـMenu متاعك يتحلّ في ثانية — بالصور، بالأسعار الصحيحة، وبالعربية أو الفرنسية.",
      cta: "اكتشف كيفاش يخدم",
      note: "بلا تطبيق · بلا طباعة جديدة · رمز QR ما يتبدّلش"
    },

    /* 02 — Problem */
    s2: {
      nav: "المشكلة",
      eyebrow: "الكارطة الورقية",
      title: "الـMenu الورقي يكلّفك أكثر ممّا تتصوّر",
      sub: "موش في الفلوس برك — في الوقت، في صورة المطعم، وفي كل حريف ما فهمش شنوّة يطلب.",
      p1t: "كارطة تتوسّخ وتتقدّ",
      p1d: "ورق يدور بين الأيادي الكل طول النهار. بعد شهرين يولّي شكله ما يشرّفش المحل.",
      p2t: "كل تبديل سعر = طباعة جديدة",
      p2d: "زادت القهوة 200 مليم؟ لازمك تعاود تطبع الكارطة الكل من الأوّل.",
      p3t: "الأطباق الجداد يستنّاو",
      p3d: "طبق جديد اليوم، وما يظهرش للحريف كان بعد أسابيع، وقت الطبعة الجاية.",
      p4t: "صور قليلة ولا بلا صور",
      p4d: "الحريف يقرا اسم برك. كي ما يشوفش الطبق، يرجع للّي يعرفو ويطلبو ديما.",
      p5t: "مصاريف تتكرّر كل عام",
      p5d: "كل طبعة فلوس تخرج، وكل نسخة ضايعة ولا مقدودة فلوس زايدة.",
      p6t: "تجربة قديمة",
      p6d: "الحريف اليوم عايش في تليفونو. الكارطة الورقية ما عادش تعطي نفس الانطباع."
    },

    /* 03 — Solution */
    s3: {
      nav: "الحلّ",
      eyebrow: "الحلّ",
      title: "Menu رقمي، بسيط، سريع وديما محدّث.",
      sub: "منصة وحدة: تبني الـMenu متاعك، تطبع رمز QR مرّة وحدة، وتبدّل شنوّة ما تحب وقتاش ما تحب.",
      n1t: "رمز QR",
      n1d: "على الطاولة",
      n2t: "التليفون",
      n2d: "مسح بالكاميرا",
      n3t: "الـMenu",
      n3d: "يتحلّ في ثانية",
      b1t: "رمز QR ثابت",
      b1d: "اطبعو مرّة وحدة. يبقى يخدم حتى كي تبدّل الأسعار والأطباق الكل.",
      b2t: "Menu في التليفون",
      b2d: "يتحلّ في المتصفّح مباشرة. الحريف ما يحمّل حتى تطبيق.",
      b3t: "لوحة تحكّم بين يديك",
      b3d: "تزيد، تنحّي، تبدّل سعر ولا تخبّي طبق نفد — في ثواني ومن التليفون."
    },

    /* 04 — How it works */
    s4: {
      nav: "كيفاش يخدم",
      eyebrow: "الطريقة",
      title: "ستّة خطوات، والباقي يمشي وحدو",
      f1t: "رمز QR على الطاولة", f1d: "ستيكر ولا حامل صغير",
      f2t: "الحريف يعمل Scan", f2d: "بكاميرا التليفون، بلا تطبيق",
      f3t: "يتحلّ الـMenu",      f3d: "صور، أسعار، عربي ولا فرنسي",
      f4t: "يختار المنتجات",     f4d: "يزيدهم للطلب ويشوف المجموع",
      f5t: "يبعث الطلبية",       f5d: "من التليفون، بلا ما يستنّى",
      f6t: "المطعم يستقبل",      f6d: "الطلب يوصل للشاشة في الحين",
      foot: "الخطوتين 5 و6 اختياريّين — تفعّلهم ولا تخلّي الـMenu للقراية برك، كيف ما يناسب المحل متاعك."
    },

    /* 05 — Customer experience */
    s5: {
      nav: "تجربة الحريف",
      eyebrow: "من عند الحريف",
      title: "هكّا يشوف الحريف الـMenu متاعك",
      sub: "تجربة نظيفة، سريعة ومصمّمة للتليفون — نفس المستوى اللي تلقاه في المطاعم الكبار.",
      t1: "شعار المطعم وألوانو في راس الصفحة",
      t2: "أقسام واضحة: فطور، بيتزا، ساندويتش، مشروبات، حلويات",
      t3: "صورة، وصف وسعر لكل طبق",
      t4: "تبديل بين العربية والفرنسية بضغطة",
      t5: "يزيد المنتجات للطلب ويشوف المجموع"
    },

    /* 06 — Dashboard */
    s6: {
      nav: "لوحة التحكّم",
      eyebrow: "من عندك أنت",
      title: "الـMenu متاعك تحت سيطرتك، في كل لحظة",
      sub: "لوحة تحكّم بالعربية، تخدم من التليفون ومن الأورديناتور. أي تبديل يظهر للحريف في الحين.",
      alt: "لوحة تحكّم المطعم: قائمة المنتجات مع الأسعار والحالة",
      nav1: "إحصائيات", nav2: "المنتجات", nav3: "الأقسام", nav4: "الطاولات وQR", nav5: "الطلبات", nav6: "الإعدادات",
      planT: "Café El Medina", planD: "منشور · 5 أقسام",
      h: "المنتجات", hsub: "20 منتج · 5 أقسام",
      live: "منشور",
      add: "زيد منتج",
      colProduct: "المنتج", colPhoto: "صورة", colPrice: "السعر (د.ت)", colState: "الحالة",
      hidden: "مخبّي اليوم",
      toast: "تسجّل — ظهر للحريف في الحين",
      k1: "زيد منتج", k2: "بدّل سعر", k3: "احذف منتج", k4: "طلّع صور",
      k5: "أنشئ أقسام", k6: "خبّي طبق نفد", k7: "رتّب الـMenu", k8: "اطبع رموز QR"
    },

    /* 07 — Benefits */
    s7: {
      nav: "الفائدة",
      eyebrow: "شنوّة تربح",
      title: "علاش المطاعم تبدّل للـMenu الرقمي",
      b1t: "توفّر في الطباعة",       b1d: "ما عادش تعاود تطبع في كل مرّة يتبدّل سعر ولا يتزاد طبق.",
      b2t: "حدّث الأسعار في ثواني",  b2d: "تبدّل السعر من التليفون، والحريف يشوفو في الحين على الطاولة.",
      b3t: "تجربة أفضل للحريف",      b3d: "يفهم شنوّة يطلب، ويقرّر بسرعة. خدمة أنظف وطاولات تدور أسرع.",
      b4t: "صور أكثر للأطباق",       b4d: "صورة وحدة نظيفة تبيع أكثر من عشر أسطر مكتوبة.",
      b5t: "Menu ديما محدّث",        b5d: "طبق نفد؟ خبّيه بضغطة. ما عادش حريف يطلب حاجة ما فماش.",
      b6t: "صورة أكثر احترافية",     b6d: "مطعم يخدم برمز QR يعطي انطباع مختلف — من أوّل طاولة.",
      foot: "والأهم: رمز QR واحد يبقى نفسو، مهما بدّلت في الـMenu."
    },

    /* 08 — Comparison */
    s8: {
      nav: "المقارنة",
      eyebrow: "المقارنة",
      title: "الكارطة الورقية والـMenu الرقمي، جنب بعضهم",
      colOld: "كارطة مطبوعة",
      colNew: "Menu رقمي بـQR",
      r1: "تبديل سعر",   r1a: "تعاود تطبع الكارطة الكل", r1b: "تبديل في ثواني",
      r2: "صور الأطباق", r2a: "قليلة ولا ما فماش",        r2b: "صورة لكل طبق",
      r3: "طبق جديد",    r3a: "يستنّى الطبعة الجاية",     r3b: "يظهر في الحين",
      r4: "المصاريف",    r4a: "في كل طبعة جديدة",         r4b: "بلا طباعة جديدة",
      r5: "حالة الكارطة", r5a: "تتوسّخ وتتقدّ",            r5b: "ديما جديدة ونظيفة",
      r6: "اللغات",      r6a: "كارطة لكل لغة",            r6b: "عربي وفرنسي في نفس الـMenu"
    },

    /* 09 — Use case */
    s9: {
      nav: "مثال حقيقي",
      eyebrow: "حالة من الواقع",
      title: "المطعم يحبّ يبدّل سعر طبق",
      sub: "نفس العملية، بزوز طرق. شوف الفرق.",
      oldT: "بالكارطة المطبوعة",
      o1: "تبدّل السعر في الملف",
      o2: "تمشي للمطبعة وتستنّى",
      o3: "تخلّص الطبعة الجديدة",
      o4: "تبدّل الكارطات الكل على الطاولات",
      oldFoot: "أيام من الوقت، وفلوس تخرج",
      newT: "بالـMenu الرقمي",
      n1: "تحلّ لوحة التحكّم",
      n2: "تبدّل السعر",
      n3: "تسجّل",
      newFoot: "السعر الجديد تو على الطاولة",
      note: "ونفس الحكاية كي تزيد طبق جديد، تخبّي حاجة نفدت، ولا تبدّل صورة."
    },

    /* 10 — Brand */
    s10: {
      nav: "صورة المطعم",
      eyebrow: "أكثر من ورقة",
      title: "الـMenu هو أوّل حاجة يشوفها الحريف",
      sub: "قبل ما يذوق حتى حاجة، الحريف يحكم على المحل من الكارطة. خلّي أوّل انطباع يشبه للخدمة اللي تقدّمها.",
      p1t: "شعارك وألوانك",   p1d: "الـMenu يولّي جزء من هوية المطعم، موش ورقة عادية.",
      p2t: "أطباقك كيف ما يلزم", p2d: "صور واضحة تبيّن الخدمة والجودة متاعك.",
      p3t: "حرفاء من كل بلاصة", p3d: "التوانسة بالعربية، والأجانب بالفرنسية — في نفس الـMenu."
    },

    /* 11 — CTA */
    s11: {
      nav: "تواصل معنا",
      eyebrow: "الخطوة الجاية",
      title: "جاهز باش تطوّر الـMenu متاعك؟",
      sub: "خلّي حرفائك يكتشفوا تجربة جديدة، من أوّل طاولة.",
      cta: "تواصل معنا",
      k1: "نعاونوك تبني الـMenu",
      k2: "بلا تطبيق للحريف",
      k3: "رمز QR ما يتبدّلش",
      qrHint: "امسح الكود وابعثلنا على واتساب"
    },

    /* 12 — Closing */
    s12: {
      nav: "الختام",
      tag: "الـMenu متاعك. علامتك. تجربة رقمية.",
      foot: "منيو رقمي برمز QR للمطاعم والمقاهي في تونس."
    }
  },

  /* ═══════════════════════════════════════════════════════════════════════
     Français — professionnel
     ═══════════════════════════════════════════════════════════════════════ */
  fr: {
    dir: "ltr",
    htmlLang: "fr",
    label: "Français",

    common: {
      whatsapp: "WhatsApp",
      waMsg: "Bonjour, je souhaite en savoir plus sur MenuQR pour mon établissement."
    },

    ui: {
      overview: "Sommaire",
      keysNav: "Naviguer",
      keysNext: "Suivant",
      keysFull: "Plein écran",
      keysEsc: "Quitter"
    },

    scene: { tentEyebrow: "Scannez" },

    menu: {
      cat: { breakfast: "Petit déj", pizza: "Pizza", sandwich: "Sandwich", drinks: "Boissons", desserts: "Desserts" },
      venueTag: "Menu digital",
      featured: "Suggestion",
      orderTitle: "Votre commande",
      count: { one: "1 article", two: "2 articles", few: "{n} articles", many: "{n} articles" },
      send: "Envoyer",
      currency: "DT"
    },

    dish: {
      margherita: "Pizza Margherita",
      escalope: "Sandwich Escalope",
      cappuccino: "Cappuccino",
      lablabi: "Lablabi"
    },

    /* 01 — Hero */
    s1: {
      nav: "Ouverture",
      eyebrow: "Plateforme tunisienne pour restaurants et cafés",
      title: "Transformez votre menu en une expérience digitale moderne",
      lede: "Votre client scanne un QR code posé sur la table et votre menu s’ouvre en une seconde — avec les photos, les bons prix, en arabe ou en français.",
      cta: "Découvrir la solution",
      note: "Aucune application à installer · Aucune réimpression · Un QR code qui ne change jamais"
    },

    /* 02 — Problem */
    s2: {
      nav: "Le constat",
      eyebrow: "La carte papier",
      title: "Le menu imprimé vous coûte plus cher qu’il n’y paraît",
      sub: "Pas seulement en dinars : en temps, en image, et en clients qui commandent sans vraiment savoir.",
      p1t: "Des cartes qui s’abîment",
      p1d: "Manipulées toute la journée, elles se tachent et vieillissent en quelques semaines.",
      p2t: "Un prix modifié = une réimpression",
      p2d: "Le café augmente de 200 millimes et c’est toute la carte qu’il faut refaire.",
      p3t: "Les nouveautés attendent",
      p3d: "Un nouveau plat aujourd’hui, visible par vos clients au prochain tirage seulement.",
      p4t: "Peu ou pas de photos",
      p4d: "Le client lit un nom. Sans voir le plat, il reprend ce qu’il connaît déjà.",
      p5t: "Un coût qui revient chaque année",
      p5d: "Chaque tirage se paie, et chaque carte perdue ou tachée se paie une deuxième fois.",
      p6t: "Une expérience datée",
      p6d: "Vos clients vivent sur leur téléphone. La carte papier ne renvoie plus la même image."
    },

    /* 03 — Solution */
    s3: {
      nav: "La solution",
      eyebrow: "La solution",
      title: "Un menu digital, simple, rapide et toujours à jour.",
      sub: "Une seule plateforme : vous construisez votre menu, vous imprimez le QR code une fois, et vous modifiez ce que vous voulez, quand vous voulez.",
      n1t: "QR code",
      n1d: "sur la table",
      n2t: "Téléphone",
      n2d: "un simple scan",
      n3t: "Le menu",
      n3d: "ouvert en une seconde",
      b1t: "Un QR code permanent",
      b1d: "Imprimé une fois. Il continue de fonctionner même quand tout le menu change.",
      b2t: "Un menu dans le téléphone",
      b2d: "Il s’ouvre directement dans le navigateur. Aucune application à installer.",
      b3t: "Un tableau de bord à vous",
      b3d: "Ajoutez, modifiez un prix ou masquez un plat épuisé — en quelques secondes, depuis votre téléphone."
    },

    /* 04 — How it works */
    s4: {
      nav: "Comment ça marche",
      eyebrow: "Le principe",
      title: "Six étapes, et tout se fait tout seul",
      f1t: "QR code sur la table", f1d: "Un sticker ou un chevalet",
      f2t: "Le client scanne",      f2d: "Avec l’appareil photo, sans app",
      f3t: "Le menu s’ouvre",       f3d: "Photos, prix, arabe ou français",
      f4t: "Il choisit ses produits", f4d: "Il les ajoute et voit le total",
      f5t: "Il envoie sa demande",  f5d: "Depuis son téléphone, sans attendre",
      f6t: "Le restaurant reçoit",  f6d: "La demande arrive sur votre écran",
      foot: "Les étapes 5 et 6 sont optionnelles : activez la commande, ou gardez un menu en simple consultation. C’est votre établissement qui décide."
    },

    /* 05 — Customer experience */
    s5: {
      nav: "Côté client",
      eyebrow: "Côté client",
      title: "Voici ce que votre client voit sur son téléphone",
      sub: "Une interface épurée, rapide, pensée d’abord pour le mobile — le niveau des grandes enseignes.",
      t1: "Votre logo et vos couleurs en haut de page",
      t2: "Des catégories claires : petit déjeuner, pizza, sandwich, boissons, desserts",
      t3: "Une photo, une description et un prix pour chaque plat",
      t4: "Passage de l’arabe au français d’un seul geste",
      t5: "Ajout des produits et total visible en temps réel"
    },

    /* 06 — Dashboard */
    s6: {
      nav: "Tableau de bord",
      eyebrow: "Côté établissement",
      title: "Votre menu reste entre vos mains, à chaque instant",
      sub: "Un tableau de bord en français ou en arabe, utilisable depuis le téléphone comme depuis l’ordinateur. Chaque modification est visible immédiatement.",
      alt: "Tableau de bord du restaurant : liste des produits avec prix et état",
      nav1: "Statistiques", nav2: "Produits", nav3: "Catégories", nav4: "Tables & QR", nav5: "Commandes", nav6: "Réglages",
      planT: "Café El Medina", planD: "Publié · 5 catégories",
      h: "Produits", hsub: "20 produits · 5 catégories",
      live: "En ligne",
      add: "Ajouter un produit",
      colProduct: "Produit", colPhoto: "Photo", colPrice: "Prix (DT)", colState: "État",
      hidden: "Masqué aujourd’hui",
      toast: "Enregistré — déjà visible en salle",
      k1: "Ajouter un produit", k2: "Changer un prix", k3: "Supprimer un produit", k4: "Charger des photos",
      k5: "Créer des catégories", k6: "Masquer un plat épuisé", k7: "Réorganiser le menu", k8: "Imprimer les QR codes"
    },

    /* 07 — Benefits */
    s7: {
      nav: "Vos bénéfices",
      eyebrow: "Ce que vous y gagnez",
      title: "Pourquoi les établissements passent au menu digital",
      b1t: "Réduisez les coûts d’impression", b1d: "Plus de réimpression à chaque prix modifié ou plat ajouté.",
      b2t: "Mettez vos prix à jour en quelques secondes", b2d: "Vous corrigez depuis votre téléphone, la salle voit le nouveau prix aussitôt.",
      b3t: "Améliorez l’expérience client", b3d: "Il comprend ce qu’il commande et décide plus vite. Un service plus fluide, des tables qui tournent mieux.",
      b4t: "Présentez vos plats avec de belles photos", b4d: "Une bonne photo vend mieux que dix lignes de description.",
      b5t: "Un menu toujours à jour", b5d: "Un plat épuisé se masque d’un geste. Fini les commandes impossibles à servir.",
      b6t: "Une image plus moderne", b6d: "Un établissement qui travaille au QR code renvoie autre chose — dès la première table.",
      foot: "Et surtout : un seul QR code, qui reste le même quoi que vous changiez dans le menu."
    },

    /* 08 — Comparison */
    s8: {
      nav: "Comparatif",
      eyebrow: "Comparatif",
      title: "La carte imprimée et le menu QR, côte à côte",
      colOld: "Carte imprimée",
      colNew: "Menu digital QR",
      r1: "Changer un prix", r1a: "Réimprimer toute la carte", r1b: "Modifié en quelques secondes",
      r2: "Photos des plats", r2a: "Rares, souvent absentes",   r2b: "Une photo par plat",
      r3: "Nouveau plat",     r3a: "Attendre le prochain tirage", r3b: "En ligne immédiatement",
      r4: "Coût",             r4a: "À chaque réimpression",      r4b: "Aucune réimpression",
      r5: "État de la carte", r5a: "S’use et se tache",          r5b: "Toujours impeccable",
      r6: "Langues",          r6a: "Une carte par langue",       r6b: "Arabe et français dans le même menu"
    },

    /* 09 — Use case */
    s9: {
      nav: "Cas concret",
      eyebrow: "Cas concret",
      title: "Le restaurant change le prix d’un plat",
      sub: "La même opération, deux méthodes. La différence se voit tout de suite.",
      oldT: "Avec la carte imprimée",
      o1: "Modifier le fichier de la carte",
      o2: "Passer chez l’imprimeur et attendre",
      o3: "Payer le nouveau tirage",
      o4: "Remplacer toutes les cartes en salle",
      oldFoot: "Des jours d’attente, et un coût",
      newT: "Avec le menu QR",
      n1: "Ouvrir le tableau de bord",
      n2: "Modifier le prix",
      n3: "Enregistrer",
      newFoot: "Le nouveau prix est déjà sur la table",
      note: "Et c’est exactement pareil pour ajouter un plat, masquer un produit épuisé ou changer une photo."
    },

    /* 10 — Brand */
    s10: {
      nav: "Votre image",
      eyebrow: "Bien plus qu’un bout de papier",
      title: "Votre menu est la première chose que voit votre client",
      sub: "Avant même de goûter, il juge votre établissement sur sa carte. Offrez une première impression à la hauteur de ce que vous servez.",
      p1t: "Votre logo, vos couleurs", p1d: "Le menu devient une pièce de votre identité, pas une feuille de plus.",
      p2t: "Vos plats bien présentés",  p2d: "Des photos nettes qui montrent votre travail et votre qualité.",
      p3t: "Des clients de partout",    p3d: "Les Tunisiens en arabe, vos visiteurs en français — dans le même menu."
    },

    /* 11 — CTA */
    s11: {
      nav: "Contact",
      eyebrow: "La prochaine étape",
      title: "Prêt à moderniser votre menu ?",
      sub: "Offrez à vos clients une nouvelle expérience digitale, dès la première table.",
      cta: "Nous contacter",
      k1: "On construit votre menu avec vous",
      k2: "Aucune application pour vos clients",
      k3: "Un QR code qui ne change jamais",
      qrHint: "Scannez pour nous écrire sur WhatsApp"
    },

    /* 12 — Closing */
    s12: {
      nav: "Contact",
      tag: "Votre menu. Votre marque. Une expérience digitale.",
      foot: "Le menu digital par QR code pour les restaurants et cafés en Tunisie."
    }
  }
};
