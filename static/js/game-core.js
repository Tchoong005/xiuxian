/**
 * 修仙游戏 2.0 - 核心引擎 (Game Core)
 * 只包含核心游戏逻辑：初始化、循环、日志、突破、小游戏
 */

let save = null;
let saveTimer = null;
let mainLoop = null;
let gameMode = 'static'; // static, meditative, adventuring
let adventureTicker = 0;
let meditateTicker = 0;
let miniGameTimer = null;

const CONFIG = window.GAME_CONFIG;

// 初始化游戏
async function init() {
    // 先检查登录状态
    const me = await API.me();
    if (!me.ok) {
        // 未登录，跳转到开始页面
        window.location.href = "/start";
        return;
    }

    addLog("命理脉动...正在从诸天识海感应道府系统。", "text-gold");
    const res = await API.loadGame(1);
    if (res.ok) {
        save = res.save;
        const p = save.player;

        // 结构补全 (防旧档失效)
        if (!p.unlockedRealms) p.unlockedRealms = ["mortal"];
        if (!save.automation) save.automation = { lastTick: Date.now() };
        if (!save.log) save.log = [];
        if (!p.inventory) p.inventory = [];
        if (!p.methods) p.methods = [];
        if (!p.stats) p.stats = { luck: 0, wisdom: 0, insight: 0 };
        if (!p.spiritStones) p.spiritStones = { low: 0, medium: 0, high: 0, supreme: 0 };
        if (!p.knownRecipes) p.knownRecipes = [];
        if (!p.knownBlueprints) p.knownBlueprints = [];

        // 确保所有属性都存在（凡人基础属性）
        if (typeof p.atk === 'undefined') p.atk = 10;
        if (typeof p.def === 'undefined') p.def = 2;
        if (typeof p.spd === 'undefined') p.spd = 1.0;
        if (typeof p.crit === 'undefined') p.crit = 5;
        if (typeof p.critDmg === 'undefined') p.critDmg = 150;
        if (typeof p.hpRegen === 'undefined') p.hpRegen = 1;
        if (typeof p.mpRegen === 'undefined') p.mpRegen = 0;

        // 调试：确保name存在
        console.log('Player data loaded:', { name: p.name, realm: p.realm, stats: p.stats, me: me });
        addLog(`识入命理，道号【${p.name || me.username || '未知'}】感应归位。`);
        renderEverything();
        startMainLoop();
    } else {
        addLog("天机由于，尚未寻得过往命数。正在指引重塑真身...");
        setTimeout(() => window.location.href = "/start", 2000);
    }
}

// 添加日志
function addLog(msg, color = "") {
    if (!save) return;
    save.log.unshift(msg);
    if (save.log.length > 50) save.log.pop();
    renderLogs();
}

// 游戏主循环
function startMainLoop() {
    if (mainLoop) clearInterval(mainLoop);
    mainLoop = setInterval(() => {
        const now = Date.now();
        const delta = now - (save.automation.lastTick || now);
        if (delta >= 1000) {
            handleAutomation();
            save.automation.lastTick = now;
        }
    }, 1000);
}

function handleAutomation() {
    if (gameMode === 'meditative') {
        meditateTicker++;
        if (meditateTicker >= CONFIG.automation.meditate.tickSeconds) {
            meditateTicker = 0;
            executeMeditatePulse();
        }
    } else if (gameMode === 'adventuring') {
        adventureTicker++;

        // 更新历练进度条
        const progress = (adventureTicker / CONFIG.automation.adventure.durationSeconds) * 100;
        updateAdventureProgress(progress, CONFIG.automation.adventure.durationSeconds - adventureTicker);

        if (adventureTicker >= CONFIG.automation.adventure.durationSeconds) {
            adventureTicker = 0;
            executeAdventurePulse();
        }
    }
}

// 更新历练进度显示
function updateAdventureProgress(percent, remaining) {
    const statusTitle = document.getElementById('ui-status-title');
    if (statusTitle && gameMode === 'adventuring') {
        statusTitle.textContent = `历练中 (${remaining}秒)`;
    }
}

function executeMeditatePulse() {
    const p = save.player;
    if (p.methods.length === 0 && p.realm.major === "凡人") {
        addLog("你盘膝而坐，却感应不到灵气。");
        return;
    }
    const gain = CONFIG.automation.meditate.gain.baseCultivation * p.root.bonus;
    p.realm.progressPct = Math.min(100, p.realm.progressPct + gain);
    p.mp.cur = Math.min(p.mp.max, p.mp.cur + (p.stats.wisdom * 0.5));
    renderEverything();
    const title = document.getElementById('ui-status-title');
    if (title) {
        title.classList.add('scale-110');
        setTimeout(() => title.classList.remove('scale-110'), 500);
    }
}

// 动作指令
window.doAction = (type) => {
    if (!save) return;
    const p = save.player;

    if (type === 'meditate') {
        if (gameMode === 'meditative') {
            gameMode = 'static';
            document.getElementById('btn-meditate').textContent = "打坐修炼";
            document.getElementById('ui-status-title').textContent = "静心凝神";
        } else {
            if (Math.random() < 0.15) return startSudoku();
            gameMode = 'meditative';
            document.getElementById('btn-meditate').textContent = "停止打坐";
            document.getElementById('ui-status-title').textContent = "灵气周转";
            document.getElementById('ui-static-view').classList.remove('hidden');
            document.getElementById('ui-adventure-scroll').classList.add('hidden');
        }
    } else if (type === 'adventure') {
        if (gameMode === 'adventuring') {
            gameMode = 'static';
            document.getElementById('btn-adventure').textContent = "历练寻机";
            document.getElementById('ui-static-view').classList.remove('hidden');
            document.getElementById('ui-adventure-scroll').classList.add('hidden');
        } else {
            // 显示地点选择模态框
            showAdventureLocationModal();
        }
    } else if (type === 'body') {
        // 体修需要至少达到开元境
        if (p.realm.major === '凡人') {
            addLog('凡人肉身孱弱，需突破至开元境方可进行肉身淬炼', 'text-danger');
            return;
        }
        startBodyGame();
    }
};

// 小游戏模块
function startSudoku() {
    const modal = document.getElementById('modal-game');
    const content = document.getElementById('game-content');
    document.getElementById('game-title').textContent = "神识推演";
    const puzzle = [3, 1, 4, 2, 4, 2, 3, 1, 1, 3, 2, 4, 2, 4, 1, 3];
    let show = [...puzzle];
    const holes = [0, 3, 5, 10, 15];
    holes.forEach(h => show[h] = "");
    content.innerHTML = `
        <div class="grid grid-cols-4 gap-4 p-8 bg-white/20 rounded-3xl border border-ink/5">
            ${show.map((v, i) => `<input type="number" min="1" max="4" value="${v}" class="w-14 h-14 md:w-16 md:h-16 text-center bg-white/40 border-none rounded-xl font-black text-xl outline-none focus:ring-2 focus:ring-gold ${v !== "" ? 'opacity-20' : ''}" ${v !== "" ? 'readonly' : `oninput="checkSudoku(this, ${i}, ${puzzle[i]})"`}>`).join('')}
        </div>
    `;
    window.suFilled = 0;
    window.suTotal = holes.length;
    modal.showModal();
}

window.checkSudoku = (el, i, cor) => {
    if (parseInt(el.value) === cor) {
        el.style.color = "var(--gold)";
        el.readOnly = true;
        window.suFilled++;
        if (window.suFilled === window.suTotal) {
            addLog("【阵破】推演成功，修为大幅提升！", "text-gold font-bold");
            save.player.realm.progressPct = Math.min(100, save.player.realm.progressPct + 15);
            setTimeout(() => {
                document.getElementById('modal-game').close();
                renderEverything();
            }, 800);
        }
    }
};

function startBodyGame() {
    const modal = document.getElementById('modal-game');
    const content = document.getElementById('game-content');
    document.getElementById('game-title').textContent = "肉身淬炼";
    let pos = 0;
    const size = 5;
    const draw = () => {
        content.innerHTML = `
            <div class="flex flex-col items-center gap-8">
                <div class="grid grid-cols-5 gap-2">
                    ${Array(25).fill(0).map((_, i) => `<div class="w-12 h-12 flex items-center justify-center border border-ink/5 rounded-lg ${i === pos ? 'bg-gold/20 animate-pulse' : 'bg-white/30'}">${i === pos ? '👤' : (i === 24 ? '终' : '')}</div>`).join('')}
                </div>
                <button class="btn-ink btn-ink-primary w-48 h-14" onclick="doBodyStep()">踏出一步</button>
            </div>
        `;
    };
    window.doBodyStep = () => {
        if (pos >= 24) return;
        pos++;
        if (pos === 24) {
            save.player.body.exp += 150;
            addLog("抵达终点，肉身强度提升。+150经验");
            setTimeout(() => modal.close(), 800);
        }
        draw();
        renderEverything();
    };
    draw();
    modal.showModal();
}

// 突破系统
window.showBreakModal = () => {
    const p = save.player;
    const modal = document.getElementById('modal-break-custom') || createBreakModal();
    modal.showModal();
};

function createBreakModal() {
    const div = document.createElement('dialog');
    div.id = 'modal-break-custom';
    div.className = 'modal';
    div.innerHTML = `
        <div class="modal-box bg-white border border-ink/10 p-10 text-center space-y-8 rounded-none">
            <h3 class="text-3xl font-black tracking-[0.5em] text-ink-black">冲击天关</h3>
            <p class="text-xs opacity-40 leading-relaxed">感悟已达瓶颈。你可以选择【冒险突围】（75%成功，属性加成略低）或【闭关圆满】（100%成功）。</p>
            <div class="flex flex-col gap-4">
                <button onclick="confirmBreak(true)" class="btn-ink btn-ink-outline w-full h-14">冒险突围 (75%成功)</button>
                <button onclick="confirmBreak(false)" class="btn-ink btn-ink-primary w-full h-14">闭关圆满 (100%成功)</button>
            </div>
            <form method="dialog"><button class="text-[10px] opacity-20 hover:opacity-100 italic">暂避劫云</button></form>
        </div>
    `;
    document.body.appendChild(div);
    return div;
}

window.confirmBreak = (isRisk) => {
    const p = save.player;
    const success = isRisk ? (Math.random() < 0.7) : true;
    const coef = isRisk ? 0.75 : 1.0;

    if (success) {
        addLog("【破境】天降瑞气，你百尺竿头更进一步！", "text-gold font-black");
        const curIdx = CONFIG.realms.findIndex(r => r.name === p.realm.major);

        if (curIdx < CONFIG.realms.length - 1) {
            const next = CONFIG.realms[curIdx + 1];
            const gain = next.majorBreakthrough;

            // 应用大境界突破属性加成
            p.realm.major = next.name;
            p.realm.minor = next.subRealms ? next.subRealms[0].name : "初期";
            p.realm.progressPct = 0;

            p.hp.max += Math.floor(gain.hp * coef);
            p.hp.cur = p.hp.max;
            p.mp.max += Math.floor(gain.mp * coef);
            p.mp.cur = p.mp.max;
            p.atk += Math.floor(gain.atk * coef);
            p.def += Math.floor(gain.def * coef);
            p.spd += gain.spd * coef;
            p.hpRegen = (p.hpRegen || 1) + Math.floor(gain.hpRegen * coef);
            p.mpRegen = (p.mpRegen || 0) + Math.floor(gain.mpRegen * coef);
            p.crit += Math.floor(gain.crit * coef);
            p.critDmg += Math.floor(gain.critDmg * coef);

            addLog(`突破至【${next.name}】，实力大幅提升！`, "text-gold");
        }
    } else {
        addLog("【劫数】突破失败，神识一阵恍惚。", "text-danger");
        p.realm.progressPct = Math.max(0, p.realm.progressPct - 20);
    }

    document.getElementById('modal-break-custom').close();
    renderEverything();
    autoSave();
};

// 自动保存
async function autoSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        if (!save) return;
        save.meta.updatedAt = Date.now();
        await API.saveGame(save, 1);
    }, 3000);
}

window.closeModalGame = () => {
    if (miniGameTimer) clearInterval(miniGameTimer);
    document.getElementById('modal-game').close();
};

// 退出登录处理（游客提示转正）
window.handleLogout = async () => {
    const me = await API.me();

    if (me.ok && me.owner_type === 'guest') {
        // 游客模式，显示转正提示
        if (confirm('您当前是游客模式，退出后数据将丢失！\n\n是否要将当前进度注册为正式账号？')) {
            // 转正为正式账号
            const username = prompt('请输入您的道号（用户名）：');
            if (!username) return;

            const password = prompt('请设置您的道印（密码）：');
            if (!password) return;

            const res = await API.register(username, password);
            if (res.ok) {
                // 注册成功，更新存档的name字段
                save.player.name = username;
                await autoSave();
                alert('转正成功！您的进度已保存到正式账号。');
                renderEverything();
            } else {
                alert('转正失败：' + res.error);
            }
        } else {
            // 确认退出
            if (confirm('确定要退出吗？游客数据将丢失！')) {
                await API.logout();
                location.href = '/';
            }
        }
    } else {
        // 正式账号，直接退出
        if (confirm('确定要退出登录吗？')) {
            await API.logout();
            location.href = '/';
        }
    }
};

// 历练地点选择
window.showAdventureLocationModal = () => {
    const p = save.player;
    const modal = document.getElementById('modal-adventure-location') || createAdventureLocationModal();

    // 获取当前境界可用的地点
    const availableLocations = CONFIG.adventures.locations.filter(loc => {
        if (p.realm.major === '凡人') return loc.realmId === 'mortal';
        if (p.realm.major === '开元铸身境') return loc.realmId === 'mortal' || loc.realmId === 'kaiyuan_body';
        if (p.realm.major === '灵海化液境') return loc.realmId === 'mortal' || loc.realmId === 'kaiyuan_body' || loc.realmId === 'linghai_huaye';
        return true;
    });

    const content = document.getElementById('adventure-location-content');
    content.innerHTML = availableLocations.map(loc => `
        <div class="ink-card p-4 mb-3 cursor-pointer hover:bg-gold/5 transition-all" onclick="selectAdventureLocation('${loc.id}')">
            <div class="font-bold text-sm mb-1">${loc.name}</div>
            <div class="text-[10px] opacity-60">${loc.desc}</div>
        </div>
    `).join('');

    modal.showModal();
};

function createAdventureLocationModal() {
    const div = document.createElement('dialog');
    div.id = 'modal-adventure-location';
    div.className = 'modal';
    div.innerHTML = `
        <div class="modal-box bg-paper-bg border border-ink/10 p-8 rounded-none max-w-md">
            <h3 class="text-2xl font-black tracking-[0.4em] text-ink-black text-center mb-6">选择历练地点</h3>
            <div id="adventure-location-content" class="space-y-3 max-h-96 overflow-y-auto">
                <!-- Locations -->
            </div>
            <form method="dialog" class="mt-6">
                <button class="btn-ink btn-ink-ghost w-full">取消</button>
            </form>
        </div>
    `;
    document.body.appendChild(div);
    return div;
}

window.selectAdventureLocation = (locationId) => {
    save.player.currentAdventureLocation = locationId;
    document.getElementById('modal-adventure-location').close();

    // 显示确认模态框
    showAdventureConfirmModal();
};

window.showAdventureConfirmModal = () => {
    const modal = document.getElementById('modal-adventure-confirm') || createAdventureConfirmModal();
    const loc = CONFIG.adventures.locations.find(l => l.id === save.player.currentAdventureLocation);

    document.getElementById('confirm-location-name').textContent = loc.name;
    document.getElementById('confirm-location-desc').textContent = loc.desc;

    modal.showModal();
};

function createAdventureConfirmModal() {
    const div = document.createElement('dialog');
    div.id = 'modal-adventure-confirm';
    div.className = 'modal';
    div.innerHTML = `
        <div class="modal-box bg-paper-bg border border-ink/10 p-8 rounded-none max-w-md">
            <h3 class="text-2xl font-black tracking-[0.4em] text-ink-black text-center mb-6">确认历练</h3>
            <div class="ink-card p-4 mb-6 bg-white/30">
                <div class="font-bold text-sm mb-1" id="confirm-location-name">地点名称</div>
                <div class="text-[10px] opacity-60" id="confirm-location-desc">描述</div>
            </div>

            <div class="space-y-3">
                <button onclick="startAdventureNormal()" class="btn-ink btn-ink-primary w-full">
                    开始历练
                </button>
                <button onclick="startAdventureAuto()" class="btn-ink btn-ink-outline w-full">
                    自动历练 (消耗灵石)
                </button>
                <form method="dialog">
                    <button class="btn-ink btn-ink-ghost w-full">取消</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(div);
    return div;
}

window.startAdventureNormal = () => {
    document.getElementById('modal-adventure-confirm').close();
    gameMode = 'adventuring';
    document.getElementById('btn-adventure').textContent = "归府休息";
    document.getElementById('ui-static-view').classList.add('hidden');
    document.getElementById('ui-adventure-scroll').classList.remove('hidden');
    addLog("收拾行囊，你踏出了洞府。");
};

window.startAdventureAuto = () => {
    const p = save.player;
    const costPerRound = 10; // 每次自动历练消耗10灵石
    const maxRounds = Math.min(10, Math.floor(p.money.spiritStone / costPerRound));

    if (maxRounds === 0) {
        addLog("灵石不足，无法进行自动历练", "text-danger");
        return;
    }

    document.getElementById('modal-adventure-confirm').close();

    // 执行多次历练
    for (let i = 0; i < maxRounds; i++) {
        p.money.spiritStone -= costPerRound;
        executeAdventurePulse();
    }

    addLog(`【自动历练】消耗${maxRounds * costPerRound}灵石，完成${maxRounds}次历练`, "text-gold font-bold");
    renderEverything();
    autoSave();
};

// 初始化
init();
