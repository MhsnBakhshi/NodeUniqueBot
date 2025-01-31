const { Telegraf, Markup } = require("telegraf");
const { connectToDB, redis } = require("./db");
const { insertUser, getUserRole, getAllChatID } = require("./utils/qurey");
const {
  checkUserMembership,
  sendAdminKeyBoard,
  sendMainKeyboard,
} = require("./utils/actions");

const bot = new Telegraf(process.env.BOT_TOKEN);

let isSentForwardTextFlag = false;
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
  const { role } = await getUserRole(ctx);
  if (role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply(
      `سلام ${ctx.chat.first_name} عزیز. \n به ربات نود یونیک خوش اومدی یکی از گزینه های زیر رو انتخاب کن:`,
      Markup.inlineKeyboard([
        [Markup.button.callback("ورود به پنل مدیریت | 🔐", "panel_admin")],
      ])
    );
  } else {
    ctx.sendChatAction("typing");
    ctx.reply(
      `سلام ${ctx.chat.first_name} عزیز. \n به ربات نود یونیک خوش اومدی یکی از گزینه های زیر رو انتخاب کن:`
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

bot.hears("لیست کاربران | 👤", async (ctx) => {
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

bot.hears("🔙 | بازگشت", async (ctx) => {
  ctx.sendChatAction("typing");
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    sendAdminKeyBoard(ctx);
  }
});

bot.on("message", async (ctx) => {
  if (isSentForwardTextFlag) {
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
});

connectToDB();
bot.launch().then(console.log("Bot Running"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
