/* ===================================================
   nostr-bridge.js — גשר Nostr למאגר מוצרים משותף
   אחראי על: מפתחות אוטומטיים, חיבור ריילי, פרסום/שאילתת מוצרים,
   העלאת תמונות לשרתי Blossom
   שייך ל: מערכת חיפוש מוצרים — שכבת הקהילה (community layer)
   תלוי ב: nostr-tools CDN (נטען לפני קובץ זה)
   =================================================== */

const NostrBridge = (() => {

    /* ---- קבועים ---- */

    /* סוג אירוע: Parameterized Replaceable Event — מאפשר עדכון מוצר לפי ברקוד */
    const PRODUCT_EVENT_KIND = 30078;

    /* תג לזיהוי אירועי מוצרים של מלאי המטבח */
    const PRODUCT_TAG = 'ki-product';

    /* ריילי ציבוריים חינמיים — אותם ריילי שה-SOS משתמש בהם */
    const DEFAULT_RELAYS = [
        'wss://relay.snort.social',
        'wss://nos.lol',
        'wss://nostr-relay.xbytez.io',
        'wss://nostr-02.uid.ovh'
    ];

    /* שרתי Blossom להעלאת תמונות — אותם שרתים שה-SOS משתמש בהם */
    const BLOSSOM_SERVERS = [
        'https://files.sovbit.host',
        'https://blossom.band',
        'https://blossom.primal.net',
        'https://blossom.nostr.build'
    ];

    /* מפתחות localStorage */
    const KEY_PRIVATE = 'ki_nostr_private_key';
    const KEY_PUBLIC = 'ki_nostr_public_key';
    const KEY_RELAYS = 'ki_nostr_relays';

    /* ---- מצב פנימי ---- */
    let _privateKey = null;  /* Uint8Array */
    let _publicKey = null;   /* hex string */
    let _pool = null;        /* SimplePool instance */
    let _ready = false;

    /* ---- כלי עזר: גישה ל-nostr-tools ---- */
    function _tools() {
        return window.NostrTools || {};
    }

    /* ---- ניהול מפתחות — אוטומטי, ללא רישום ---- */
    function _ensureKeys() {
        const tools = _tools();
        if (!tools.generateSecretKey || !tools.getPublicKey) {
            console.warn('[NostrBridge] nostr-tools לא נטען');
            return false;
        }

        /* טעינה מ-localStorage */
        const storedHex = localStorage.getItem(KEY_PRIVATE);
        if (storedHex && storedHex.length === 64) {
            try {
                _privateKey = tools.hexToBytes
                    ? tools.hexToBytes(storedHex)
                    : _hexToBytes(storedHex);
                _publicKey = tools.getPublicKey(_privateKey);
                return true;
            } catch (e) {
                console.warn('[NostrBridge] מפתח שמור לא תקין, מייצר חדש');
            }
        }

        /* יצירת מפתח חדש */
        _privateKey = tools.generateSecretKey();
        const hexPrivate = tools.bytesToHex
            ? tools.bytesToHex(_privateKey)
            : _bytesToHex(_privateKey);
        _publicKey = tools.getPublicKey(_privateKey);

        localStorage.setItem(KEY_PRIVATE, hexPrivate);
        localStorage.setItem(KEY_PUBLIC, _publicKey);
        console.log('[NostrBridge] מפתח חדש נוצר');
        return true;
    }

    /* fallback המרת bytes ↔ hex */
    function _bytesToHex(arr) {
        return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    function _hexToBytes(hex) {
        const out = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
        }
        return out;
    }

    /* ---- חיבור ריילי ---- */
    function _ensurePool() {
        if (_pool) return _pool;
        const tools = _tools();
        if (!tools.SimplePool) {
            console.warn('[NostrBridge] SimplePool לא זמין');
            return null;
        }
        _pool = new tools.SimplePool();
        return _pool;
    }

    function _getRelays() {
        try {
            const stored = JSON.parse(localStorage.getItem(KEY_RELAYS));
            if (Array.isArray(stored) && stored.length) return stored;
        } catch {}
        return [...DEFAULT_RELAYS];
    }

    /* ---- אתחול — קורא פעם אחת בטעינת האפליקציה ---- */
    function init() {
        if (_ready) return true;
        const keysOk = _ensureKeys();
        if (!keysOk) return false;
        _ensurePool();
        _ready = true;
        console.log('[NostrBridge] מוכן ✓', { pubkey: _publicKey?.slice(0, 12) + '...' });
        return true;
    }

    /* ---- פרסום מוצר לריילי ---- */
    async function publishProduct(barcode, data) {
        if (!init()) throw new Error('NostrBridge לא מאותחל');
        const tools = _tools();
        if (!tools.finalizeEvent) throw new Error('finalizeEvent חסר');

        const { name, brand, category, image } = data;

        /* בניית אירוע Nostr — Parameterized Replaceable */
        const tags = [
            ['d', barcode],
            ['t', PRODUCT_TAG]
        ];
        if (name) tags.push(['name', name]);
        if (brand) tags.push(['brand', brand]);
        if (category) tags.push(['category', category]);
        if (image) tags.push(['image', image]);

        const content = JSON.stringify({ name, brand, category, image, barcode });

        const event = tools.finalizeEvent({
            kind: PRODUCT_EVENT_KIND,
            content,
            tags,
            created_at: Math.floor(Date.now() / 1000)
        }, _privateKey);

        /* פרסום לכל הריילי */
        const relays = _getRelays();
        const pool = _ensurePool();
        if (!pool) throw new Error('אין חיבור ריילי');

        try {
            await Promise.any(
                relays.map(r => pool.publish([r], event))
            );
            console.log('[NostrBridge] מוצר פורסם:', name, barcode);
            return true;
        } catch (err) {
            console.error('[NostrBridge] פרסום נכשל:', err);
            return false;
        }
    }

    /* ---- שאילתת מוצר מריילי לפי ברקוד ---- */
    async function queryProduct(barcode, timeoutMs = 5000) {
        if (!init()) return null;
        const pool = _ensurePool();
        if (!pool) return null;

        const relays = _getRelays();
        const filter = {
            kinds: [PRODUCT_EVENT_KIND],
            '#d': [barcode],
            '#t': [PRODUCT_TAG],
            limit: 5
        };

        return new Promise((resolve) => {
            let best = null;
            let bestTime = 0;
            const timer = setTimeout(() => {
                sub.close();
                if (best) {
                    console.log('[NostrBridge] ריילי מצא:', best.name);
                }
                resolve(best);
            }, timeoutMs);

            const sub = pool.subscribeMany(relays, [filter], {
                onevent(event) {
                    try {
                        /* לוקחים את האירוע העדכני ביותר */
                        if (event.created_at > bestTime) {
                            bestTime = event.created_at;
                            const data = JSON.parse(event.content);
                            /* גם מתגים */
                            const nameTag = event.tags.find(t => t[0] === 'name');
                            const catTag = event.tags.find(t => t[0] === 'category');
                            const imgTag = event.tags.find(t => t[0] === 'image');
                            const brandTag = event.tags.find(t => t[0] === 'brand');

                            best = {
                                name: data.name || nameTag?.[1] || '',
                                brand: data.brand || brandTag?.[1] || '',
                                category: data.category || catTag?.[1] || null,
                                image: data.image || imgTag?.[1] || '',
                                found: true,
                                source: 'nostr'
                            };
                        }
                    } catch (e) {
                        console.warn('[NostrBridge] שגיאה בפענוח אירוע:', e);
                    }
                },
                oneose() {
                    /* כל הריילי סיימו — אפשר להחזיר מוקדם */
                    clearTimeout(timer);
                    sub.close();
                    if (best) {
                        console.log('[NostrBridge] ריילי מצא:', best.name);
                    }
                    resolve(best);
                }
            });
        });
    }

    /* ---- העלאת תמונה לשרת Blossom ---- */
    async function uploadImage(blob) {
        if (!init()) throw new Error('NostrBridge לא מאותחל');
        const tools = _tools();

        /* חישוב SHA-256 */
        const buf = await blob.arrayBuffer();
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        const sha256 = Array.from(new Uint8Array(hashBuf))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        /* יצירת auth event (NIP-24242) */
        const now = Math.floor(Date.now() / 1000);
        const authEvent = tools.finalizeEvent({
            kind: 24242,
            content: 'Upload product image',
            tags: [
                ['t', 'upload'],
                ['x', sha256],
                ['expiration', String(now + 86400)]
            ],
            created_at: now
        }, _privateKey);

        const authHeader = 'Nostr ' + btoa(JSON.stringify(authEvent));

        /* ניסיון העלאה לכל שרת עד הצלחה */
        const errors = [];
        for (const server of BLOSSOM_SERVERS) {
            for (const path of ['/upload', '/api/v1/upload']) {
                for (const method of ['PUT', 'POST']) {
                    try {
                        const url = new URL(path, server).toString();
                        const res = await fetch(url, {
                            method,
                            body: blob,
                            headers: {
                                'Content-Type': blob.type || 'image/jpeg',
                                'Accept': 'application/json',
                                'Authorization': authHeader
                            },
                            mode: 'cors',
                            credentials: 'omit'
                        });

                        if (!res.ok) continue;
                        const data = await res.json();
                        const resultUrl = data?.url || data?.data?.url;
                        if (resultUrl) {
                            console.log('[NostrBridge] תמונה הועלתה:', resultUrl);
                            return resultUrl;
                        }
                    } catch (e) {
                        errors.push(`${server}${path}: ${e.message}`);
                    }
                }
            }
        }

        console.warn('[NostrBridge] העלאת תמונה נכשלה:', errors);
        return null;
    }

    /* ---- המרת Data URL ל-Blob (לצורך העלאה) ---- */
    function dataUrlToBlob(dataUrl) {
        if (!dataUrl || !dataUrl.startsWith('data:')) return null;
        const [header, base64] = dataUrl.split(',');
        const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
        const binary = atob(base64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            arr[i] = binary.charCodeAt(i);
        }
        return new Blob([arr], { type: mime });
    }

    /* ---- סנכרון מכשירים — פרסום והאזנה לשינויי מלאי בחדר משותף ---- */
    const SYNC_EVENT_KIND = 30079; /* סוג אירוע לסנכרון מלאי */
    let _syncSub = null;          /* subscription פעיל */
    let _onSyncCallback = null;   /* callback לקבלת שינויים */

    /* פרסום שינוי מלאי לחדר */
    async function publishSync(roomCode, action) {
        if (!init() || !roomCode) return false;
        const tools = _tools();
        if (!tools.finalizeEvent) return false;

        const { barcode, type, quantity, productName, deviceId } = action;
        const content = JSON.stringify({ barcode, type, quantity, productName, deviceId, ts: Date.now() });

        const event = tools.finalizeEvent({
            kind: SYNC_EVENT_KIND,
            content,
            tags: [
                ['d', `sync-${roomCode}-${barcode}-${Date.now()}`],
                ['t', 'ki-sync'],
                ['room', roomCode],
                ['barcode', barcode],
                ['action', type]
            ],
            created_at: Math.floor(Date.now() / 1000)
        }, _privateKey);

        const pool = _ensurePool();
        if (!pool) return false;

        try {
            await Promise.any(_getRelays().map(r => pool.publish([r], event)));
            console.log('[NostrBridge] סנכרון פורסם:', type, barcode);
            return true;
        } catch (e) {
            console.warn('[NostrBridge] סנכרון נכשל:', e);
            return false;
        }
    }

    /* האזנה לשינויים מחדר — callback(action) נקרא בכל שינוי שמגיע */
    function subscribeSync(roomCode, callback) {
        if (!init() || !roomCode) return;
        unsubscribeSync();
        _onSyncCallback = callback;

        const pool = _ensurePool();
        if (!pool) return;

        const filter = {
            kinds: [SYNC_EVENT_KIND],
            '#t': ['ki-sync'],
            '#room': [roomCode],
            since: Math.floor(Date.now() / 1000) - 60 /* רק אירועים מהדקה האחרונה */
        };

        _syncSub = pool.subscribeMany(_getRelays(), [filter], {
            onevent(event) {
                /* התעלם מאירועים שפורסמו מאותו מכשיר */
                if (event.pubkey === _publicKey) return;
                try {
                    const data = JSON.parse(event.content);
                    console.log('[NostrBridge] סנכרון התקבל:', data.type, data.barcode);
                    if (_onSyncCallback) _onSyncCallback(data);
                } catch (e) {
                    console.warn('[NostrBridge] שגיאת סנכרון:', e);
                }
            }
        });
        console.log('[NostrBridge] מאזין לחדר:', roomCode);
    }

    /* ניתוק האזנה */
    function unsubscribeSync() {
        if (_syncSub) {
            _syncSub.close();
            _syncSub = null;
        }
        _onSyncCallback = null;
    }

    /* ---- סטטוס ---- */
    function isReady() { return _ready; }
    function getPublicKey() { return _publicKey; }

    /* ---- ייצוא פומבי ---- */
    return {
        init,
        isReady,
        getPublicKey,
        publishProduct,
        queryProduct,
        uploadImage,
        dataUrlToBlob,
        publishSync,
        subscribeSync,
        unsubscribeSync
    };
})();
