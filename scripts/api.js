/* ===================================================
   api.js — שכבת תקשורת רשת
   אחראי על: קריאות API, retry, טיפול בשגיאות
   שייך ל: sync.js, inventory.js — כל מי שפונה לשרת
   =================================================== */

const Api = (() => {

    /* ---- בסיס URL ---- */
    function _baseUrl() {
        return Config.API_BASE;
    }

    /* ---- בדיקת חיבור רשת ---- */
    function isOnline() {
        return navigator.onLine;
    }

    /* ---- קריאת API גנרית עם retry ---- */
    async function _fetch(endpoint, options = {}, retries = 2) {
        const url = _baseUrl() + endpoint;
        const defaults = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, defaults);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw { status: response.status, ...errorData };
                }
                return await response.json();
            } catch (err) {
                if (attempt === retries || !isOnline()) {
                    throw err;
                }
                /* המתנה קצרה לפני retry */
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            }
        }
    }

    /* ==== API Endpoints ==== */

    /* GET /api/health — בדיקת זמינות */
    function health() {
        return _fetch('/api/health');
    }

    /* GET /api/products/by-barcode/:barcode — חיפוש מוצר */
    function getProductByBarcode(barcode) {
        return _fetch(`/api/products/by-barcode/${encodeURIComponent(barcode)}`);
    }

    /* POST /api/products — יצירת מוצר חדש */
    function createProduct(data) {
        return _fetch('/api/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /* POST /api/inventory/stock-in — כניסה למלאי */
    function stockIn(data) {
        return _fetch('/api/inventory/stock-in', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /* POST /api/inventory/stock-out — יציאה מהמלאי */
    function stockOut(data) {
        return _fetch('/api/inventory/stock-out', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /* POST /api/inventory/adjust — תיקון ידני */
    function adjust(data) {
        return _fetch('/api/inventory/adjust', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /* GET /api/shortages — רשימת חוסרים */
    function getShortages(locationType) {
        const params = locationType ? `?location_type=${locationType}` : '';
        return _fetch(`/api/shortages${params}`);
    }

    /* POST /api/sync/batch — סנכרון batch */
    function syncBatch(transactions) {
        return _fetch('/api/sync/batch', {
            method: 'POST',
            body: JSON.stringify({ transactions })
        });
    }

    /* POST /api/upload-image — העלאת תמונה */
    function uploadImage(formData) {
        const url = _baseUrl() + '/api/upload-image';
        return fetch(url, {
            method: 'POST',
            body: formData
        }).then(r => r.json());
    }

    /* ---- ייצוא פומבי ---- */
    return {
        isOnline,
        health,
        getProductByBarcode,
        createProduct,
        stockIn,
        stockOut,
        adjust,
        getShortages,
        syncBatch,
        uploadImage
    };
})();
