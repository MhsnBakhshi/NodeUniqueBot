const rqeuiredChannels = ["@NodeUnique"];
const moment = require("moment-timezone");
const { Markup } = require("telegraf");
const { findByChatID } = require("./qurey");
const { prisma } = require("../db");

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
        [Markup.button.callback("ورود به پنل مدیریت | 🔐", "panel_admin")],
        [Markup.button.callback("➖➖➖➖➖➖➖➖➖➖", "none")],
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
          [
            { text: "👤 | پروفایل", callback_data: "myProfile" },
            { text: "🫂 | هم تیمی یاب", callback_data: "team_mate" },
          ],

          [
            { text: "📑 | مقاله یاب", callback_data: "none" },
            { text: "🗂 | سورس یاب", callback_data: "none" },
            { text: "📮| پکیج یاب", callback_data: "none" },
          ],

          [{ text: "💰 | شغل یاب", callback_data: "none" }],
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


const findTeamMateFromUserProfileStack = async (ctx) => {
  const user = await findByChatID(Number(ctx.callbackQuery?.from?.id));

  const userStack = await prisma.userStack.findMany({
    where: { user_id: user.id },
  });

  if (userStack.length === 0) {
    await ctx.sendChatAction("typing");

    return ctx.editMessageText(
      "شما هنوز پروفایل خود را کامل نکردید! \n برای استفاده از این بخش باید پروفایل خود را کامل کنید",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⏮ | رفتن به پروفایل", callback_data: "myProfile" }],
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  let matchedUsers = new Set();

  for (const stack of userStack) {
    const teamMateStack = await prisma.userStack.findMany({
      where: {
        stack_id: stack.stack_id,
      },
      select: {
        user_id: true,
      },
    });

    teamMateStack.forEach((mate) => {
      if (mate.user_id !== user.id) {
        matchedUsers.add(mate.user_id);
      }
    });
  }

  if (matchedUsers.size === 0) {
    await ctx.sendChatAction("typing");

    return ctx.editMessageText(
      "متاسفانه کاربری با حوزه شما در ربات وجود ندارد :(",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const matchedUserDetails = await prisma.user.findMany({
    where: {
      id: { in: Array.from(matchedUsers) },
    },
  });

  let response = "🔎کاربران هم‌حوزه شما:\n\n";

  matchedUserDetails.forEach((mateInfo) => {
    let linkedin = mateInfo.linkedin
      ? `\n🔹 لینکدین: ${mateInfo.linkedin}`
      : "";
    let github = mateInfo.gitHub ? `\n🔹 گیتهاب: ${mateInfo.gitHub}` : "";
    let city = mateInfo.address ? `\n📍 محل سکونت: ${mateInfo.address}` : "";

    response += `👤 اسم: ${mateInfo.name}
    🔗 <a href="tg://openmessage?user_id=${mateInfo.chat_id}">پیوی ${mateInfo.name}</a>${linkedin}${github}${city}\n\n`;
  });

  await ctx.sendChatAction("typing");
  ctx.editMessageText("⌛️ درحال جستجو ... ممکن است کمی زمان بر باشد ⏳");

  await ctx.sendChatAction("typing");
  ctx.deleteMessage();

  return ctx.reply(response, {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
    parse_mode: "HTML",
  });
}

module.exports = {
  checkUserMembership,
  sendAdminKeyBoard,
  findTeamMateFromUserProfileStack,
  sendMainKeyboard,
  sendUserKeyboard,
  sendStackKeyBoard,
  calculateTimestampToIranTime,
};
