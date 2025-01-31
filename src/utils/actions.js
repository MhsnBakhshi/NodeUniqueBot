const rqeuiredChannels = ["@NodeUnique"];

const checkUserMembership = async function (ctx) {
  try {
    const userId = ctx.message?.chat?.id || ctx.callbackQuery?.from?.id;

    let isMember = true;

    for (const channel of rqeuiredChannels) {
      const member = await ctx.telegram.getChatMember(channel, userId);
      if (member.status == "left" || member.status == "kicked") {
        isMember = false;
        break;
      }
    }

    return isMember;
  } catch (error) {
    console.log(error);
  }
};

const sendAdminKeyBoard = (ctx) => {
  return ctx.reply("به پنل مدیریت خوش اومدی: \n یه گزینه انتخاب کن:", {
    reply_markup: {
      keyboard: [
        [{ text: "🔙 | بازگشت به منو" }],
        [
          { text: "📬 | فوروارد همگانی" },
          { text: "✉ | پیام همگانی" },
          { text: "📩 | پیام به کاربر" },
        ],
        [{ text: "لیست کاربران | 👤" }, { text: "🆔 | آیدی یاب" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
};
const sendMainKeyboard = (ctx) => {
  // codes
};

module.exports = {
  checkUserMembership,
  sendAdminKeyBoard,
  sendMainKeyboard,
};
