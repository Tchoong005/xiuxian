/**
 * 历练模块 - 历练系统和物品掉落
 */

// 执行历练
function executeAdventurePulse() {
    const p = save.player;

    // 使用玩家选择的地点，如果没有选择则使用默认地点
    let currentLoc;
    if (p.currentAdventureLocation) {
        currentLoc = CONFIG.adventures.locations.find(l => l.id === p.currentAdventureLocation);
    }

    // 如果没有找到或没有选择，使用默认地点
    if (!currentLoc) {
        currentLoc = CONFIG.adventures.locations.find(l =>
            l.realmId === (p.realm.major === "凡人" ? "mortal" : "kaiyuan_body")
        );
    }

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

        // 凡人40%概率直接获得功法并入门
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

// 学习功法
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

// 添加物品到背包
function addToInventory(item, count) {
    const p = save.player;

    // 如果是灵石，添加到spiritStones数据结构
    if (item.quality && item.category === "货币") {
        if (!p.spiritStones) {
            p.spiritStones = { low: 0, medium: 0, high: 0, supreme: 0 };
        }
        p.spiritStones[item.quality] = (p.spiritStones[item.quality] || 0) + count;
        addLog(`获得${item.name} x${count}`, "text-gold");
        return;
    }

    // 普通物品添加到背包
    const inv = p.inventory;
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

// 权重随机
function rollWeighted(arr) {
    const total = arr.reduce((sum, item) => sum + (item.weight || 1), 0);
    let r = Math.random() * total;
    for (const item of arr) {
        if (r < (item.weight || 1)) return item;
        r -= (item.weight || 1);
    }
    return arr[0];
}
