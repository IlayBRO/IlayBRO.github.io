const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/config.json');

const DEFAULT_CONFIG = {
    serverImage: null,
    verifyEmoji: '✅',
    verifyRoleId: null,
    commandsChannelId: null,
    tickets: {},
    giveaways: {},
    storeStats: { customers: 0, reviews: 0, storeOpen: true }
};

function getConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
            return { ...DEFAULT_CONFIG };
        }
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch {
        return { ...DEFAULT_CONFIG };
    }
}

function saveConfig(config) {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

function updateConfig(updates) {
    const config = getConfig();
    const merged = deepMerge(config, updates);
    saveConfig(merged);
    return merged;
}

function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

module.exports = { getConfig, saveConfig, updateConfig };
