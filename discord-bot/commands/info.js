const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('הצגת סטטיסטיקות החנות בזמן אמת'),

    async execute(interaction) {
        await interaction.deferReply();

        const config = getConfig();
        const stats = config.storeStats || { customers: 0, reviews: 0, storeOpen: true };

        await interaction.guild.members.fetch();
        const memberCount = interaction.guild.memberCount;
        const humanCount = interaction.guild.members.cache.filter(m => !m.user.bot).size;

        const statusEmoji = stats.storeOpen ? '🟢' : '🔴';
        const statusText = stats.storeOpen ? 'פתוח ✅' : 'סגור ❌';

        const embed = new EmbedBuilder()
            .setTitle('📊 סטטיסטיקות החנות בזמן אמת')
            .setColor(stats.storeOpen ? 0x2ecc71 : 0xe74c3c)
            .addFields(
                { name: '👥 אנשים בשרת', value: `**${memberCount}** (${humanCount} אנושיים)`, inline: true },
                { name: '🛒 לקוחות', value: `**${stats.customers.toLocaleString()}**`, inline: true },
                { name: '⭐ חוות דעת', value: `**${stats.reviews.toLocaleString()}**`, inline: true },
                { name: `${statusEmoji} מצב החנות`, value: statusText, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

        if (config.serverImage) {
            embed.setImage(config.serverImage);
        }

        return interaction.editReply({ embeds: [embed] });
    }
};
