const { Telegraf, Markup } = require("telegraf");
const { connectToDB, redis } = require("./db");
const {
  insertUser,
  getUserRole,
  getAllChatID,
  findByChatID,
  findAndRemove,
  findAndChangeRole,
  getAllAdmins,
  isUserBanned,
  banUser,
  getAllBans,
} = require("./utils/qurey");
const {
  checkUserMembership,
  sendAdminKeyBoard,
  sendMainKeyboard,
  calculateTimestampToIranTime,
} = require("./utils/actions");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(async (ctx, next) => {
  await insertUser(ctx);

  const isMemberJoined = await checkUserMembership(ctx);
  if (isMemberJoined) {
    return next();
  } else {
    ctx.reply(
      `سلام ${ctx.chat.first_name} عزیز،
        برای استفاده از ربات میبایست داخل کانال تلگرام نود یونیک عضو باشید، سپس مجدد /start نمایید.`,
      Markup.inlineKeyboard([
        [Markup.button.url("کانال نود یونیک", "https://t.me/NodeUnique")],
      ])
    );
  }
});

bot.use(async (ctx, next) => {
  const userId = ctx.message?.chat?.id || ctx.callbackQuery?.from?.id;

  const checkIsUserBan = await isUserBanned(parseInt(userId));

  if (!checkIsUserBan) {
    return next();
  }

  ctx.reply(
    "🤷‍♂️ | متأسفانه شما از طرف ادمین ربات مسدود شدید، اگه فکر میکنین اشتباهی رخ داده به ادمین ربات مراجعه کنید.",
    Markup.inlineKeyboard([
      [Markup.button.url("ارتباط با ادمین", "https://t.me/iDvMH")],
    ])
  );
});

bot.start(async (ctx) => {
  const { date, time } = calculateTimestampToIranTime(Date.now());
  const { role } = await getUserRole(ctx);
  sendMainKeyboard(ctx, role, date, time);
});

bot.command("donit", (ctx) => {
  ctx.reply(`${ctx.chat.first_name} عزیز، 
برای حمایت از ربات میتوانید یکی از راه ها را انتخاب نمایید. حمایت شما باعث دلگرمی برنامه نویس ربات است.🙏❤️

1) بوست کردن کانال تلگرام (کاربران پریموم)
- https://t.me/boost/NodeUnique
2) دونیت قهوه برای برنامه نویس 
- https://www.coffeete.ir/MhsnBakhshi
3) دادن 🌟 به ریپو گیت هاب ربات
- https://github.com/MhsnBakhshi/NodeUniqueBot`);
});

bot.action("panel_admin", async (ctx) => {
  ctx.sendChatAction("typing");
  ctx.deleteMessage();
  sendAdminKeyBoard(ctx);
});

let isSentForwardTextFlag = false;
bot.hears("📬 | فوروارد همگانی", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply("پیام مورد نظرتو بفرست:", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
    isSentForwardTextFlag = true;
  }
});
bot.hears("✉ | پیام همگانی", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply("پیام مورد نظرتو بفرست:", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
    await redis.setex("sendMessageUsersStep", 120, "WAITING_FOR_MESSAGE");
  }
});

bot.hears("👤 | لیست کاربران", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");

    const users = await getAllChatID();
    let chatIDList = "لیست کاربران به شرح زیر می‌باشد:\n\n";

    users.forEach((user, index) => {
      chatIDList +=
        `${index + 1}` + " - " + "`" + `${user.chat_id}` + "`" + "\n";
    });

    ctx.reply(chatIDList, {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
      parse_mode: "Markdown",
    });
  }
});

bot.hears("📩 | پیام به کاربر", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply("آیدی عددی کاربر رو بفرست:", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
    await redis.setex("sendMessageStep", 120, "WAITING_FOR_CHATID");
  }
});

bot.hears("🚨 | حذف کاربر", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply(
      "🔰 آیدی عددی فرد مورد نظر را جهت حذف شدن ارسال کنید.\n🚨 هشدار کاربر بصورت کامل از لیست کاربران حذف میشود.",
      {
        reply_markup: {
          keyboard: [[{ text: "🔙 | بازگشت" }]],
          resize_keyboard: true,
          remove_keyboard: true,
        },
      }
    );
    await redis.setex("removeUserStep", 120, "WAITING_FOR_CHATID");
  }
});
bot.hears("🆔 | آیدی یاب", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply("آیدی عددی کاربر رو بفرست:", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
    await redis.setex("findUserStep", 120, "WAITING_FOR_CHATID");
  }
});
bot.hears("👤 | تنظیمات ادمین ها", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply("👈🏻 | گزینه مورد نظر را انتخاب کنید", {
      reply_markup: {
        keyboard: [
          [{ text: "👤 لیست ادمین ها" }],
          [{ text: "➖حذف ادمین" }, { text: "➕افزودن ادمین" }],
          [{ text: "🔙 | بازگشت" }],
        ],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
  }
});

bot.hears("👤 لیست ادمین ها", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");

    const admins = await getAllAdmins();
    let chatIDList = "لیست ادمین ها به شرح زیر می‌باشد:\n\n";

    admins.forEach((admin, index) => {
      chatIDList +=
        `${index + 1}` + " - " + "`" + `${admin.chat_id}` + "`" + "\n";
    });

    ctx.reply(chatIDList, {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
      parse_mode: "Markdown",
    });
  }
});

bot.hears("➕افزودن ادمین", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply(
      "🔰 آیدی عددی فرد مورد نظر را جهت ادمین شدن در ربات ارسال کنید.",
      {
        reply_markup: {
          keyboard: [[{ text: "🔙 | بازگشت" }]],
          resize_keyboard: true,
          remove_keyboard: true,
        },
      }
    );

    await redis.setex("addAdminStep", 120, "WAITING_FOR_CHATID");
  }
});

bot.hears("➖حذف ادمین", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply(
      "🔰 آیدی عددی فرد مورد نظر را جهت حذف ادمین در ربات ارسال کنید.",
      {
        reply_markup: {
          keyboard: [[{ text: "🔙 | بازگشت" }]],
          resize_keyboard: true,
          remove_keyboard: true,
        },
      }
    );

    await redis.setex("removeAdminStep", 120, "WAITING_FOR_CHATID");
  }
});

bot.hears("🔰 | بلاک و آنبلاک‌ کاربر | 🔰", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply("👈🏻 | گزینه مورد نظر را انتخاب کنید", {
      reply_markup: {
        keyboard: [
          [{ text: "⭕️| لیست مسدودی ها" }],
          [{ text: "🚫| مسدود کردن" }, { text: "♻️| آزاد سازی" }],
          [{ text: "🔙 | بازگشت" }],
        ],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
  }
});

bot.hears("⭕️| لیست مسدودی ها", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");

    const bans = await getAllBans();
    let chatIDList = "💢 لیست مسدودی ها به شرح زیر میباشد:\n\n";

    bans.forEach((ban, index) => {
      chatIDList +=
        `${index + 1}` + " - " + "`" + `${ban.chat_id}` + "`" + "\n";
    });

    ctx.reply(chatIDList, {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
      parse_mode: "Markdown",
    });
  }
});

bot.hears("♻️| آزاد سازی", async (ctx) => {
  // codes
});

bot.hears("🚫| مسدود کردن", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply(
      "👈🏻 | آیدی عددی فرد جهت مسدود کردن را ارسال نمایید.\n\n⚠️ نکته: کاربر از لیست کاربران حذف نمیشود فقط دسترسی استفاده از ربات گرفته میشود.",
      {
        reply_markup: {
          keyboard: [[{ text: "🔙 | بازگشت" }]],
          resize_keyboard: true,
          remove_keyboard: true,
        },
      }
    );

    await redis.setex("blockUserStep", 120, "WAITING_FOR_CHATID");
  }
});

bot.hears("🔙 | بازگشت", async (ctx) => {
  ctx.sendChatAction("typing");
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    sendAdminKeyBoard(ctx);
  }
});
bot.hears("🔙 | بازگشت به منو", async (ctx) => {
  ctx.sendChatAction("typing");
  const { date, time } = calculateTimestampToIranTime(Date.now());
  const { role } = await getUserRole(ctx);
  sendMainKeyboard(ctx, role, date, time);
});

bot.on("message", async (ctx) => {
  const userRole = await getUserRole(ctx);
  const sendMessageStep = await redis.get("sendMessageStep");
  const findUserStep = await redis.get("findUserStep");
  const removeUserStep = await redis.get("removeUserStep");
  const sendMessageUsersStep = await redis.get("sendMessageUsersStep");
  const addAdminStep = await redis.get("addAdminStep");
  const removeAdminStep = await redis.get("removeAdminStep");
  const blockUserStep = await redis.get("blockUserStep");

  if (isSentForwardTextFlag && userRole.role === "ADMIN") {
    const users = await getAllChatID();

    ctx.sendChatAction("typing");
    ctx.reply("درحال فوروارد متن مورد نظر ....");

    for (const user of users) {
      const chatId = Number(user.chat_id);
      try {
        await bot.telegram.forwardMessage(
          chatId,
          ctx.message.chat.id,
          ctx.message.message_id
        );
      } catch (error) {
        ctx.sendChatAction("typing");
        ctx.reply(`خطا در فوروارد پیام. ${error}`);
      }
    }
    ctx.sendChatAction("typing");
    ctx.reply("فوروارد با موفقیت به تمامی کاربران ارسال شد.");
    isSentForwardTextFlag = false;
  }
  if (sendMessageStep === "WAITING_FOR_CHATID") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const chatIdInput = ctx.message.text;
    const isValidChatId = parseInt(chatIdInput);

    if (isNaN(isValidChatId)) return ctx.reply("ایدی فرد درست نمیباشد!");

    const user = await findByChatID(isValidChatId);
    if (!user) {
      ctx.reply("کاربری با ایدی مورد نظر یافت نشد!", {
        reply_markup: {
          keyboard: [[{ text: "🔙 | بازگشت" }]],
          resize_keyboard: true,
          remove_keyboard: true,
        },
      });
      return;
    }
    await redis.setex("sentChatId", 120, isValidChatId);
    await redis.setex("sendMessageStep", 120, "WAITING_FOR_MESSAGE");

    ctx.sendChatAction("typing");
    ctx.reply("حالا متن مورد نظرتو بفرست:");
  }

  if (sendMessageStep === "WAITING_FOR_MESSAGE") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const text = ctx.message.text;

    try {
      const sentChatId = await redis.get("sentChatId");
      ctx.telegram.sendMessage(sentChatId, text);
      ctx.sendChatAction("typing");
      ctx.reply("با موفقیت ارسال شد. ✔");

      await redis.del("sendMessageStep");
      await redis.del("sentChatId");
    } catch (error) {
      ctx.reply("خطا در ارسال پیام");
      console.log("error on send message", error);
    }
  }

  if (findUserStep === "WAITING_FOR_CHATID") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const chatId = ctx.message.text;
    try {
      const { bio, username, first_name } = await ctx.telegram.getChat(chatId);

      const response = `
    👤نام کاربر: ${first_name}\n🆔 ایدی کاربر: ${chatId}\n🔖 یوزرنیم کاربر: @${
        username ? username : "یوزرنیم ندارد"
      }\n 📚 بیو کاربر: ${
        bio ? bio : "بیو ندارد"
      }\n\n <a href= "tg://openmessage?user_id=${chatId}">پیوی کاربر </a>
    `;

      ctx.reply(response, { parse_mode: "HTML" });
      await redis.del("findUserStep");
    } catch (error) {
      ctx.reply("کاربر یافت نشد ❌");
    }
  }

  if (removeUserStep === "WAITING_FOR_CHATID") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const chatIdInput = parseInt(ctx.message.text);

    if (isNaN(chatIdInput)) return ctx.reply("ایدی فرد درست نمیباشد!");

    await findAndRemove(chatIdInput, ctx);
  }

  if (sendMessageUsersStep === "WAITING_FOR_MESSAGE") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const text = ctx.message.text;
    const users = await getAllChatID();

    ctx.sendChatAction("typing");
    ctx.reply("درحال ارسال پیام مورد نظر ....");

    for (const user of users) {
      const chatId = Number(user.chat_id);
      try {
        await bot.telegram.sendMessage(chatId, text);
      } catch (error) {
        ctx.sendChatAction("typing");
        ctx.reply(`خطا در ارسال پیام. ${error}`);
      }
    }
    ctx.sendChatAction("typing");
    ctx.reply("پیام با موفقیت به تمامی کاربران ارسال شد.");
    await redis.del("sendMessageUsersStep");
  }

  if (addAdminStep === "WAITING_FOR_CHATID") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const chatID = parseInt(ctx.message.text);

    if (isNaN(chatID)) return ctx.reply("ایدی فرد درست نمیباشد!");

    await findAndChangeRole(chatID, ctx, "ADMIN", "کاربر با موفقیت ادمین شد ✔");
    await redis.del("addAdminStep");
  }

  if (removeAdminStep === "WAITING_FOR_CHATID") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const chatID = parseInt(ctx.message.text);

    if (isNaN(chatID)) return ctx.reply("ایدی فرد درست نمیباشد!");

    await findAndChangeRole(
      chatID,
      ctx,
      "USER",
      "کاربر با موفقیت از ادمین ها حذف شد ✔"
    );
    await redis.del("removeAdminStep");
  }

  if (blockUserStep === "WAITING_FOR_CHATID") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const chatID = parseInt(ctx.message.text);

    if (isNaN(chatID)) return ctx.reply("ایدی فرد درست نمیباشد!");

    await banUser(ctx, chatID);
    await redis.del("blockUserStep");
  }
});

connectToDB();
bot.launch().then(console.log("Bot Running"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
