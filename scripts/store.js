/* ===================================================
   store.js — שכבת אחסון IndexedDB
   אחראי על: CRUD למוצרים, טרנזקציות, תור offline
   שייך ל: כל מודולי הלוגיקה (inventory, products, shortages)
   =================================================== */

const Store = (() => {
    let db = null;

    /* ---- Object Stores ---- */
    const STORES = {
        PRODUCTS: 'products',
        TRANSACTIONS: 'transactions',
        OFFLINE_QUEUE: 'offline_queue'
    };

    /* ---- אתחול ופתיחת DB ---- */
    function init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(Config.DB_NAME, Config.DB_VERSION);

            /* יצירת טבלאות בעת שדרוג */
            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                /* טבלת מוצרים — ברקוד כמפתח ייחודי */
                if (!database.objectStoreNames.contains(STORES.PRODUCTS)) {
                    const prodStore = database.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
                    prodStore.createIndex('barcode', 'barcode', { unique: true });
                    prodStore.createIndex('location_type', 'location_type', { unique: false });
                    prodStore.createIndex('is_active', 'is_active', { unique: false });
                }

                /* טבלת טרנזקציות מלאי */
                if (!database.objectStoreNames.contains(STORES.TRANSACTIONS)) {
                    const txnStore = database.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
                    txnStore.createIndex('product_id', 'product_id', { unique: false });
                    txnStore.createIndex('barcode', 'barcode', { unique: false });
                    txnStore.createIndex('created_at', 'created_at', { unique: false });
                }

                /* תור offline — פעולות שממתינות לסנכרון */
                if (!database.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
                    const queueStore = database.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
                    queueStore.createIndex('sync_status', 'sync_status', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('[Store] IndexedDB נפתח בהצלחה');
                resolve(db);
            };

            request.onerror = (event) => {
                console.error('[Store] שגיאה בפתיחת IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /* ---- עזר: גישה ל-Object Store ---- */
    function _getStore(storeName, mode = 'readonly') {
        const txn = db.transaction(storeName, mode);
        return txn.objectStore(storeName);
    }

    /* ---- עזר: Promise wrapper ל-IDB request ---- */
    function _promisify(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /* ---- יצירת UUID ---- */
    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    /* ==== CRUD מוצרים ==== */

    /* הוספת מוצר חדש */
    function addProduct(product) {
        product.id = product.id || generateId();
        product.created_at = product.created_at || new Date().toISOString();
        product.updated_at = new Date().toISOString();
        product.is_active = true;
        const store = _getStore(STORES.PRODUCTS, 'readwrite');
        return _promisify(store.add(product));
    }

    /* עדכון מוצר */
    function updateProduct(product) {
        product.updated_at = new Date().toISOString();
        const store = _getStore(STORES.PRODUCTS, 'readwrite');
        return _promisify(store.put(product));
    }

    /* שליפת מוצר לפי ID */
    function getProduct(id) {
        const store = _getStore(STORES.PRODUCTS);
        return _promisify(store.get(id));
    }

    /* שליפת מוצר לפי ברקוד */
    function getProductByBarcode(barcode) {
        const store = _getStore(STORES.PRODUCTS);
        const index = store.index('barcode');
        return _promisify(index.get(barcode));
    }

    /* שליפת כל המוצרים הפעילים */
    function getAllProducts() {
        return new Promise((resolve, reject) => {
            const store = _getStore(STORES.PRODUCTS);
            const request = store.getAll();
            request.onsuccess = () => {
                const active = request.result.filter(p => p.is_active !== false);
                resolve(active);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /* שליפת חוסרים — מוצרים שהכמות מתחת ליעד */
    function getShortages(locationType) {
        return new Promise((resolve, reject) => {
            getAllProducts().then(products => {
                let shortages = products.filter(p => p.current_quantity < p.target_quantity);
                if (locationType && locationType !== 'all') {
                    shortages = shortages.filter(p => p.location_type === locationType);
                }
                /* מיפוי לפורמט חוסר */
                const items = shortages.map(p => ({
                    product_id: p.id,
                    display_name: p.display_name,
                    image_url: p.image_url || '',
                    location_type: p.location_type,
                    current_quantity: p.current_quantity,
                    target_quantity: p.target_quantity,
                    missing_quantity: p.target_quantity - p.current_quantity
                }));
                resolve(items);
            }).catch(reject);
        });
    }

    /* ==== טרנזקציות מלאי ==== */

    /* הוספת טרנזקציה */
    function addTransaction(txn) {
        txn.id = txn.id || generateId();
        txn.created_at = txn.created_at || new Date().toISOString();
        const store = _getStore(STORES.TRANSACTIONS, 'readwrite');
        return _promisify(store.add(txn));
    }

    /* ==== תור Offline ==== */

    /* הוספת פעולה לתור */
    function addToOfflineQueue(action) {
        action.sync_status = 'pending';
        action.created_at = new Date().toISOString();
        const store = _getStore(STORES.OFFLINE_QUEUE, 'readwrite');
        return _promisify(store.add(action));
    }

    /* שליפת כל הפעולות הממתינות */
    function getPendingOfflineActions() {
        return new Promise((resolve, reject) => {
            const store = _getStore(STORES.OFFLINE_QUEUE);
            const index = store.index('sync_status');
            const request = index.getAll('pending');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /* סימון פעולה כמסונכרנת */
    function markSynced(id) {
        return new Promise((resolve, reject) => {
            const store = _getStore(STORES.OFFLINE_QUEUE, 'readwrite');
            const request = store.get(id);
            request.onsuccess = () => {
                const item = request.result;
                if (item) {
                    item.sync_status = 'synced';
                    store.put(item).onsuccess = () => resolve();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    /* ניקוי פעולות שכבר סונכרנו */
    function clearSyncedActions() {
        return new Promise((resolve, reject) => {
            const store = _getStore(STORES.OFFLINE_QUEUE, 'readwrite');
            const request = store.getAll();
            request.onsuccess = () => {
                const items = request.result.filter(i => i.sync_status === 'synced');
                items.forEach(i => store.delete(i.id));
                resolve(items.length);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /* ---- ייצוא פומבי ---- */
    return {
        init,
        generateId,
        addProduct,
        updateProduct,
        getProduct,
        getProductByBarcode,
        getAllProducts,
        getShortages,
        addTransaction,
        addToOfflineQueue,
        getPendingOfflineActions,
        markSynced,
        clearSyncedActions,
        STORES
    };
})();
