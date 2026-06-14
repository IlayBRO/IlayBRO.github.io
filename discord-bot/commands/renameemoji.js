const { SlashCommandBuilder } = require('discord.js');
const { replyNoPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('renameemoji')
        .setDescription('שינוי שם אימוג\'י בשרת')
        .addStringOption(opt =>
            opt.setName('name').setDescription('שם האימוג\'י הנוכחי').setRequired(true))
        .addStringOption(opt =>
            opt.setName('newname').setDescription('השם החדש').setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageEmojisAndStickers')) {
            return replyNoPermission(interaction);
        }

        const nameOrId = interaction.options.getString('name');
        const newName = interaction.options.getString('newname').replace(/\s+/g, '_');

        const emoji = interaction.guild.emojis.cache.find(
            e => e.name === nameOrId || e.id === nameOrId
        );

        if (!emoji) {
            return interaction.reply({ content: `❌ האימוג'י **${nameOrId}** לא נמצא.`, ephemeral: true });
        }

        try {
            await emoji.setName(newName);
            return interaction.reply({ content: `✅ האימוג'י שונה מ-**${nameOrId}** ל-**${newName}**.`, ephemeral: true });
        } catch (err) {
            return interaction.reply({ content: `❌ שגיאה בשינוי שם האימוג'י: ${err.message}`, ephemeral: true });
        }
    }
};
