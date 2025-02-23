const rqeuiredChannels = ["@NodeUnique"];
const moment = require("moment-timezone");
const { Markup } = require("telegraf");

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
        [{ text: "👤 | تنظیمات ادمین ها" }, { text: "💻 | تنظیمات حوزه ها" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
};
const sendMainKeyboard = (ctx, role, date, time) => {
  if (role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply(
      `سلام ${ctx.chat.first_name} عزیز. \n به ربات نود یونیک خوش اومدی یکی از گزینه های زیر رو انتخاب کن:`,
      Markup.inlineKeyboard([
        [Markup.button.callback("➖➖➖➖➖➖➖➖➖➖", "none")],
        [
          Markup.button.callback("ورود به پنل کاربری | 🔰", "panel_user"),
          Markup.button.callback("ورود به پنل مدیریت | 🔐", "panel_admin"),
        ],
        [Markup.button.callback("➖➖➖➖➖➖➖➖➖➖", "none")],

        [
          Markup.button.callback(date, "none"),
          Markup.button.callback("📆 تاریخ", "none"),
        ],
        [
          Markup.button.callback(time, "none"),
          Markup.button.callback("⏰ زمان", "none"),
        ],
      ])
    );
  } else {
    ctx.sendChatAction("typing");
    ctx.reply(
      `سلام ${ctx.chat.first_name} عزیز. \n به ربات نود یونیک خوش اومدی یکی از گزینه های زیر رو انتخاب کن:`,
      Markup.inlineKeyboard([
        [Markup.button.callback("ورود به پنل کاربری | 🔰", "panel_user")],
        [Markup.button.callback("➖➖➖➖➖➖➖➖➖➖", "none")],
        [
          Markup.button.callback(date, "none"),
          Markup.button.callback("📆 تاریخ", "none"),
        ],
        [
          Markup.button.callback(time, "none"),
          Markup.button.callback("⏰ زمان", "none"),
        ],
      ])
    );
  }
};

const sendUserKeyboard = (ctx) => {
  ctx.editMessageText(
    `🌹 | به پنل کاربری خوش اومدی ${ctx.chat.first_name} عزیز.\nیکی از گزینه های زیر را انتخاب کن:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به منو", callback_data: "backMainMenue" }],
          [{ text: "👤 | پروفایل", callback_data: "myProfile" }],
          [
            {
              text: "👨‍💻 | ارتباط با برنامه نویس",
              callback_data: "contactToDev",
            },
          ],
        ],
      },
    }
  );
};

const sendStackKeyBoard = (ctx) => {
  return ctx.reply("👈🏻 | گزینه مورد نظر را انتخاب کنید", {
    reply_markup: {
      keyboard: [
        [{ text: "🖥 | لیست حوزها" }],
        [{ text: "➕ | افزودن حوزه" }, { text: "✏ | ویرایش حوزه" }],
        [{ text: "❌ | حذف حوزه" }],
        [{ text: "🔙 | بازگشت" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
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

  const date = `${dayOfWeek} ${formattedDate}`;
  const time = `ساعت ${formattedTime}`;

  return { date, time };
};

module.exports = {
  checkUserMembership,
  sendAdminKeyBoard,
  sendMainKeyboard,
  sendUserKeyboard,
  sendStackKeyBoard,
  calculateTimestampToIranTime,
};
