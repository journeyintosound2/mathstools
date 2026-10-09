/**
 * BILINGUAL DICTIONARY (EALD) — hand translations for the student-facing UI.
 *
 * Keyed by the EXACT English string as it appears in the UI. To translate more
 * of the game, add the English string as a key here (in both `fa` and `ar`) and
 * wrap the place it renders with <Bi> (see i18n.jsx). Missing keys fall back to
 * English automatically, so partial coverage is always safe.
 *
 *   fa = Farsi / Persian (فارسی)   ar = Arabic (العربية)   — both right-to-left.
 *
 * Numbers and maths symbols are deliberately NOT translated (they're universal).
 */
export const TRANSLATIONS = {
  fa: {
    // — Top HUD buttons —
    "Quests": "ماموریت‌ها",
    "Results": "نتایج",
    "Help": "راهنما",
    "Sign in": "ورود",
    "Demo (local)": "نسخهٔ آزمایشی (محلی)",

    // — ⚙ Options menu —
    "Options": "تنظیمات",
    "Language": "زبان",
    "Camera Lock": "قفل دوربین",
    "Quest HUD": "نوار ماموریت",
    "Sound": "صدا",
    "Touch controls": "کنترل لمسی",
    "Graphics": "گرافیک",
    "Edit name": "ویرایش نام",
    "On": "روشن",
    "Off": "خاموش",
    "High": "زیاد",
    "Low": "کم",

    // — Quest tracker / guidance —
    "Current Quest": "ماموریت فعلی",
    "All quests complete — explore freely! 🎉": "همهٔ ماموریت‌ها کامل شد — آزادانه بگرد! 🎉",
    "Press": "فشار بده",

    // — Controls help line (both camera modes) —
    "WASD / Arrows to move · Space to jump · Shift to run · E to interact · Q for quests · Camera follows you":
      "WASD / کلیدهای جهت‌دار برای حرکت · Space برای پرش · Shift برای دویدن · E برای تعامل · Q برای ماموریت‌ها · دوربین دنبالت می‌کند",
    "WASD / Arrows to move · Space to jump · Shift to run · E to interact · Z / X to rotate camera · Q for quests":
      "WASD / کلیدهای جهت‌دار برای حرکت · Space برای پرش · Shift برای دویدن · E برای تعامل · Z / X برای چرخاندن دوربین · Q برای ماموریت‌ها",

    // — Welcome / character-select screen —
    "Your character": "شخصیت تو",
    "Pick your character, tell us your name, and set off across Number Island!":
      "شخصیتت را انتخاب کن، نامت را بگو، و در جزیرهٔ اعداد راه بیفت!",
    "Pick your character and update your details, then head back out!":
      "شخصیتت را انتخاب کن و مشخصاتت را به‌روز کن، بعد به بازی برگرد!",
    "Your name": "نام تو",
    "Student code": "کد دانش‌آموزی",
    "(optional — for your teacher)": "(اختیاری — برای معلمت)",
    "Start Adventure →": "شروع ماجراجویی →",
    "Save & play →": "ذخیره و بازی →",
    "Signing in…": "در حال ورود…",
    "☁ Sign in with student code (save online)": "☁ ورود با کد دانش‌آموزی (ذخیرهٔ آنلاین)",
    "Reset saved progress": "بازنشانی پیشرفت ذخیره‌شده",
    "Choose your language": "زبانت را انتخاب کن",
    // Selectable characters (labels + blurbs).
    "Explorer": "کاوشگر",
    "The original adventurer": "ماجراجوی اصلی",
    "Cool Cat": "گربهٔ باحال",
    "Too cool for maths? Never.": "برای ریاضی زیادی باحال؟ هرگز.",
    "DJ Goat": "بز دی‌جی",
    "The Greatest Of All Time": "بهترینِ تمام دوران",

    // — In-world labels, prompts & buttons (picked up by the auto-layer
    //    everywhere they appear: 3D NPC badges, zone signs, challenge panels) —
    "Talk to me": "با من حرف بزن",
    "Start! (Enter)": "شروع! (Enter)",
    "Quit": "خروج",
    "Continue": "ادامه",
    "Next": "بعدی",
    "Try again": "دوباره امتحان کن",
    "Submit": "ثبت",
    "Done": "تمام",
    "Close": "بستن",
    "Back": "بازگشت",
    // Places / zones.
    "Cow Paddock": "چراگاه گاو",
    "Veggie Plot": "باغچهٔ سبزیجات",
    "Pig Pen": "آغل خوک",
    "Sorting Pen": "آغل جداسازی",
    "Fraction Farm": "مزرعهٔ کسرها",
    "Number Island": "جزیرهٔ اعداد",
    "Retrieval Practice Playground": "زمین بازیِ تمرین یادآوری",
    // Quest guidance.
    "Find Pip in Pip's Problems": "پیپ را در «مسائل پیپ» پیدا کن",
    "Find Fern at Fern's Fun": "فرن را در «سرگرمی فرن» پیدا کن",
    "Find Alby at Alby's Addition": "آلبی را در «جمعِ آلبی» پیدا کن",
    // Farm hosts + island friends (roles translated, names transliterated).
    "The Milkman": "شیرفروش",
    "The Weigh Master": "استادِ وزن",
    "The Trader": "تاجر",
    "Robot": "ربات",
    "Trevor": "تروور",
    "Steve": "استیو",
    "Sunny": "سانی",
    "Woody": "وودی",
    "Mills": "میلز",
    "Pip the Penguin": "پیپِ پنگوئن",
    "Fern the Fox": "فرنِ روباه",
    "Alby the Owl": "آلبیِ جغد",
    "Fraction Fred": "فردِ کسری",
    "Decimal Dot": "داتِ اعشاری",
    "Percent Penny": "پنیِ درصدی",

    // — Title screen (2026-10-09) —
    "A maths adventure across Number Island": "یک ماجراجویی ریاضی در سراسر جزیرهٔ اعداد",
    "Building Number Island…": "در حال ساختن جزیرهٔ اعداد…",
    "Press Enter or tap to start": "برای شروع Enter را بزن یا ضربه بزن",
    "Tap to start": "برای شروع ضربه بزن",
    "Start adventure": "شروع ماجراجویی",
    "Pick your explorer and set off": "کاوشگرت را انتخاب کن و راه بیفت",
    "Change character": "تغییر شخصیت",
    "Your explorer, name and student code": "کاوشگر، نام و کد دانش‌آموزی‌ات",
    "Sign in with student code": "ورود با کد دانش‌آموزی",
    "Save your work for your teacher": "کارت را برای معلمت ذخیره کن",
    "Language, graphics and sound": "زبان، گرافیک و صدا",
    "Choose your explorer": "کاوشگرت را انتخاب کن",
    "Set off!": "راه بیفت!",
    "Save & play": "ذخیره و بازی",
    "Cancel": "لغو",
    "Yes, reset": "بله، پاک کن",
    "This clears everything saved on this device — your trophies, keys and level. Are you sure?":
      "این کار همه‌چیزِ ذخیره‌شده روی این دستگاه را پاک می‌کند — جام‌ها، کلیدها و سطحت. مطمئنی؟",
    "High looks richest; Low runs smoother on tablets.": "«زیاد» زیباتر است؛ «کم» روی تبلت روان‌تر اجرا می‌شود.",
    "Tap to move and on-screen buttons.": "حرکت با ضربه و دکمه‌های روی صفحه.",

    // — The Achievements Wall —
    "Achievements Wall": "دیوار افتخارات",
    "Look at the Achievements Wall": "به دیوار افتخارات نگاه کن",
    "Step back": "عقب برو",
    "step back": "عقب برو",
    "Whole wall": "کل دیوار",
    "Zoom in": "بزرگ‌نمایی",
    "zoom": "بزرگ‌نمایی",
    "boards": "تابلوها",
    "worlds": "دنیاها",
  },

  ar: {
    // — Top HUD buttons —
    "Quests": "المهام",
    "Results": "النتائج",
    "Help": "مساعدة",
    "Sign in": "تسجيل الدخول",
    "Demo (local)": "نسخة تجريبية (محلية)",

    // — ⚙ Options menu —
    "Options": "الإعدادات",
    "Language": "اللغة",
    "Camera Lock": "قفل الكاميرا",
    "Quest HUD": "شريط المهمة",
    "Sound": "الصوت",
    "Touch controls": "التحكم باللمس",
    "Graphics": "الرسوميات",
    "Edit name": "تعديل الاسم",
    "On": "تشغيل",
    "Off": "إيقاف",
    "High": "عالٍ",
    "Low": "منخفض",

    // — Quest tracker / guidance —
    "Current Quest": "المهمة الحالية",
    "All quests complete — explore freely! 🎉": "اكتملت جميع المهام — استكشف بحرية! 🎉",
    "Press": "اضغط",

    // — Controls help line (both camera modes) —
    "WASD / Arrows to move · Space to jump · Shift to run · E to interact · Q for quests · Camera follows you":
      "WASD / الأسهم للحركة · Space للقفز · Shift للركض · E للتفاعل · Q للمهام · الكاميرا تتبعك",
    "WASD / Arrows to move · Space to jump · Shift to run · E to interact · Z / X to rotate camera · Q for quests":
      "WASD / الأسهم للحركة · Space للقفز · Shift للركض · E للتفاعل · Z / X لتدوير الكاميرا · Q للمهام",

    // — Welcome / character-select screen —
    "Your character": "شخصيتك",
    "Pick your character, tell us your name, and set off across Number Island!":
      "اختر شخصيتك، أخبرنا باسمك، وانطلق عبر جزيرة الأرقام!",
    "Pick your character and update your details, then head back out!":
      "اختر شخصيتك وحدّث بياناتك، ثم عُد إلى اللعب!",
    "Your name": "اسمك",
    "Student code": "رمز الطالب",
    "(optional — for your teacher)": "(اختياري — لمعلمك)",
    "Start Adventure →": "ابدأ المغامرة →",
    "Save & play →": "احفظ والعب →",
    "Signing in…": "جارٍ تسجيل الدخول…",
    "☁ Sign in with student code (save online)": "☁ تسجيل الدخول برمز الطالب (الحفظ عبر الإنترنت)",
    "Reset saved progress": "إعادة ضبط التقدم المحفوظ",
    "Choose your language": "اختر لغتك",
    // Selectable characters (labels + blurbs).
    "Explorer": "المستكشف",
    "The original adventurer": "المغامر الأصلي",
    "Cool Cat": "القط الرائع",
    "Too cool for maths? Never.": "رائع جداً على الرياضيات؟ أبداً.",
    "DJ Goat": "الماعز دي جي",
    "The Greatest Of All Time": "الأعظم على الإطلاق",

    // — In-world labels, prompts & buttons (picked up by the auto-layer
    //    everywhere they appear: 3D NPC badges, zone signs, challenge panels) —
    "Talk to me": "تحدّث معي",
    "Start! (Enter)": "ابدأ! (Enter)",
    "Quit": "خروج",
    "Continue": "متابعة",
    "Next": "التالي",
    "Try again": "حاول مرة أخرى",
    "Submit": "إرسال",
    "Done": "تمّ",
    "Close": "إغلاق",
    "Back": "رجوع",
    // Places / zones.
    "Cow Paddock": "حظيرة الأبقار",
    "Veggie Plot": "حوض الخضار",
    "Pig Pen": "حظيرة الخنازير",
    "Sorting Pen": "حظيرة الفرز",
    "Fraction Farm": "مزرعة الكسور",
    "Number Island": "جزيرة الأرقام",
    "Retrieval Practice Playground": "ساحة تمرين الاسترجاع",
    // Quest guidance.
    "Find Pip in Pip's Problems": "ابحث عن بيب في «مسائل بيب»",
    "Find Fern at Fern's Fun": "ابحث عن فيرن في «مرح فيرن»",
    "Find Alby at Alby's Addition": "ابحث عن ألبي في «جمع ألبي»",
    // Farm hosts + island friends (roles translated, names transliterated).
    "The Milkman": "بائع الحليب",
    "The Weigh Master": "سيّد الوزن",
    "The Trader": "التاجر",
    "Robot": "روبوت",
    "Trevor": "تريفور",
    "Steve": "ستيف",
    "Sunny": "ساني",
    "Woody": "وودي",
    "Mills": "ميلز",
    "Pip the Penguin": "بيب البطريق",
    "Fern the Fox": "فيرن الثعلب",
    "Alby the Owl": "ألبي البومة",
    "Fraction Fred": "فريد الكسور",
    "Decimal Dot": "دوت العشرية",
    "Percent Penny": "بيني النسبة",

    // — Title screen (2026-10-09) —
    "A maths adventure across Number Island": "مغامرة رياضيات في أرجاء جزيرة الأرقام",
    "Building Number Island…": "جارٍ بناء جزيرة الأرقام…",
    "Press Enter or tap to start": "اضغط Enter أو المس الشاشة للبدء",
    "Tap to start": "المس الشاشة للبدء",
    "Start adventure": "ابدأ المغامرة",
    "Pick your explorer and set off": "اختر مستكشفك وانطلق",
    "Change character": "تغيير الشخصية",
    "Your explorer, name and student code": "مستكشفك واسمك ورمز الطالب",
    "Sign in with student code": "تسجيل الدخول برمز الطالب",
    "Save your work for your teacher": "احفظ عملك لمعلمك",
    "Language, graphics and sound": "اللغة والرسومات والصوت",
    "Choose your explorer": "اختر مستكشفك",
    "Set off!": "انطلق!",
    "Save & play": "احفظ والعب",
    "Cancel": "إلغاء",
    "Yes, reset": "نعم، امسح",
    "This clears everything saved on this device — your trophies, keys and level. Are you sure?":
      "سيمسح هذا كل ما حُفظ على هذا الجهاز — كؤوسك ومفاتيحك ومستواك. هل أنت متأكد؟",
    "High looks richest; Low runs smoother on tablets.": "«عالٍ» هو الأجمل؛ «منخفض» أكثر سلاسة على الأجهزة اللوحية.",
    "Tap to move and on-screen buttons.": "المس للتحرك، مع أزرار على الشاشة.",

    // — The Achievements Wall —
    "Achievements Wall": "جدار الإنجازات",
    "Look at the Achievements Wall": "انظر إلى جدار الإنجازات",
    "Step back": "تراجع",
    "step back": "تراجع",
    "Whole wall": "الجدار كله",
    "Zoom in": "تكبير",
    "zoom": "تكبير",
    "boards": "اللوحات",
    "worlds": "العوالم",
  },
};
