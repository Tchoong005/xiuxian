/**
 * 修仙游戏 2.0 - 宣纸水墨版核心引擎 (Game.js)
 */

let save = null;
let saveTimer = null;
let mainLoop = null;
let gameMode = 'static'; // static, meditative, adventuring
let adventureTicker = 0;
let meditateTicker = 0;
let miniGameTimer = null;

const CONFIG = window.GAME_CONFIG;

async function init() {
    addLog("命理脉动...正在从诸天识海感应道府系统。", "text-gold");
    const res = await API.loadGame(1);
    if (res.ok) {
        save = res.save;
        // 结构补全 (防旧档失效)
        if (!save.player.unlockedRealms) save.player.unlockedRealms = ["mortal"];
        if (!save.automation) save.automation = { lastTick: Date.now() };

        addLog(`识入命理，道号【${save.player.name}】感应归位。`);
        renderEverything();
        startMainLoop();
    } else {
        addLog("天机由于，尚未寻得过往命数。正在指引重塑真身...");
        setTimeout(() => window.location.href = "/start", 2000);
    }
}

// -----------------------------------------------------------------------------
// UI 渲染逻辑 (Xuanpaper Style)
// -----------------------------------------------------------------------------

function renderEverything() {
    if (!save) return;
    const p = save.player;

    // 1. 顶部状态
    document.getElementById('ui-name').textContent = p.name;
    document.getElementById('ui-realm').textContent = `${p.realm.major} · ${p.realm.minor}`;
    document.getElementById('ui-avatar').textContent = p.name.charAt(0);
    document.getElementById('ui-stones').textContent = p.money.spiritStone;

    // 2. 修为进度 (凡人隐藏)
    const expBox = document.getElementById('ui-exp-box');
    if (p.realm.major !== "凡人") {
        expBox.style.display = 'block';
        const pct = p.realm.progressPct || 0;
        document.getElementById('ui-exp-pct').textContent = Math.floor(pct) + "%";
        document.getElementById('ui-exp-bar').style.width = pct + "%";
    } else {
        expBox.style.display = 'none';
        if (p.methods.length === 0) {
            document.getElementById('ui-status-desc').textContent = "你只是一介凡人，需前往【破庙】历练寻得机缘（开启功法）方可感应灵气。";
        }
    }

    // 3. 左侧属性
    document.getElementById('ui-stats-grid').innerHTML = `
        <div class="flex flex-col"><span class="text-xl font-black">${p.stats.luck}</span><span class="text-[9px] opacity-30">机缘</span></div>
        <div class="flex flex-col"><span class="text-xl font-black">${p.stats.wisdom}</span><span class="text-[9px] opacity-30">悟性</span></div>
        <div class="flex flex-col"><span class="text-xl font-black">${p.stats.insight}</span><span class="text-[9px] opacity-30">洞察</span></div>
    `;

    // 4. 已习功法
    const mBox = document.getElementById('ui-methods');
    if (!p.methods || p.methods.length === 0) {
        mBox.innerHTML = `<div class="opacity-20 italic py-10 text-center text-xs">空无一法</div>`;
    } else {
        mBox.innerHTML = p.methods.map(m => `
            <div class="ink-card p-3 flex justify-between items-center text-[11px] mb-2 bg-white/50">
                <span class="font-bold">${m.name}</span>
                <span class="text-gold font-black">${m.level}</span>
            </div>
        `).join('');
    }

    // 5. 右侧详细状态
    const rootElements = Array.isArray(p.root.elements) ? p.root.elements.join('·') : p.root.elements;
    document.getElementById('ui-status-detail').innerHTML = `
        <div class="space-y-2">
             <div class="flex justify-between text-[11px]"><span class="opacity-60">气血</span><span class="font-bold text-red-600">${Math.floor(p.hp.cur)}/${p.hp.max}</span></div>
             <div class="flex justify-between text-[11px]"><span class="opacity-60">灵气</span><span class="font-bold text-blue-600">${Math.floor(p.mp.cur)}/${p.mp.max}</span></div>
             <hr class="border-ink/5 my-2">
             <div class="flex justify-between text-[10px]"><span class="opacity-60">攻击</span><span class="font-bold">${p.atk || 10}</span></div>
             <div class="flex justify-between text-[10px]"><span class="opacity-60">防御</span><span class="font-bold">${p.def || 2}</span></div>
             <div class="flex justify-between text-[10px]"><span class="opacity-60">速度</span><span class="font-bold">${(p.spd || 1.0).toFixed(1)}</span></div>
             <hr class="border-ink/5 my-2">
             <div class="flex justify-between text-[10px]"><span class="opacity-60">气血恢复</span><span class="font-bold">${p.hpRegen || 1}</span></div>
             <div class="flex justify-between text-[10px]"><span class="opacity-60">灵气恢复</span><span class="font-bold">${p.mpRegen || 0}</span></div>
             <div class="flex justify-between text-[10px]"><span class="opacity-60">暴击</span><span class="font-bold">${p.crit || 5}</span></div>
             <div class="flex justify-between text-[10px]"><span class="opacity-60">爆伤</span><span class="font-bold">${p.critDmg || 150}%</span></div>
             <hr class="border-ink/5 my-2">
             <div class="flex justify-between text-[10px]"><span class="opacity-60">肉身</span><span class="text-ink-black/60">${p.body.realm}</span></div>
             <div class="flex justify-between text-[10px]"><span class="opacity-60">灵根</span><span class="text-gold font-bold">${p.root.type}</span></div>
             <div class="flex justify-between text-[10px]"><span class="opacity-60">属性</span><span class="opacity-60">${rootElements}</span></div>
        </div>
    `;

    // 6. 按钮状态
    const btnBreak = document.getElementById('btn-break');
    const isBreakable = p.realm.progressPct >= 100;
    btnBreak.disabled = !isBreakable;
    btnBreak.classList.toggle('opacity-30', !isBreakable);
    btnBreak.classList.toggle('btn-ink-gold', isBreakable);

    renderLogs();
}

function addLog(msg, color = "") {
    if (!save) return;
    save.log.unshift(msg);
    if (save.log.length > 50) save.log.pop();
    renderLogs();
}

function renderLogs() {
    const box = document.getElementById('ui-log');
    if (!box || !save) return;
    box.innerHTML = save.log.map(msg => `
        <div class="flex gap-2 py-0.5 animate-fade-in text-[11px]">
            <span class="opacity-10 text-ink-black">|</span>
            <span class="opacity-60 leading-relaxed">${msg}</span>
        </div>
    `).join('');
}

// -----------------------------------------------------------------------------
// 游戏核心循环 (Pulse System)
// -----------------------------------------------------------------------------

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
        if (adventureTicker >= CONFIG.automation.adventure.durationSeconds) {
            adventureTicker = 0;
            executeAdventurePulse();
        }
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

// -----------------------------------------------------------------------------
// 历练系统 (Adventure)
// -----------------------------------------------------------------------------

function executeAdventurePulse() {
    const p = save.player;
    const currentLoc = CONFIG.adventures.locations.find(l => l.realmId === (p.realm.major === "凡人" ? "mortal" : "kaiyuan_body"));

    // 渲染位移
    const bg = document.getElementById('adventure-bg');
    if (bg) bg.style.transform = `translateX(-${Math.random() * 50}px) scale(1.05)`;

    const evt = rollWeighted(currentLoc.events);
    addLog(`【${currentLoc.name}】历练中：${evt.name}`);

    const group = rollWeighted(currentLoc.loot.groups);
    const itemPool = CONFIG.adventures.lootItems[group.group] || [];
    if (itemPool.length > 0) {
        const item = rollWeighted(itemPool);
        const count = item.max ? (Math.floor(Math.random() * (item.max - item.min + 1)) + item.min) : 1;
        if (p.realm.major === "凡人" && p.methods.length === 0 && Math.random() < 0.4) {
            learnManualDirect("m0");
        } else {
            addToInventory(item, count);
        }
    }
    showEventToast(evt.name, "冥冥中自有天意。");
    renderEverything();
    autoSave();
}

function learnManualDirect(id) {
    const m = CONFIG.manuals.starterPool.find(x => x.id === id);
    if (!m) return;

    const p = save.player;
    // 检查是否已经拥有此功法
    const existing = p.methods.find(method => method.id === m.id);
    if (existing) {
        addLog(`你已经拥有功法《${m.name}》`, "text-gold");
        return;
    }

    // 凡人阶段获得功法后自动入门，并可以突破到开元境
    p.methods.push({ id: m.id, name: m.name, quality: m.quality, level: "入门", exp: 0 });
    addLog(`【奇遇】你获得并参悟了功法《${m.name}》！`, "text-gold font-black");

    // 如果是凡人，获得第一个功法入门后，解锁突破
    if (p.realm.major === "凡人" && p.methods.length === 1) {
        addLog(`【机缘】感应到天地灵气，可以尝试突破至开元铸身境！`, "text-gold font-black");
        p.realm.progressPct = 100; // 允许突破
    }
}

function addToInventory(item, count) {
    const inv = save.player.inventory;
    const existing = inv.find(i => i.id === item.id);
    if (existing) {
        existing.count += count;
    } else {
        inv.push({
            id: item.id,
            name: item.name,
            count: count,
            category: item.category || "杂物"
        });
    }
    addLog(`获得物品：${item.name} x${count}`, "text-gold");
}

// -----------------------------------------------------------------------------
// 动作指令 (Actions)
// -----------------------------------------------------------------------------

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
            gameMode = 'adventuring';
            document.getElementById('btn-adventure').textContent = "归府休息";
            document.getElementById('ui-static-view').classList.add('hidden');
            document.getElementById('ui-adventure-scroll').classList.remove('hidden');
            addLog("收拾行囊，你踏出了洞府。");
        }
    } else if (type === 'body') {
        startBodyGame();
    }
};

// -----------------------------------------------------------------------------
// 小游戏模块 (Mini-games)
// -----------------------------------------------------------------------------

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
    window.suFilled = 0; window.suTotal = holes.length;
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
            setTimeout(() => { document.getElementById('modal-game').close(); renderEverything(); }, 800);
        }
    }
};

function startBodyGame() {
    const modal = document.getElementById('modal-game');
    const content = document.getElementById('game-content');
    document.getElementById('game-title').textContent = "肉身淬炼";
    let pos = 0; const size = 5;
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
        draw(); renderEverything();
    };
    draw(); modal.showModal();
}

// -----------------------------------------------------------------------------
// 突破与其后境界
// -----------------------------------------------------------------------------

window.showBreakModal = () => {
    const p = save.player;
    const modal = document.getElementById('modal-break-custom') || createBreakModal();
    modal.showModal();
};

function createBreakModal() {
    // 动态创建一个专用的突破弹窗，因为需要处理 Risk/Full 按钮
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

// -----------------------------------------------------------------------------
// 合成系统
// -----------------------------------------------------------------------------

window.compose = (type) => {
    const p = save.player;
    const cfg = CONFIG.inventory.crafting[type];
    const item = p.inventory.find(i => i.id === cfg.fragmentItemId);

    if (!item || item.count < cfg.need) {
        addLog(`碎片不足，需要${cfg.need}个${item ? item.name : '碎片'}`, "text-danger");
        return;
    }

    item.count -= cfg.need;

    if (type === 'danfang') {
        // 随机获得一个丹方
        const recipes = CONFIG.pills.recipes;
        const recipe = recipes[Math.floor(Math.random() * recipes.length)];
        p.knownRecipes = p.knownRecipes || [];
        if (!p.knownRecipes.find(r => r.id === recipe.id)) {
            p.knownRecipes.push(recipe);
            addLog(`【丹方合成】习得丹方：${recipe.name}（${recipe.quality}）`, "text-gold font-bold");
        } else {
            addLog(`【丹方合成】此丹方已掌握，获得补偿灵石+50`, "text-gold");
            p.money.spiritStone += 50;
        }
    } else if (type === 'blueprint') {
        // 随机获得一个装备图纸
        const blueprints = CONFIG.equipment.blueprints;
        const blueprint = blueprints[Math.floor(Math.random() * blueprints.length)];
        p.knownBlueprints = p.knownBlueprints || [];
        if (!p.knownBlueprints.find(b => b.id === blueprint.id)) {
            p.knownBlueprints.push(blueprint);
            addLog(`【图纸合成】习得图纸：${blueprint.name}（${blueprint.quality}）`, "text-gold font-bold");
        } else {
            addLog(`【图纸合成】此图纸已掌握，获得补偿灵石+30`, "text-gold");
            p.money.spiritStone += 30;
        }
    }

    // 如果碎片用完，从背包移除
    if (item.count === 0) {
        const idx = p.inventory.indexOf(item);
        p.inventory.splice(idx, 1);
    }

    renderEverything();
    openDrawer('inv');
    autoSave();
};

// -----------------------------------------------------------------------------
// 炼丹与炼器系统
// -----------------------------------------------------------------------------

window.openAlchemy = () => {
    const p = save.player;
    p.knownRecipes = p.knownRecipes || [];

    const title = document.getElementById('drawer-title');
    const body = document.getElementById('drawer-body');

    title.textContent = "炼丹房";

    if (p.knownRecipes.length === 0) {
        body.innerHTML = `<div class="py-20 text-center opacity-20 italic">尚未习得任何丹方</div>`;
    } else {
        body.innerHTML = p.knownRecipes.map(recipe => {
            const canCraft = checkMaterials(p, recipe.materials);
            return `
                <div class="ink-card p-4 mb-3 bg-white/30">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-bold text-sm">${recipe.name}</div>
                            <div class="text-[9px] opacity-40">${recipe.quality} · ${recipe.desc}</div>
                        </div>
                        <button onclick="craftPill('${recipe.id}')"
                                class="btn-ink ${canCraft ? 'btn-ink-primary' : 'btn-ink-ghost opacity-30'} px-3 py-1 h-auto text-[10px]"
                                ${!canCraft ? 'disabled' : ''}>
                            炼制
                        </button>
                    </div>
                    <div class="text-[10px] opacity-60 mt-2">
                        ${Object.entries(recipe.materials).map(([id, count]) => {
                            const has = getItemCount(p, id);
                            return `<div>${getItemName(id)}: ${has}/${count}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    openDrawerDirect();
};

window.openForge = () => {
    const p = save.player;
    p.knownBlueprints = p.knownBlueprints || [];

    const title = document.getElementById('drawer-title');
    const body = document.getElementById('drawer-body');

    title.textContent = "炼器房";

    if (p.knownBlueprints.length === 0) {
        body.innerHTML = `<div class="py-20 text-center opacity-20 italic">尚未习得任何图纸</div>`;
    } else {
        body.innerHTML = p.knownBlueprints.map(bp => {
            const canCraft = checkMaterials(p, bp.materials);
            return `
                <div class="ink-card p-4 mb-3 bg-white/30">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-bold text-sm">${bp.name}</div>
                            <div class="text-[9px] opacity-40">${bp.quality} · ${bp.slot} · ${bp.desc}</div>
                        </div>
                        <button onclick="craftEquipment('${bp.id}')"
                                class="btn-ink ${canCraft ? 'btn-ink-primary' : 'btn-ink-ghost opacity-30'} px-3 py-1 h-auto text-[10px]"
                                ${!canCraft ? 'disabled' : ''}>
                            炼制
                        </button>
                    </div>
                    <div class="text-[10px] opacity-60 mt-2">
                        ${Object.entries(bp.materials).map(([id, count]) => {
                            const has = getItemCount(p, id);
                            return `<div>${getItemName(id)}: ${has}/${count}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    openDrawerDirect();
};

window.craftPill = (recipeId) => {
    const p = save.player;
    const recipe = p.knownRecipes.find(r => r.id === recipeId);
    if (!recipe) return;

    if (!consumeMaterials(p, recipe.materials)) {
        addLog("材料不足，无法炼丹", "text-danger");
        return;
    }

    // 添加丹药到背包
    addToInventory({ id: recipe.id, name: recipe.name, category: "丹药" }, 1);
    addLog(`【炼丹成功】炼制了${recipe.name}`, "text-gold");
    openAlchemy();
    autoSave();
};

window.craftEquipment = (blueprintId) => {
    const p = save.player;
    const bp = p.knownBlueprints.find(b => b.id === blueprintId);
    if (!bp) return;

    if (!consumeMaterials(p, bp.materials)) {
        addLog("材料不足，无法炼器", "text-danger");
        return;
    }

    // 添加装备到背包
    addToInventory({ id: bp.id, name: bp.name, category: "装备" }, 1);
    addLog(`【炼器成功】炼制了${bp.name}`, "text-gold");
    openForge();
    autoSave();
};

function checkMaterials(player, materials) {
    for (const [id, count] of Object.entries(materials)) {
        if (getItemCount(player, id) < count) return false;
    }
    return true;
}

function consumeMaterials(player, materials) {
    if (!checkMaterials(player, materials)) return false;

    for (const [id, count] of Object.entries(materials)) {
        if (id === 'spirit_stone') {
            player.money.spiritStone -= count;
        } else {
            const item = player.inventory.find(i => i.id === id);
            if (item) {
                item.count -= count;
                if (item.count === 0) {
                    const idx = player.inventory.indexOf(item);
                    player.inventory.splice(idx, 1);
                }
            }
        }
    }
    return true;
}

function getItemCount(player, id) {
    if (id === 'spirit_stone') return player.money.spiritStone;
    const item = player.inventory.find(i => i.id === id);
    return item ? item.count : 0;
}

function getItemName(id) {
    if (id === 'spirit_stone') return '灵石';
    // 从config中查找物品名称
    for (const group of Object.values(CONFIG.adventures.lootItems)) {
        const item = group.find(i => i.id === id);
        if (item) return item.name;
    }
    return id;
}

function openDrawerDirect() {
    const drawer = document.getElementById('ui-drawer');
    const panel = document.getElementById('drawer-panel');
    drawer.classList.remove('pointer-events-none', 'opacity-0');
    drawer.classList.add('opacity-100');
    panel.style.transform = 'translateX(0)';
}

// -----------------------------------------------------------------------------
// UI 辅助
// -----------------------------------------------------------------------------

// 全局变量用于背包分类
let currentInvCategory = "全部";

window.openDrawer = (type) => {
    const title = document.getElementById('drawer-title');
    const body = document.getElementById('drawer-body');
    const p = save.player;

    if (type === 'char') {
        title.textContent = "查看命数";
        const rootElements = Array.isArray(p.root.elements) ? p.root.elements.join('、') : p.root.elements;
        body.innerHTML = `
            <div class="ink-card p-6 space-y-4 bg-white/40">
                <div class="flex justify-between border-b border-ink/5 pb-2">
                    <span>道号</span>
                    <span class="font-bold">${p.name}</span>
                </div>
                <div class="flex justify-between border-b border-ink/5 pb-2">
                    <span>天赋灵根</span>
                    <span class="text-gold font-bold">${p.root.type}</span>
                </div>
                <div class="flex justify-between border-b border-ink/5 pb-2">
                    <span>属性</span>
                    <span class="opacity-60">${rootElements}</span>
                </div>
                <div class="flex justify-between">
                    <span>命理加成</span>
                    <span class="text-gold font-black">x${p.root.bonus}</span>
                </div>
            </div>
        `;
    } else if (type === 'inv') {
        title.textContent = "识海藏物";
        renderInventory(p);
    } else if (type === 'story') {
        title.textContent = "修仙传记";
        const chapters = CONFIG.story.chapters;
        body.innerHTML = `
            <div class="space-y-4">
                <div class="ink-card p-5 bg-white/40">
                    <div class="text-xs opacity-60 leading-relaxed">
                        ${CONFIG.story.prologue}
                    </div>
                </div>
                ${chapters.map((ch, idx) => `
                    <div class="ink-card p-5 bg-white/30">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                                <span class="text-xs font-black text-gold">${idx + 1}</span>
                            </div>
                            <h3 class="font-black text-sm">${ch.title}</h3>
                        </div>
                        <div class="text-[10px] opacity-60 mb-2">${ch.story}</div>
                        <div class="text-[9px] opacity-40 border-t border-ink/5 pt-2 mt-2">
                            目标：${ch.goal}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (type === 'menu') {
        title.textContent = "洞府菜单";
        body.innerHTML = `
            <div class="space-y-3">
                <button onclick="openDrawer('char')" class="btn-ink btn-ink-ghost w-full">查看命数</button>
                <button onclick="openDrawer('story')" class="btn-ink btn-ink-ghost w-full">修仙传记</button>
                <button onclick="openDrawer('inv')" class="btn-ink btn-ink-ghost w-full">识海背包</button>
                <button onclick="openAlchemy()" class="btn-ink btn-ink-ghost w-full">炼丹房</button>
                <button onclick="openForge()" class="btn-ink btn-ink-ghost w-full">炼器房</button>
                <button onclick="openDrawer('body')" class="btn-ink btn-ink-ghost w-full">肉身淬炼</button>
                <hr class="border-ink/5 my-4">
                <button onclick="API.logout().then(()=>location.href='/')" class="btn-ink btn-ink-outline w-full text-xs">退出登录</button>
            </div>
        `;
    }

    const drawer = document.getElementById('ui-drawer');
    const panel = document.getElementById('drawer-panel');
    drawer.classList.remove('pointer-events-none', 'opacity-0');
    drawer.classList.add('opacity-100');
    panel.style.transform = 'translateX(0)';
};

function renderInventory(p) {
    const body = document.getElementById('drawer-body');
    const categories = CONFIG.inventory.categories;

    // 分类标签
    const tabs = categories.map(cat => `
        <button onclick="switchInvCategory('${cat}')"
                class="px-4 py-2 text-xs font-bold transition-all ${currentInvCategory === cat ? 'text-gold border-b-2 border-gold' : 'opacity-40 hover:opacity-100'}">
            ${cat}
        </button>
    `).join('');

    // 过滤物品
    let filteredItems = p.inventory;
    if (currentInvCategory !== "全部") {
        filteredItems = p.inventory.filter(i => i.category === currentInvCategory);
    }

    // 物品列表
    const itemsList = filteredItems.length ? filteredItems.map(i => `
        <div class="ink-card p-4 flex justify-between items-center bg-white/30 mb-2">
            <div>
                <div class="font-bold">${i.name}</div>
                <div class="text-[9px] opacity-40">${i.category}</div>
            </div>
            <span class="text-gold font-black">x${i.count}</span>
        </div>
    `).join('') : `<div class="py-20 text-center opacity-20 italic">此类空空如也</div>`;

    body.innerHTML = `
        <div class="flex gap-2 mb-4 overflow-x-auto pb-2 border-b border-ink/10">
            ${tabs}
        </div>
        <div class="grid grid-cols-2 gap-2 mb-6">
            <button onclick="compose('danfang')" class="btn-ink btn-ink-outline h-10 text-[10px]">
                合成丹方<br/>(需40碎片)
            </button>
            <button onclick="compose('blueprint')" class="btn-ink btn-ink-outline h-10 text-[10px]">
                合成图纸<br/>(需6碎片)
            </button>
        </div>
        ${itemsList}
    `;
}

window.switchInvCategory = (cat) => {
    currentInvCategory = cat;
    renderInventory(save.player);
};

window.closeDrawer = () => {
    const drawer = document.getElementById('ui-drawer');
    const panel = document.getElementById('drawer-panel');
    panel.style.transform = 'translateX(100%)';
    setTimeout(() => {
        drawer.classList.remove('opacity-100');
        drawer.classList.add('opacity-0', 'pointer-events-none');
    }, 300);
};

function showEventToast(title, desc) {
    const el = document.getElementById('ui-event-toast');
    document.getElementById('event-title').textContent = title;
    document.getElementById('event-desc').textContent = desc;
    el.style.opacity = '1'; el.style.transform = 'translate(-50%, -70%)';
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translate(-50%, -50%)'; }, 2000);
}

function rollWeighted(arr) {
    const total = arr.reduce((sum, item) => sum + (item.weight || 1), 0);
    let r = Math.random() * total;
    for (const item of arr) { if (r < (item.weight || 1)) return item; r -= (item.weight || 1); }
    return arr[0];
}

async function autoSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        if (!save) return;
        save.meta.updatedAt = Date.now();
        await API.saveGame(save, 1);
    }, 3000);
}

window.closeModalGame = () => { if (miniGameTimer) clearInterval(miniGameTimer); document.getElementById('modal-game').close(); };

init();
