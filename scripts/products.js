/* ===================================================
   products.js — ניהול מוצרים
   אחראי על: רישום מוצר חדש, צילום, עריכה, רשימה
   שייך ל: #screen-register, #screen-product, #screen-all-products
   =================================================== */

const Products = (() => {

    let cameraStream = null;    /* stream של מצלמת רישום */
    let capturedImage = null;   /* תמונה שצולמה (base64) */
    let selectedLocation = '';  /* מיקום נבחר */

    /* ---- פתיחת מצלמה לצילום מוצר ---- */
    async function openCamera() {
        const video = document.getElementById('reg-camera');
        const preview = document.getElementById('reg-preview');

        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            video.srcObject = cameraStream;
            await video.play();

            video.classList.remove('hidden');
            preview.classList.add('hidden');
            document.getElementById('btn-open-camera').classList.add('hidden');
            document.getElementById('btn-capture').classList.remove('hidden');
            document.getElementById('btn-retake').classList.add('hidden');
        } catch (err) {
            console.error('[Products] שגיאה בפתיחת מצלמה:', err);
            UI.toast('שגיאה בפתיחת מצלמה', 'error');
        }
    }

    /* ---- צילום תמונה ---- */
    function capturePhoto() {
        const video = document.getElementById('reg-camera');
        const canvas = document.getElementById('reg-canvas');
        const preview = document.getElementById('reg-preview');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        capturedImage = canvas.toDataURL('image/jpeg', 0.8);
        preview.src = capturedImage;

        /* עצירת מצלמה */
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }

        video.classList.add('hidden');
        preview.classList.remove('hidden');
        document.getElementById('btn-capture').classList.add('hidden');
        document.getElementById('btn-retake').classList.remove('hidden');
    }

    /* ---- צילום מחדש ---- */
    function retakePhoto() {
        capturedImage = null;
        openCamera();
    }

    /* ---- בחירת מיקום ---- */
    function setLocation(loc) {
        selectedLocation = loc;
        document.getElementById('reg-location').value = loc;

        /* עדכון UI — כפתור פעיל */
        document.querySelectorAll('.loc-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.loc === loc);
        });
    }

    /* ---- שינוי כמות יעד ---- */
    function adjustTarget(delta) {
        const input = document.getElementById('reg-target');
        const val = Math.max(1, parseInt(input.value || '1') + delta);
        input.value = val;
    }

    /* ---- שינוי כמות התחלתית ---- */
    function adjustInitial(delta) {
        const input = document.getElementById('reg-initial');
        const val = Math.max(0, parseInt(input.value || '0') + delta);
        input.value = val;
    }

    /* ---- שימוש בשם מוצע ---- */
    function useSuggestedName() {
        const suggested = document.getElementById('reg-suggested-name').textContent;
        if (suggested) {
            document.getElementById('reg-display-name').value = suggested;
        }
    }

    /* ---- רישום מוצר חדש ---- */
    async function register(event) {
        event.preventDefault();

        const barcode = document.getElementById('reg-barcode').value;
        const displayName = document.getElementById('reg-display-name').value.trim();
        const location = document.getElementById('reg-location').value;
        const targetQty = parseInt(document.getElementById('reg-target').value) || 2;
        const initialQty = parseInt(document.getElementById('reg-initial').value) || 1;

        /* ולידציה */
        if (!barcode) {
            UI.toast('חסר ברקוד', 'error');
            return;
        }
        if (!displayName) {
            UI.toast('נדרש שם מוצר', 'error');
            return;
        }
        if (!capturedImage) {
            UI.toast('נדרשת תמונת מוצר', 'error');
            return;
        }
        if (!location) {
            UI.toast('נדרש לבחור מיקום', 'error');
            return;
        }
        if (targetQty < 1) {
            UI.toast('כמות יעד חייבת להיות לפחות 1', 'error');
            return;
        }

        /* בדיקה שאין ברקוד כפול */
        const existing = await Store.getProductByBarcode(barcode);
        if (existing) {
            UI.toast('ברקוד כבר קיים במערכת!', 'error');
            return;
        }

        /* תאריך תפוגה (אופציונלי) */
        const expiryDate = document.getElementById('reg-expiry').value || null;

        /* יצירת מוצר */
        const product = {
            barcode: barcode,
            display_name: displayName,
            suggested_name: '',
            image_url: capturedImage,
            location_type: location,
            target_quantity: targetQty,
            current_quantity: initialQty,
            expiry_date: expiryDate
        };

        await Store.addProduct(product);

        /* רישום טרנזקציה ראשונית */
        if (initialQty > 0) {
            await Store.addTransaction({
                product_id: product.id,
                barcode: barcode,
                action_type: 'stock_in',
                quantity_delta: initialQty,
                station_mode: Config.getStationMode(),
                device_id: Config.getDeviceId()
            });
        }

        UI.toast(`${displayName} נרשם בהצלחה!`, 'success');

        /* ניקוי טופס */
        _resetForm();

        /* עדכון חוסרים */
        Shortages.refresh();

        /* חזרה למסך קודם */
        setTimeout(() => Router.back(), 1000);
    }

    /* ---- הגדרת תאריך תפוגה מהיר ---- */
    function setQuickExpiry(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        const iso = d.toISOString().split('T')[0];
        document.getElementById('reg-expiry').value = iso;
    }

    /* ---- איפוס טופס רישום ---- */
    function _resetForm() {
        document.getElementById('register-form').reset();
        capturedImage = null;
        selectedLocation = '';
        document.getElementById('reg-preview').classList.add('hidden');
        document.getElementById('reg-camera').classList.add('hidden');
        document.getElementById('btn-open-camera').classList.remove('hidden');
        document.getElementById('btn-capture').classList.add('hidden');
        document.getElementById('btn-retake').classList.add('hidden');
        document.querySelectorAll('.loc-btn').forEach(b => b.classList.remove('active'));

        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
    }

    /* ---- טעינת מסך פרטי מוצר ---- */
    async function loadDetail(productId) {
        const product = await Store.getProduct(productId);
        if (!product) {
            UI.toast('מוצר לא נמצא', 'error');
            Router.navigate('home');
            return;
        }

        document.getElementById('detail-img').src = product.image_url || '';
        document.getElementById('detail-name').textContent = product.display_name;
        document.getElementById('detail-barcode').textContent = `ברקוד: ${product.barcode}`;
        const locInfo = Config.LOCATIONS[product.location_type];
        document.getElementById('detail-location').textContent = locInfo ? `${locInfo.icon} ${locInfo.label}` : product.location_type;
        document.getElementById('detail-current').textContent = product.current_quantity;
        document.getElementById('detail-target').textContent = product.target_quantity;

        /* תאריך תפוגה — אם קיים */
        const expiryEl = document.getElementById('detail-expiry');
        if (expiryEl && product.expiry_date) {
            expiryEl.textContent = _formatExpiry(product.expiry_date);
            expiryEl.style.display = '';
        } else if (expiryEl) {
            expiryEl.style.display = 'none';
        }
    }

    /* ---- עריכת יעד ---- */
    async function editTarget() {
        const productId = Router.currentParams;
        if (!productId) return;

        const product = await Store.getProduct(productId);
        if (!product) return;

        const newTarget = prompt('כמות יעד חדשה:', product.target_quantity);
        if (newTarget === null) return;

        const val = parseInt(newTarget);
        if (isNaN(val) || val < 1) {
            UI.toast('כמות יעד חייבת להיות לפחות 1', 'error');
            return;
        }

        product.target_quantity = val;
        await Store.updateProduct(product);

        document.getElementById('detail-target').textContent = val;
        UI.toast('יעד עודכן', 'success');
        Shortages.refresh();
    }

    /* ---- החלפת תמונה ---- */
    async function changePhoto() {
        const productId = Router.currentParams;
        if (!productId) return;

        /* פתיחת file input */
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (ev) => {
                const dataUrl = ev.target.result;
                const product = await Store.getProduct(productId);
                if (product) {
                    product.image_url = dataUrl;
                    await Store.updateProduct(product);
                    document.getElementById('detail-img').src = dataUrl;
                    UI.toast('תמונה עודכנה', 'success');
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    /* ---- מחיקת מוצר מרשימת כל המוצרים ---- */
    async function deleteProduct(productId, event) {
        /* מניעת ניווט לפרטי מוצר */
        if (event) event.stopPropagation();

        const product = await Store.getProduct(productId);
        if (!product) return;

        /* אישור מחיקה */
        const confirmed = confirm(`למחוק את "${product.display_name}"?\n\nהמוצר יוסר מהרשימה.`);
        if (!confirmed) return;

        await Store.deleteProduct(productId);
        UI.toast(`${product.display_name} נמחק`, 'success');

        /* רענון רשימה + חוסרים */
        loadAllProducts();
        Shortages.refresh();
    }

    /* ---- טעינת רשימת כל המוצרים ---- */
    async function loadAllProducts() {
        const products = await Store.getAllProducts();
        const container = document.getElementById('all-products-list');
        const emptyMsg = document.getElementById('no-products');

        if (products.length === 0) {
            emptyMsg.style.display = '';
            container.innerHTML = '';
            container.appendChild(emptyMsg);
            return;
        }

        emptyMsg.style.display = 'none';
        container.innerHTML = products.map(p => {
            const isShort = p.current_quantity < p.target_quantity;
            /* תאריך תפוגה — הצגה אם קיים */
            const expHtml = p.expiry_date
                ? `<p class="product-mini__expiry">${_formatExpiry(p.expiry_date)}</p>`
                : '';
            return `
                <div class="product-mini" onclick="Router.navigate('product', '${p.id}')">
                    <button class="product-mini__delete" onclick="Products.deleteProduct('${p.id}', event)" title="מחק מוצר">✕</button>
                    <img class="product-mini__img" src="${p.image_url || ''}" alt="${p.display_name}">
                    <p class="product-mini__name">${p.display_name}</p>
                    <p class="product-mini__qty ${isShort ? 'product-mini__qty--shortage' : ''}">
                        ${p.current_quantity} / ${p.target_quantity}
                    </p>
                    ${expHtml}
                </div>
            `;
        }).join('');
    }

    /* ---- עזר: פורמט תאריך תפוגה ---- */
    function _formatExpiry(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        const formatted = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
        if (diffDays < 0) return `⛔ פג תוקף ${formatted}`;
        if (diffDays <= 3) return `🔴 ${formatted} (${diffDays} ימים)`;
        if (diffDays <= 7) return `🟡 ${formatted}`;
        return `${formatted}`;
    }

    /* ---- הכנת מסך רישום עם ברקוד ---- */
    function prepareRegister(barcode) {
        _resetForm();
        document.getElementById('reg-barcode').value = barcode || '';
    }

    /* ---- ייצוא פומבי ---- */
    return {
        openCamera,
        capturePhoto,
        retakePhoto,
        setLocation,
        adjustTarget,
        adjustInitial,
        useSuggestedName,
        register,
        loadDetail,
        editTarget,
        changePhoto,
        deleteProduct,
        setQuickExpiry,
        loadAllProducts,
        prepareRegister
    };
})();
