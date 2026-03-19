/* ===================================================
   test-flows.js — בדיקות אינטגרציה לזרימות מלאות
   אחראי על: כניסה/יציאה מלאי, רישום, חוסרים, offline
   שייך ל: tests/integration/
   =================================================== */

const TestFlows = (() => {
    const results = [];

    function _assert(name, condition, detail = '') {
        results.push({ name, pass: !!condition, detail });
    }

    /* עזר: הכנת מוצר */
    async function _ensureProduct(barcode, name, qty, target, loc) {
        let p = await Store.getProductByBarcode(barcode);
        if (p) {
            p.current_quantity = qty;
            p.target_quantity = target;
            await Store.updateProduct(p);
            return p;
        }
        p = { barcode, display_name: name, image_url: '', location_type: loc, target_quantity: target, current_quantity: qty };
        await Store.addProduct(p);
        return await Store.getProductByBarcode(barcode);
    }

    /* ---- D1: זרימת כניסה למוצר קיים ---- */
    async function testStockInFlow() {
        const p = await _ensureProduct('7290200000001', 'חלב בדיקה', 1, 3, 'fridge');
        Scanner._currentProduct = p;
        _ensureEl('stock-in-current');
        _ensureEl('stock-in-target');

        await Inventory.stockIn(1);
        const updated = await Store.getProductByBarcode('7290200000001');

        _assert('D1: כניסה למלאי — כמות עולה', updated.current_quantity === 2);

        /* בדיקת חוסר */
        const shortages = await Store.getShortages();
        const isShort = shortages.some(s => s.display_name === 'חלב בדיקה');
        _assert('D1b: עדיין חסר (2 < 3)', isShort);
    }

    /* ---- D2: זרימת כניסה עד השלמת יעד ---- */
    async function testStockInToTarget() {
        const p = await Store.getProductByBarcode('7290200000001');
        Scanner._currentProduct = p;

        await Inventory.stockIn(1); /* 2 → 3 */
        const updated = await Store.getProductByBarcode('7290200000001');
        _assert('D2: הגיע ליעד', updated.current_quantity === 3);

        const shortages = await Store.getShortages();
        const isShort = shortages.some(s => s.display_name === 'חלב בדיקה');
        _assert('D2b: לא חסר יותר', !isShort);
    }

    /* ---- D3: זרימת יציאה — יצירת חוסר ---- */
    async function testStockOutCreatesShortage() {
        const p = await _ensureProduct('7290200000002', 'גבינה בדיקה', 2, 3, 'fridge');
        Scanner._currentProduct = p;
        _ensureEl('stock-out-current');
        _ensureEl('stock-out-target');

        await Inventory.stockOut(1); /* 2 → 1, target=3 → חסר 2 */
        const shortages = await Store.getShortages();
        const found = shortages.find(s => s.display_name === 'גבינה בדיקה');
        _assert('D3: יציאה יוצרת חוסר', !!found);
        _assert('D3b: כמות חסרה נכונה', found && found.missing_quantity === 2, `missing: ${found?.missing_quantity}`);
    }

    /* ---- D4: זרימת מוצר חדש — רישום מלא ---- */
    async function testNewProductFlow() {
        /* ודא שהברקוד לא קיים */
        const existing = await Store.getProductByBarcode('7290200000099');
        if (existing) {
            _assert('D4: מוצר חדש (skip — כבר קיים)', true);
            return;
        }

        await Store.addProduct({
            barcode: '7290200000099',
            display_name: 'מוצר חדש בדיקה',
            image_url: 'data:image/png;base64,iVBORw0KGgo=',
            location_type: 'pantry',
            target_quantity: 2,
            current_quantity: 1
        });

        const product = await Store.getProductByBarcode('7290200000099');
        _assert('D4: מוצר חדש נוצר', !!product);
        _assert('D4b: שם נכון', product.display_name === 'מוצר חדש בדיקה');
        _assert('D4c: מיקום ארון', product.location_type === 'pantry');
        _assert('D4d: יעד 2', product.target_quantity === 2);
        _assert('D4e: כמות התחלתית 1', product.current_quantity === 1);
    }

    /* ---- D5: יציאה של מוצר לא קיים ---- */
    async function testStockOutNotFound() {
        const p = await Store.getProductByBarcode('0000000000000');
        _assert('D5: מוצר לא קיים — undefined', !p);
    }

    /* ---- D6: ניסיון הורדה ממלאי 0 ---- */
    async function testStockOutFromZero() {
        const p = await _ensureProduct('7290200000003', 'ריק לגמרי', 0, 1, 'freezer');
        Scanner._currentProduct = p;
        _ensureEl('stock-out-current');

        await Inventory.stockOut(1);
        const updated = await Store.getProductByBarcode('7290200000003');
        _assert('D6: לא ירד מתחת ל-0', updated.current_quantity === 0);
    }

    /* ---- D7: רשימת חוסרים ריקה כשהכל מלא ---- */
    async function testNoShortages() {
        await _ensureProduct('7290200000004', 'מלא 1', 5, 3, 'pantry');
        await _ensureProduct('7290200000005', 'מלא 2', 3, 3, 'fridge');

        /* רק המוצרים שבאמת חסרים */
        const allShort = await Store.getShortages();
        const fullOnes = allShort.filter(s =>
            s.display_name === 'מלא 1' || s.display_name === 'מלא 2'
        );
        _assert('D7: מוצרים מלאים לא ברשימת חוסרים', fullOnes.length === 0);
    }

    /* ---- D8: offline queue — שמירה וסנכרון ---- */
    async function testOfflineFlow() {
        const before = await Store.getPendingOfflineActions();
        const beforeCount = before.length;

        await Sync.queueAction({
            action_type: 'stock_in',
            barcode: '7290200000001',
            quantity: 1
        });

        const after = await Store.getPendingOfflineActions();
        _assert('D8: offline queue גדל', after.length === beforeCount + 1);
    }

    /* ---- D9: סינון חוסרים לפי מיקום ---- */
    async function testShortagesFilterIntegration() {
        await _ensureProduct('7290200000006', 'חוסר מקרר', 0, 2, 'fridge');
        await _ensureProduct('7290200000007', 'חוסר ארון', 0, 2, 'pantry');

        const fridgeShort = await Store.getShortages('fridge');
        const pantryShort = await Store.getShortages('pantry');

        const fridgeHas = fridgeShort.some(s => s.display_name === 'חוסר מקרר');
        const pantryHas = pantryShort.some(s => s.display_name === 'חוסר ארון');

        _assert('D9a: סינון מקרר נכון', fridgeHas);
        _assert('D9b: סינון ארון נכון', pantryHas);

        /* לא מערבב */
        const fridgeNoPantry = !fridgeShort.some(s => s.display_name === 'חוסר ארון');
        _assert('D9c: מקרר לא מכיל ארון', fridgeNoPantry);
    }

    /* ---- D10: כמות יעד גדולה מ-1 ---- */
    async function testLargeTarget() {
        const p = await _ensureProduct('7290200000008', 'יעד גדול', 2, 10, 'pantry');
        const shortages = await Store.getShortages();
        const found = shortages.find(s => s.display_name === 'יעד גדול');
        _assert('D10: יעד 10, כמות 2 = חסר 8', found && found.missing_quantity === 8, `missing: ${found?.missing_quantity}`);
    }

    /* ---- Mock helper ---- */
    function _ensureEl(id) {
        if (!document.getElementById(id)) {
            const el = document.createElement('span');
            el.id = id;
            el.style.display = 'none';
            document.body.appendChild(el);
        }
    }

    /* ---- הרצת כל הבדיקות ---- */
    async function runAll() {
        results.length = 0;

        await testStockInFlow();
        await testStockInToTarget();
        await testStockOutCreatesShortage();
        await testNewProductFlow();
        await testStockOutNotFound();
        await testStockOutFromZero();
        await testNoShortages();
        await testOfflineFlow();
        await testShortagesFilterIntegration();
        await testLargeTarget();

        return results;
    }

    return { runAll, results };
})();
