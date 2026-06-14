const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGiveaway, getGiveaway, updateGiveaway, deleteGiveaway, listGiveaways, pickWinners } = require('../utils/giveawayManager');
const { getConfig } = require('../utils/config');
const { isOwner, isStaff, replyNoPermission } = require('../utils/permissions');

function parseTime(str) {
    const match = str.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return null;
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return parseInt(match[1]) * units[match[2]];
}

function formatTime(ms) {
    if (ms < 60000) return `${Math.round(ms / 1000)} שניות`;
    if (ms < 3600000) return `${Math.round(ms / 60000)} דקות`;
    if (ms < 86400000) return `${Math.round(ms / 3600000)} שעות`;
    return `${Math.round(ms / 86400000)} ימים`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('ניהול הגרלות')
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('פתיחת הגרלה חדשה')
                .addStringOption(opt =>
                    opt.setName('prize').setDescription('הפרס').setRequired(true))
                .addStringOption(opt =>
                    opt.setName('duration').setDescription('משך זמן (לדוגמה: 1h, 30m, 1d)').setRequired(true))
                .addIntegerOption(opt =>
                    opt.setName('winners').setDescription('מספר זוכים (ברירת מחדל: 1)').setRequired(false).setMinValue(1).setMaxValue(20)))
        .addSubcommand(sub =>
            sub.setName('end')
                .setDescription('סיום מיידי של הגרלה')
                .addStringOption(opt =>
                    opt.setName('message_id').setDescription('ה-ID של הודעת ההגרלה').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('reroll')
                .setDescription('בחירת זוכה חדש להגרלה שהסתיימה')
                .addStringOption(opt =>
                    opt.setName('message_id').setDescription('ה-ID של הודעת ההגרלה').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('delete')
                .setDescription('מחיקת הגרלה')
                .addStringOption(opt =>
                    opt.setName('message_id').setDescription('ה-ID של הודעת ההגרלה').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('הצגת כל ההגרלות הפעילות')),

    async execute(interaction) {
        if (!isOwner(interaction) && !isStaff(interaction.member)) {
            return replyNoPermission(interaction);
        }

        const sub = interaction.options.getSubcommand();
        const config = getConfig();

        if (sub === 'start') {
            const prize = interaction.options.getString('prize');
            const durationStr = interaction.options.getString('duration');
            const winnerCount = interaction.options.getInteger('winners') || 1;
            const duration = parseTime(durationStr);

            if (!duration) {
                return interaction.reply({
                    content: '❌ פורמט זמן לא חוקי. השתמש ב: `1s`, `30m`, `1h`, `1d`',
                    ephemeral: true
                });
            }

            const endsAt = Date.now() + duration;

            const embed = new EmbedBuilder()
                .setTitle('🎉 הגרלה!')
                .setDescription(
                    `**פרס:** ${prize}\n` +
                    `**זוכים:** ${winnerCount}\n` +
                    `**מסתיים:** <t:${Math.floor(endsAt / 1000)}:R> (<t:${Math.floor(endsAt / 1000)}:f>)\n\n` +
                    `לחץ על 🎉 להשתתפות!`
                )
                .setColor(0xf1c40f)
                .setTimestamp(endsAt)
                .setFooter({ text: `מתארגן על ידי ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            if (config.serverImage) embed.setThumbnail(config.serverImage);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('PLACEHOLDER')
                    .setLabel('השתתף')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
            );

            await interaction.reply({ content: '✅ ההגרלה נוצרת...', ephemeral: true });

            const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

            // Update button with actual message ID
            const joinRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`giveaway_join_${msg.id}`)
                    .setLabel('השתתף')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Primary)
            );

            await msg.edit({ components: [joinRow] });

            createGiveaway(msg.id, {
                prize,
                winnerCount,
                endsAt,
                channelId: interaction.channelId,
                guildId: interaction.guildId,
                hostId: interaction.user.id,
                messageId: msg.id
            });

            // Schedule end
            setTimeout(async () => {
                const giveaway = getGiveaway(msg.id);
                if (!giveaway || !giveaway.active) return;

                const winners = pickWinners(giveaway, giveaway.winnerCount);
                updateGiveaway(msg.id, { active: false, winners });

                const endEmbed = new EmbedBuilder()
                    .setTitle('🎉 הגרלה הסתיימה!')
                    .setDescription(
                        `**פרס:** ${giveaway.prize}\n` +
                        `**זוכים:** ${winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'אין זוכים'}\n` +
                        `**משתתפים:** ${giveaway.participants.length}`
                    )
                    .setColor(0xe74c3c)
                    .setTimestamp();

                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`giveaway_join_${msg.id}`)
                        .setLabel('הגרלה הסתיימה')
                        .setEmoji('🎉')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

                await msg.edit({ embeds: [endEmbed], components: [disabledRow] });

                if (winners.length > 0) {
                    await interaction.channel.send(
                        `🎉 מזל טוב ${winners.map(id => `<@${id}>`).join(', ')}! זכיתם ב-**${giveaway.prize}**!`
                    );
                } else {
                    await interaction.channel.send('😔 ההגרלה הסתיימה ללא משתתפים.');
                }
            }, duration);

            return;
        }

        if (sub === 'end') {
            const messageId = interaction.options.getString('message_id');
            const giveaway = getGiveaway(messageId);

            if (!giveaway) {
                return interaction.reply({ content: '❌ הגרלה לא נמצאה.', ephemeral: true });
            }
            if (!giveaway.active) {
                return interaction.reply({ content: '❌ ההגרלה כבר הסתיימה.', ephemeral: true });
            }

            const winners = pickWinners(giveaway, giveaway.winnerCount);
            updateGiveaway(messageId, { active: false, winners });

            try {
                const channel = await interaction.guild.channels.fetch(giveaway.channelId);
                const msg = await channel.messages.fetch(messageId);

                const endEmbed = new EmbedBuilder()
                    .setTitle('🎉 הגרלה הסתיימה!')
                    .setDescription(
                        `**פרס:** ${giveaway.prize}\n` +
                        `**זוכים:** ${winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'אין זוכים'}\n` +
                        `**משתתפים:** ${giveaway.participants.length}`
                    )
                    .setColor(0xe74c3c)
                    .setTimestamp();

                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`giveaway_join_${messageId}`)
                        .setLabel('הגרלה הסתיימה')
                        .setEmoji('🎉')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

                await msg.edit({ embeds: [endEmbed], components: [disabledRow] });

                if (winners.length > 0) {
                    await channel.send(`🎉 מזל טוב ${winners.map(id => `<@${id}>`).join(', ')}! זכיתם ב-**${giveaway.prize}**!`);
                }
            } catch {}

            return interaction.reply({ content: '✅ ההגרלה הסתיימה!', ephemeral: true });
        }

        if (sub === 'reroll') {
            const messageId = interaction.options.getString('message_id');
            const giveaway = getGiveaway(messageId);

            if (!giveaway) {
                return interaction.reply({ content: '❌ הגרלה לא נמצאה.', ephemeral: true });
            }

            const newWinners = pickWinners(giveaway, giveaway.winnerCount);

            if (newWinners.length === 0) {
                return interaction.reply({ content: '❌ אין משתתפים לבחור מהם.', ephemeral: true });
            }

            updateGiveaway(messageId, { winners: newWinners });

            await interaction.reply({
                content: `🎉 **זוכים חדשים נבחרו!**\n${newWinners.map(id => `<@${id}>`).join(', ')} — מזל טוב על הזכייה ב-**${giveaway.prize}**!`
            });
        }

        if (sub === 'delete') {
            const messageId = interaction.options.getString('message_id');
            const giveaway = getGiveaway(messageId);

            if (!giveaway) {
                return interaction.reply({ content: '❌ הגרלה לא נמצאה.', ephemeral: true });
            }

            deleteGiveaway(messageId);

            try {
                const channel = await interaction.guild.channels.fetch(giveaway.channelId);
                const msg = await channel.messages.fetch(messageId);
                await msg.delete();
            } catch {}

            return interaction.reply({ content: '✅ ההגרלה נמחקה.', ephemeral: true });
        }

        if (sub === 'list') {
            const giveaways = listGiveaways();
            const activeList = Object.entries(giveaways).filter(([, g]) => g.active);

            if (activeList.length === 0) {
                return interaction.reply({ content: '📋 אין הגרלות פעילות כרגע.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('🎉 הגרלות פעילות')
                .setColor(0xf1c40f)
                .setTimestamp();

            for (const [msgId, g] of activeList) {
                embed.addFields({
                    name: `🎁 ${g.prize}`,
                    value: `📨 ID: \`${msgId}\`\n👥 משתתפים: ${g.participants.length}\n⏰ מסתיים: <t:${Math.floor(g.endsAt / 1000)}:R>\n🏆 זוכים: ${g.winnerCount}`,
                    inline: false
                });
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
