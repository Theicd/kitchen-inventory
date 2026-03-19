/* ===================================================
   test-store.js — בדיקות יחידה ל-store.js (IndexedDB)
   אחראי על: CRUD מוצרים, טרנזקציות, offline queue, חוסרים
   שייך ל: tests/unit/
   =================================================== */

const TestStore = (() => {
    const results = [];

    function _assert(name, condition, detail = '') {
        results.push({ name, pass: !!condition, detail });
    }

    /* ---- A1: אתחול DB ---- */
    async function testInit() {
        try {
            await Store.init();
            _assert('A1: אתחול IndexedDB', true);
        } catch (e) {
            _assert('A1: אתחול IndexedDB', false, e.message);
        }
    }

    /* ---- A2: הוספת מוצר ---- */
    async function testAddProduct() {
        const product = {
            barcode: '7290000000001',
            display_name: 'חלב 3%',
            image_url: '',
            location_type: 'fridge',
            target_quantity: 2,
            current_quantity: 1
        };
        try {
            await Store.addProduct(product);
            const found = await Store.getProductByBarcode('7290000000001');
            _assert('A2: הוספת מוצר', found && found.display_name === 'חלב 3%');
        } catch (e) {
            _assert('A2: הוספת מוצר', false, e.message);
        }
    }

    /* ---- A3: שליפה לפי ברקוד ---- */
    async function testGetByBarcode() {
        const found = await Store.getProductByBarcode('7290000000001');
        _assert('A3: שליפה לפי ברקוד', found && found.barcode === '7290000000001');
    }

    /* ---- A4: שליפת מוצר שלא קיים ---- */
    async function testGetNotFound() {
        const found = await Store.getProductByBarcode('9999999999999');
        _assert('A4: מוצר לא קיים מחזיר undefined', !found);
    }

    /* ---- A5: עדכון מוצר ---- */
    async function testUpdateProduct() {
        const found = await Store.getProductByBarcode('7290000000001');
        found.current_quantity = 2;
        await Store.updateProduct(found);
        const updated = await Store.getProductByBarcode('7290000000001');
        _assert('A5: עדכון כמות', updated.current_quantity === 2);
    }

    /* ---- A6: שליפת כל המוצרים ---- */
    async function testGetAllProducts() {
        /* הוספת מוצר נוסף */
        await Store.addProduct({
            barcode: '7290000000002',
            display_name: 'גבינה 9%',
            image_url: '',
            location_type: 'fridge',
            target_quantity: 3,
            current_quantity: 3
        });
        await Store.addProduct({
            barcode: '7290000000003',
            display_name: 'סוכר',
            image_url: '',
            location_type: 'pantry',
            target_quantity: 2,
            current_quantity: 0
        });
        await Store.addProduct({
            barcode: '7290000000004',
            display_name: 'נס קפה',
            image_url: '',
            location_type: 'pantry',
            target_quantity: 2,
            current_quantity: 1
        });

        const all = await Store.getAllProducts();
        _assert('A6: שליפת כל המוצרים (4)', all.length === 4);
    }

    /* ---- A7: חישוב חוסרים ---- */
    async function testShortages() {
        const shortages = await Store.getShortages();
        /* חלב: 2/2 = לא חסר, גבינה: 3/3 = לא חסר, סוכר: 0/2 = חסר, קפה: 1/2 = חסר */
        _assert('A7: חוסרים (2 מוצרים)', shortages.length === 2, `got ${shortages.length}`);
    }

    /* ---- A8: חוסרים עם סינון מיקום ---- */
    async function testShortagesFilter() {
        const pantryShort = await Store.getShortages('pantry');
        _assert('A8: חוסרים ארון בלבד (2)', pantryShort.length === 2, `got ${pantryShort.length}`);
        const fridgeShort = await Store.getShortages('fridge');
        _assert('A8b: חוסרים מקרר (0)', fridgeShort.length === 0, `got ${fridgeShort.length}`);
    }

    /* ---- A9: הוספת טרנזקציה ---- */
    async function testAddTransaction() {
        try {
            await Store.addTransaction({
                product_id: 'test-id',
                barcode: '7290000000001',
                action_type: 'stock_in',
                quantity_delta: 1,
                station_mode: 'entry',
                device_id: 'test-device'
            });
            _assert('A9: הוספת טרנזקציה', true);
        } catch (e) {
            _assert('A9: הוספת טרנזקציה', false, e.message);
        }
    }

    /* ---- A10: offline queue ---- */
    async function testOfflineQueue() {
        await Store.addToOfflineQueue({
            action_type: 'stock_in',
            barcode: '7290000000001',
            quantity: 1
        });
        const pending = await Store.getPendingOfflineActions();
        _assert('A10: offline queue - pending', pending.length >= 1);

        /* סימון כמסונכרן */
        if (pending.length > 0) {
            await Store.markSynced(pending[0].id);
            const after = await Store.getPendingOfflineActions();
            _assert('A10b: markSynced', after.length < pending.length);
        }
    }

    /* ---- A11: ברקוד ייחודי ---- */
    async function testDuplicateBarcode() {
        try {
            await Store.addProduct({
                barcode: '7290000000001',
                display_name: 'כפול',
                image_url: '',
                location_type: 'fridge',
                target_quantity: 1,
                current_quantity: 0
            });
            _assert('A11: ברקוד כפול נחסם', false, 'היה צריך לזרוק שגיאה');
        } catch (e) {
            _assert('A11: ברקוד כפול נחסם', true);
        }
    }

    /* ---- A12: generateId ייחודי ---- */
    async function testGenerateId() {
        const ids = new Set();
        for (let i = 0; i < 100; i++) ids.add(Store.generateId());
        _assert('A12: 100 IDs ייחודיים', ids.size === 100);
    }

    /* ---- הרצת כל הבדיקות ---- */
    async function runAll() {
        results.length = 0;

        await testInit();
        await testAddProduct();
        await testGetByBarcode();
        await testGetNotFound();
        await testUpdateProduct();
        await testGetAllProducts();
        await testShortages();
        await testShortagesFilter();
        await testAddTransaction();
        await testOfflineQueue();
        await testDuplicateBarcode();
        await testGenerateId();

        return results;
    }

    return { runAll, results };
})();
