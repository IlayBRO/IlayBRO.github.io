const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('בדיקת סטטיסטיקות הזמנות')
        .addUserOption(opt =>
            opt.setName('user').setDescription('משתמש לבדיקה (ברירת מחדל: אתה)').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser('user') || interaction.user;
        const config = getConfig();

        let regular = 0, left = 0, fake = 0;

        try {
            const invites = await interaction.guild.invites.fetch();
            for (const invite of invites.values()) {
                if (invite.inviter?.id === target.id) {
                    regular += invite.uses || 0;
                }
            }
        } catch {
            // Invites might not be accessible
        }

        // Check bonus from config
        const bonusData = config.inviteBonus?.[target.id] || 0;
        const total = regular + bonusData - fake;

        const embed = new EmbedBuilder()
            .setTitle('📨 סטטיסטיקות הזמנות')
            .setDescription(`הזמנות עבור <@${target.id}>`)
            .setColor(0x5865f2)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: '📊 סה"כ', value: `**${total}**`, inline: true },
                { name: '✅ רגילות', value: `**${regular}**`, inline: true },
                { name: '🚪 עזבו', value: `**${left}**`, inline: true },
                { name: '🤖 מזויפות', value: `**${fake}**`, inline: true },
                { name: '🎁 בונוס', value: `**${bonusData}**`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

        return interaction.editReply({ embeds: [embed] });
    }
};
