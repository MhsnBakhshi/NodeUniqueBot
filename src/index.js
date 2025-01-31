const { Telegraf, Markup } = require("telegraf");
const { connectToDB } = require("./db");
const { insertUser, getUserRole } = require("./utils/qurey");
const { checkUserMembership, sendAdminKeyBoard } = require("./utils/actions");

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

bot.action("panel_admin", async (ctx) => {
  ctx.sendChatAction("typing");
  ctx.deleteMessage();
  sendAdminKeyBoard(ctx);
});

bot.hears("فوروارد همگانی 📨", (ctx) => {
  // codes
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

connectToDB();
console.log("Bot Running");
bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
