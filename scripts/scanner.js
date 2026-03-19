/* ===================================================
   scanner.js — מנוע סריקת ברקוד (V3)
   אחראי על: סריקת ברקוד עם html5-qrcode כמנוע ראשי,
              פתיחת מצלמה, הרשאות, זיהוי אוטומטי,
              fallback להקלדה ידנית אם מצלמה לא זמינה
   שייך ל: #screen-stock-in, #screen-stock-out
   =================================================== */

const Scanner = (() => {

    let html5Scanner = null;    /* Html5Qrcode instance */
    let scanning = false;       /* האם סורק כרגע */
    let currentMode = null;     /* 'in' או 'out' */
    let lastBarcode = '';       /* ברקוד אחרון שנסרק */
    let scanPaused = false;     /* האם סריקה בהשהיה */
    let _log = [];              /* לוג דיאגנוסטי */

    /* ---- לוג דיאגנוסטי ---- */
    function _addLog(msg, level) {
        const entry = `[${level || 'INFO'}] ${msg}`;
        _log.push(entry);
        if (level === 'ERROR') console.error('[Scanner]', msg);
        else if (level === 'WARN') console.warn('[Scanner]', msg);
        else console.log('[Scanner]', msg);
    }

    /* ---- טעינת ספריית html5-qrcode ---- */
    function _ensureLibLoaded() {
        return new Promise((resolve, reject) => {
            if (typeof Html5Qrcode !== 'undefined') {
                _addLog('ספרייה כבר טעונה');
                resolve();
                return;
            }
            _addLog('טוען ספריית html5-qrcode מ-CDN...');
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
            script.onload = () => {
                _addLog('ספרייה נטענה בהצלחה');
                resolve();
            };
            script.onerror = () => {
                _addLog('נכשל בטעינת ספרייה מ-CDN!', 'ERROR');
                reject(new Error('Failed to load html5-qrcode library'));
            };
            document.head.appendChild(script);
        });
    }

    /* ---- עצירה בטוחה של סורק קיים ---- */
    async function _safeStop() {
        if (!html5Scanner) return;
        try {
            const state = html5Scanner.getState();
            _addLog(`מצב סורק נוכחי: ${state}`);
            /* 2 = SCANNING, 3 = PAUSED */
            if (state === 2 || state === 3) {
                await html5Scanner.stop();
                _addLog('סורק נעצר');
            }
        } catch (e) {
            _addLog('שגיאה בעצירה: ' + e.message, 'WARN');
        }
        try { html5Scanner.clear(); } catch (e) {}
        html5Scanner = null;
        scanning = false;
        scanPaused = false;
    }

    /* ---- Callback כשברקוד זוהה ---- */
    async function _onBarcodeDetected(decodedText, decodedResult) {
        if (scanPaused) return;
        if (decodedText === lastBarcode) return;

        scanPaused = true;
        lastBarcode = decodedText;

        const fmt = decodedResult?.result?.format?.formatName || 'unknown';
        _addLog(`ברקוד זוהה: ${decodedText} (${fmt})`);

        _beep();

        /* השהיית סריקה */
        if (html5Scanner) {
            try { html5Scanner.pause(true); } catch (e) {}
        }

        /* חיפוש מוצר ב-DB */
        const product = await Store.getProductByBarcode(decodedText);

        if (currentMode === 'in') {
            _handleStockInScan(decodedText, product);
        } else if (currentMode === 'out') {
            _handleStockOutScan(decodedText, product);
        }
    }

    /* ---- טיפול בסריקה — מצב כניסה ---- */
    function _handleStockInScan(code, product) {
        const resultDiv = document.getElementById('stock-in-result');
        const newDiv = document.getElementById('stock-in-new');

        if (product) {
            /* מוצר קיים — הצגת פרטים ואפשרות עדכון כמות */
            document.getElementById('stock-in-img').src = product.image_url || '';
            document.getElementById('stock-in-name').textContent = product.display_name;
            document.getElementById('stock-in-barcode').textContent = `ברקוד: ${code}`;
            const expiryEl = document.getElementById('stock-in-expiry');
            if (expiryEl) expiryEl.textContent = _formatExpiryShort(product.expiry_date);
            document.getElementById('stock-in-current').textContent = product.current_quantity;
            document.getElementById('stock-in-target').textContent = product.target_quantity;
            resultDiv.classList.remove('hidden');
            newDiv.classList.add('hidden');
            Scanner._currentProduct = product;
        } else {
            /* מוצר חדש — מעבר אוטומטי לדף רישום ללא אישור */
            _addLog('מוצר חדש — מעבר אוטומטי לרישום: ' + code);
            UI.toast('מוצר חדש — עובר לרישום...', 'info', 1200);
            setTimeout(() => {
                Router.navigate('register', code);
            }, 600);
        }
    }

    /* ---- טיפול בסריקה — מצב יציאה ---- */
    function _handleStockOutScan(code, product) {
        const resultDiv = document.getElementById('stock-out-result');
        const notfoundDiv = document.getElementById('stock-out-notfound');

        if (product) {
            document.getElementById('stock-out-img').src = product.image_url || '';
            document.getElementById('stock-out-name').textContent = product.display_name;
            /* הצגת מספר ברקוד בולט */
            document.getElementById('stock-out-barcode').textContent = `ברקוד: ${code}`;
            /* תאריך תפוגה אם קיים */
            const expiryEl = document.getElementById('stock-out-expiry');
            if (expiryEl) expiryEl.textContent = _formatExpiryShort(product.expiry_date);
            document.getElementById('stock-out-current').textContent = product.current_quantity;
            document.getElementById('stock-out-target').textContent = product.target_quantity;
            resultDiv.classList.remove('hidden');
            notfoundDiv.classList.add('hidden');
            Scanner._currentProduct = product;
        } else {
            notfoundDiv.classList.remove('hidden');
            resultDiv.classList.add('hidden');
        }
    }

    /* ---- עזר: פורמט תאריך תפוגה קצר ---- */
    function _formatExpiryShort(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
        const fmt = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
        if (diffDays < 0) return `⛔ פג תוקף ${fmt}`;
        if (diffDays <= 3) return `🔴 תפוגה: ${fmt} (${diffDays} ימים!)`;
        if (diffDays <= 7) return `🟡 תפוגה: ${fmt}`;
        return `תפוגה: ${fmt}`;
    }

    /* ---- צליל חיווי ---- */
    function _beep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) { /* ignore */ }
    }

    /* ---- יצירת fallback להקלדה ידנית ---- */
    function _showManualFallback(area, suffix) {
        _addLog('מציג fallback הקלדה ידנית');
        const fallback = document.createElement('div');
        fallback.className = 'scanner-manual-fallback';
        fallback.innerHTML = `
            <p style="color:var(--accent-gold);text-align:center;margin-bottom:0.75rem;font-weight:700">
                📷 מצלמה לא זמינה
            </p>
            <p style="color:var(--text-muted);text-align:center;font-size:0.85rem;margin-bottom:1rem">
                הקלד ברקוד ידנית או בדוק הרשאות מצלמה
            </p>
            <div style="display:flex;gap:0.5rem">
                <input type="text" id="manual-barcode-${suffix}" 
                    placeholder="הקלד ברקוד כאן..." inputmode="numeric"
                    style="flex:1;padding:0.75rem;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-primary);font-size:1.1rem;direction:ltr;text-align:center">
                <button onclick="Scanner.manualSubmit('${suffix}')"
                    style="padding:0.75rem 1.2rem;border-radius:8px;background:var(--accent-copper);color:#fff;border:none;font-weight:700;font-size:1rem;cursor:pointer">
                    אישור
                </button>
            </div>
        `;
        area.appendChild(fallback);
    }

    /* ---- שליחת ברקוד ידני ---- */
    async function manualSubmit(suffix) {
        const input = document.getElementById(`manual-barcode-${suffix}`);
        if (!input) return;
        const code = input.value.trim();
        if (!code) {
            UI.toast('הקלד ברקוד', 'error');
            return;
        }
        _addLog(`ברקוד ידני: ${code}`);
        input.value = '';
        lastBarcode = code;
        _beep();

        const product = await Store.getProductByBarcode(code);
        if (currentMode === 'in') {
            _handleStockInScan(code, product);
        } else if (currentMode === 'out') {
            _handleStockOutScan(code, product);
        } else {
            /* ברירת מחדל — ניווט ישיר לרישום */
            Router.navigate('register', code);
        }
    }

    /* ==== API ציבורי ==== */

    /* ---- התחלת סריקה ---- */
    async function start(mode) {
        _log = [];
        currentMode = mode;
        lastBarcode = '';
        scanPaused = false;
        Scanner._currentProduct = null;

        const suffix = mode === 'in' ? 'in' : 'out';
        _addLog(`מתחיל סריקה — מצב: ${mode}`);

        /* בדיקות מקדימות */
        _addLog(`Secure context: ${window.isSecureContext}`);
        _addLog(`Protocol: ${window.location.protocol}`);
        _addLog(`getUserMedia: ${!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)}`);

        /* הסתרת תוצאות קודמות */
        document.querySelectorAll(`#screen-stock-${suffix} .scan-result`).forEach(el => {
            el.classList.add('hidden');
        });

        /* מציאת אזור הסורק */
        const area = document.getElementById(`scanner-area-${suffix}`);
        if (!area) {
            _addLog(`area #scanner-area-${suffix} לא נמצא!`, 'ERROR');
            UI.toast('שגיאה: אלמנט סורק לא נמצא', 'error');
            return;
        }

        try {
            /* שלב 1: עצירת סורק קודם קודם כל */
            await _safeStop();

            /* שלב 2: טעינת ספרייה */
            await _ensureLibLoaded();

            /* שלב 3: ניקוי וידוא container ריק */
            area.innerHTML = '';
            const readerDiv = document.createElement('div');
            readerDiv.id = `scanner-reader-${suffix}`;
            readerDiv.className = 'scanner-reader';
            area.appendChild(readerDiv);

            /* הוספת hint מתחת */
            const hint = document.createElement('p');
            hint.className = 'scanner-hint';
            hint.textContent = 'כוון את הברקוד למצלמה';
            area.appendChild(hint);

            _addLog(`container #scanner-reader-${suffix} נוצר`);

            /* שלב 4: בדיקת מצלמות זמינות */
            let cameras = [];
            try {
                cameras = await Html5Qrcode.getCameras();
                _addLog(`נמצאו ${cameras.length} מצלמות`);
                cameras.forEach((c, i) => _addLog(`  מצלמה ${i}: ${c.label || c.id}`));
            } catch (camErr) {
                _addLog('שגיאה בשליפת מצלמות: ' + camErr.message, 'ERROR');
                UI.toast('נדרשת הרשאת מצלמה — לחץ "אפשר" בהודעה', 'error');
                _showManualFallback(area, suffix);
                return;
            }

            if (cameras.length === 0) {
                _addLog('אין מצלמות זמינות במכשיר', 'ERROR');
                UI.toast('לא נמצאו מצלמות — הקלד ברקוד ידנית', 'error');
                _showManualFallback(area, suffix);
                return;
            }

            /* שלב 5: יצירת סורק חדש */
            html5Scanner = new Html5Qrcode(`scanner-reader-${suffix}`);
            scanning = true;

            /* שלב 6: הגדרות + הפעלה */
            const config = {
                fps: 10,
                qrbox: { width: 280, height: 120 },
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.CODE_93,
                    Html5QrcodeSupportedFormats.ITF
                ],
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            };

            /* בחירת מצלמה — מצלמה אחורית אם יש, אחרת הראשונה */
            const backCamera = cameras.find(c =>
                c.label && (c.label.toLowerCase().includes('back') ||
                c.label.toLowerCase().includes('rear') ||
                c.label.toLowerCase().includes('environment'))
            );
            const cameraId = backCamera ? backCamera.id : cameras[cameras.length - 1].id;
            _addLog(`משתמש במצלמה: ${cameraId} (${backCamera ? 'אחורית' : 'ברירת מחדל'})`);

            await html5Scanner.start(
                cameraId,
                config,
                _onBarcodeDetected,
                () => { /* scan frame miss */ }
            );

            _addLog('סריקה התחילה בהצלחה!');
            UI.toast('מצלמה פעילה — כוון את הברקוד', 'info');

        } catch (err) {
            _addLog('שגיאה קריטית: ' + (err.message || err), 'ERROR');
            scanning = false;

            let msg = '';
            const errStr = String(err.message || err).toLowerCase();
            if (errStr.includes('permission') || errStr.includes('denied') || errStr.includes('notallowed')) {
                msg = 'נדרשת הרשאת מצלמה — בדוק הגדרות דפדפן';
            } else if (errStr.includes('notfound') || errStr.includes('not found')) {
                msg = 'לא נמצאה מצלמה במכשיר';
            } else if (errStr.includes('secure') || errStr.includes('https')) {
                msg = 'נדרש HTTPS — אי אפשר להשתמש במצלמה ב-HTTP';
            } else if (errStr.includes('notreadable') || errStr.includes('could not start')) {
                msg = 'המצלמה תפוסה — סגור אפליקציות אחרות';
            } else {
                msg = 'שגיאה: ' + (err.message || err);
            }
            UI.toast(msg, 'error');

            /* הצגת fallback הקלדה ידנית */
            const area = document.getElementById(`scanner-area-${suffix}`);
            if (area) _showManualFallback(area, suffix);
        }
    }

    /* ---- המשך סריקה אחרי פעולה ---- */
    function resume(mode) {
        lastBarcode = '';
        scanPaused = false;
        Scanner._currentProduct = null;

        const suffix = (mode || currentMode) === 'in' ? 'in' : 'out';
        document.querySelectorAll(`#screen-stock-${suffix} .scan-result`).forEach(el => {
            el.classList.add('hidden');
        });

        if (html5Scanner) {
            try {
                html5Scanner.resume();
                _addLog('סריקה חודשה');
            } catch (e) {
                _addLog('שגיאה בחידוש: ' + e.message, 'WARN');
            }
        }
    }

    /* ---- עצירת סריקה ---- */
    async function stop() {
        await _safeStop();
        currentMode = null;
        _addLog('סורק נעצר');
    }

    /* ---- בדיקה אם BarcodeDetector native נתמך ---- */
    function isNativeSupported() {
        return 'BarcodeDetector' in window;
    }

    /* ---- אבחון — לצורך QA ---- */
    function getDiagnostics() {
        return {
            log: _log.slice(),
            scanning: scanning,
            scanPaused: scanPaused,
            currentMode: currentMode,
            lastBarcode: lastBarcode,
            hasScanner: !!html5Scanner,
            isSecureContext: window.isSecureContext,
            hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            libLoaded: typeof Html5Qrcode !== 'undefined'
        };
    }

    /* ---- ייצוא פומבי ---- */
    return {
        start,
        stop,
        resume,
        manualSubmit,
        isNativeSupported,
        getDiagnostics,
        _currentProduct: null,
        get lastBarcode() { return lastBarcode; }
    };
})();
