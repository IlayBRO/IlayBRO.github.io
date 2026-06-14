const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('קבלת רשימת כל הפקודות הזמינות (נשלח ב-DM)'),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        const config = getConfig();

        const commandDescriptions = {
            'ilay': '🔧 **הגדרות מתקדמות** — תמונת שרת, אימוג\'י, ערוץ פקודות (בעל שרת)',
            'addemoji': '😀 **הוספת אימוג\'י** — העלאת אימוג\'י חדש לשרת',
            'removeemoji': '🗑️ **מחיקת אימוג\'י** — מחיקת אימוג\'י קיים מהשרת',
            'renameemoji': '✏️ **שינוי שם אימוג\'י** — שינוי שם אימוג\'י קיים',
            'setups-verify': '✅ **פאנל אימות** — שליחת פאנל אימות לערוץ',
            'setups ticket': '🎫 **פאנל טיקטים** — שליחת מערכת טיקטים לערוץ',
            'dmall': '📢 **הודעה לכולם** — שליחת DM לכל חברי השרת (בעל שרת)',
            'warning': '⚠️ **תזכורת לטיקט** — שליחת תזכורת פרטית לפותח הטיקט (בטיקט בלבד)',
            'info': '📊 **סטטיסטיקות** — הצגת מידע ונתוני החנות בזמן אמת',
            'invites': '📨 **הזמנות** — בדיקת סטטיסטיקות ההזמנות שלך',
            'giveaway start': '🎉 **פתיחת הגרלה** — פתיחת הגרלה חדשה עם פרס וזמן',
            'giveaway end': '🏁 **סיום הגרלה** — סיום מיידי של הגרלה פעילה',
            'giveaway reroll': '🔄 **זוכה מחדש** — בחירת זוכה חדש להגרלה שהסתיימה',
            'giveaway delete': '🗑️ **מחיקת הגרלה** — מחיקת הגרלה קיימת',
            'giveaway list': '📋 **רשימת הגרלות** — הצגת כל ההגרלות הפעילות',
            'help': '❓ **עזרה** — הצגת רשימת פקודות זו',
        };

        const embed = new EmbedBuilder()
            .setTitle('📋 רשימת הפקודות')
            .setDescription('כל הפקודות הזמינות בבוט:')
            .setColor(0x5865f2)
            .setTimestamp()
            .setFooter({ text: `${interaction.guild.name} Bot`, iconURL: interaction.guild.iconURL() });

        for (const [name, desc] of Object.entries(commandDescriptions)) {
            embed.addFields({ name: `/${name}`, value: desc, inline: false });
        }

        if (config.serverImage) {
            embed.setThumbnail(config.serverImage);
        }

        try {
            await interaction.user.send({ embeds: [embed] });
            return interaction.editReply({ content: '✅ רשימת הפקודות נשלחה אליך ב-DM!' });
        } catch {
            return interaction.editReply({
                content: '❌ לא ניתן לשלוח לך DM. בדוק שה-DM שלך פתוח.',
                embeds: [embed]
            });
        }
    }
};
