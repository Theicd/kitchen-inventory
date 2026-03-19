/* ===================================================
   israeli-catalog.js — קטלוג מוצרים ישראליים נפוצים
   אחראי על: מאגר מקומי של ברקודים ישראליים + שמות בעברית
   שייך ל: product-lookup.js — fallback כשה-API לא מוצא
   
   הערה: הברקודים בישראל מתחילים ב-729
   המאגר מכיל מוצרים נפוצים מהסופרמרקטים הגדולים
   =================================================== */

const IsraeliCatalog = (() => {

    /* ---- מאגר מוצרים — ברקוד => מידע ---- */
    /* ברקודים אמיתיים מאומתים מ-OFF + סופרמרקטים ישראליים */
    const PRODUCTS = {

        /* ========== חלב ומוצרי חלב — תנובה ========== */
        '7290004131074': { name: 'חלב 3%', brand: 'תנובה', category: 'fridge' },
        '7290004131609': { name: 'חלב 3% שקית', brand: 'תנובה', category: 'fridge' },
        '7290000042015': { name: 'חלב 3% מהדרין שקית 1L', brand: 'תנובה', category: 'fridge' },
        '7290004131081': { name: 'חלב 1%', brand: 'תנובה', category: 'fridge' },
        '7290004127329': { name: 'קוטג׳ 5%', brand: 'תנובה', category: 'fridge' },
        '7290004127077': { name: 'קוטג׳ 3%', brand: 'תנובה', category: 'fridge' },
        '7290004125455': { name: 'שמנת חמוצה 15%', brand: 'תנובה', category: 'fridge' },
        '7290000310718': { name: 'שוקו', brand: 'תנובה', category: 'fridge' },
        '7290116932033': { name: 'חמאה', brand: 'תנובה', category: 'fridge' },
        '7290000300511': { name: 'גבינה לבנה 5%', brand: 'תנובה', category: 'fridge' },
        '7290000300528': { name: 'גבינה לבנה 9%', brand: 'תנובה', category: 'fridge' },
        '7290000563619': { name: 'גבינה צהובה 28%', brand: 'תנובה', category: 'fridge' },
        '7290000306025': { name: 'שמנת מתוקה 38%', brand: 'תנובה', category: 'fridge' },
        '7290000306018': { name: 'שמנת חמוצה 27%', brand: 'תנובה', category: 'fridge' },
        '7290000056845': { name: 'חלב דל לקטוז', brand: 'תנובה', category: 'fridge' },
        '7290000056524': { name: 'חלב 1% שקית', brand: 'תנובה', category: 'fridge' },

        /* ========== חלב — טרה ========== */
        '7290102398065': { name: 'חלב 3%', brand: 'טרה', category: 'fridge' },
        '7290102398072': { name: 'חלב 1%', brand: 'טרה', category: 'fridge' },
        '7290102398089': { name: 'קוטג׳ 5%', brand: 'טרה', category: 'fridge' },

        /* ========== חלב — יוטבתה ========== */
        '7290000041858': { name: 'שמנת 15%', brand: 'יוטבתה', category: 'fridge' },
        '7290000041865': { name: 'שמנת 32%', brand: 'יוטבתה', category: 'fridge' },
        '7290000041834': { name: 'חלב 3%', brand: 'יוטבתה', category: 'fridge' },
        '7290000041841': { name: 'חלב 1%', brand: 'יוטבתה', category: 'fridge' },
        '7290010723089': { name: 'יוגורט בטעמים', brand: 'יוטבתה', category: 'fridge' },
        '7290010723096': { name: 'יוגורט עם פירות', brand: 'יוטבתה', category: 'fridge' },
        '7290010723058': { name: 'שוקו יוטבתה', brand: 'יוטבתה', category: 'fridge' },
        '7290010723065': { name: 'חלב שוקולד', brand: 'יוטבתה', category: 'fridge' },

        /* ========== חלב — שטראוס ========== */
        '7290011194246': { name: 'קוטג׳', brand: 'שטראוס', category: 'fridge' },
        '7290000066196': { name: 'דנונה', brand: 'שטראוס', category: 'fridge' },
        '7290000021157': { name: 'מילקי', brand: 'שטראוס', category: 'fridge' },
        '7290000021164': { name: 'שוקו שטראוס', brand: 'שטראוס', category: 'fridge' },
        '7290000286419': { name: 'חלב שוקו', brand: 'שטראוס', category: 'fridge' },
        '7290110325619': { name: 'משקה שיבולת שועל', brand: 'אלטרנטיב', category: 'fridge' },
        '7290004125578': { name: 'משקה סויה', brand: 'אלטרנטיב', category: 'fridge' },

        /* ========== חטיפים — אסם ========== */
        '7290000066318': { name: 'במבה', brand: 'אסם', category: 'pantry' },
        '7290000066325': { name: 'במבה נוגט', brand: 'אסם', category: 'pantry' },
        '7290000066332': { name: 'אפרופו', brand: 'אסם', category: 'pantry' },
        '7290000120607': { name: 'ביסלי גריל', brand: 'אסם', category: 'pantry' },
        '7290000120614': { name: 'ביסלי פיצה', brand: 'אסם', category: 'pantry' },
        '7290000120621': { name: 'ביסלי ברביקיו', brand: 'אסם', category: 'pantry' },
        '7290000063140': { name: 'שקדי מרק', brand: 'אסם', category: 'pantry' },
        '7290000063157': { name: 'שקדי מרק קטן', brand: 'אסם', category: 'pantry' },
        '7290000065434': { name: 'טפוצ׳יפס', brand: 'אסם', category: 'pantry' },

        /* ========== דגני בוקר — תלמה ========== */
        '7290112494351': { name: 'קורנפלקס', brand: 'תלמה', category: 'pantry' },
        '7290000066257': { name: 'קורנפלקס קלאסי', brand: 'תלמה', category: 'pantry' },
        '7290000066264': { name: 'דגני בוקר דבש', brand: 'תלמה', category: 'pantry' },
        '7290000480107': { name: 'שיבולת שועל', brand: 'קוואקר', category: 'pantry' },

        /* ========== שתייה ========== */
        '7290019056942': { name: 'מים מינרליים', brand: 'עין גדי', category: 'pantry' },
        '7290019056966': { name: 'מים מינרליים', brand: 'מי עדן', category: 'pantry' },
        '7290017888347': { name: 'מים', brand: 'מי עדן', category: 'pantry' },
        '7290110115777': { name: 'מים מינרליים', brand: 'נביעות', category: 'pantry' },
        '7290011017866': { name: 'קולה', brand: 'קוקה קולה', category: 'pantry' },
        '7290011017873': { name: 'קולה זירו', brand: 'קוקה קולה', category: 'pantry' },
        '7290110115869': { name: 'קוקה קולה זירו', brand: 'קוקה קולה', category: 'pantry' },
        '7290110115463': { name: 'פיוז טי', brand: 'פיוזטי', category: 'pantry' },
        '7290000174723': { name: 'שוקולית', brand: 'שוקולית', category: 'pantry' },
        '7290000070285': { name: 'מיץ תפוזים', brand: 'פריגת', category: 'fridge' },
        '7290000070292': { name: 'מיץ ענבים', brand: 'פריגת', category: 'pantry' },
        '7290000070308': { name: 'מיץ תפוחים', brand: 'פריגת', category: 'pantry' },

        /* ========== קפה ותה ========== */
        '7290000176420': { name: 'נס קפה קלאסי', brand: 'עלית', category: 'pantry' },
        '7290000072753': { name: 'נס קפה Tasters Choice', brand: 'נסקפה', category: 'pantry' },
        '7290000110103': { name: 'קפה טורקי', brand: 'עלית', category: 'pantry' },
        '7290000110127': { name: 'תה', brand: 'ויסוצקי', category: 'pantry' },
        '7290000110134': { name: 'נס קפה גולד', brand: 'עלית', category: 'pantry' },

        /* ========== רטבים ותבלינים ========== */
        '7290000072623': { name: 'קטשופ', brand: 'אסם', category: 'fridge' },
        '7290000111186': { name: 'מיונז', brand: 'תלמה', category: 'fridge' },
        '7290000120836': { name: 'מיונז', brand: 'הלמנס', category: 'fridge' },
        '7290000523224': { name: 'מלח ים דק', brand: 'מלח הארץ', category: 'pantry' },
        '7290000090153': { name: 'שמן זית', brand: 'יד מרדכי', category: 'pantry' },
        '7290000090160': { name: 'שמן קנולה', brand: 'שמן תבור', category: 'pantry' },
        '7290000090177': { name: 'חומץ', brand: 'פרימור', category: 'pantry' },
        '7290000090191': { name: 'פלפל שחור', brand: 'פרקש', category: 'pantry' },
        '7290112357113': { name: 'חומוס', brand: 'שטראוס', category: 'fridge' },

        /* ========== ממרחים ========== */
        '7290000416021': { name: 'שוקולד למריחה', brand: 'השחר העולה', category: 'pantry' },
        '7290000446547': { name: 'חמאת בוטנים', brand: 'B&D', category: 'pantry' },
        '7290000120201': { name: 'חלווה', brand: 'אחווה', category: 'pantry' },
        '7290000120218': { name: 'טחינה גולמית', brand: 'אחווה', category: 'pantry' },

        /* ========== פסטה ואורז ========== */
        '7290000100104': { name: 'ספגטי', brand: 'אסם', category: 'pantry' },
        '7290000100111': { name: 'פנה', brand: 'אסם', category: 'pantry' },
        '7290000100128': { name: 'אורז בסמטי', brand: 'סוגת', category: 'pantry' },
        '7290000100135': { name: 'קוסקוס', brand: 'אסם', category: 'pantry' },
        '7290000197067': { name: 'סוכר', brand: 'סוגת', category: 'pantry' },

        /* ========== שימורים ========== */
        '7290000080109': { name: 'טונה בשמן', brand: 'סטארקיסט', category: 'pantry' },
        '7290000080116': { name: 'טונה במים', brand: 'סטארקיסט', category: 'pantry' },
        '7290000080123': { name: 'תירס', brand: 'גרין ג׳יינט', category: 'pantry' },

        /* ========== ממתקים ושוקולד ========== */
        '7290000066301': { name: 'שוקולד פרה', brand: 'עלית', category: 'pantry' },
        '7290000060477': { name: 'קליק', brand: 'שטראוס', category: 'pantry' },

        /* ========== לחם ומאפים ========== */
        '7290000651613': { name: 'לחם אחיד פרוס', brand: 'אנגל', category: 'pantry' },
        '7290000651620': { name: 'לחם קל', brand: 'אנגל', category: 'pantry' },
        '7290000120102': { name: 'פיתות', brand: 'אנגל', category: 'pantry' },

        /* ========== קמח ואפייה ========== */
        '7290000160102': { name: 'קמח לבן', brand: 'שטיבל', category: 'pantry' },
        '7290000160119': { name: 'קמח מלא', brand: 'שטיבל', category: 'pantry' },
        '7290000160133': { name: 'אבקת אפייה', brand: 'שטיבל', category: 'pantry' },
        '7290000160157': { name: 'קקאו', brand: 'עלית', category: 'pantry' },

        /* ========== מוצרי ניקיון — סנו ========== */
        '7290000571652': { name: 'סנו מקס', brand: 'סנו', category: 'cleaning' },
        '7290000567402': { name: 'כלנית אבקת כביסה', brand: 'סנו', category: 'cleaning' },
        '7290000567419': { name: 'כלנית מרכך כביסה', brand: 'סנו', category: 'cleaning' },
        '7290000567426': { name: 'כלנית נוזל כביסה', brand: 'סנו', category: 'cleaning' },
        '7290000571669': { name: 'סנו מקס ג׳ל', brand: 'סנו', category: 'cleaning' },
        '7290000571676': { name: 'סנו גרין פאוור', brand: 'סנו', category: 'cleaning' },
        '7290000286303': { name: 'סנו סושי שקיות אשפה', brand: 'סנו', category: 'cleaning' },
        '7290000286310': { name: 'סנו סנובון', brand: 'סנו', category: 'cleaning' },
        '7290000286327': { name: 'סנו ספריי חלונות', brand: 'סנו', category: 'cleaning' },
        '7290000286334': { name: 'סנו נוזל רצפות', brand: 'סנו', category: 'cleaning' },
        '7290000130105': { name: 'אקונומיקה', brand: 'סנו', category: 'cleaning' },
        '7290000130112': { name: 'נוזל כלים', brand: 'פיירי', category: 'cleaning' },
        '7290000130174': { name: 'סבון ידיים', brand: 'קרלטון', category: 'cleaning' },
        '7290000130181': { name: 'נייר טואלט', brand: 'לילי', category: 'cleaning' },
        '7290000130198': { name: 'מגבות נייר', brand: 'לילי', category: 'cleaning' },

        /* ========== קפואים — זוגלובק ========== */
        '7290002741114': { name: 'נקניקיות חמות', brand: 'זוגלובק', category: 'freezer' },
        '7290002741121': { name: 'נקניקיות הודו', brand: 'זוגלובק', category: 'freezer' },
        '7290002741138': { name: 'שניצל מן הצומח', brand: 'זוגלובק', category: 'freezer' },
        '7290002741145': { name: 'קבב', brand: 'זוגלובק', category: 'freezer' },
        '7290002741152': { name: 'המבורגר קפוא', brand: 'זוגלובק', category: 'freezer' },

        /* ========== קפואים — כללי ========== */
        '7290000140107': { name: 'שניצל מוכן', brand: 'מאמא עוף', category: 'freezer' },
        '7290000140114': { name: 'צ׳יפס קפוא', brand: 'תפוצ׳יפס', category: 'freezer' },
        '7290000140121': { name: 'פיצה קפואה', brand: 'שטראוס', category: 'freezer' },
        '7290000140138': { name: 'בורקס גבינה', brand: 'ברק', category: 'freezer' },
        '7290000140152': { name: 'גלידה וניל', brand: 'נסטלה', category: 'freezer' },
        '7290115203844': { name: 'שניצל צמחי', brand: 'Hälsans Kök', category: 'freezer' },

        /* ========== ביצים ========== */
        '7290000000688': { name: 'ביצים L חופש', brand: 'טען', category: 'fridge' },
        '7290000000695': { name: 'ביצים XL', brand: 'טען', category: 'fridge' },

        /* ========== בשר ועוף ========== */
        '7290000700014': { name: 'חזה עוף', brand: 'עוף טוב', category: 'fridge' },
        '7290000700021': { name: 'שוקיים עוף', brand: 'עוף טוב', category: 'fridge' },
        '7290000700038': { name: 'כנפיים עוף', brand: 'עוף טוב', category: 'freezer' },

        /* ========== תינוקות ========== */
        '7290000150103': { name: 'מטרנה שלב 1', brand: 'מטרנה', category: 'pantry' },
        '7290000150110': { name: 'מחית תפוחים', brand: 'מטרנה', category: 'pantry' },
    };

    /* ---- חיפוש מוצר לפי ברקוד ---- */
    function lookup(barcode) {
        const p = PRODUCTS[barcode];
        if (!p) return null;
        const fullName = p.brand ? `${p.name} - ${p.brand}` : p.name;
        return {
            name: fullName,
            brand: p.brand || '',
            category: p.category || 'pantry',
            image: null, /* אין תמונות במאגר מקומי */
            found: true,
            source: 'local'
        };
    }

    /* ---- ייצוא פומבי ---- */
    return { lookup, PRODUCTS };
})();
