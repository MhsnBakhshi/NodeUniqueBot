const { Telegraf, Markup } = require("telegraf");
const { connectToDB, redis } = require("./db");
const {
  insertUser,
  getUserRole,
  getAllChatID,
  findByChatID,
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

bot.start(async (ctx) => {
  const time = calculateTimestampToIranTime(Date.now());
  const { role } = await getUserRole(ctx);
  if (role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply(
      `سلام ${ctx.chat.first_name} عزیز. \n به ربات نود یونیک خوش اومدی یکی از گزینه های زیر رو انتخاب کن:`,
      Markup.inlineKeyboard([
        [Markup.button.callback("ورود به پنل مدیریت | 🔐", "panel_admin")],
        [Markup.button.callback("➖➖➖➖➖➖➖➖➖➖", "none")],
        [Markup.button.callback(time, "none")],
      ])
    );
  } else {
    ctx.sendChatAction("typing");
    ctx.reply(
      `سلام ${ctx.chat.first_name} عزیز. \n به ربات نود یونیک خوش اومدی یکی از گزینه های زیر رو انتخاب کن:`,
      Markup.inlineKeyboard([
        [Markup.button.callback("➖➖➖➖➖➖➖➖➖➖", "none")],
        [Markup.button.callback(time, "show_time")],
      ])
    );
  }
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
bot.hears("🔙 | بازگشت", async (ctx) => {
  ctx.sendChatAction("typing");
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    sendAdminKeyBoard(ctx);
  }
});

bot.on("message", async (ctx) => {
  const userRole = await getUserRole(ctx);
  const sendMessageStep = await redis.get("sendMessageStep");

  if (!sendMessageStep) return;

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
});

connectToDB();
bot.launch().then(console.log("Bot Running"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
