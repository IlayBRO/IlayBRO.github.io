const { getConfig, saveConfig } = require('./config');

function createGiveaway(messageId, data) {
    const config = getConfig();
    if (!config.giveaways) config.giveaways = {};
    config.giveaways[messageId] = {
        ...data,
        participants: [],
        active: true,
        createdAt: Date.now()
    };
    saveConfig(config);
}

function getGiveaway(messageId) {
    const config = getConfig();
    return config.giveaways?.[messageId] || null;
}

function updateGiveaway(messageId, updates) {
    const config = getConfig();
    if (!config.giveaways?.[messageId]) return null;
    Object.assign(config.giveaways[messageId], updates);
    saveConfig(config);
    return config.giveaways[messageId];
}

function deleteGiveaway(messageId) {
    const config = getConfig();
    if (!config.giveaways?.[messageId]) return false;
    delete config.giveaways[messageId];
    saveConfig(config);
    return true;
}

function listGiveaways() {
    const config = getConfig();
    return config.giveaways || {};
}

function pickWinners(giveaway, count = 1) {
    const pool = [...(giveaway.participants || [])];
    if (pool.length === 0) return [];
    const winners = [];
    for (let i = 0; i < Math.min(count, pool.length); i++) {
        const idx = Math.floor(Math.random() * pool.length);
        winners.push(pool.splice(idx, 1)[0]);
    }
    return winners;
}

module.exports = { createGiveaway, getGiveaway, updateGiveaway, deleteGiveaway, listGiveaways, pickWinners };
