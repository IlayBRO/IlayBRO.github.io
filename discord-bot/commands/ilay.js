const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig, updateConfig } = require('../utils/config');
const { isOwner, replyNoPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ilay')
        .setDescription('לוח בקרה ראשי של הבוט (בעל השרת בלבד)')
        .addSubcommand(sub =>
            sub.setName('image')
                .setDescription('הגדרת תמונת השרת לכל ה-Embeds')
                .addStringOption(opt =>
                    opt.setName('url').setDescription('קישור לתמונה').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('emoji')
                .setDescription('הגדרת אימוג\'י האימות')
                .addStringOption(opt =>
                    opt.setName('emoji').setDescription('האימוג\'י (Unicode או Custom)').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('channel')
                .setDescription('הגדרת ערוץ הפקודות')
                .addChannelOption(opt =>
                    opt.setName('channel').setDescription('הערוץ הייעודי לפקודות').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('verifyrole')
                .setDescription('הגדרת תפקיד האימות')
                .addRoleOption(opt =>
                    opt.setName('role').setDescription('התפקיד שיינתן לאחר אימות').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('stats')
                .setDescription('עדכון סטטיסטיקות החנות')
                .addIntegerOption(opt =>
                    opt.setName('customers').setDescription('מספר לקוחות').setRequired(false))
                .addIntegerOption(opt =>
                    opt.setName('reviews').setDescription('מספר חוות דעת').setRequired(false))
                .addBooleanOption(opt =>
                    opt.setName('open').setDescription('האם החנות פתוחה?').setRequired(false))),

    async execute(interaction) {
        if (!isOwner(interaction)) return replyNoPermission(interaction);

        const sub = interaction.options.getSubcommand();
        const config = getConfig();

        if (sub === 'image') {
            const url = interaction.options.getString('url');
            updateConfig({ serverImage: url });
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('✅ תמונת השרת עודכנה')
                        .setDescription(`התמונה הוגדרה בהצלחה.`)
                        .setImage(url)
                        .setColor(0x2ecc71)
                ],
                ephemeral: true
            });
        }

        if (sub === 'emoji') {
            const emoji = interaction.options.getString('emoji');
            updateConfig({ verifyEmoji: emoji });
            return interaction.reply({
                content: `✅ אימוג'י האימות עודכן ל: ${emoji}`,
                ephemeral: true
            });
        }

        if (sub === 'channel') {
            const channel = interaction.options.getChannel('channel');
            updateConfig({ commandsChannelId: channel.id });
            return interaction.reply({
                content: `✅ ערוץ הפקודות הוגדר ל: <#${channel.id}>`,
                ephemeral: true
            });
        }

        if (sub === 'verifyrole') {
            const role = interaction.options.getRole('role');
            updateConfig({ verifyRoleId: role.id });
            return interaction.reply({
                content: `✅ תפקיד האימות הוגדר ל: <@&${role.id}>`,
                ephemeral: true
            });
        }

        if (sub === 'stats') {
            const customers = interaction.options.getInteger('customers');
            const reviews = interaction.options.getInteger('reviews');
            const open = interaction.options.getBoolean('open');
            const current = config.storeStats || {};
            updateConfig({
                storeStats: {
                    customers: customers ?? current.customers ?? 0,
                    reviews: reviews ?? current.reviews ?? 0,
                    storeOpen: open ?? current.storeOpen ?? true
                }
            });
            return interaction.reply({
                content: '✅ סטטיסטיקות החנות עודכנו בהצלחה.',
                ephemeral: true
            });
        }
    }
};
