/* ===================================================
   shortages.js — ניהול רשימת חוסרים
   אחראי על: שליפת חוסרים, רינדור, סינון לפי מיקום
   שייך ל: #screen-home (תצוגה מקוצרת), #screen-shortages (מלאה)
   =================================================== */

const Shortages = (() => {

    let currentFilter = 'all';

    /* ---- רענון רשימת חוסרים (שני המסכים) ---- */
    async function refresh() {
        await _renderHome();
        await _renderFull(currentFilter);
    }

    /* ---- רינדור חוסרים במסך בית (מקוצר) ---- */
    async function _renderHome() {
        const items = await Store.getShortages();
        const container = document.getElementById('shortages-list-home');
        const emptyMsg = document.getElementById('no-shortages-home');

        if (items.length === 0) {
            container.innerHTML = '';
            container.appendChild(emptyMsg);
            emptyMsg.style.display = '';
            return;
        }

        emptyMsg.style.display = 'none';
        /* הצגת עד 5 חוסרים במסך בית */
        const shown = items.slice(0, 5);
        container.innerHTML = shown.map(item => _renderShortageItem(item)).join('');

        if (items.length > 5) {
            container.innerHTML += `
                <p class="more-items" onclick="Router.navigate('shortages')">
                    + עוד ${items.length - 5} מוצרים חסרים...
                </p>
            `;
        }
    }

    /* ---- רינדור חוסרים מלא ---- */
    async function _renderFull(locationType) {
        const items = await Store.getShortages(locationType);
        const container = document.getElementById('shortages-list-full');
        const emptyMsg = document.getElementById('no-shortages-full');

        if (items.length === 0) {
            container.innerHTML = '';
            container.appendChild(emptyMsg);
            emptyMsg.style.display = '';
            return;
        }

        emptyMsg.style.display = 'none';
        container.innerHTML = items.map(item => _renderShortageItem(item)).join('');
    }

    /* ---- רינדור פריט חוסר בודד ---- */
    function _renderShortageItem(item) {
        const locInfo = Config.LOCATIONS[item.location_type];
        const locLabel = locInfo ? `${locInfo.icon} ${locInfo.label}` : '';

        return `
            <div class="shortage-item" onclick="Router.navigate('product', '${item.product_id}')">
                <img class="shortage-item__img" src="${item.image_url || ''}" alt="${item.display_name}">
                <div class="shortage-item__info">
                    <p class="shortage-item__name">${item.display_name}</p>
                    <p class="shortage-item__detail">
                        ${locLabel} | נוכחי: ${item.current_quantity} | יעד: ${item.target_quantity}
                    </p>
                </div>
                <span class="shortage-item__missing">חסר: ${item.missing_quantity}</span>
            </div>
        `;
    }

    /* ---- סינון לפי מיקום ---- */
    function filter(locationType) {
        currentFilter = locationType;

        /* עדכון UI כפתורי סינון */
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === locationType);
        });

        _renderFull(locationType);
    }

    /* ---- ייצוא פומבי ---- */
    return {
        refresh,
        filter
    };
})();
