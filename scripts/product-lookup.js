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

        /* שלב 2: אם יש תוצאה מקטלוג מקומי — מחזירים מיד, ומעשירים ברקע (תמונה) */
        if (localResult) {
            _setCache(barcode, localResult);
            /* העשרת תמונה ברקע — לא חוסם */
            _enrichInBackground(barcode, localResult);
            return localResult;
        }

        /* שלב 3: אין תוצאה מקומית — מחפשים ברשת (ריילי + OFF במקביל) */
        let nostrResult = null;
        let offResult = null;

        const nostrPromise = (typeof NostrBridge !== 'undefined' && NostrBridge.isReady())
            ? NostrBridge.queryProduct(barcode, 4000).catch(() => null)
            : Promise.resolve(null);

        const offPromise = _fetchOpenFoodFacts(barcode).catch(() => null);

        [nostrResult, offResult] = await Promise.all([nostrPromise, offPromise]);

        /* מיזוג: ריילי > Open Food Facts */
        const mergedName = (nostrResult?.name) || (offResult?.name) || '';
        const mergedImage = (nostrResult?.image) || (offResult?.image) || null;
        const mergedCategory = (nostrResult?.category) || null;
        const mergedBrand = (nostrResult?.brand) || (offResult?.brand) || '';

        if (!mergedName && !mergedImage) {
            console.log('[Lookup] לא נמצא באף מקור');
            _setCache(barcode, { name: null, image: null, brand: null, found: false });
            return null;
        }

        const result = { name: mergedName, image: mergedImage, brand: mergedBrand, category: mergedCategory, found: true };
        _setCache(barcode, result);
        const sources = [nostrResult?.found && 'ריילי', offResult?.found && 'OFF'].filter(Boolean).join('+');
        console.log('[Lookup] נמצא:', mergedName, mergedImage ? '(+תמונה)' : '(ללא תמונה)', `[${sources}]`);
        return result;
    }

    /* ---- העשרת מוצר ברקע — שולף תמונה מ-API/ריילי/CDN ומעדכן cache ---- */
    function _enrichInBackground(barcode, localResult) {
        const nostrP = (typeof NostrBridge !== 'undefined' && NostrBridge.isReady())
            ? NostrBridge.queryProduct(barcode, 4000).catch(() => null)
            : Promise.resolve(null);
        const offP = _fetchOpenFoodFacts(barcode).catch(() => null);
        const cdnP = _tryImageCDN(barcode).catch(() => null);

        Promise.all([nostrP, offP, cdnP]).then(function(results) {
            const nostr = results[0], off = results[1], cdnImg = results[2];
            const image = nostr?.image || off?.image || cdnImg || null;
            if (image) {
                const enriched = Object.assign({}, localResult, { image: image });
                _setCache(barcode, enriched);
                console.log('[Lookup] העשרה ברקע:', localResult.name, '(+תמונה)');
                /* עדכון תצוגה אם עדיין במסך רישום */
                var preview = document.getElementById('reg-preview');
                if (preview && !preview.src) {
                    preview.src = image;
                    preview.classList.remove('hidden');
                }
            }
        });
    }

    /* ---- ניסיון שליפת תמונה מ-CDN סופרמרקטים ישראליים ---- */
    function _tryImageCDN(barcode) {
        /* רמי לוי מפרסם תמונות מוצרים ב-URL צפוי */
        var urls = [
            'https://static.rfrsh.co.il/supermarket/product/' + barcode + '/small.jpg',
            'https://img.shufersal.co.il/imgs/Products_Vertical/' + barcode + '_V_large.jpg'
        ];
        /* מנסה לטעון תמונה — אם הצליח (200 + content-type image) מחזיר URL */
        return new Promise(function(resolve) {
            var tried = 0;
            urls.forEach(function(url) {
                fetch(url, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(4000) })
                .then(function() {
                    /* no-cors תמיד מחזיר opaque, ננסה לטעון כ-img */
                    var img = new Image();
                    img.onload = function() { if (img.naturalWidth > 1) resolve(url); };
                    img.onerror = function() { tried++; if (tried >= urls.length) resolve(null); };
                    img.src = url;
                })
                .catch(function() { tried++; if (tried >= urls.length) resolve(null); });
            });
            /* timeout כללי */
            setTimeout(function() { resolve(null); }, 5000);
        });
    }

    /* ---- חיפוש תמונה לפי שם מוצר — כשברקוד מזוהה אבל אין תמונה ---- */
    async function searchImage(productName, barcode) {
        if (!productName) return null;
        console.log('[Lookup] מחפש תמונה עבור:', productName);

        /* 1: ניסיון OFF search לפי שם (מוצרים ישראליים) */
        try {
            const q = encodeURIComponent(productName.split(' - ')[0].trim());
            const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&tagtype_0=countries&tag_contains_0=contains&tag_0=israel&page_size=5&fields=code,image_front_small_url,image_front_url&json=1`;
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (res.ok) {
                const json = await res.json();
                const products = (json.products || []);
                for (var i = 0; i < products.length; i++) {
                    var img = products[i].image_front_small_url || products[i].image_front_url;
                    if (img) {
                        console.log('[Lookup] תמונה נמצאה ב-OFF search:', img);
                        /* שמירה ב-cache */
                        if (barcode) {
                            var cached = _getCache()[barcode];
                            if (cached) { cached.image = img; _setCache(barcode, cached); }
                        }
                        return img;
                    }
                }
            }
        } catch (e) { console.warn('[Lookup] OFF search failed:', e.message); }

        /* 2: ניסיון CDN סופרמרקטים */
        if (barcode) {
            try {
                var cdnImg = await _tryImageCDN(barcode);
                if (cdnImg) return cdnImg;
            } catch (e) {}
        }

        console.log('[Lookup] לא נמצאה תמונה עבור:', productName);
        return null;
    }

    /* ---- קריאה ל-Open Food Facts API ---- */
    async function _fetchOpenFoodFacts(barcode) {
        console.log('[Lookup] מחפש ב-Open Food Facts:', barcode);
        const url = `${OFF_API}/${barcode}.json?fields=product_name,product_name_he,brands,image_front_url,image_front_small_url`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) return null;
        const json = await res.json();
        if (json.status !== 1 || !json.product) return null;

        const p = json.product;
        const apiName = p.product_name_he || p.product_name || '';
        const apiBrand = p.brands || '';
        const apiImage = p.image_front_small_url || p.image_front_url || '';
        const fullName = apiBrand && apiName && !apiName.includes(apiBrand)
            ? `${apiName} - ${apiBrand}` : (apiName || apiBrand || '');

        if (!fullName && !apiImage) return null;
        return { name: fullName, image: apiImage, brand: apiBrand, found: true, source: 'off' };
    }

    /* ---- ייצוא פומבי ---- */
    return { lookup, searchImage };
})();
