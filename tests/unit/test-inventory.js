/* ===================================================
   test-inventory.js — בדיקות יחידה ל-inventory.js
   אחראי על: stock_in, stock_out, manualAdjust, מניעת שלילי
   שייך ל: tests/unit/
   =================================================== */

const TestInventory = (() => {
    const results = [];

    function _assert(name, condition, detail = '') {
        results.push({ name, pass: !!condition, detail });
    }

    /* עזר: יצירת מוצר בדיקה */
    async function _seedProduct(barcode, name, qty, target, loc) {
        const existing = await Store.getProductByBarcode(barcode);
        if (existing) {
            existing.current_quantity = qty;
            existing.target_quantity = target;
            await Store.updateProduct(existing);
            return existing;
        }
        const product = {
            barcode, display_name: name, image_url: '',
            location_type: loc, target_quantity: target, current_quantity: qty
        };
        await Store.addProduct(product);
        return await Store.getProductByBarcode(barcode);
    }

    /* ---- B1: stock_in מעלה כמות ---- */
    async function testStockIn() {
        const p = await _seedProduct('7290100000001', 'מוצר בדיקה 1', 1, 3, 'fridge');
        Scanner._currentProduct = p;

        /* mock elements */
        _mockStockInUI();

        await Inventory.stockIn(1);
        const updated = await Store.getProductByBarcode('7290100000001');
        _assert('B1: stock_in מעלה כמות', updated.current_quantity === 2, `got ${updated.current_quantity}`);
    }

    /* ---- B2: stock_in מרובה ---- */
    async function testStockInMultiple() {
        const p = await Store.getProductByBarcode('7290100000001');
        Scanner._currentProduct = p;
        _mockStockInUI();

        await Inventory.stockIn(2);
        const updated = await Store.getProductByBarcode('7290100000001');
        _assert('B2: stock_in +2', updated.current_quantity === 4, `got ${updated.current_quantity}`);
    }

    /* ---- B3: stock_out מוריד כמות ---- */
    async function testStockOut() {
        const p = await _seedProduct('7290100000002', 'מוצר בדיקה 2', 3, 3, 'pantry');
        Scanner._currentProduct = p;
        _mockStockOutUI();

        await Inventory.stockOut(1);
        const updated = await Store.getProductByBarcode('7290100000002');
        _assert('B3: stock_out מוריד כמות', updated.current_quantity === 2, `got ${updated.current_quantity}`);
    }

    /* ---- B4: stock_out לא יורד מתחת לאפס ---- */
    async function testStockOutFloor() {
        const p = await _seedProduct('7290100000003', 'מוצר ריק', 0, 2, 'fridge');
        Scanner._currentProduct = p;
        _mockStockOutUI();

        await Inventory.stockOut(1);
        const updated = await Store.getProductByBarcode('7290100000003');
        _assert('B4: כמות לא יורדת מ-0', updated.current_quantity === 0, `got ${updated.current_quantity}`);
    }

    /* ---- B5: יצירת חוסר אחרי stock_out ---- */
    async function testShortageCreated() {
        const p = await _seedProduct('7290100000004', 'מוצר חוסר', 2, 3, 'freezer');
        Scanner._currentProduct = p;
        _mockStockOutUI();

        await Inventory.stockOut(1);
        const shortages = await Store.getShortages();
        const found = shortages.find(s => s.display_name === 'מוצר חוסר');
        _assert('B5: חוסר נוצר אחרי ירידה', !!found, found ? `missing: ${found.missing_quantity}` : 'not found');
    }

    /* ---- B6: manual adjust +1 ---- */
    async function testManualAdjustUp() {
        const p = await _seedProduct('7290100000005', 'מוצר תיקון', 1, 3, 'pantry');
        /* simulate Router.currentParams */
        Router._testOverrideParams = p.id;
        _mockDetailUI();

        await Inventory.manualAdjust(1);
        const updated = await Store.getProduct(p.id);
        _assert('B6: manual adjust +1', updated.current_quantity === 2, `got ${updated.current_quantity}`);
        Router._testOverrideParams = null;
    }

    /* ---- B7: manual adjust -1 לא יורד מ-0 ---- */
    async function testManualAdjustFloor() {
        const p = await _seedProduct('7290100000006', 'מוצר אפס', 0, 1, 'fridge');
        Router._testOverrideParams = p.id;
        _mockDetailUI();

        await Inventory.manualAdjust(-1);
        const updated = await Store.getProduct(p.id);
        _assert('B7: manual adjust floor', updated.current_quantity === 0, `got ${updated.current_quantity}`);
        Router._testOverrideParams = null;
    }

    /* ---- Mock UI elements ---- */
    function _mockStockInUI() {
        _ensureElement('stock-in-current', 'span');
        _ensureElement('stock-in-target', 'span');
    }

    function _mockStockOutUI() {
        _ensureElement('stock-out-current', 'span');
        _ensureElement('stock-out-target', 'span');
    }

    function _mockDetailUI() {
        _ensureElement('detail-current', 'span');
        _ensureElement('detail-target', 'span');
    }

    function _ensureElement(id, tag) {
        if (!document.getElementById(id)) {
            const el = document.createElement(tag || 'span');
            el.id = id;
            el.style.display = 'none';
            document.body.appendChild(el);
        }
    }

    /* ---- הרצת כל הבדיקות ---- */
    async function runAll() {
        results.length = 0;

        await testStockIn();
        await testStockInMultiple();
        await testStockOut();
        await testStockOutFloor();
        await testShortageCreated();
        await testManualAdjustUp();
        await testManualAdjustFloor();

        return results;
    }

    return { runAll, results };
})();
