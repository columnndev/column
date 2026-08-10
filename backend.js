// Public backend config (safe to expose — contains NO secrets).
// Point this at your deployed Cloudflare Worker.
const BACKEND = {
    url: "https://api.column.wtf",

    // Purchases are handled in the Discord server: the buyer opens a ticket and
    // staff run !sign, which issues the KeyAuth key and the timed role.
    invite: "https://discord.gg/wgxyDQS9WW",

    // ── Discord identity gate ────────────────────────────────────────────────
    // Logging in with a key and downloading the loader both require a signed
    // token proving the visitor is a member of the Discord server. The worker
    // mints it after OAuth and re-verifies membership on every gated call, so
    // deleting it here only locks the user out — it can never grant access.
    DC_STORAGE_KEY: "column_dc",

    // Pull the token out of the URL fragment the worker redirects back with.
    captureDiscord() {
        const m = location.hash.match(/dc=([0-9]+\.[0-9]+\.[a-f0-9]+)/);
        if (m) {
            try { localStorage.setItem(this.DC_STORAGE_KEY, m[1]); } catch (e) {}
            history.replaceState(null, '', location.pathname + location.search);
        }
        return this.discordToken();
    },

    discordToken() {
        try { return localStorage.getItem(this.DC_STORAGE_KEY) || null; } catch (e) { return null; }
    },

    clearDiscord() {
        try { localStorage.removeItem(this.DC_STORAGE_KEY); } catch (e) {}
    },

    connectUrl() { return `${this.url}/discord/login`; },

    // { ok, id, username } — ok:false means never linked, expired, or kicked.
    async discordMe() {
        const t = this.discordToken();
        if (!t) return { ok: false };
        try {
            return await fetch(`${this.url}/discord/me?t=${encodeURIComponent(t)}`).then(r => r.json());
        } catch (e) {
            return { ok: false, offline: true };
        }
    },

    // Create a crypto invoice. Returns { orderId, invoiceUrl }.
    async checkout({ itemId, itemName, priceUsd, discordRef }) {
        const r = await fetch(`${this.url}/checkout`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ itemId, itemName, priceUsd, discordRef })
        });
        const data = await r.json().catch(() => ({}));
        // 409 = the saved Discord link expired; caller should reconnect.
        if (r.status === 409 && data.needDiscord) return { needDiscord: true };
        if (!r.ok) throw new Error(data.error || 'checkout failed');
        return data;
    },

    // Poll order status until the key is delivered.
    async getOrder(orderId) {
        const r = await fetch(`${this.url}/order/${orderId}`);
        if (!r.ok) return null;
        return r.json();
    }
};
