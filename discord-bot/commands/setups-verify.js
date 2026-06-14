const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig } = require('../utils/config');
const { isOwner, replyNoPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setups-verify')
        .setDescription('שליחת פאנל אימות לערוץ (בעל שרת בלבד)'),

    async execute(interaction) {
        if (!isOwner(interaction) && !interaction.member.permissions.has('ManageGuild')) {
            return replyNoPermission(interaction);
        }

        const config = getConfig();
        const emoji = config.verifyEmoji || '✅';
        const emojiChar = emoji.match(/^\p{Emoji}/u)?.[0] || '✅';

        const embed = new EmbedBuilder()
            .setTitle(`${emoji} אימות חברים`)
            .setDescription(
                `**ברוכים הבאים לשרת!**\n\n` +
                `כדי לקבל גישה מלאה לשרת, לחץ על כפתור האימות למטה.\n\n` +
                `${emoji} לחץ על הכפתור להמשך`
            )
            .setColor(0x5865f2)
            .setTimestamp()
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

        if (config.serverImage) {
            embed.setImage(config.serverImage);
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_button')
                .setLabel('אמת אותי')
                .setEmoji(emojiChar)
                .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ פאנל האימות נשלח!', ephemeral: true });
    }
};
