/**
 * 修仙游戏 2.0 - 宣纸水墨版全量配置引擎 (Config.js)
 * 包含：灵根、境界、功法、历练、掉落、背包、自动化与合成
 */

window.GAME_CONFIG = {
    artStyle: {
        theme: "xuanpaper_ink",
        colors: {
            paper: "#f4f1de",      // 宣纸白
            ink: "#1a1a1a",        // 墨黑
            gold: "#c9a227",       // 暗金
            danger: "#8b0000"      // 朱砂红 (警示)
        },
        notes: [
            "背景使用宣纸纹理",
            "水墨线条 + 特效动画",
            "历练使用卷轴动画"
        ]
    },

    // ============ 家境系统 (Background) ============
    backgrounds: {
        poor: {
            name: "贫困家境",
            desc: "出身贫寒，一无所有，唯有自力更生",
            bonuses: {
                spiritStones: { low: 0 },
                items: []
            }
        },
        common: {
            name: "平凡家境",
            desc: "寻常人家，略有薄产",
            bonuses: {
                spiritStones: { low: 50 },
                items: [{ id: "herb_1", name: "止血草", count: 3 }]
            }
        },
        wealthy: {
            name: "富裕家境",
            desc: "家境殷实，资源充裕",
            bonuses: {
                spiritStones: { low: 100, medium: 5 },
                items: [
                    { id: "herb_1", name: "止血草", count: 5 },
                    { id: "herb_2", name: "凝神花", count: 3 }
                ]
            }
        },
        noble: {
            name: "修仙世家",
            desc: "世代修仙，底蕴深厚",
            bonuses: {
                spiritStones: { low: 200, medium: 10, high: 1 },
                items: [
                    { id: "herb_2", name: "凝神花", count: 5 },
                    { id: "herb_3", name: "灵芝", count: 2 }
                ]
            }
        }
    },

    // ============ 灵根系统 (Roots) ============
    roots: {
        types: [
            "五行杂灵根", "四灵根", "三灵根", "双灵根", "单灵根",
            "变异灵根", "极品灵根", "混沌灵根", "无属性灵根"
        ],
        elements: ["金", "木", "水", "火", "土", "光", "暗", "冰", "雷", "风", "毒"],
        rules: {
            "无属性灵根": { canLearnAll: true, bonus: 1.0, desc: "无任何加成，但可修炼全部功法" },
            "混沌灵根": { canLearnAll: true, bonus: 2.0, desc: "最强灵根，有加成且可修炼全部功法" },
            "变异灵根": { canLearnAll: false, bonus: 1.6, desc: "如冰/雷等变异属性，偏向对应系功法掉落" },
            "极品灵根": { canLearnAll: false, bonus: 1.8, desc: "高修炼加成，属性更纯" },
            "单灵根": { canLearnAll: false, bonus: 1.5, desc: "某属性极致粹化" },
            "双灵根": { canLearnAll: false, bonus: 1.2, desc: "双属性交互" },
            "三灵根": { canLearnAll: false, bonus: 1.0, desc: "三气并行" },
            "四灵根": { canLearnAll: false, bonus: 0.8, desc: "四气杂糅" },
            "五行杂灵根": { canLearnAll: false, bonus: 0.6, desc: "五气混杂，进阶维艰" }
        }
    },

    // ============ 境界系统 (Realms) ============
    realms: [
        {
            id: "mortal",
            name: "凡人",
            lootQualities: ["凡品"],
            unlocks: ["历练(寻机缘)"],
            breakthroughRule: "必须获得任意功法并修到【入门】才能突破到开元铸身境",
            // 大境界突破加成
            majorBreakthrough: { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, hpRegen: 0, mpRegen: 0, crit: 0, critDmg: 0 },
            // 小境界突破加成
            minorBreakthrough: { hp: 0, mp: 0, atk: 0, def: 0, spd: 0, hpRegen: 0, mpRegen: 0, crit: 0, critDmg: 0 }
        },
        {
            id: "kaiyuan_body",
            name: "开元铸身境",
            lootQualities: ["凡品", "灵品"],
            subRealms: [
                { id: "bone", name: "练骨期", countTarget: 206, desc: "强化206块骨骼" },
                { id: "meridian", name: "淬脉期", countTarget: 12, desc: "淬炼十二正经" },
                { id: "kaiyuan", name: "开元期", special: "开启窍穴，感应天地灵气" }
            ],
            // 大境界突破（凡人->开元）大幅提升
            majorBreakthrough: { hp: 150, mp: 100, atk: 20, def: 8, spd: 0.3, hpRegen: 3, mpRegen: 2, crit: 3, critDmg: 30 },
            // 小境界突破（练骨->淬脉->开元）小幅提升
            minorBreakthrough: { hp: 20, mp: 15, atk: 3, def: 1, spd: 0.05, hpRegen: 0, mpRegen: 0, crit: 0, critDmg: 5 }
        },
        {
            id: "linghai_huaye",
            name: "灵海化液境",
            lootQualities: ["凡品", "灵品"],
            subRealms: [
                { id: "huaye", name: "化液期", desc: "灵气化液，凝于丹田" },
                { id: "ninghe", name: "凝河期", desc: "液汇成河，奔流不息" },
                { id: "juhai", name: "聚海期", desc: "河聚成海，浩瀚无垠" }
            ],
            // 大境界突破（开元->灵海）
            majorBreakthrough: { hp: 250, mp: 200, atk: 35, def: 15, spd: 0.4, hpRegen: 4, mpRegen: 4, crit: 4, critDmg: 40 },
            // 小境界突破
            minorBreakthrough: { hp: 30, mp: 25, atk: 5, def: 2, spd: 0.08, hpRegen: 1, mpRegen: 1, crit: 1, critDmg: 8 }
        },
        {
            id: "shendao_tai",
            name: "身化道台境",
            lootQualities: ["凡品", "灵品", "玄品"],
            subRealms: [
                { id: "ningdao", name: "凝道期", desc: "凝聚道台，奠定根基" },
                { id: "fendao", name: "分道期", desc: "分化道台，品质分级", qualityTiers: ["一品", "二品", "三品", "四品", "五品", "六品", "七品", "八品", "九品", "圆满", "极品", "完美", "极道"] },
                { id: "hedao", name: "合道期", desc: "筑神桥，合天地之道" }
            ],
            // 大境界突破（灵海->道台）
            majorBreakthrough: { hp: 400, mp: 350, atk: 50, def: 25, spd: 0.5, hpRegen: 6, mpRegen: 6, crit: 6, critDmg: 60 },
            // 小境界突破
            minorBreakthrough: { hp: 50, mp: 40, atk: 8, def: 3, spd: 0.1, hpRegen: 1, mpRegen: 1, crit: 1, critDmg: 10 }
        }
    ],

    // ============ 基础属性 (Base Stats) ============
    baseStats: {
        hp: 100, mp: 0,
        atk: 10, def: 2,
        spd: 1.0,
        hpRegen: 1, mpRegen: 0,
        crit: 5, critDmg: 150
    },

    // ============ 功法系统 (Manuals) ============
    manuals: {
        qualities: ["凡品", "灵品", "玄品", "地品", "天品", "极品"],
        levels: ["未入门", "入门", "小成", "大成", "圆满", "入微", "入道", "玄道", "合道", "法则"],
        types: ["universal", "elemental", "hybrid"],

        // 全属性功法池
        starterPool: [
            { id: "m0", name: "《吐纳入门》", quality: "凡品", type: "universal", elementReq: [], desc: "凡人亦可修，打坐效率+5%" },
            { id: "m1", name: "《静心诀》", quality: "凡品", type: "universal", elementReq: [], desc: "提升悟性成长，修炼波动更稳" },
            { id: "m2", name: "《行气法》", quality: "凡品", type: "universal", elementReq: [], desc: "微量提升灵气恢复（解锁后才生效）" },
            { id: "m3", name: "《长生心经》", quality: "灵品", type: "universal", elementReq: [], desc: "增加气血上限+50，打坐时气血回复+2" },
            { id: "m4", name: "《无极功》", quality: "玄品", type: "universal", elementReq: [], desc: "无属性修炼加成+30%，突破成功率+10%" }
        ],

        // 基础五行功法（凡品-灵品）
        elementalPool: [
            // 金系
            { id: "e_gold_1", name: "《金锋诀》", quality: "凡品", type: "elemental", elementReq: ["金"], desc: "金系攻击倾向，暴击+2" },
            { id: "e_gold_2", name: "《庚金锻体诀》", quality: "灵品", type: "elemental", elementReq: ["金"], desc: "金系锻体，攻击+10，防御+3" },
            { id: "e_gold_3", name: "《太白剑经》", quality: "玄品", type: "elemental", elementReq: ["金"], desc: "金系剑修，攻击+25，暴击伤害+30" },

            // 木系
            { id: "e_wood_1", name: "《青木养元诀》", quality: "凡品", type: "elemental", elementReq: ["木"], desc: "木系回复倾向，气血恢复+1" },
            { id: "e_wood_2", name: "《万木长春功》", quality: "灵品", type: "elemental", elementReq: ["木"], desc: "木系生机，气血上限+80，回复+3" },
            { id: "e_wood_3", name: "《青帝长生诀》", quality: "玄品", type: "elemental", elementReq: ["木"], desc: "木系至尊，所有回复效果+50%" },

            // 水系
            { id: "e_water_1", name: "《水镜诀》", quality: "凡品", type: "elemental", elementReq: ["水"], desc: "水系稳定倾向，降低修炼失败概率" },
            { id: "e_water_2", name: "《沧海诀》", quality: "灵品", type: "elemental", elementReq: ["水"], desc: "水系浩瀚，灵气上限+100，防御+5" },
            { id: "e_water_3", name: "《玄水天功》", quality: "玄品", type: "elemental", elementReq: ["水"], desc: "水系变化，闪避+20%，灵气回复+5" },

            // 火系
            { id: "e_fire_1", name: "《炎阳诀》", quality: "凡品", type: "elemental", elementReq: ["火"], desc: "火系爆发倾向，爆伤+10" },
            { id: "e_fire_2", name: "《烈焰焚天功》", quality: "灵品", type: "elemental", elementReq: ["火"], desc: "火系狂暴，攻击+15，爆伤+25" },
            { id: "e_fire_3", name: "《太阳真火诀》", quality: "玄品", type: "elemental", elementReq: ["火"], desc: "火系至强，攻击+35，战斗伤害+40%" },

            // 土系
            { id: "e_earth_1", name: "《厚土诀》", quality: "凡品", type: "elemental", elementReq: ["土"], desc: "土系防御倾向，防御+2" },
            { id: "e_earth_2", name: "《大地金身诀》", quality: "灵品", type: "elemental", elementReq: ["土"], desc: "土系防护，防御+10，气血+60" },
            { id: "e_earth_3", name: "《山岳镇压经》", quality: "玄品", type: "elemental", elementReq: ["土"], desc: "土系厚重，防御+20，受伤减免30%" },

            // 变异属性
            { id: "e_light_1", name: "《照心真经》", quality: "灵品", type: "elemental", elementReq: ["光"], desc: "光系净化倾向，历练负面事件概率降低" },
            { id: "e_light_2", name: "《大光明经》", quality: "玄品", type: "elemental", elementReq: ["光"], desc: "光系至圣，净化邪祟，攻击+20" },

            { id: "e_dark_1", name: "《幽影秘典》", quality: "灵品", type: "elemental", elementReq: ["暗"], desc: "暗系诡变倾向，掉落稀有概率微增" },
            { id: "e_dark_2", name: "《幽冥鬼经》", quality: "玄品", type: "elemental", elementReq: ["暗"], desc: "暗系诡异，暴击+5，掉落稀有+15%" },

            { id: "e_ice_1", name: "《玄冰诀》", quality: "灵品", type: "elemental", elementReq: ["冰"], desc: "冰系控制倾向，战斗受伤降低" },
            { id: "e_ice_2", name: "《万古冰封诀》", quality: "玄品", type: "elemental", elementReq: ["冰"], desc: "冰系极寒，控制效果+30%，速度+0.3" },

            { id: "e_thunder_1", name: "《雷霆诀》", quality: "灵品", type: "elemental", elementReq: ["雷"], desc: "雷系狂暴，速度+0.2，暴击+3" },
            { id: "e_thunder_2", name: "《九霄神雷经》", quality: "玄品", type: "elemental", elementReq: ["雷"], desc: "雷系毁灭，攻击+30，速度+0.4" },

            { id: "e_wind_1", name: "《疾风诀》", quality: "灵品", type: "elemental", elementReq: ["风"], desc: "风系迅捷，速度+0.25" },
            { id: "e_wind_2", name: "《九天罡风诀》", quality: "玄品", type: "elemental", elementReq: ["风"], desc: "风系极速，速度+0.5，闪避+25%" },

            { id: "e_poison_1", name: "《毒经》", quality: "灵品", type: "elemental", elementReq: ["毒"], desc: "毒系侵蚀，持续伤害+20%" },
            { id: "e_poison_2", name: "《万毒噬心诀》", quality: "玄品", type: "elemental", elementReq: ["毒"], desc: "毒系至尊，敌人防御降低30%" }
        ],

        learnRules: {
            universalAlwaysOk: true,
            noElementRootCanLearnAll: true,
            chaosRootCanLearnAll: true,
            elementalRequiresContained: true
        }
    },

    // ============ 历练系统 (Adventures) ============
    adventures: {
        locations: [
            {
                id: "loc_mortal_1",
                realmId: "mortal",
                name: "青石镇外 · 破庙",
                desc: "凡人求机缘之地，常见残卷与草药",
                events: [
                    { id: "evt_empty", name: "空手而归", weight: 25 },
                    { id: "evt_herb", name: "采得草药", weight: 25 },
                    { id: "evt_scroll", name: "拾得残卷", weight: 18 },
                    { id: "evt_bandit", name: "遭遇山匪", weight: 20 },
                    { id: "evt_fate", name: "奇遇机缘", weight: 12 }
                ],
                loot: {
                    groups: [
                        { group: "currency", weight: 30 },
                        { group: "material", weight: 30 },
                        { group: "manual", weight: 25 },
                        { group: "fragment", weight: 15 }
                    ]
                }
            },
            {
                id: "loc_kaiyuan_1",
                realmId: "kaiyuan_body",
                name: "云雾山道 · 灵泉",
                desc: "开元修士常来之地，灵品材料更常见",
                events: [
                    { id: "evt_empty", name: "空手而归", weight: 18 },
                    { id: "evt_herb", name: "灵草", weight: 20 },
                    { id: "evt_beast", name: "妖兽袭击", weight: 22 },
                    { id: "evt_chest", name: "山洞宝箱", weight: 20 },
                    { id: "evt_manual", name: "得功法残页", weight: 20 }
                ],
                loot: {
                    groups: [
                        { group: "currency", weight: 25 },
                        { group: "material", weight: 30 },
                        { group: "manual", weight: 30 },
                        { group: "fragment", weight: 15 }
                    ]
                }
            }
            // 后续地点可根据 ID 与 境界配置动态加载
        ],
        lootItems: {
            currency: [
                { id: "spirit_stone_low", name: "下品灵石", min: 1, max: 25, weight: 60, category: "货币", quality: "low" },
                { id: "spirit_stone_medium", name: "中品灵石", min: 1, max: 5, weight: 25, category: "货币", quality: "medium" },
                { id: "spirit_stone_high", name: "上品灵石", min: 1, max: 2, weight: 10, category: "货币", quality: "high" },
                { id: "spirit_stone_supreme", name: "极品灵石", min: 1, max: 1, weight: 5, category: "货币", quality: "supreme" }
            ],
            material: [
                { id: "herb_1", name: "止血草", weight: 40, category: "材料" },
                { id: "herb_2", name: "凝神花", weight: 25, category: "材料" },
                { id: "herb_3", name: "灵芝", weight: 15, category: "材料" },
                { id: "herb_4", name: "千年人参", weight: 8, category: "材料" },
                { id: "ore_1", name: "黑铁砂", weight: 30, category: "材料" },
                { id: "ore_2", name: "精铁矿", weight: 20, category: "材料" },
                { id: "ore_3", name: "寒铁", weight: 10, category: "材料" },
                { id: "ore_4", name: "星辰石", weight: 5, category: "材料" },
                { id: "misc_1", name: "旧符纸", weight: 25, category: "材料" },
                { id: "misc_2", name: "兽皮", weight: 20, category: "材料" },
                { id: "misc_3", name: "妖兽内丹", weight: 10, category: "材料" }
            ],
            fragment: [
                { id: "danfang_frag_common", name: "丹方碎片", min: 1, max: 4, weight: 60, category: "碎片" },
                { id: "blueprint_frag_common", name: "图纸碎片", min: 1, max: 3, weight: 40, category: "碎片" }
            ],
            manual: [
                { id: "manual_frag_common", name: "功法残页", weight: 50, category: "功法" },
                { id: "manual_frag_rare", name: "灵品功法残卷", weight: 20, category: "功法" }
            ]
        }
    },

    // ============ 自动化与辅助 (Automation) ============
    automation: {
        meditate: {
            enabled: true,
            tickSeconds: 5,
            gain: {
                baseCultivation: 1,
                baseMp: 0
            }
        },
        adventure: {
            enabled: true,
            durationSeconds: 8,
            animation: ["scroll_open", "ink_spread", "silhouette_walk", "result_stamp"],
            resolution: {
                eventRoll: "weighted",
                lootRoll: "weighted_groups_then_items",
                elementBias: 0.15
            }
        }
    },

    // ============ 丹药系统 (Pills) ============
    pills: {
        recipes: [
            // 凡品丹药
            { id: "pill_hp_1", name: "回春丹", quality: "凡品", effect: { type: "heal_hp", value: 50 }, materials: { herb_1: 3, spirit_stone: 5 }, desc: "恢复50点气血" },
            { id: "pill_mp_1", name: "回气丹", quality: "凡品", effect: { type: "heal_mp", value: 30 }, materials: { herb_2: 3, spirit_stone: 5 }, desc: "恢复30点灵气" },
            { id: "pill_exp_1", name: "聚气丹", quality: "凡品", effect: { type: "add_exp", value: 5 }, materials: { herb_1: 2, herb_2: 2, spirit_stone: 10 }, desc: "增加5%修为" },

            // 灵品丹药
            { id: "pill_hp_2", name: "大回春丹", quality: "灵品", effect: { type: "heal_hp", value: 150 }, materials: { herb_3: 2, herb_1: 5, spirit_stone: 20 }, desc: "恢复150点气血" },
            { id: "pill_mp_2", name: "大回气丹", quality: "灵品", effect: { type: "heal_mp", value: 100 }, materials: { herb_3: 2, herb_2: 5, spirit_stone: 20 }, desc: "恢复100点灵气" },
            { id: "pill_exp_2", name: "破境丹", quality: "灵品", effect: { type: "add_exp", value: 10 }, materials: { herb_3: 3, herb_4: 1, spirit_stone: 50 }, desc: "增加10%修为" },
            { id: "pill_atk_1", name: "力量丹", quality: "灵品", effect: { type: "buff_atk", value: 10, duration: 3600 }, materials: { misc_3: 1, herb_1: 5, spirit_stone: 30 }, desc: "1小时内攻击+10" },

            // 玄品丹药
            { id: "pill_hp_3", name: "造化丹", quality: "玄品", effect: { type: "heal_hp_full" }, materials: { herb_4: 2, herb_3: 5, misc_3: 2, spirit_stone: 100 }, desc: "完全恢复气血" },
            { id: "pill_breakthrough", name: "天元破障丹", quality: "玄品", effect: { type: "breakthrough_bonus", value: 20 }, materials: { herb_4: 3, misc_3: 3, ore_4: 1, spirit_stone: 200 }, desc: "突破成功率+20%" }
        ]
    },

    // ============ 装备系统 (Equipment) ============
    equipment: {
        slots: ["武器", "护甲", "法宝", "灵饰"],
        blueprints: [
            // 凡品装备
            { id: "eq_weapon_1", name: "铁剑", slot: "武器", quality: "凡品", stats: { atk: 5 }, materials: { ore_1: 5, spirit_stone: 10 }, desc: "普通铁剑" },
            { id: "eq_armor_1", name: "布甲", slot: "护甲", quality: "凡品", stats: { def: 3, hp: 20 }, materials: { misc_2: 5, spirit_stone: 10 }, desc: "普通布甲" },

            // 灵品装备
            { id: "eq_weapon_2", name: "精铁剑", slot: "武器", quality: "灵品", stats: { atk: 15, crit: 2 }, materials: { ore_2: 8, ore_1: 10, spirit_stone: 50 }, desc: "精铁锻造的宝剑" },
            { id: "eq_armor_2", name: "玄铁甲", slot: "护甲", quality: "灵品", stats: { def: 10, hp: 60 }, materials: { ore_2: 8, misc_2: 10, spirit_stone: 50 }, desc: "玄铁打造的护甲" },
            { id: "eq_treasure_1", name: "护身符", slot: "法宝", quality: "灵品", stats: { def: 5, hp: 40 }, materials: { misc_1: 10, herb_2: 5, spirit_stone: 40 }, desc: "防护法宝" },

            // 玄品装备
            { id: "eq_weapon_3", name: "寒铁剑", slot: "武器", quality: "玄品", stats: { atk: 30, crit: 5, critDmg: 20 }, materials: { ore_3: 5, ore_4: 2, misc_3: 3, spirit_stone: 150 }, desc: "寒气逼人的宝剑" },
            { id: "eq_armor_3", name: "星辰甲", slot: "护甲", quality: "玄品", stats: { def: 20, hp: 120, mpRegen: 2 }, materials: { ore_4: 3, ore_3: 5, misc_3: 3, spirit_stone: 150 }, desc: "星辰之力护体" },
            { id: "eq_treasure_2", name: "聚灵珠", slot: "法宝", quality: "玄品", stats: { mp: 80, mpRegen: 3 }, materials: { ore_4: 2, misc_3: 5, herb_4: 2, spirit_stone: 120 }, desc: "聚集灵气的宝珠" },
            { id: "eq_accessory_1", name: "灵玉佩", slot: "灵饰", quality: "玄品", stats: { hp: 50, mp: 50, spd: 0.2 }, materials: { ore_4: 3, herb_4: 2, spirit_stone: 100 }, desc: "温润灵玉" }
        ]
    },

    // ============ 背包与合成 (Inventory) ============
    inventory: {
        categories: ["全部", "装备", "丹药", "材料", "碎片", "功法", "货币", "杂物"],
        crafting: {
            danfang: { fragmentItemId: "danfang_frag_common", need: 40, result: "丹方(随机)" },
            blueprint: { fragmentItemId: "blueprint_frag_common", need: 6, result: "图纸(随机)" }
        }
    },

    // ============ 灵石品质系统 (Spirit Stone Quality) ============
    spiritStones: {
        qualities: [
            {
                id: "low",
                name: "下品灵石",
                color: "#8b4513",
                cultivationBonus: 1.0,
                breakthroughBonus: 0,
                sellValue: 1,
                desc: "最常见的灵石，修炼加成+0%"
            },
            {
                id: "medium",
                name: "中品灵石",
                color: "#4169e1",
                cultivationBonus: 1.5,
                breakthroughBonus: 5,
                sellValue: 10,
                desc: "品质不俗的灵石，修炼加成+50%，突破成功率+5%"
            },
            {
                id: "high",
                name: "上品灵石",
                color: "#9370db",
                cultivationBonus: 2.0,
                breakthroughBonus: 10,
                sellValue: 100,
                desc: "上乘灵石，修炼加成+100%，突破成功率+10%"
            },
            {
                id: "supreme",
                name: "极品灵石",
                color: "#ffd700",
                cultivationBonus: 3.0,
                breakthroughBonus: 20,
                sellValue: 1000,
                desc: "传说中的极品灵石，修炼加成+200%，突破成功率+20%"
            }
        ],
        conversion: {
            // 10个低品=1个中品，10个中品=1个高品，10个高品=1个极品
            ratio: 10
        }
    },

    // ============ 故事主线 (Story) ============
    story: {
        prologue: "你生于凡尘，天资未显。乱世将至，修途唯有一线生机：寻得功法，踏入仙途。",
        chapters: [
            {
                id: "c1",
                title: "第一章：凡尘求机缘",
                goal: "历练获得功法并修至入门",
                story: "你只是青石镇外一介凡人，听闻镇外破庙常有机缘，决定前往一探。",
                completion: "你在破庙中获得了功法，从此踏上修仙之路！"
            },
            {
                id: "c2",
                title: "第二章：铸身开元",
                goal: "练骨淬脉，开元破境",
                story: "功法入门后，你感应到天地灵气。修炼需先强健肉身，练骨206根，淬脉12条。",
                completion: "你完成了开元铸身，真正踏入修仙者行列！"
            },
            {
                id: "c3",
                title: "第三章：灵海化液",
                goal: "化液成河，凝聚灵海",
                story: "体内灵气如涓涓细流，需化液凝河，最终聚成灵海，方能继续前行。",
                completion: "灵海已成，你的修为又上一层楼！"
            },
            {
                id: "c4",
                title: "第四章：身化道台",
                goal: "凝道台，悟天地之理",
                story: "修炼至此，需于识海中凝聚道台，此为根基，道台品质决定未来成就。",
                completion: "道台已成，你已是一方强者！"
            }
        ]
    }
};
