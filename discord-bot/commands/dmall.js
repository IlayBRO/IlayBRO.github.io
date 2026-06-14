const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../utils/config');
const { isOwner, replyNoPermission } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dmall')
        .setDescription('שליחת הודעה פרטית לכל חברי השרת (בעל שרת בלבד)')
        .addStringOption(opt =>
            opt.setName('message').setDescription('ההודעה לשליחה').setRequired(true)),

    async execute(interaction) {
        if (!isOwner(interaction)) return replyNoPermission(interaction);

        await interaction.deferReply({ ephemeral: true });

        const message = interaction.options.getString('message');
        const config = getConfig();

        const embed = new EmbedBuilder()
            .setTitle(`📢 הודעה מ-${interaction.guild.name}`)
            .setDescription(message)
            .setColor(0x5865f2)
            .setTimestamp()
            .setFooter({ text: `נשלח על ידי ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        if (config.serverImage) {
            embed.setImage(config.serverImage);
        }

        const members = await interaction.guild.members.fetch();
        let sent = 0, failed = 0;

        for (const [, member] of members) {
            if (member.user.bot) continue;
            try {
                await member.send({ embeds: [embed] });
                sent++;
                await new Promise(r => setTimeout(r, 100));
            } catch {
                failed++;
            }
        }

        return interaction.editReply({
            content: `✅ ההודעה נשלחה!\n📨 נשלח: **${sent}**\n❌ נכשל: **${failed}**`
        });
    }
};
