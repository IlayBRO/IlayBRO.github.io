const { SlashCommandBuilder } = require('discord.js');
const { replyNoPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeemoji')
        .setDescription('מחיקת אימוג\'י מהשרת')
        .addStringOption(opt =>
            opt.setName('name').setDescription('שם האימוג\'י או ה-ID שלו').setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageEmojisAndStickers')) {
            return replyNoPermission(interaction);
        }

        const nameOrId = interaction.options.getString('name');
        const emoji = interaction.guild.emojis.cache.find(
            e => e.name === nameOrId || e.id === nameOrId
        );

        if (!emoji) {
            return interaction.reply({ content: `❌ האימוג'י **${nameOrId}** לא נמצא בשרת.`, ephemeral: true });
        }

        try {
            await emoji.delete();
            return interaction.reply({ content: `✅ האימוג'י **${nameOrId}** נמחק בהצלחה.`, ephemeral: true });
        } catch (err) {
            return interaction.reply({ content: `❌ שגיאה במחיקת האימוג'י: ${err.message}`, ephemeral: true });
        }
    }
};
