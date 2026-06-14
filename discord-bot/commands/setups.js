const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getConfig } = require('../utils/config');
const { isOwner, replyNoPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setups')
        .setDescription('פקודות הגדרת פאנלים')
        .addSubcommand(sub =>
            sub.setName('ticket')
                .setDescription('שליחת פאנל טיקטים לערוץ')),

    async execute(interaction) {
        if (!isOwner(interaction) && !interaction.member.permissions.has('ManageGuild')) {
            return replyNoPermission(interaction);
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'ticket') {
            const config = getConfig();

            const embed = new EmbedBuilder()
                .setTitle('🎫 מערכת תמיכה')
                .setDescription(
                    '**פתח טיקט לקבלת עזרה מהצוות שלנו!**\n\n' +
                    'בחר קטגוריה מהתפריט למטה כדי לפתוח טיקט.\n' +
                    'הצוות שלנו יטפל בך בהקדם האפשרי.'
                )
                .setColor(0x5865f2)
                .setTimestamp()
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

            if (config.serverImage) {
                embed.setImage(config.serverImage);
            }

            const selectMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_category')
                    .setPlaceholder('📋 בחר קטגוריה לפתיחת טיקט...')
                    .addOptions([
                        {
                            label: 'תמיכה כללית',
                            description: 'שאלות כלליות ובקשות עזרה',
                            value: 'general',
                            emoji: '💬'
                        },
                        {
                            label: 'דיווח',
                            description: 'דיווח על משתמש או בעיה',
                            value: 'report',
                            emoji: '🚨'
                        },
                        {
                            label: 'ביצוע רכישה',
                            description: 'תמיכה ברכישות ותשלומים',
                            value: 'purchase',
                            emoji: '🛒'
                        },
                        {
                            label: 'שיתוף פעולה',
                            description: 'הצעות שיתוף פעולה ועסקאות',
                            value: 'collab',
                            emoji: '🤝'
                        }
                    ])
            );

            await interaction.channel.send({ embeds: [embed], components: [selectMenu] });
            await interaction.reply({ content: '✅ פאנל הטיקטים נשלח!', ephemeral: true });
        }
    }
};
