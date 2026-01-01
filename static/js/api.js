/**
 * 修仙游戏 2.0 - API 封装层
 */

const API = {
    async post(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const resData = await response.json();
            if (!response.ok) throw new Error(resData.error || `HTTP ${response.status}`);
            return resData;
        } catch (err) {
            console.error(`API Error [POST ${url}]:`, err);
            return { ok: false, error: err.message };
        }
    },

    async get(url) {
        try {
            const response = await fetch(url);
            const resData = await response.json();
            if (!response.ok) throw new Error(resData.error || `HTTP ${response.status}`);
            return resData;
        } catch (err) {
            console.error(`API Error [GET ${url}]:`, err);
            return { ok: false, error: err.message };
        }
    },

    // 游客模式
    async loginAsGuest() {
        return this.post('/api/guest', {});
    },

    // 账户
    async register(username, password) {
        return this.post('/api/register', { username, password });
    },

    async login(username, password) {
        return this.post('/api/login', { username, password });
    },

    async logout() {
        return this.post('/api/logout', {});
    },

    async me() {
        return this.get('/api/me');
    },

    // 存档 (对应后端复合主键，但 Session 自动处理 owner)
    async saveGame(saveData, slot = 1) {
        return this.post('/api/save', { save: saveData, slot });
    },

    async loadGame(slot = 1) {
        return this.get(`/api/load?slot=${slot}`);
    }
};
