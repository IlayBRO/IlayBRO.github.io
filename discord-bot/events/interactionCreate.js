const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getConfig, updateConfig } = require('../utils/config');
const { getGiveaway, updateGiveaway, pickWinners } = require('../utils/giveawayManager');
const { isStaff, replyNoPermission } = require('../utils/permissions');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // --- Slash Commands ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            const config = getConfig();
            const isOwner = interaction.guild?.ownerId === interaction.user.id ||
                interaction.user.id === process.env.OWNER_ID;

            // Check allowed channel (skip for admin commands)
            const ownerOnlyCommands = ['ilay', 'dmall', 'addemoji', 'removeemoji', 'renameemoji', 'setups-verify', 'setups', 'help'];
            if (
                config.commandsChannelId &&
                interaction.channelId !== config.commandsChannelId &&
                !ownerOnlyCommands.includes(interaction.commandName)
            ) {
                return interaction.reply({
                    content: `❌ פקודות זמינות רק בערוץ <#${config.commandsChannelId}>.`,
                    ephemeral: true
                });
            }

            try {
                await command.execute(interaction, client);
            } catch (err) {
                console.error(`Error in command ${interaction.commandName}:`, err);
                const msg = { content: '❌ אירעה שגיאה בביצוע הפקודה.', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(msg).catch(() => {});
                } else {
                    await interaction.reply(msg).catch(() => {});
                }
            }
            return;
        }

        // --- Button Interactions ---
        if (interaction.isButton()) {
            const [action, ...parts] = interaction.customId.split('_');

            // Verify button
            if (interaction.customId === 'verify_button') {
                const config = getConfig();
                if (!config.verifyRoleId) {
                    return interaction.reply({ content: '❌ תפקיד האימות לא הוגדר. בקש מהמנהל להגדיר אותו.', ephemeral: true });
                }
                const role = interaction.guild.roles.cache.get(config.verifyRoleId);
                if (!role) {
                    return interaction.reply({ content: '❌ תפקיד האימות לא נמצא.', ephemeral: true });
                }
                if (interaction.member.roles.cache.has(role.id)) {
                    return interaction.reply({ content: '✅ כבר אומתת!', ephemeral: true });
                }
                await interaction.member.roles.add(role);
                return interaction.reply({ content: `✅ אומתת בהצלחה! קיבלת את התפקיד ${role.name}.`, ephemeral: true });
            }

            // Ticket claim button
            if (interaction.customId.startsWith('ticket_claim_')) {
                const channelId = interaction.customId.replace('ticket_claim_', '');
                const config = getConfig();
                const ticket = config.tickets?.[channelId];

                if (!ticket) {
                    return interaction.reply({ content: '❌ הטיקט לא נמצא.', ephemeral: true });
                }

                if (interaction.user.id === ticket.openerId) {
                    return interaction.reply({
                        content: '❌ אינך יכול לקחת את הטיקט שלך עצמך.',
                        ephemeral: true
                    });
                }

                // Disable the button
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_claim_disabled')
                        .setLabel('נלקח')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                );

                await interaction.update({ components: [disabledRow] });

                await interaction.channel.send({
                    content: `<@${interaction.user.id}> לקח את הטיקט ✅`
                });

                // Update ticket in config
                updateConfig({
                    tickets: {
                        ...config.tickets,
                        [channelId]: { ...ticket, claimedBy: interaction.user.id }
                    }
                });
                return;
            }

            // Giveaway join button
            if (interaction.customId.startsWith('giveaway_join_')) {
                const messageId = interaction.customId.replace('giveaway_join_', '');
                const giveaway = getGiveaway(messageId);

                if (!giveaway) {
                    return interaction.reply({ content: '❌ ההגרלה לא נמצאה.', ephemeral: true });
                }
                if (!giveaway.active) {
                    return interaction.reply({ content: '❌ ההגרלה הסתיימה.', ephemeral: true });
                }

                if (giveaway.participants.includes(interaction.user.id)) {
                    // Toggle off
                    const updated = giveaway.participants.filter(id => id !== interaction.user.id);
                    updateGiveaway(messageId, { participants: updated });
                    return interaction.reply({
                        content: '✅ הוסרת מההגרלה.',
                        ephemeral: true
                    });
                }

                giveaway.participants.push(interaction.user.id);
                updateGiveaway(messageId, { participants: giveaway.participants });

                return interaction.reply({
                    content: `🎉 נרשמת להגרלה! סה"כ משתתפים: **${giveaway.participants.length}**`,
                    ephemeral: true
                });
            }
            return;
        }

        // --- Select Menu Interactions ---
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_category') {
                await interaction.deferReply({ ephemeral: true });

                const category = interaction.values[0];
                const categoryLabels = {
                    general: 'תמיכה כללית',
                    report: 'דיווח',
                    purchase: 'ביצוע רכישה',
                    collab: 'שיתוף פעולה'
                };
                const categoryLabel = categoryLabels[category] || category;

                const guild = interaction.guild;
                const member = interaction.member;

                // Find or create Tickets category
                let ticketCategory = guild.channels.cache.find(
                    c => c.type === ChannelType.GuildCategory && c.name === '🎫 טיקטים'
                );
                if (!ticketCategory) {
                    ticketCategory = await guild.channels.create({
                        name: '🎫 טיקטים',
                        type: ChannelType.GuildCategory,
                    });
                }

                // Create ticket channel
                const channelName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                const ticketChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: ticketCategory.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: member.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: guild.members.me.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                        },
                    ],
                });

                // Save ticket info
                const config = getConfig();
                updateConfig({
                    tickets: {
                        ...config.tickets,
                        [ticketChannel.id]: {
                            openerId: interaction.user.id,
                            guildId: guild.id,
                            category: categoryLabel,
                            createdAt: Date.now()
                        }
                    }
                });

                // Send welcome embed in ticket channel
                const claimButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket_claim_${ticketChannel.id}`)
                        .setLabel('קחו טיקט')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success)
                );

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle(`🎫 טיקט - ${categoryLabel}`)
                    .setDescription(`שלום <@${interaction.user.id}>!\nפתחת טיקט בנושא **${categoryLabel}**.\nצוות הסיוע יגיע בהקדם.`)
                    .setColor(0x2ecc71)
                    .setTimestamp()
                    .setFooter({ text: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

                await ticketChannel.send({ embeds: [welcomeEmbed], components: [claimButton] });

                await interaction.editReply({
                    content: `✅ נפתח טיקט: <#${ticketChannel.id}>`
                });
            }
        }
    }
};
