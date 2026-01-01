/**
 * 修仙游戏 2.0 - Start Page 交互
 */

let state = {
    mode: 'gate',
    authTab: 'login',
    form: {
        gender: 'male',
        selectedRoot: null, // { type, elements, bonus, desc }
        selectedBackground: null, // 家境选择
        isRandomRoot: false, // 是否使用随机灵根模式
        randomAttempts: 0, // 随机抽取次数
        stats: { luck: 0, wisdom: 0, insight: 0 },
        points: 10
    }
};



function init() {
    renderRoots();
    renderBackgroundGrid();
    renderStatSteppers();
    checkExistingSession();
}

async function checkExistingSession() {
    const res = await API.me();
    if (res.ok) {
        // 如果已经有身份，检查是否有存档
        const saveRes = await API.loadGame(1);
        if (saveRes.ok) {
            window.location.href = "/game";
        } else {
            showView('create');
        }
    }
}

// -----------------------------------------------------------------------------
// 视图切换
// -----------------------------------------------------------------------------

function showView(view) {
    state.mode = view;
    document.getElementById('ui-gate').classList.toggle('hidden', view !== 'gate');
    document.getElementById('ui-auth').classList.toggle('hidden', view !== 'auth');
    document.getElementById('ui-create').classList.toggle('hidden', view !== 'create');
    document.body.style.justifyContent = (view === 'create') ? 'flex-start' : 'center';
}

window.enterAsGuest = async () => {
    const res = await API.loginAsGuest();
    if (res.ok) showView('create');
    else showError(res.error);
};

window.showAuth = () => showView('auth');
window.backToGate = () => showView('gate');

window.switchAuthTab = (tab) => {
    state.authTab = tab;
    document.getElementById('tab-login').classList.toggle('border-ink-black', tab === 'login');
    document.getElementById('tab-login').classList.toggle('opacity-30', tab !== 'login');
    document.getElementById('tab-register').classList.toggle('border-ink-black', tab === 'register');
    document.getElementById('tab-register').classList.toggle('opacity-30', tab !== 'register');
    document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
    document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
};


// -----------------------------------------------------------------------------
// 角色创建渲染
// -----------------------------------------------------------------------------

function renderRoots() {
    const container = document.getElementById('root-container');
    const rootTypes = window.GAME_CONFIG.roots.types;

    container.innerHTML = rootTypes.map(type => {
        return `
            <div class="root-grid-item ink-card p-4 text-center border border-ink/10 opacity-30 cursor-not-allowed"
                 id="root-${type}">
                <div class="text-xs font-black">${type}</div>
                <div class="text-[9px] opacity-40 mt-1">请先随机抽取</div>
            </div>
        `;
    }).join('');
}

window.randomizeRoot = () => {
    // 限制3次随机
    if (state.form.randomAttempts >= 3) {
        alert('已达到随机抽取上限（3次），请确认当前灵根。');
        return;
    }

    const types = window.GAME_CONFIG.roots.types;
    const t = types[Math.floor(Math.random() * types.length)];
    state.form.isRandomRoot = true;
    state.form.randomAttempts++;
    selectRootByHand(t, true);

    // 更新按钮文本
    const btn = document.getElementById('btn-randomize-root');
    if (btn) {
        btn.textContent = `随机灵根抽取 (${3 - state.form.randomAttempts}/3)`;
        if (state.form.randomAttempts >= 3) {
            btn.disabled = true;
            btn.classList.add('opacity-30');
        }
    }
};

// 渲染家境选择
function renderBackgroundGrid() {
    const cfg = window.GAME_CONFIG.backgrounds;
    const container = document.getElementById('background-grid');
    if (!container) return;

    container.innerHTML = Object.entries(cfg).map(([id, bg]) => `
        <button onclick="selectBackground('${id}')" id="bg-${id}"
            class="ink-card p-3 text-left hover:bg-gold/5 transition-all cursor-pointer border border-ink/10">
            <div class="text-xs font-bold mb-1">${bg.name}</div>
            <div class="text-[9px] opacity-40 leading-tight">${bg.desc.split('，')[0]}</div>
        </button>
    `).join('');
}

window.selectBackground = (bgId) => {
    const cfg = window.GAME_CONFIG.backgrounds[bgId];
    state.form.selectedBackground = { id: bgId, ...cfg };

    // 更新UI高亮
    document.querySelectorAll('[id^="bg-"]').forEach(btn => {
        btn.classList.remove('bg-gold/10', 'border-gold/30');
        btn.classList.add('border-ink/10');
    });

    const selectedBtn = document.getElementById(`bg-${bgId}`);
    if (selectedBtn) {
        selectedBtn.classList.add('bg-gold/10', 'border-gold/30');
        selectedBtn.classList.remove('border-ink/10');
    }

    // 更新描述
    const desc = document.getElementById('background-desc');
    if (desc) {
        const stones = cfg.bonuses.spiritStones;
        const stoneText = Object.entries(stones).filter(([_, v]) => v > 0)
            .map(([quality, count]) => {
                const qName = window.GAME_CONFIG.spiritStones.qualities.find(q => q.id === quality)?.name || '灵石';
                return `${qName}x${count}`;
            }).join('、');

        const itemsText = cfg.bonuses.items.map(i => `${i.name}x${i.count}`).join('、');
        const bonusText = [stoneText, itemsText].filter(t => t).join('、') || '无';

        desc.innerHTML = `<span class="text-gold font-bold">【${cfg.name}】</span><br>
            ${cfg.desc}<br>
            <span class="opacity-60 text-[9px]">初始资源：${bonusText}</span>`;
    }
};

window.selectRootByHand = (typeName, fromRandom = false) => {
    // 必须先进行随机抽取
    if (state.form.randomAttempts === 0) {
        alert('请先点击"随机灵根抽取"按钮！');
        return;
    }

    const cfg = window.GAME_CONFIG.roots;
    const rule = cfg.rules[typeName] || { bonus: 1.0, desc: "感应平和，无甚出奇。" };

    // 随机分配属性
    let elements = [];
    if (typeName === "无属性灵根") {
        elements = ["无"];
    } else if (typeName === "混沌灵根") {
        elements = ["全属性"];
    } else {
        const countMap = {
            "单灵根": 1, "双灵根": 2, "三灵根": 3, "四灵根": 4, "五行杂灵根": 5,
            "变异灵根": 1, "极品灵根": 1
        };
        const count = countMap[typeName] || 1;
        const pool = typeName === "变异灵根" ? ["冰", "雷", "风", "毒"] : ["金", "木", "水", "火", "土"];
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        elements = shuffled.slice(0, count);
    }

    state.form.selectedRoot = {
        type: typeName,
        elements: elements,
        bonus: rule.bonus,
        desc: rule.desc
    };

    // UI 反馈
    cfg.types.forEach(t => {
        const el = document.getElementById(`root-${t}`);
        if (el) el.classList.remove('active');
    });
    const activeEl = document.getElementById(`root-${typeName}`);
    if (activeEl) {
        activeEl.classList.add('active');
        activeEl.innerHTML = `
            <div class="text-[10px] text-gold font-bold mb-1">${typeName}</div>
            <div class="text-xs font-black uppercase">${elements.join('·')}</div>
            <div class="text-[9px] opacity-40 mt-1">加成 x${rule.bonus}</div>
        `;
    }

    document.getElementById('root-desc').innerHTML = `
        <span class="text-gold font-bold">【${typeName}】</span>
        感应到属性：<span class="text-ink-black font-bold">${elements.join('、')}</span><br>
        <span class="opacity-80">${rule.desc}</span>
    `;
};



function renderStatSteppers() {
    const container = document.getElementById('stat-steppers');
    const stats = [
        { key: 'luck', name: '机缘' },
        { key: 'wisdom', name: '悟性' },
        { key: 'insight', name: '洞察' }
    ];
    container.innerHTML = stats.map(s => `
        <div class="flex items-center justify-between gap-4">
            <span class="text-sm font-bold w-12 text-center text-gold/60">${s.name}</span>
            <div class="flex items-center bg-black/40 rounded-xl border border-white/10 p-1">
                <button type="button" onclick="changeStat('${s.key}', -1)" class="w-12 h-12 flex items-center justify-center hover:text-gold">-</button>
                <span id="ui-stat-${s.key}" class="w-12 text-center font-black text-lg">${state.form.stats[s.key]}</span>
                <button type="button" onclick="changeStat('${s.key}', 1)" class="w-12 h-12 flex items-center justify-center hover:text-gold">+</button>
            </div>
        </div>
    `).join('');
}

window.selectRoot = (name) => {
    if (state.form.selectedRoot) {
        document.getElementById(`root-${state.form.selectedRoot}`).classList.remove('selected');
    }
    state.form.selectedRoot = name;
    document.getElementById(`root-${name}`).classList.add('selected');
};

window.setGender = (g) => {
    state.form.gender = g;
    document.getElementById('gender-male').classList.toggle('btn-ink-primary', g === 'male');
    document.getElementById('gender-male').classList.toggle('btn-ink-ghost', g !== 'male');
    document.getElementById('gender-female').classList.toggle('btn-ink-primary', g === 'female');
    document.getElementById('gender-female').classList.toggle('btn-ink-ghost', g !== 'female');
};

window.changeStat = (key, delta) => {
    if (delta > 0 && state.form.points <= 0) return;
    if (delta < 0 && state.form.stats[key] <= 0) return;
    state.form.stats[key] += delta;
    state.form.points -= delta;
    document.getElementById(`ui-stat-${key}`).textContent = state.form.stats[key];
    document.getElementById('ui-points').textContent = state.form.points;

    // 水墨反馈效果
    const dot = document.createElement('div');
    dot.className = 'ink-drop';
    dot.style.left = (Math.random() * 100) + '%';
    dot.style.top = (Math.random() * 100) + '%';
    document.getElementById('ui-points').appendChild(dot);
    setTimeout(() => dot.remove(), 1000);
};


// -----------------------------------------------------------------------------
// 提交逻辑
// -----------------------------------------------------------------------------

window.submitLogin = async () => {
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value.trim();
    if (!u || !p) return showError("道号道印不可缺失");
    const res = await API.login(u, p);
    if (res.ok) checkExistingSession();
    else showError(res.error);
};

window.submitRegister = async () => {
    const u = document.getElementById('reg-user').value.trim();
    const p = document.getElementById('reg-pass').value.trim();
    if (!u || !p) return showError("道号道印不可展示");
    const res = await API.register(u, p);
    if (res.ok) showView('create');
    else showError(res.error);
};

window.startJourney = async () => {
    const f = state.form;
    if (!f.selectedRoot) return showError("尚未感应先天灵根");
    if (!f.selectedBackground) return showError("尚未选择出身家境");
    if (f.points > 0) return showError("尚有天数未曾分配完满");

    const me = await API.me();
    if (!me.ok) return showError("身份感应中断");

    const cfg = window.GAME_CONFIG;
    const base = cfg.baseStats;

    // 初始化灵石（根据家境）
    const bgBonus = f.selectedBackground.bonuses;
    const initSpiritStones = {
        low: bgBonus.spiritStones.low || 0,
        medium: bgBonus.spiritStones.medium || 0,
        high: bgBonus.spiritStones.high || 0,
        supreme: bgBonus.spiritStones.supreme || 0
    };

    // 初始化背包物品（根据家境）
    const initInventory = bgBonus.items.map(item => ({
        id: item.id,
        name: item.name,
        count: item.count,
        category: "材料"
    }));

    const saveData = {
        meta: { ver: 2.6, createdAt: Date.now(), updatedAt: Date.now() },
        player: {
            name: me.username || "寻路人",
            gender: f.gender,
            root: f.selectedRoot, // { type, elements, bonus, desc }
            background: f.selectedBackground.name, // 记录家境
            stats: f.stats,
            realm: {
                major: "凡人",
                minor: "凡躯",
                progressPct: 0
            },
            // 基础数值初始化
            hp: { cur: base.hp, max: base.hp },
            mp: { cur: base.mp, max: base.mp },
            atk: base.atk + (f.stats.insight * 1), // 洞察微增攻击
            def: base.def,
            spd: base.spd,
            crit: base.crit + (f.stats.luck * 0.5), // 机缘增暴击
            critDmg: base.critDmg,
            hpRegen: base.hpRegen,
            mpRegen: base.mpRegen,

            money: { spiritStone: 0 },
            spiritStones: initSpiritStones, // 家境加成的灵石
            spiritThread: { cur: 0 },
            body: { realm: "凡体", exp: 0 },

            methods: [], // 凡人初期无功法
            inventory: initInventory, // 家境加成的物品
            log: [
                cfg.story.prologue,
                `你出身${f.selectedBackground.name}，${f.selectedBackground.desc}`,
                "你睁开眼，此处乃是青石镇外。"
            ],
            unlockedRealms: ["mortal"]
        },
        automation: {
            lastTick: Date.now()
        }
    };

    showOverlay();
    const res = await API.saveGame(saveData, 1);
    if (res.ok) {
        setTimeout(() => window.location.href = "/game", 1800);
    } else {
        hideOverlay();
        showError("天机阻塞，存入命理失败");
    }
};


function showError(msg) {
    const h = document.getElementById('hint');
    h.textContent = msg;
    setTimeout(() => h.textContent = "", 3000);
}

function showOverlay() {
    const ov = document.getElementById('overlay');
    ov.classList.remove('pointer-events-none');
    ov.classList.add('opacity-100');
    document.getElementById('overlay-progress').style.width = "100%";
}

function hideOverlay() {
    const ov = document.getElementById('overlay');
    ov.classList.add('pointer-events-none');
    ov.classList.remove('opacity-100');
}

init();
