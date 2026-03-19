/* ===================================================
   ui.js — ניהול ממשק משתמש
   אחראי על: toast, מעברי מסך, רינדור כללי
   שייך ל: כל המסכים — כלי עזר UI
   =================================================== */

const UI = (() => {

    /* ---- Toast — חיווי הצלחה/שגיאה/מידע ---- */
    function toast(message, type = 'info', duration = 2500) {
        const el = document.getElementById('toast');
        el.textContent = message;
        el.className = `toast toast--${type} show`;

        /* הסרה אחרי duration */
        setTimeout(() => {
            el.classList.remove('show');
            el.classList.add('hidden');
        }, duration);
    }

    /* ---- הצגת מסך ספציפי ---- */
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const target = document.getElementById(`screen-${screenId}`);
        if (target) {
            target.classList.add('active');
        }
    }

    /* ---- עדכון הגדרות תחנה ב-UI ---- */
    function updateStationUI() {
        const mode = Config.getStationMode();
        document.querySelectorAll('.station-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        const deviceName = Config.getDeviceName();
        const nameInput = document.getElementById('device-name');
        if (nameInput) nameInput.value = deviceName;

        /* קוד חדר */
        const roomInput = document.getElementById('room-code-input');
        if (roomInput) roomInput.value = Config.getRoomCode();

        /* סטטוס Nostr */
        _updateNostrStatus();
    }

    /* ---- סנכרון מכשירים — פונקציות UI ---- */
    let _syncActive = false;

    function onRoomCodeChange(value) {
        Config.setRoomCode(value);
        if (_syncActive) {
            toggleSync(); /* ניתוק */
            toggleSync(); /* חיבור מחדש עם קוד חדש */
        }
    }

    function generateRoom() {
        const code = Config.generateRoomCode();
        const input = document.getElementById('room-code-input');
        if (input) input.value = code;
        toast(`קוד חדר: ${code}`, 'success');
    }

    function toggleSync() {
        if (typeof NostrBridge === 'undefined') {
            toast('מאגר קהילתי לא זמין', 'error');
            return;
        }
        const roomCode = Config.getRoomCode();
        const statusEl = document.getElementById('sync-status');
        const btn = document.getElementById('btn-sync-toggle');

        if (_syncActive) {
            /* ניתוק */
            NostrBridge.unsubscribeSync();
            _syncActive = false;
            if (btn) btn.textContent = '🔌 חבר';
            if (statusEl) statusEl.innerHTML = '<span class="status-off">⚫ מנותק</span>';
            toast('סנכרון נותק', 'info');
        } else {
            /* חיבור */
            if (!roomCode || roomCode.length < 4) {
                toast('הזן קוד חדר (4 ספרות)', 'error');
                return;
            }
            NostrBridge.subscribeSync(roomCode, _onSyncEvent);
            _syncActive = true;
            if (btn) btn.textContent = '🔴 נתק';
            if (statusEl) statusEl.innerHTML = `<span class="status-on">🟢 מחובר לחדר ${roomCode}</span>`;
            toast(`מחובר לחדר ${roomCode}`, 'success');
        }
    }

    /* טיפול באירוע סנכרון שהתקבל ממכשיר אחר */
    async function _onSyncEvent(data) {
        const { barcode, type, quantity, productName } = data;
        if (!barcode) return;

        const product = await Store.getProductByBarcode(barcode);
        if (!product) {
            toast(`📡 ${productName || barcode} — מוצר לא מוכר`, 'info');
            return;
        }

        if (type === 'stock_in') {
            product.current_quantity += (quantity || 1);
            toast(`📡 +${quantity || 1} ${product.display_name}`, 'success');
        } else if (type === 'stock_out') {
            product.current_quantity = Math.max(0, product.current_quantity - (quantity || 1));
            toast(`📡 -${quantity || 1} ${product.display_name}`, 'info');
        }

        product.updated_at = new Date().toISOString();
        const store = await Store._getStore(Store.STORES?.PRODUCTS || 'products', 'readwrite');
        if (store) store.put(product);

        /* רענון חוסרים */
        if (typeof Shortages !== 'undefined') Shortages.refresh();
    }

    /* סטטוס Nostr */
    function _updateNostrStatus() {
        const el = document.getElementById('nostr-status');
        if (!el) return;
        if (typeof NostrBridge !== 'undefined' && NostrBridge.isReady()) {
            const pk = NostrBridge.getPublicKey();
            el.innerHTML = `<span class="status-on">🟢 מחובר</span> <span class="status-id">${pk?.slice(0, 8)}...</span>`;
        } else {
            el.innerHTML = '<span class="status-off">⚫ לא מחובר</span>';
        }
    }

    /* ---- ייצוא פומבי ---- */
    return {
        toast,
        showScreen,
        updateStationUI,
        onRoomCodeChange,
        generateRoom,
        toggleSync
    };
})();
