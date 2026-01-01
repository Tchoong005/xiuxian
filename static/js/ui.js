/**
 * UI模块 - 负责所有界面渲染和交互
 */

// 全局变量
let currentInvCategory = "全部";

// 渲染所有UI元素
function renderEverything() {
    if (!save) return;
    const p = save.player;

    // 1. 顶部状态 - 确保显示正确的道号
    const displayName = p.name && p.name !== '' ? p.name : '未知';
    document.getElementById('ui-name').textContent = displayName;
    document.getElementById('ui-realm').textContent = `${p.realm.major} · ${p.realm.minor}`;
    document.getElementById('ui-avatar').textContent = displayName.charAt(0);

    // 计算灵石总数（所有品质换算成下品）
    let totalStones = p.money.spiritStone || 0;
    if (p.spiritStones) {
        totalStones += (p.spiritStones.low || 0);
        totalStones += (p.spiritStones.medium || 0) * 10;
        totalStones += (p.spiritStones.high || 0) * 100;
        totalStones += (p.spiritStones.supreme || 0) * 1000;
    }
    document.getElementById('ui-stones').textContent = totalStones;

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

    // 5. 右侧简化状态面板
    document.getElementById('ui-status-detail').innerHTML = `
        <div class="space-y-3">
             <div class="flex justify-between text-sm"><span class="opacity-60">气血</span><span class="font-bold text-red-600">${Math.floor(p.hp.cur)}/${p.hp.max}</span></div>
             <div class="flex justify-between text-sm"><span class="opacity-60">灵气</span><span class="font-bold text-blue-600">${Math.floor(p.mp.cur)}/${p.mp.max}</span></div>
             <hr class="border-ink/5 my-2">
             <div class="flex justify-between text-sm"><span class="opacity-60">攻击</span><span class="font-bold">${p.atk || 10}</span></div>
             <div class="flex justify-between text-sm"><span class="opacity-60">防御</span><span class="font-bold">${p.def || 2}</span></div>
             <div class="flex justify-between text-sm"><span class="opacity-60">速度</span><span class="font-bold">${(p.spd || 1.0).toFixed(1)}</span></div>
             <hr class="border-ink/5 my-2">
             <button onclick="openDrawer('char')" class="btn-ink btn-ink-ghost w-full text-[10px]">查看详细属性</button>
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

// 渲染日志
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

// 抽屉相关函数
window.openDrawer = (type) => {
    const title = document.getElementById('drawer-title');
    const body = document.getElementById('drawer-body');
    const p = save.player;

    if (type === 'char') {
        renderCharacterDrawer(title, body, p);
    } else if (type === 'inv') {
        title.textContent = "识海藏物";
        renderInventory(p);
    } else if (type === 'story') {
        renderStoryDrawer(title, body);
    } else if (type === 'menu') {
        renderMenuDrawer(title, body);
    } else if (type === 'mansion') {
        renderMansionDrawer(title, body, p);
    } else if (type === 'stones') {
        renderSpiritStonesDrawer(title, body, p);
    }

    const drawer = document.getElementById('ui-drawer');
    const panel = document.getElementById('drawer-panel');
    drawer.classList.remove('pointer-events-none', 'opacity-0');
    drawer.classList.add('opacity-100');
    panel.style.transform = 'translateX(0)';
};

function renderCharacterDrawer(title, body, p) {
    title.textContent = "详细属性";
    const rootElements = Array.isArray(p.root.elements) ? p.root.elements.join('、') : p.root.elements;
    body.innerHTML = `
        <div class="space-y-4">
            <div class="ink-card p-5 bg-white/40">
                <h4 class="text-xs font-black opacity-30 mb-3 uppercase">基本信息</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="opacity-60">道号</span><span class="font-bold">${p.name}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">境界</span><span class="font-bold">${p.realm.major} · ${p.realm.minor}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">家境</span><span class="opacity-60">${p.background || '未知'}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">灵根</span><span class="text-gold font-bold">${p.root.type}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">属性</span><span class="opacity-60">${rootElements}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">加成</span><span class="text-gold font-black">x${p.root.bonus}</span></div>
                </div>
            </div>

            <div class="ink-card p-5 bg-white/40">
                <h4 class="text-xs font-black opacity-30 mb-3 uppercase">战斗属性</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="opacity-60">气血</span><span class="font-bold text-red-600">${p.hp.cur}/${p.hp.max}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">灵气</span><span class="font-bold text-blue-600">${p.mp.cur}/${p.mp.max}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">攻击</span><span class="font-bold">${p.atk || 10}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">防御</span><span class="font-bold">${p.def || 2}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">速度</span><span class="font-bold">${(p.spd || 1.0).toFixed(1)}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">暴击</span><span class="font-bold">${p.crit || 5}%</span></div>
                    <div class="flex justify-between"><span class="opacity-60">爆伤</span><span class="font-bold">${p.critDmg || 150}%</span></div>
                </div>
            </div>

            <div class="ink-card p-5 bg-white/40">
                <h4 class="text-xs font-black opacity-30 mb-3 uppercase">恢复属性</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="opacity-60">气血恢复</span><span class="font-bold">${p.hpRegen || 1}/秒</span></div>
                    <div class="flex justify-between"><span class="opacity-60">灵气恢复</span><span class="font-bold">${p.mpRegen || 0}/秒</span></div>
                </div>
            </div>

            <div class="ink-card p-5 bg-white/40">
                <h4 class="text-xs font-black opacity-30 mb-3 uppercase">先天命数</h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="opacity-60">机缘</span><span class="font-bold">${p.stats.luck}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">悟性</span><span class="font-bold">${p.stats.wisdom}</span></div>
                    <div class="flex justify-between"><span class="opacity-60">洞察</span><span class="font-bold">${p.stats.insight}</span></div>
                </div>
            </div>
        </div>
    `;
}

function renderStoryDrawer(title, body) {
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
}

function renderMenuDrawer(title, body) {
    title.textContent = "洞府菜单";
    body.innerHTML = `
        <div class="space-y-3">
            <button onclick="openDrawer('char')" class="btn-ink btn-ink-ghost w-full">查看命数</button>
            <button onclick="openDrawer('story')" class="btn-ink btn-ink-ghost w-full">修仙传记</button>
            <button onclick="openDrawer('inv')" class="btn-ink btn-ink-ghost w-full">识海背包</button>
            <button onclick="openDrawer('stones')" class="btn-ink btn-ink-ghost w-full">灵石宝库</button>
            <button onclick="openDrawer('mansion')" class="btn-ink btn-ink-ghost w-full">洞府炼制</button>
            <button onclick="doAction('body')" class="btn-ink btn-ink-ghost w-full">肉身淬炼</button>
            <hr class="border-ink/5 my-4">
            <button onclick="handleLogout()" class="btn-ink btn-ink-outline w-full text-xs">退出登录</button>
        </div>
    `;
}

let currentMansionTab = 'alchemy'; // 默认显示炼丹

function renderMansionDrawer(title, body, p) {
    title.textContent = "洞府炼制";
    p.knownRecipes = p.knownRecipes || [];
    p.knownBlueprints = p.knownBlueprints || [];

    // 标签切换
    const tabs = `
        <div class="flex gap-2 mb-6 border-b border-ink/10 pb-2">
            <button onclick="switchMansionTab('alchemy')"
                    class="px-4 py-2 text-sm font-bold transition-all ${currentMansionTab === 'alchemy' ? 'text-gold border-b-2 border-gold' : 'opacity-40 hover:opacity-100'}">
                炼丹房
            </button>
            <button onclick="switchMansionTab('forge')"
                    class="px-4 py-2 text-sm font-bold transition-all ${currentMansionTab === 'forge' ? 'text-gold border-b-2 border-gold' : 'opacity-40 hover:opacity-100'}">
                炼器房
            </button>
        </div>
    `;

    let content = '';
    if (currentMansionTab === 'alchemy') {
        if (p.knownRecipes.length === 0) {
            content = `<div class="py-20 text-center opacity-20 italic">尚未习得任何丹方<br/><span class="text-[9px]">收集40个丹方碎片可合成丹方</span></div>`;
        } else {
            content = p.knownRecipes.map(recipe => {
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
                                const color = has >= count ? 'text-green-600' : 'text-red-600';
                                return `<div class="${color}">${getItemName(id)}: ${has}/${count}</div>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    } else {
        if (p.knownBlueprints.length === 0) {
            content = `<div class="py-20 text-center opacity-20 italic">尚未习得任何图纸<br/><span class="text-[9px]">收集6个图纸碎片可合成图纸</span></div>`;
        } else {
            content = p.knownBlueprints.map(bp => {
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
                                const color = has >= count ? 'text-green-600' : 'text-red-600';
                                return `<div class="${color}">${getItemName(id)}: ${has}/${count}</div>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    body.innerHTML = tabs + content;
}

window.switchMansionTab = (tab) => {
    currentMansionTab = tab;
    renderMansionDrawer(
        document.getElementById('drawer-title'),
        document.getElementById('drawer-body'),
        save.player
    );
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

    // 检查是否有碎片
    const danfangFragment = p.inventory.find(i => i.id === 'fragment_danfang');
    const blueprintFragment = p.inventory.find(i => i.id === 'fragment_blueprint');
    const hasDanfangFragment = danfangFragment && danfangFragment.count >= 40;
    const hasBlueprintFragment = blueprintFragment && blueprintFragment.count >= 6;

    let composeButtons = '';
    if (hasDanfangFragment || hasBlueprintFragment) {
        composeButtons = `
            <div class="grid grid-cols-2 gap-2 mb-6">
                ${hasDanfangFragment ? `
                    <button onclick="compose('danfang')" class="btn-ink btn-ink-outline h-10 text-[10px]">
                        合成丹方<br/>(需40碎片)
                    </button>
                ` : ''}
                ${hasBlueprintFragment ? `
                    <button onclick="compose('blueprint')" class="btn-ink btn-ink-outline h-10 text-[10px]">
                        合成图纸<br/>(需6碎片)
                    </button>
                ` : ''}
            </div>
        `;
    }

    body.innerHTML = `
        <div class="flex gap-2 mb-4 overflow-x-auto pb-2 border-b border-ink/10">
            ${tabs}
        </div>
        ${composeButtons}
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
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%, -70%)';
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translate(-50%, -50%)';
    }, 2000);
}

function openDrawerDirect() {
    const drawer = document.getElementById('ui-drawer');
    const panel = document.getElementById('drawer-panel');
    drawer.classList.remove('pointer-events-none', 'opacity-0');
    drawer.classList.add('opacity-100');
    panel.style.transform = 'translateX(0)';
}

// 灵石管理界面
function renderSpiritStonesDrawer(title, body, p) {
    title.textContent = "灵石宝库";

    // 初始化灵石数据结构
    if (!p.spiritStones) {
        p.spiritStones = {
            low: 0,
            medium: 0,
            high: 0,
            supreme: 0
        };
    }

    const qualities = CONFIG.spiritStones.qualities;
    const ratio = CONFIG.spiritStones.conversion.ratio;

    body.innerHTML = `
        <div class="space-y-4">
            <div class="text-[10px] opacity-40 text-center mb-4">
                ${ratio}个低品 = 1个中品 · ${ratio}个中品 = 1个高品 · ${ratio}个高品 = 1个极品
            </div>

            ${qualities.map(q => {
                const count = p.spiritStones[q.id] || 0;
                const canUpgrade = count >= ratio && q.id !== 'supreme';
                const canDowngrade = p.spiritStones[getNextQuality(q.id)] > 0 && q.id !== 'supreme';

                return `
                    <div class="ink-card p-4 bg-white/30">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <div class="font-bold text-sm" style="color: ${q.color}">${q.name}</div>
                                <div class="text-[9px] opacity-60 mt-1">${q.desc}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-xl font-black" style="color: ${q.color}">${count}</div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2 mt-3">
                            ${q.id !== 'supreme' ? `
                                <button onclick="convertSpiritStone('${q.id}', 'up')"
                                        class="btn-ink ${canUpgrade ? 'btn-ink-primary' : 'btn-ink-ghost opacity-30'} px-2 py-1 h-auto text-[10px]"
                                        ${!canUpgrade ? 'disabled' : ''}>
                                    升品 (${ratio}→1)
                                </button>
                            ` : '<div></div>'}

                            ${q.id !== 'low' ? `
                                <button onclick="convertSpiritStone('${q.id}', 'down')"
                                        class="btn-ink ${canDowngrade ? 'btn-ink-outline' : 'btn-ink-ghost opacity-30'} px-2 py-1 h-auto text-[10px]"
                                        ${!canDowngrade ? 'disabled' : ''}>
                                    降品 (1→${ratio})
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function getNextQuality(currentId) {
    const order = ['low', 'medium', 'high', 'supreme'];
    const idx = order.indexOf(currentId);
    return idx < order.length - 1 ? order[idx + 1] : null;
}

function getPrevQuality(currentId) {
    const order = ['low', 'medium', 'high', 'supreme'];
    const idx = order.indexOf(currentId);
    return idx > 0 ? order[idx - 1] : null;
}

window.convertSpiritStone = (qualityId, direction) => {
    const p = save.player;
    const ratio = CONFIG.spiritStones.conversion.ratio;

    if (direction === 'up') {
        const nextId = getNextQuality(qualityId);
        if (!nextId || p.spiritStones[qualityId] < ratio) {
            addLog("灵石数量不足，无法升品", "text-danger");
            return;
        }

        p.spiritStones[qualityId] -= ratio;
        p.spiritStones[nextId] = (p.spiritStones[nextId] || 0) + 1;

        const currentName = CONFIG.spiritStones.qualities.find(q => q.id === qualityId).name;
        const nextName = CONFIG.spiritStones.qualities.find(q => q.id === nextId).name;
        addLog(`【灵石转换】${ratio}个${currentName}转换为1个${nextName}`, "text-gold");
    } else if (direction === 'down') {
        const prevId = getPrevQuality(qualityId);
        if (!prevId || p.spiritStones[qualityId] < 1) {
            addLog("灵石数量不足，无法降品", "text-danger");
            return;
        }

        p.spiritStones[qualityId] -= 1;
        p.spiritStones[prevId] = (p.spiritStones[prevId] || 0) + ratio;

        const currentName = CONFIG.spiritStones.qualities.find(q => q.id === qualityId).name;
        const prevName = CONFIG.spiritStones.qualities.find(q => q.id === prevId).name;
        addLog(`【灵石转换】1个${currentName}转换为${ratio}个${prevName}`, "text-gold");
    }

    renderEverything();
    openDrawer('stones');
    autoSave();
}
