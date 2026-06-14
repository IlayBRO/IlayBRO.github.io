const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getConfig } = require('../utils/config');
const { isStaff, replyNoPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warning')
        .setDescription('שליחת תזכורת פרטית לפותח הטיקט (רק בתוך ערוץ טיקט)'),

    async execute(interaction) {
        if (!isStaff(interaction.member) && interaction.guild.ownerId !== interaction.user.id) {
            return replyNoPermission(interaction);
        }

        const config = getConfig();
        const ticket = config.tickets?.[interaction.channelId];

        if (!ticket) {
            return interaction.reply({
                content: '❌ פקודה זו ניתן להשתמש בה רק בתוך ערוץ טיקט.',
                ephemeral: true
            });
        }

        const opener = await interaction.guild.members.fetch(ticket.openerId).catch(() => null);
        if (!opener) {
            return interaction.reply({ content: '❌ לא ניתן למצוא את פותח הטיקט.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('⚠️ תזכורת לטיקט שלך')
            .setDescription(
                `שלום <@${ticket.openerId}>!\n\n` +
                `הצוות ממתין לתגובתך בטיקט שפתחת.\n` +
                `לחץ על הכפתור למטה כדי לחזור לטיקט.`
            )
            .setColor(0xf39c12)
            .setTimestamp()
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('עבור לטיקט')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/channels/${interaction.guildId}/${interaction.channelId}`)
                .setEmoji('🎫')
        );

        try {
            await opener.send({ embeds: [embed], components: [row] });
            return interaction.reply({
                content: `✅ תזכורת נשלחה ל-<@${ticket.openerId}>.`,
                ephemeral: true
            });
        } catch {
            return interaction.reply({
                content: '❌ לא ניתן לשלוח הודעה פרטית לפותח הטיקט (DMs כנראה חסומים).',
                ephemeral: true
            });
        }
    }
};
