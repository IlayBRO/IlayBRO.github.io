const { SlashCommandBuilder } = require('discord.js');
const { isOwner, replyNoPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addemoji')
        .setDescription('הוספת אימוג\'י חדש לשרת')
        .addStringOption(opt =>
            opt.setName('name').setDescription('שם האימוג\'י').setRequired(true))
        .addAttachmentOption(opt =>
            opt.setName('image').setDescription('קובץ התמונה (PNG/JPG/GIF)').setRequired(true)),

    async execute(interaction) {
        if (!isOwner(interaction) && !interaction.member.permissions.has('ManageEmojisAndStickers')) {
            return replyNoPermission(interaction);
        }

        await interaction.deferReply({ ephemeral: true });

        const name = interaction.options.getString('name').replace(/\s+/g, '_');
        const attachment = interaction.options.getAttachment('image');

        if (!attachment.contentType?.startsWith('image/')) {
            return interaction.editReply({ content: '❌ הקובץ חייב להיות תמונה.' });
        }

        try {
            const emoji = await interaction.guild.emojis.create({
                attachment: attachment.url,
                name: name
            });
            return interaction.editReply({
                content: `✅ האימוג'י **${emoji.name}** נוסף בהצלחה! ${emoji}`
            });
        } catch (err) {
            return interaction.editReply({
                content: `❌ שגיאה בהוספת האימוג'י: ${err.message}`
            });
        }
    }
};
