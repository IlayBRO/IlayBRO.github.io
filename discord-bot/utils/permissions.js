function isOwner(interaction) {
    return interaction.guild?.ownerId === interaction.user.id ||
        interaction.user.id === process.env.OWNER_ID;
}

function isStaff(member) {
    return member.permissions.has('ManageGuild') ||
        member.roles.cache.some(r => ['Staff', 'Admin', 'Moderator', 'מנהל', 'צוות'].includes(r.name));
}

async function replyNoPermission(interaction) {
    await interaction.reply({
        content: '❌ אין לך הרשאה להשתמש בפקודה זו.',
        ephemeral: true
    });
}

async function replyWrongChannel(interaction) {
    await interaction.reply({
        content: '❌ פקודה זו אינה זמינה בערוץ הנוכחי.',
        ephemeral: true
    });
}

module.exports = { isOwner, isStaff, replyNoPermission, replyWrongChannel };
