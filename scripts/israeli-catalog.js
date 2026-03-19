/* ===================================================
   israeli-catalog.js — קטלוג מוצרים ישראליים נפוצים
   אחראי על: מאגר מקומי של ברקודים ישראליים + שמות בעברית
   שייך ל: product-lookup.js — fallback כשה-API לא מוצא
   
   הערה: הברקודים בישראל מתחילים ב-729
   המאגר מכיל מוצרים נפוצים מהסופרמרקטים הגדולים
   =================================================== */

const IsraeliCatalog = (() => {

    /* ---- מאגר מוצרים — ברקוד => מידע ---- */
    const PRODUCTS = {
        /* === חלב ומוצרי חלב === */
        '7290000197067': { name: 'סוכר לבן', brand: 'סוגת', category: 'pantry' },
        '7290004131609': { name: 'חלב 3%', brand: 'תנובה', category: 'fridge' },
        '7290000300511': { name: 'קוטג׳ 5%', brand: 'תנובה', category: 'fridge' },
        '7290000056524': { name: 'חלב 1%', brand: 'תנובה', category: 'fridge' },
        '7290000056500': { name: 'חלב 3%', brand: 'תנובה', category: 'fridge' },
        '7290000306025': { name: 'שמנת מתוקה', brand: 'תנובה', category: 'fridge' },
        '7290000306018': { name: 'שמנת חמוצה 15%', brand: 'תנובה', category: 'fridge' },
        '7290000300528': { name: 'גבינה לבנה 5%', brand: 'תנובה', category: 'fridge' },
        '7290000300535': { name: 'גבינה לבנה 9%', brand: 'תנובה', category: 'fridge' },
        '7290000066196': { name: 'יוגורט דנונה', brand: 'שטראוס', category: 'fridge' },
        '7290000021157': { name: 'מילקי', brand: 'שטראוס', category: 'fridge' },
        '7290000563619': { name: 'גבינה צהובה 28%', brand: 'תנובה', category: 'fridge' },
        '7290000021164': { name: 'שוקו', brand: 'שטראוס', category: 'fridge' },

        /* === לחם ומאפים === */
        '7290000651613': { name: 'לחם אחיד פרוס', brand: 'אנגל', category: 'pantry' },
        '7290000651620': { name: 'לחם קל פרוס', brand: 'אנגל', category: 'pantry' },
        '7290000651637': { name: 'לחם מלא פרוס', brand: 'אנגל', category: 'pantry' },
        '7290000120102': { name: 'פיתות', brand: 'אנגל', category: 'pantry' },

        /* === ביצים === */
        '7290000000688': { name: 'ביצים L חופש', brand: 'טען', category: 'fridge' },
        '7290000000695': { name: 'ביצים XL', brand: 'טען', category: 'fridge' },

        /* === בשר ועוף === */
        '7290000700014': { name: 'חזה עוף טרי', brand: 'עוף טוב', category: 'fridge' },
        '7290000700021': { name: 'שוקיים עוף', brand: 'עוף טוב', category: 'fridge' },
        '7290000700038': { name: 'כנפיים עוף', brand: 'עוף טוב', category: 'freezer' },

        /* === פירות וירקות (ארוזים) === */
        '7290000900018': { name: 'עגבניות שרי', brand: 'יוניליוור', category: 'fridge' },
        '7290000900025': { name: 'מלפפון', brand: 'יוניליוור', category: 'fridge' },

        /* === חטיפים ודגני בוקר === */
        '7290000066318': { name: 'במבה', brand: 'אסם', category: 'pantry' },
        '7290000066325': { name: 'במבה נוגט', brand: 'אסם', category: 'pantry' },
        '7290000066332': { name: 'ביסלי גריל', brand: 'אסם', category: 'pantry' },
        '7290000066349': { name: 'ביסלי פיצה', brand: 'אסם', category: 'pantry' },
        '7290000066356': { name: 'טפוצ׳יפס', brand: 'אסם', category: 'pantry' },
        '7290000066257': { name: 'קורנפלקס', brand: 'תלמה', category: 'pantry' },
        '7290000066264': { name: 'דגני בוקר דבש', brand: 'תלמה', category: 'pantry' },
        '7290000065434': { name: 'אפרופו', brand: 'אסם', category: 'pantry' },
        '7290000060477': { name: 'קליק', brand: 'שטראוס', category: 'pantry' },

        /* === שתייה === */
        '7290000053004': { name: 'מים מינרליים 1.5L', brand: 'נביעות', category: 'pantry' },
        '7290000053011': { name: 'מים מינרליים 0.5L', brand: 'נביעות', category: 'pantry' },
        '7290000070285': { name: 'מיץ תפוזים', brand: 'פריגת', category: 'fridge' },
        '7290000070292': { name: 'מיץ ענבים', brand: 'פריגת', category: 'pantry' },
        '7290000070308': { name: 'מיץ תפוחים', brand: 'פריגת', category: 'pantry' },

        /* === שימורים === */
        '7290000080109': { name: 'טונה בשמן', brand: 'סטארקיסט', category: 'pantry' },
        '7290000080116': { name: 'טונה במים', brand: 'סטארקיסט', category: 'pantry' },
        '7290000080123': { name: 'תירס', brand: 'גרין ג׳יינט', category: 'pantry' },
        '7290000080130': { name: 'זיתים ירוקים', brand: 'בני דרום', category: 'pantry' },
        '7290000080147': { name: 'חומוס', brand: 'אל ערבי', category: 'pantry' },

        /* === רטבים ותבלינים === */
        '7290000090108': { name: 'קטשופ', brand: 'אסם', category: 'fridge' },
        '7290000090115': { name: 'חרדל', brand: 'אסם', category: 'fridge' },
        '7290000090122': { name: 'מיונז', brand: 'אסם', category: 'fridge' },
        '7290000090139': { name: 'רוטב סויה', brand: 'יאמאסא', category: 'pantry' },
        '7290000090146': { name: 'רוטב צ׳ילי', brand: 'טיפ טיפה', category: 'pantry' },
        '7290000090153': { name: 'שמן זית', brand: 'יד מרדכי', category: 'pantry' },
        '7290000090160': { name: 'שמן קנולה', brand: 'שמן תבור', category: 'pantry' },
        '7290000090177': { name: 'חומץ', brand: 'פרימור', category: 'pantry' },
        '7290000090184': { name: 'מלח שולחני', brand: 'מלח הארץ', category: 'pantry' },
        '7290000090191': { name: 'פלפל שחור', brand: 'פרקש', category: 'pantry' },

        /* === פסטה ואורז === */
        '7290000100104': { name: 'אטריות ספגטי', brand: 'אסם', category: 'pantry' },
        '7290000100111': { name: 'פסטה פנה', brand: 'אסם', category: 'pantry' },
        '7290000100128': { name: 'אורז בסמטי', brand: 'סוגת', category: 'pantry' },
        '7290000100135': { name: 'קוסקוס', brand: 'אסם', category: 'pantry' },
        '7290000100142': { name: 'בורגול', brand: 'סוגת', category: 'pantry' },

        /* === קפה ותה === */
        '7290000110103': { name: 'נס קפה קלאסי', brand: 'עלית', category: 'pantry' },
        '7290000110110': { name: 'קפה טורקי', brand: 'עלית', category: 'pantry' },
        '7290000110127': { name: 'תה ויסוצקי', brand: 'ויסוצקי', category: 'pantry' },
        '7290000110134': { name: 'נס קפה גולד', brand: 'עלית', category: 'pantry' },

        /* === ממתקים === */
        '7290000066301': { name: 'שוקולד פרה', brand: 'עלית', category: 'pantry' },
        '7290000120201': { name: 'חלווה', brand: 'אחווה', category: 'pantry' },
        '7290000120218': { name: 'טחינה גולמית', brand: 'אחווה', category: 'pantry' },

        /* === מוצרי ניקיון === */
        '7290000130105': { name: 'אקונומיקה', brand: 'סנו', category: 'cleaning' },
        '7290000130112': { name: 'נוזל כלים', brand: 'פיירי', category: 'cleaning' },
        '7290000130129': { name: 'מרכך כביסה', brand: 'סנו', category: 'cleaning' },
        '7290000130136': { name: 'אבקת כביסה', brand: 'כלנית', category: 'cleaning' },
        '7290000130143': { name: 'מטליות רצפה', brand: 'סנו', category: 'cleaning' },
        '7290000130150': { name: 'ספריי ניקוי חלונות', brand: 'סנו', category: 'cleaning' },
        '7290000130167': { name: 'נוזל רצפות', brand: 'סנו', category: 'cleaning' },
        '7290000130174': { name: 'סבון ידיים', brand: 'קרלטון', category: 'cleaning' },
        '7290000130181': { name: 'נייר טואלט', brand: 'לילי', category: 'cleaning' },
        '7290000130198': { name: 'מגבות נייר', brand: 'לילי', category: 'cleaning' },

        /* === קפואים === */
        '7290000140107': { name: 'שניצל מוכן', brand: 'תפוצ׳יפס', category: 'freezer' },
        '7290000140114': { name: 'צ׳יפס קפוא', brand: 'תפוצ׳יפס', category: 'freezer' },
        '7290000140121': { name: 'פיצה קפואה', brand: 'שטראוס', category: 'freezer' },
        '7290000140138': { name: 'בורקס גבינה', brand: 'בורקס', category: 'freezer' },
        '7290000140145': { name: 'עוגת שוקולד קפואה', brand: 'שטראוס', category: 'freezer' },
        '7290000140152': { name: 'גלידה וניל', brand: 'שטראוס', category: 'freezer' },

        /* === תינוקות === */
        '7290000150103': { name: 'מטרנה שלב 1', brand: 'מטרנה', category: 'pantry' },
        '7290000150110': { name: 'מחית תפוחים', brand: 'מטרנה', category: 'pantry' },

        /* === קמח ואפייה === */
        '7290000160102': { name: 'קמח לבן', brand: 'שטיבל', category: 'pantry' },
        '7290000160119': { name: 'קמח מלא', brand: 'שטיבל', category: 'pantry' },
        '7290000160126': { name: 'שמרים יבשים', brand: 'אנגל', category: 'pantry' },
        '7290000160133': { name: 'אבקת אפייה', brand: 'שטיבל', category: 'pantry' },
        '7290000160140': { name: 'וניל', brand: 'שטיבל', category: 'pantry' },
        '7290000160157': { name: 'קקאו', brand: 'עלית', category: 'pantry' },
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
