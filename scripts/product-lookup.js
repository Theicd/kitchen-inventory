/* ===================================================
   product-lookup.js — חיפוש מוצרים לפי ברקוד מ-API חיצוני
   אחראי על: שליפת שם מוצר + תמונה + יצרן מ-Open Food Facts
   שייך ל: #screen-register — מילוי אוטומטי בטופס רישום
   =================================================== */

const ProductLookup = (() => {

    /* ---- Open Food Facts API — חינמי, קוד פתוח, מכיל מוצרים ישראליים ---- */
    const OFF_API = 'https://world.openfoodfacts.org/api/v2/product';

    /* ---- מטמון מקומי (localStorage) למניעת קריאות כפולות ---- */
    const CACHE_KEY = 'ki_product_cache';
    const CACHE_MAX = 500; /* מקסימום מוצרים במטמון */

    /* ---- שליפת מטמון ---- */
    function _getCache() {
        try {
            return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        } catch { return {}; }
    }

    /* ---- שמירה למטמון ---- */
    function _setCache(barcode, data) {
        const cache = _getCache();
        cache[barcode] = { ...data, _ts: Date.now() };
        /* ניקוי מטמון אם עבר את הגבול */
        const keys = Object.keys(cache);
        if (keys.length > CACHE_MAX) {
            /* מחיקת הישנים ביותר */
            keys.sort((a, b) => (cache[a]._ts || 0) - (cache[b]._ts || 0));
            for (let i = 0; i < keys.length - CACHE_MAX; i++) {
                delete cache[keys[i]];
            }
        }
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
    }

    /* ---- חיפוש מוצר לפי ברקוד ---- */
    async function lookup(barcode) {
        if (!barcode || barcode.length < 4) return null;

        /* בדיקת מטמון קודם */
        const cache = _getCache();
        if (cache[barcode] && cache[barcode].found) {
            console.log('[Lookup] מטמון:', barcode);
            const c = cache[barcode];
            return { name: c.name, image: c.image, brand: c.brand, category: c.category || null, found: true };
        }

        /* שלב 1: קטלוג ישראלי מקומי (מהיר, ללא אינטרנט) */
        let localResult = null;
        if (typeof IsraeliCatalog !== 'undefined') {
            localResult = IsraeliCatalog.lookup(barcode);
            if (localResult) {
                console.log('[Lookup] קטלוג מקומי:', localResult.name);
            }
        }

        /* שלב 2: קריאה ל-Open Food Facts — גם אם יש מקומי בלי תמונה */
        try {
            console.log('[Lookup] מחפש ב-Open Food Facts:', barcode);
            const url = `${OFF_API}/${barcode}.json?fields=product_name,product_name_he,brands,image_front_url,image_front_small_url`;
            const res = await fetch(url, { signal: AbortSignal.timeout(6000) });

            if (!res.ok) {
                console.log('[Lookup] שגיאת HTTP:', res.status);
                /* fallback לקטלוג מקומי אם ה-API נכשל */
                if (localResult) {
                    _setCache(barcode, localResult);
                    return localResult;
                }
                return null;
            }

            const json = await res.json();

            if (json.status !== 1 || !json.product) {
                console.log('[Lookup] מוצר לא נמצא ב-OFF');
                /* fallback לקטלוג מקומי */
                if (localResult) {
                    _setCache(barcode, localResult);
                    return localResult;
                }
                _setCache(barcode, { name: null, image: null, brand: null, found: false });
                return null;
            }

            const p = json.product;

            /* שם — עדיפות לעברית מ-API, או מהקטלוג המקומי */
            const apiName = p.product_name_he || p.product_name || '';
            const apiBrand = p.brands || '';
            /* תמונה — עדיפות לגרסה קטנה (יותר מהיר) */
            const apiImage = p.image_front_small_url || p.image_front_url || '';

            /* שם מלא — עדיפות לקטלוג מקומי (עברית מדויקת), API כגיבוי */
            const apiFullName = apiBrand && apiName && !apiName.includes(apiBrand)
                ? `${apiName} - ${apiBrand}`
                : (apiName || apiBrand || '');

            /* מיזוג: קטלוג מקומי = שם + קטגוריה, API = תמונה */
            const mergedName = (localResult && localResult.name) || apiFullName;
            const mergedImage = apiImage || null;
            const mergedCategory = (localResult && localResult.category) || null;
            const mergedBrand = (localResult && localResult.brand) || apiBrand;

            if (!mergedName && !mergedImage) {
                console.log('[Lookup] מוצר נמצא אבל בלי מידע שימושי');
                if (localResult) { _setCache(barcode, localResult); return localResult; }
                _setCache(barcode, { name: null, image: null, brand: null, found: false });
                return null;
            }

            const result = { name: mergedName, image: mergedImage, brand: mergedBrand, category: mergedCategory, found: true };
            _setCache(barcode, result);
            console.log('[Lookup] נמצא:', mergedName, mergedImage ? '(+תמונה)' : '(ללא תמונה)');
            return result;

        } catch (err) {
            console.warn('[Lookup] שגיאה:', err.message);
            /* fallback לקטלוג מקומי אם הרשת לא זמינה */
            if (localResult) {
                _setCache(barcode, localResult);
                return localResult;
            }
            return null;
        }
    }

    /* ---- ייצוא פומבי ---- */
    return { lookup };
})();
