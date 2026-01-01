/**
 * 炼制模块 - 炼丹、炼器、合成系统
 */

// 打开炼丹房
window.openAlchemy = () => {
    const p = save.player;
    p.knownRecipes = p.knownRecipes || [];

    const title = document.getElementById('drawer-title');
    const body = document.getElementById('drawer-body');

    title.textContent = "炼丹房";

    if (p.knownRecipes.length === 0) {
        body.innerHTML = `<div class="py-20 text-center opacity-20 italic">尚未习得任何丹方<br/><span class="text-[9px]">收集40个丹方碎片可合成丹方</span></div>`;
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
                            const color = has >= count ? 'text-green-600' : 'text-red-600';
                            return `<div class="${color}">${getItemName(id)}: ${has}/${count}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    openDrawerDirect();
};

// 打开炼器房
window.openForge = () => {
    const p = save.player;
    p.knownBlueprints = p.knownBlueprints || [];

    const title = document.getElementById('drawer-title');
    const body = document.getElementById('drawer-body');

    title.textContent = "炼器房";

    if (p.knownBlueprints.length === 0) {
        body.innerHTML = `<div class="py-20 text-center opacity-20 italic">尚未习得任何图纸<br/><span class="text-[9px]">收集6个图纸碎片可合成图纸</span></div>`;
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
                            const color = has >= count ? 'text-green-600' : 'text-red-600';
                            return `<div class="${color}">${getItemName(id)}: ${has}/${count}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    openDrawerDirect();
};

// 炼制丹药
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
    openDrawer('mansion');
    autoSave();
};

// 炼制装备
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
    openDrawer('mansion');
    autoSave();
};

// 合成系统
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

// 辅助函数
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
