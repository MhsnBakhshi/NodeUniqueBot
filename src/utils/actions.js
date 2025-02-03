const rqeuiredChannels = ["@NodeUnique"];
const moment = require("moment-timezone");

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
        [{ text: "🔰 | بلاک و آنبلاک‌ کاربر | 🔰" }],
        [
          { text: "📬 | فوروارد همگانی" },
          { text: "✉ | پیام همگانی" },
          { text: "📩 | پیام به کاربر" },
        ],
        [
          { text: "👤 | لیست کاربران" },
          { text: "🆔 | آیدی یاب" },
          { text: "🚨 | حذف کاربر" },
        ],
        [{ text: "👤 | تنظیمات ادمین ها" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
};
const sendMainKeyboard = (ctx) => {
  // codes
};

const calculateTimestampToIranTime = (timestamp) => {
  const daysOfWeekInPersian = [
    "شنبه", // Sunday
    "یکشنبه", // Monday
    "دوشنبه", // Tuesday
    "سه‌شنبه", // Wednesday
    "چهارشنبه", // Thursday
    "پنج‌شنبه", // Friday
    "جمعه", // Saturday
  ];
  const iranTime = moment.utc(timestamp).tz("Asia/Tehran");

  let dayOfWeekIndex = iranTime.day();

  dayOfWeekIndex = (dayOfWeekIndex + 1) % 7;

  const dayOfWeek = daysOfWeekInPersian[dayOfWeekIndex];
  const formattedDate = iranTime.format("YYYY/MM/DD");
  const formattedTime = iranTime.format("HH:mm:ss");

  const message = ` امروز ${dayOfWeek} مورخ ${formattedDate} ساعت ${formattedTime}`;

  return message;
};

module.exports = {
  checkUserMembership,
  sendAdminKeyBoard,
  sendMainKeyboard,
  calculateTimestampToIranTime,
};
