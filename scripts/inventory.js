/* ===================================================
   inventory.js — לוגיקת מלאי
   אחראי על: stock_in, stock_out, adjust, חישוב חוסרים
   שייך ל: store.js, sync.js — ליבת הלוגיקה העסקית
   =================================================== */

const Inventory = (() => {

    /* ---- כניסה למלאי — הוספת כמות ---- */
    async function stockIn(quantity = 1) {
        const product = Scanner._currentProduct;
        if (!product) {
            UI.toast('לא נבחר מוצר', 'error');
            return;
        }

        /* עדכון כמות */
        product.current_quantity += quantity;
        await Store.updateProduct(product);

        /* רישום טרנזקציה */
        await Store.addTransaction({
            product_id: product.id,
            barcode: product.barcode,
            action_type: 'stock_in',
            quantity_delta: quantity,
            station_mode: Config.getStationMode(),
            device_id: Config.getDeviceId()
        });

        /* הוספה לתור offline */
        await Sync.queueAction({
            action_type: 'stock_in',
            barcode: product.barcode,
            quantity: quantity,
            station_mode: Config.getStationMode(),
            device_id: Config.getDeviceId()
        });

        /* עדכון UI */
        document.getElementById('stock-in-current').textContent = product.current_quantity;

        const isShortage = product.current_quantity < product.target_quantity;
        UI.toast(`${product.display_name} — נוספו ${quantity}`, 'success');

        /* חזרה אוטומטית לסריקה אחרי 1.5 שניות */
        setTimeout(() => Scanner.resume('in'), 1500);

        /* עדכון רשימת חוסרים */
        Shortages.refresh();
    }

    /* ---- יציאה מהמלאי — הורדת כמות ---- */
    async function stockOut(quantity = 1) {
        const product = Scanner._currentProduct;
        if (!product) {
            UI.toast('לא נבחר מוצר', 'error');
            return;
        }

        /* בדיקה: לא ניתן לרדת מתחת לאפס */
        if (product.current_quantity <= 0) {
            UI.toast('הכמות כבר אפס — לא ניתן להוריד', 'error');
            return;
        }

        /* עדכון כמות */
        product.current_quantity = Math.max(0, product.current_quantity - quantity);
        await Store.updateProduct(product);

        /* רישום טרנזקציה */
        await Store.addTransaction({
            product_id: product.id,
            barcode: product.barcode,
            action_type: 'stock_out',
            quantity_delta: -quantity,
            station_mode: Config.getStationMode(),
            device_id: Config.getDeviceId()
        });

        /* הוספה לתור offline */
        await Sync.queueAction({
            action_type: 'stock_out',
            barcode: product.barcode,
            quantity: quantity,
            station_mode: Config.getStationMode(),
            device_id: Config.getDeviceId()
        });

        /* עדכון UI */
        document.getElementById('stock-out-current').textContent = product.current_quantity;

        /* הודעה */
        const isShortage = product.current_quantity < product.target_quantity;
        if (isShortage) {
            UI.toast(`${product.display_name} — ירד מהמלאי (חסר!)`, 'error');
        } else {
            UI.toast(`${product.display_name} — ירד מהמלאי`, 'success');
        }

        /* חזרה אוטומטית לסריקה */
        setTimeout(() => Scanner.resume('out'), 1500);

        /* עדכון רשימת חוסרים */
        Shortages.refresh();
    }

    /* ---- תיקון ידני — ממסך פרטי מוצר ---- */
    async function manualAdjust(delta) {
        const productId = Router.currentParams;
        if (!productId) return;

        const product = await Store.getProduct(productId);
        if (!product) {
            UI.toast('מוצר לא נמצא', 'error');
            return;
        }

        /* מניעת ערך שלילי */
        const newQty = Math.max(0, product.current_quantity + delta);
        product.current_quantity = newQty;
        await Store.updateProduct(product);

        /* רישום טרנזקציה */
        await Store.addTransaction({
            product_id: product.id,
            barcode: product.barcode,
            action_type: 'manual_adjust',
            quantity_delta: delta,
            station_mode: 'admin',
            device_id: Config.getDeviceId()
        });

        /* עדכון UI */
        document.getElementById('detail-current').textContent = newQty;
        UI.toast(`כמות עודכנה: ${newQty}`, 'success');

        /* עדכון חוסרים */
        Shortages.refresh();
    }

    /* ---- ייצוא פומבי ---- */
    return {
        stockIn,
        stockOut,
        manualAdjust
    };
})();
