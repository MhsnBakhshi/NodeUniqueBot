const { Telegraf, Markup } = require("telegraf");
const { connectToDB, redis, prisma } = require("./db");
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
  unBanUser,
  findUserStacks,
  editGitHubLink,
  editLinkedin,
  editName,
  editCity,
  getAllStacks,
  editStacks,
  removeUserStacks,
  removeStackQuery,
  insertStack,
  checkIsStackInserted,
  editStackTitleQuery,
} = require("./utils/qurey");
const {
  checkUserMembership,
  sendAdminKeyBoard,
  sendMainKeyboard,
  calculateTimestampToIranTime,
  sendUserKeyboard,
  sendStackKeyBoard,
  findTeamMateFromUserProfileStack,
  findTeamMateFromUserRequstStack,
  validateProvince,
  validateTechnology,
  provinceList,
  technologyList,
  karboardWebsiteProvince,
} = require("./utils/actions");
const { scraperNPMPackages } = require("./scraping/package-scrap");

const bot = new Telegraf(process.env.BOT_TOKEN);

const fs = require("fs");
const {
  scrapArticlesFromDevToWebsite,
  scrapArticlesFromVirgoolWebsite,
  scrapArticlesFromBacancyWebsite,
  scrapSerachingArticleFromFreeCodeCamp,
} = require("./scraping/article-scrap");
const { scrapSourceCodeFromGitHub } = require("./scraping/source-scrap");
const {
  scrapJobFrom_E_Estekhdam,
  scrapJobsFrom_Karboard,
  scrapJobsFrom_JobVision,
  scrapJobsFrom_JobInja,
} = require("./scraping/job-scraping");
const { scrapOpenSourceFromGitHub } = require("./scraping/openSource-scrap");

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

bot.command("donate", (ctx) => {
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
    ctx.reply("👈🏻 | لطفا پیام موردنظرتون فوروارد نمایید.", {
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
    ctx.reply("👈🏻 | لطفا پیام موردنظرتون ارسال نمایید.", {
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
    ctx.reply("🔰 آیدی عددی فرد مورد نظر را جهت ارسال پیام ارسال کنید.", {
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
    ctx.reply("🔰 آیدی عددی فرد مورد نظر را ارسال کنید.", {
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
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply("👈🏻 | آیدی عددی فرد جهت رفع مسدودیت را ارسال نمایید.", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });

    await redis.setex("unBlockUserStep", 120, "WAITING_FOR_CHATID");
  }
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

bot.hears("💻 | تنظیمات حوزه ها", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    sendStackKeyBoard(ctx);
  }
});
bot.hears("❌ | حذف حوزه", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply("👈🏻 | آیدی حوزه را جهت حذف ارسال نمایید.", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });

    await redis.setex("removeStack", 120, "WAITING_FOR_STACKID");
  }
});

bot.hears("✏ | ویرایش حوزه", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply("👈🏻 | آیدی حوزه را ارسال نمایید.", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });

    await redis.setex("editStackTitleStep", 120, "WAITING_FOR_STACKID");
  }
});

bot.hears("➕ | افزودن حوزه", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply("👈🏻 | اسم حوزه را ارسال نمایید.", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });

    await redis.setex("addStack", 120, "WAITING_FOR_TITLE");
  }
});

bot.hears("🖥 | لیست حوزها", async (ctx) => {
  const userRole = await getUserRole(ctx);
  if (userRole.role === "ADMIN") {
    const stacks = await getAllStacks();

    let stackList = "💻 لیست حوزها به شرح زیر میباشد:\n\n";

    stacks.forEach((stack) => {
      stackList +=
        `🆔 ${stack.id}` + " -> " + "`" + `${stack.fields}` + "`" + "\n";
    });

    ctx.sendChatAction("typing");
    return ctx.reply(stackList, {
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
bot.hears("🔙 | بازگشت به منو", async (ctx) => {
  ctx.sendChatAction("typing");
  const { date, time } = calculateTimestampToIranTime(Date.now());
  const { role } = await getUserRole(ctx);
  sendMainKeyboard(ctx, role, date, time);
});

bot.action("panel_user", async (ctx) => {
  ctx.sendChatAction("typing");
  return sendUserKeyboard(ctx);
});

bot.action("backMainMenue", async (ctx) => {
  ctx.sendChatAction("typing");
  const { date, time } = calculateTimestampToIranTime(Date.now());
  const { role } = await getUserRole(ctx);

  ctx.deleteMessage();
  return sendMainKeyboard(ctx, role, date, time);
});

bot.action("myProfile", async (ctx) => {
  ctx.sendChatAction("typing");
  const chatID = ctx.callbackQuery.from.id;

  const user = await findByChatID(chatID);
  const stacks = await findUserStacks(user.id);
  const formattedStacks = stacks.map((stack) => stack.fields).join(", ");

  const { date, time } = calculateTimestampToIranTime(user.created_at);

  const response = `🖥 اطلاعات حساب کاربری شما به شرح زیر میباشد :

🔢 ایدی عددی شما : ${chatID}
🗣 نام شما : ${user.name}
🖇 یوزرنیم شما : @${ctx.callbackQuery.from.username ?? "❌"}
👁️‍🗨️ آدرس گیت هاب : ${user.gitHub ?? "❌"}
👁️‍🗨️ آدرس لینکدین : ${user.linkedin ?? "❌"}
   منطقه سکونت 🇮🇷 : ${user.address ?? "❌"}
  🧑🏻‍💻حوزه فعالیت شما : ${formattedStacks == [] ? "❌" : formattedStacks}

*(عضویت داخل کانال @NodeUnique اجباری است)*\n💎 تاریخ عضویت : ${date} ${time}`;

  return ctx.editMessageText(response, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✏️ | ویرایش پروفایل", callback_data: "editProfileInfo" },
          { text: "❌ | حذف پروفایل", callback_data: "delProfileInfo" },
        ],
        [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
      ],
    },
  });
});

bot.action("editProfileInfo", async (ctx) => {
  ctx.sendChatAction("typing");

  ctx.editMessageText(
    "👇🏻 | یکی از بخش های زیر که میخوای ویرایش بشه انتخاب کن: ",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✏️ | ویرایش آدرس گیت هاب", callback_data: "editGitHub" }],
          [{ text: "✏️ | ویرایش آدرس لینکدین", callback_data: "editLinkedin" }],
          [
            { text: "✏️ | منطقه سکونت", callback_data: "editCity" },
            { text: "✏️ | حوزه فعالیت", callback_data: "editStack" },
          ],
          [{ text: "✏️ | ویرایش نام کاربری", callback_data: "editName" }],

          [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
        ],
      },
    }
  );
});
bot.action("delProfileInfo", async (ctx) => {
  ctx.sendChatAction("typing");

  ctx.editMessageText("👇🏻 | یکی از بخش های زیر که میخوای حذف بشه انتخاب کن: ", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "❌ | آدرس گیت هاب", callback_data: "delGitHub" }],
        [{ text: "❌ | آدرس لینکدین", callback_data: "delLinkedin" }],
        [
          { text: "❌ | منطقه سکونت", callback_data: "delCity" },
          { text: "❌ | حوزه فعالیت", callback_data: "delStack" },
        ],
        [{ text: "❌ | نام کاربری", callback_data: "delName" }],

        [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
      ],
    },
  });
});

bot.action("delName", async (ctx) => {
  ctx.sendChatAction("typing");
  await prisma.user.update({
    where: {
      chat_id: ctx?.callbackQuery?.from?.id,
    },
    data: {
      name: ctx.callbackQuery?.from?.first_name,
    },
  });
  return ctx.editMessageText(
    "نام کاربریت با موفقیت حذف و به حالت اولیه بازگشت. ✔",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    }
  );
});
bot.action("delCity", async (ctx) => {
  ctx.sendChatAction("typing");
  await prisma.user.update({
    where: {
      chat_id: ctx?.callbackQuery?.from?.id,
    },
    data: {
      address: null,
    },
  });
  return ctx.editMessageText("منطقه سکونت با موفقیت حذف شد. ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
});
bot.action("delLinkedin", async (ctx) => {
  ctx.sendChatAction("typing");
  await prisma.user.update({
    where: {
      chat_id: ctx?.callbackQuery?.from?.id,
    },
    data: {
      linkedin: null,
    },
  });
  return ctx.editMessageText("آدرس لینکدینت با موفقیت حذف شد. ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
});
bot.action("delGitHub", async (ctx) => {
  ctx.sendChatAction("typing");
  await prisma.user.update({
    where: {
      chat_id: ctx?.callbackQuery?.from?.id,
    },
    data: {
      gitHub: null,
    },
  });
  return ctx.editMessageText("آدرس گیت هابت با موفقیت حذف شد. ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
});
bot.action("delStack", async (ctx) => {
  ctx.sendChatAction("typing");

  await removeUserStacks(ctx, ctx?.callbackQuery?.from?.id);
});

bot.action("editGitHub", async (ctx) => {
  ctx.sendChatAction("typing");

  await redis.setex(
    `editGitHubStep:ChatID:${ctx?.callbackQuery?.from?.id}`,
    120,
    "WAITING_FOR_LINK"
  );

  return ctx.editMessageText("👈🏻 | حالا آدرس گیت هابت رو بفرست.", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
});

bot.action("editLinkedin", async (ctx) => {
  ctx.sendChatAction("typing");

  await redis.setex(
    `editLinkedinStep:ChatID:${ctx?.callbackQuery?.from?.id}`,
    120,
    "WAITING_FOR_LINK"
  );

  return ctx.editMessageText("👈🏻 | حالا آدرس لینکدینت رو بفرست.", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
});
bot.action("editName", async (ctx) => {
  ctx.sendChatAction("typing");

  await redis.setex(
    `editNameStep:ChatID:${ctx?.callbackQuery?.from?.id}`,
    120,
    "WAITING_FOR_NAME"
  );

  return ctx.editMessageText("👈🏻 | اسم خود رو بصورت کامل بفرست", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
});
bot.action("editCity", async (ctx) => {
  ctx.sendChatAction("typing");

  await redis.setex(
    `editCityStep:ChatID:${ctx?.callbackQuery?.from?.id}`,
    120,
    "WAITING_FOR_CITY"
  );

  return ctx.editMessageText(
    "👈🏻 | اسم شهر و استان خودت رو بصورت مخفف ارسال کن\n.مثلا اگه تهران هستی به این صورت: تهران، نیاوران\n یا اردبیل، مشکین شهر.",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    }
  );
});
bot.action("editStack", async (ctx) => {
  ctx.sendChatAction("typing");

  const stacks = await getAllStacks();
  let stackList =
    "از بین حوزه های زیر یکی رو ارسال کن.\nمیتونی با , (کاما) چند حوزه فعالیتت رو جدا کنی.\n لیست حوزه های موجود به شرح زیر میباشد: 👨‍💻\n\n";

  stacks.forEach((stack, index) => {
    stackList += `${index + 1}` + " - " + "`" + `${stack.fields}` + "`" + "\n";
  });

  await redis.setex(
    `editStackStep:ChatID:${ctx?.callbackQuery?.from?.id}`,
    120,
    "WAITING_FOR_STACK"
  );

  return ctx.editMessageText(stackList, {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
    parse_mode: "Markdown",
  });
});

bot.action("contactToDev", async (ctx) => {
  ctx.sendChatAction("typing");

  return ctx.editMessageText(
    "👈🏻 | جهت ارتباط با برنامه نویس یکی از راه های زیر را انتخاب کن:",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          [{ text: "👥 | ارتباط مستقیم", url: "https://t.me/iDvMH" }],
          [{ text: "🤖 | ارتباط غیر مستقیم", callback_data: "openChat" }],
        ],
      },
    }
  );
});

bot.action("backMenu", async (ctx) => {
  ctx.sendChatAction("typing");
  return sendUserKeyboard(ctx);
});
bot.action("endCaht", async (ctx) => {
  ctx.sendChatAction("typing");
  await redis.del("fromChatId");
  await redis.del("adminChatId");

  return ctx.editMessageText("گفتگو با موفقیت بسته شد. ✔");
});

bot.action("openChat", async (ctx) => {
  ctx.sendChatAction("typing");

  ctx.editMessageText("📬 | پیام مورد نظرتو بفرست:");

  await redis.set(
    `newMessageFromChatId: ${ctx.callbackQuery.from.id}`,
    "WAITING_FOR_MESSAGE"
  );
  await redis.set("fromChatId", ctx.callbackQuery.from.id);
});
bot.action("answerChat", async (ctx) => {
  ctx.sendChatAction("typing");

  ctx.editMessageText("📬 | پاسخ خود را ارسال کنید:");

  await redis.set(
    `answerMessageToChatId: ${ctx.callbackQuery.from.id}`,
    "ANSWERED_MESSAGE_TO_CHATID"
  );
  await redis.set("adminChatId", ctx.callbackQuery.from.id);
});
bot.action("team_mate", async (ctx) => {
  await ctx.sendChatAction("typing");

  return ctx.editMessageText(
    `خب خب به بخش هم تیمی یاب خوش اومدی. \nیکی از گزینه های زیر رو انتخاب کن: 👇🏻`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔍 | جستجو بر اساس حوزه پروفایل شما",
              callback_data: "user_profile_stack",
            },
          ],
          [
            {
              text: "🔎 | جستجو بر اساس حوزه درخواستی",
              callback_data: "user_request_stack",
            },
          ],
          [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
        ],
      },
    }
  );
});
bot.action("user_profile_stack", async (ctx) => {
  await findTeamMateFromUserProfileStack(ctx);
});

bot.action("user_request_stack", async (ctx) => {
  ctx.sendChatAction("typing");

  const stacks = await getAllStacks();
  let stackList =
    "از بین حوزه های زیر یکی رو ارسال کن.\n لیست حوزه های موجود به شرح زیر میباشد: 👨‍💻\n\n";

  stacks.forEach((stack, index) => {
    stackList += `${index + 1}` + " - " + "`" + `${stack.fields}` + "`" + "\n";
  });

  await redis.setex(
    `UserRequestStack:ChatID:${ctx?.callbackQuery?.from?.id}`,
    120,
    "WAITING_FOR_STACK"
  );

  return ctx.editMessageText(stackList, {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
    parse_mode: "Markdown",
  });
});

bot.action("packageYab", async (ctx) => {
  ctx.sendChatAction("typing");
  return ctx.editMessageText(
    "👇🏻 | به پکیج یاب خوش آومدی یکی از سایت های زیر رو انتخاب کن تا برات جستجو رو انجام بدم.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔍 | سایت NPM", callback_data: "NPM_PackageYab" }],
          [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
        ],
      },
    }
  );
});

bot.action("NPM_PackageYab", async (ctx) => {
  ctx.sendChatAction("typing");
  ctx.editMessageText(
    `برام keyword ارسال کن تا پکیج های مرتبط باهاش رو از سایت NPM برات پیدا کنم👇🏻`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ | لغو", callback_data: "cancel_scrap" }],
        ],
      },
    }
  );

  await redis.setex(
    `UserRequestPackage:ChatID:${ctx.callbackQuery.from.id}`,
    120,
    "WAITING_FOR_PACKAGE_KEYWORD"
  );
});

bot.action("continue_scrap", async (ctx) => {
  const packageData = await redis.get(
    `UserRequestPackageContinue:CHATID${ctx.callbackQuery?.from.id}`
  );

  if (!JSON.parse(packageData)) {
    return ctx.editMessageText("مجدد مراحل رو انجام بده. 💬", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔐 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  const { packageKeyword, page, perPage } = JSON.parse(packageData);
  await ctx.sendChatAction("typing");
  await ctx.editMessageText(
    "درحال استخراج 40 پکیج بعدی, ممکن است کمی طول بکشد .... ⏳"
  );

  const { totalPackagesFound, filePath } = await scraperNPMPackages(
    packageKeyword,
    page,
    perPage
  );
  await ctx.sendChatAction("upload_document");

  await ctx.telegram.sendDocument(ctx.chat.id, {
    source: fs.createReadStream(filePath),
    filename: `${packageKeyword}-packages.json`,
  });
  fs.unlinkSync(filePath);

  await ctx.sendChatAction("typing");
  await ctx.reply(
    `40 پکیج دیگر استخراج شد از مجموع ${totalPackagesFound}.\nمیخوای ادامه بدی؟`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⌛️ | ادامه استخراج", callback_data: "continue_scrap" }],
          [{ text: "❌ | لغو", callback_data: "cancel_scrap" }],
        ],
      },
    }
  );
  await redis.setex(
    `UserRequestPackageContinue:CHATID${ctx.from.id}`,
    120,
    JSON.stringify({ packageKeyword, page, perPage })
  );
});

bot.action("cancel_scrap", async (ctx) => {
  await redis.del(`UserRequestPackage:ChatID:${ctx.callbackQuery?.from.id}`);
  await redis.del(
    `UserRequestPackageContinue:CHATID${ctx.callbackQuery?.from.id}`
  );
  ctx.sendChatAction("typing");
  return ctx.editMessageText("فرایند استخراج با موفقیت متوقف شد ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
});
bot.action("cancel_scrap_article", async (ctx) => {
  await redis.del(`UserKeywords:CHATID${ctx?.callbackQuery?.from.id}`);
  await redis.del(
    `UserRequestDevToArticleStep:CHARID:${ctx.callbackQuery?.from.id}`
  );
  ctx.sendChatAction("typing");
  return ctx.editMessageText("فرایند استخراج با موفقیت متوقف شد ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
});

bot.action("articleYab", async (ctx) => {
  ctx.sendChatAction("typing");
  return ctx.editMessageText(
    "به بخش جذاب مقاله یاب خوش اومدی 😍\nیکی از بخش هایی که میخوای برات مقاله جمع آوری کنم رو انتخاب کن:",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔓 | آنلاک مقالات پرمیوم (Medium)",
              callback_data: "OnlockMediumPermiumAerticle",
            },
          ],
          [
            { text: "🏷 | سایت ویرگول", callback_data: "VirGool" },
            { text: "📩 | سایت Dev.to", callback_data: "DevTo" },
          ],
          [
            {
              text: "🔍 | جستجو براساس حوزه فعالیت شما",
              callback_data: "StackSerachingArticle",
            },
          ],
          [
            {
              text: "⚡️ | جستجو رندوم از بین سایت های معتبر",
              callback_data: "RandomSerachingArticle",
            },
          ],

          [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
        ],
      },
    }
  );
});

bot.action("DevTo", async (ctx) => {
  ctx.sendChatAction("typing");
  await redis.setex(
    `UserRequestDevToArticleStep:CHARID:${ctx?.callbackQuery?.from?.id}`,
    120,
    "WAITING_FOR_ARTICLE_KEYWORD"
  );

  return ctx.editMessageText(
    `${ctx.callbackQuery.from.first_name} عزیز.\n 👈🏻  برام چند کلید واژه انگلیسی ارسال کن تا برات مقاله هایی که مرتبط با این کلید واژه هستن رو پیدا کنم میتونی با ( , کاما چند کلید واژه ارسال کنی).\n 💡مثال: Nodejs, Express, MySQL`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    }
  );
});

bot.action("MostRelevant", async (ctx) => {
  try {
    const keywords = await redis.get(
      `UserKeywords:CHATID${ctx.callbackQuery?.from.id}`
    );
    if (!keywords) {
      ctx.sendChatAction("typing");
      return ctx.editMessageText(
        "مدت زمان شما پایان رسیده مجدد مراحل رو انجام بدید! ❌",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
            ],
          },
        }
      );
    }

    ctx.sendChatAction("typing");
    ctx.editMessageText("درحال استخراج مقالات ممکن است کمی طول بکشد ... ⏳");

    const { articlePath, articlesTotalCount } =
      await scrapArticlesFromDevToWebsite(keywords, "MostRelevant");

    ctx.sendChatAction("typing");
    ctx.reply(
      `استخراج مقالات با موفقیت پایان رسید، حدود ${articlesTotalCount} مقاله یافت شد ✅  درحال ارسال فایل ...`
    );

    ctx.sendChatAction("upload_document");

    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(articlePath),
      filename: `${keywords}ArticlesDevto.json`,
    });
    fs.unlinkSync(articlePath);
    ctx.reply("فرایند استخراج با موفقیت به پایان رسید ✔", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
    await redis.del(`UserKeywords:CHATID${ctx.callbackQuery?.from.id}`);
  } catch (error) {
    return ctx.reply("خطا هنگام استخراج !");
  }
});

bot.action("Newest", async (ctx) => {
  try {
    const keywords = await redis.get(
      `UserKeywords:CHATID${ctx.callbackQuery?.from.id}`
    );
    if (!keywords) {
      ctx.sendChatAction("typing");
      return ctx.editMessageText(
        "مدت زمان شما پایان رسیده مجدد مراحل رو انجام بدید! ❌",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
            ],
          },
        }
      );
    }

    ctx.sendChatAction("typing");
    ctx.editMessageText("درحال استخراج مقالات ممکن است کمی طول بکشد ... ⏳");

    const { articlePath, articlesTotalCount } =
      await scrapArticlesFromDevToWebsite(keywords, "Newest");

    ctx.sendChatAction("typing");
    ctx.reply(
      `استخراج مقالات با موفقیت پایان رسید، حدود ${articlesTotalCount} مقاله یافت شد ✅  درحال ارسال فایل ...`
    );

    ctx.sendChatAction("upload_document");

    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(articlePath),
      filename: `${keywords}ArticlesDevto.json`,
    });
    fs.unlinkSync(articlePath);
    ctx.reply("فرایند استخراج با موفقیت به پایان رسید ✔", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
    await redis.del(`UserKeywords:CHATID${ctx.callbackQuery?.from.id}`);
  } catch (error) {
    return ctx.reply("خطا هنگام استخراج !");
  }
});
bot.action("Oldest", async (ctx) => {
  try {
    const keywords = await redis.get(
      `UserKeywords:CHATID${ctx.callbackQuery?.from.id}`
    );
    if (!keywords) {
      ctx.sendChatAction("typing");
      return ctx.editMessageText(
        "مدت زمان شما پایان رسیده مجدد مراحل رو انجام بدید! ❌",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
            ],
          },
        }
      );
    }

    ctx.sendChatAction("typing");
    ctx.editMessageText("درحال استخراج مقالات ممکن است کمی طول بکشد ... ⏳");

    const { articlePath, articlesTotalCount } =
      await scrapArticlesFromDevToWebsite(keywords, "Oldest");

    ctx.sendChatAction("typing");
    ctx.reply(
      `استخراج مقالات با موفقیت پایان رسید، حدود ${articlesTotalCount} مقاله یافت شد ✅  درحال ارسال فایل ...`
    );

    ctx.sendChatAction("upload_document");

    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(articlePath),
      filename: `${keywords}ArticlesDevto.json`,
    });
    fs.unlinkSync(articlePath);
    ctx.reply("فرایند استخراج با موفقیت به پایان رسید ✔", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
    await redis.del(`UserKeywords:CHATID${ctx.callbackQuery?.from.id}`);
  } catch (error) {
    return ctx.reply("خطا هنگام استخراج !");
  }
});

bot.action("VirGool", async (ctx) => {
  ctx.sendChatAction("typing");
  await redis.setex(
    `UserRequestVirgoolArticleStep:CHARID:${ctx?.callbackQuery?.from?.id}`,
    120,
    "WAITING_FOR_VIRGOOL_ARTICLE_KEYWORD"
  );

  return ctx.editMessageText(
    `${ctx.callbackQuery.from.first_name} عزیز.\n 👈🏻  برام چند کلید واژه انگلیسی یا فارسی ارسال کن تا برات مقاله هایی که مرتبط با این کلید واژه هستن رو پیدا کنم میتونی با ( , کاما چند کلید واژه ارسال کنی).\n 💡مثال: Nodejs, Express, MySQL\n💡مثال فارسی: نودجی‌اس، جاوااسکریپت`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    }
  );
});
bot.action("cancel_virgool_scrap", async (ctx) => {
  const articleData = await redis.get(
    `UserKeywordsVirgool:CHATID${ctx.callbackQuery?.from?.id}`
  );
  const { virgoolArticlesPath } = JSON.parse(articleData);
  fs.unlinkSync(virgoolArticlesPath);
  await redis.del(`UserKeywordsVirgool:CHATID${ctx.callbackQuery?.from?.id}`);
  await redis.del(
    `UserRequestVirgoolArticleStep:CHARID:${ctx.callbackQuery?.from?.id}`
  );
  ctx.sendChatAction("typing");
  return ctx.editMessageText("فرایند استخراج با موفقیت متوقف شد ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
});

bot.action("send_virgool_output", async (ctx) => {
  try {
    const articleData = await redis.get(
      `UserKeywordsVirgool:CHATID${ctx.callbackQuery.from.id}`
    );
    const { keywords, virgoolArticlesPath } = JSON.parse(articleData);

    if (!JSON.parse(articleData)) {
      fs.unlinkSync(virgoolArticlesPath);
      ctx.sendChatAction("typing");
      return ctx.editMessageText("مجدد مراحل رو انجام بده. 💬", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔐 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      });
    }
    ctx.deleteMessage();
    ctx.sendChatAction("upload_document");
    ctx.sendChatAction("typing");
    ctx.reply("درحال ارسال فایل JSON ✅");

    ctx.sendChatAction("upload_document");

    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(virgoolArticlesPath),
      filename: `${keywords}-ArticlesVirgool.json`,
    });
    fs.unlinkSync(virgoolArticlesPath);
    ctx.sendChatAction("typing");
    ctx.reply("فرایند استخراج با موفقیت به پایان رسید ✔", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });

    await redis.del(`UserKeywordsVirgool:CHATID${ctx.callbackQuery.from.id}`);
  } catch (error) {
    ctx.reply("ارور هنگام ارسال فایل !!!!");
  }
});

bot.action("OnlockMediumPermiumAerticle", async (ctx) => {
  ctx.sendChatAction("typing");
  [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
    ctx.editMessageText(
      "خب حالا لینک مقاله رو برام ارسال کن تا برات آنلاک کنم 😎",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      }
    );
  await redis.setex(
    `waitingForUserMediumLink:CHATID${ctx.callbackQuery.from.id}`,
    120,
    "WAITING_FOR_MEDIUM_LINK"
  );
});

bot.action("StackSerachingArticle", async (ctx) => {
  const chatID = ctx.callbackQuery.from.id;
  const user = await findByChatID(chatID);

  const userStack = await findUserStacks(user.id);

  if (userStack.length === 0) {
    return ctx.editMessageText(
      `👈🏻 | برای استفاده از این بخش باید پروفایل خودتو کامل کنی ${ctx.callbackQuery.from.first_name} عزیز:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⏮  | رفتن به پروفایل", callback_data: "myProfile" }],
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  ctx.sendChatAction("typing");
  return ctx.editMessageText(
    "👈🏻 میخوای طبق کدوم سایتی برات مقاله جمع کنم؟ \nانتخاب کن: 👇🏻",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🏷 | سایت ویرگول",
              callback_data: "StackSerachingArticleVirGool",
            },
            {
              text: "📩 | سایت Dev.to",
              callback_data: "StackSerachingArticleDevTo",
            },
          ],
          [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
        ],
      },
    }
  );
});

bot.action("StackSerachingArticleVirGool", async (ctx) => {
  const chatID = ctx.callbackQuery.from.id;
  const user = await findByChatID(chatID);

  const userStack = await findUserStacks(user.id);

  const combinedStacksToOneArray = userStack.flatMap((stack) => stack.fields);

  const virgoolKeywords = combinedStacksToOneArray.join(" ");
  ctx.deleteMessage();
  ctx.sendChatAction("typing");
  ctx.reply("درحال استخراج مقالات ممکن است کمی طول بکشد ... ⏳");

  const { totalArticlesCount, virgoolArticlesPath } =
    await scrapArticlesFromVirgoolWebsite(virgoolKeywords, 10);
  ctx.sendChatAction("typing");
  ctx.reply(
    `${totalArticlesCount} مقاله با موفقیت از سایت ویرگول استخراج شد ✅, تنها 6 دقیقه فرصت داری فایل خروجی رو دریافت کنی\n👈🏻 برای دریافت رویه دکمه خروجی کلیک کن:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📥 | خروجی", callback_data: "send_virgool_output" }],
          [{ text: "❌ | لغو", callback_data: "cancel_virgool_scrap" }],
        ],
      },
    }
  );

  await redis.setex(
    `UserKeywordsVirgool:CHATID${ctx.callbackQuery.from.id}`,
    400,
    JSON.stringify({ keywords: virgoolKeywords, virgoolArticlesPath })
  );
});
bot.action("StackSerachingArticleDevTo", async (ctx) => {
  const chatID = ctx.callbackQuery.from.id;
  const user = await findByChatID(chatID);

  const userStack = await findUserStacks(user.id);

  const combinedStacksToOneArray = userStack.flatMap((stack) => stack.fields);

  const devToKeywords = combinedStacksToOneArray.join("+");

  ctx.deleteMessage();
  ctx.sendChatAction("typing");
  ctx.reply("درحال استخراج مقالات ممکن است کمی طول بکشد ... ⏳");

  const { articlePath, articlesTotalCount } =
    await scrapArticlesFromDevToWebsite(devToKeywords, "MostRelevant");

  ctx.sendChatAction("typing");
  ctx.reply(
    `استخراج مقالات با موفقیت پایان رسید، حدود ${articlesTotalCount} مقاله یافت شد ✅  درحال ارسال فایل ...`
  );

  ctx.sendChatAction("upload_document");

  await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
    source: fs.createReadStream(articlePath),
    filename: `${devToKeywords}ArticlesDevto.json`,
  });
  fs.unlinkSync(articlePath);
  ctx.reply("فرایند استخراج با موفقیت به پایان رسید ✔", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
      ],
    },
  });
});

bot.action("RandomSerachingArticle", async (ctx) => {
  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "به بخش سرچ مقاله بر اساس سایت رندوم خوش اومدی 🌹. لطفا کلید واژه انگلیسی برام ارسال کن تا سرچ رو شروع کنم.\n 💡مثال: Nodejs, Express, MySQL",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    }
  );

  return redis.setex(
    `UserRandomKeywordsStep:CHATID${ctx.callbackQuery.from.id}`,
    120,
    "WAITING_FOR_RANDOM_KEYWORD"
  );
});

bot.action("sourceYab", async (ctx) => {
  ctx.sendChatAction("typing");
  return ctx.editMessageText(
    "به بخش فوق‌العاده جذاب سورس یاب خوش اومدی 🤩.\n👈🏻 تو این بخش میتونی راجب حوزه فعالیتت و هر تکنولوژی نمونه کد از گیت هاب به راحتی پیدا کنی.\n👇🏻 یکی از بخش های زیر رو انتخاب کن: ",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 | جستجو بر اساس کلید واژه درخواستی",
              callback_data: "sourceYabFromUserKeyword",
            },
          ],
          [
            {
              text: "👨‍💻 | جستجو بر اساس حوزه فعالیتت",
              callback_data: "sourceYabFromUserStack",
            },
          ],
          [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
        ],
      },
    }
  );
});

bot.action("sourceYabFromUserKeyword", async (ctx) => {
  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "👈🏻 | برام یک یا چند کلید واژه ارسال کن تا طبق اون سرچ رو انجام بدم. میتونی با کاما (,) کلید واژه هارو جدا کنی.\n💡| مثال: nodejs, express, mongodb",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    }
  );
  return redis.setex(
    `UserRequestSource:CHATID${ctx.callbackQuery.from.id}`,
    120,
    "WAITING_FOR_SOURCE_KEYWORD"
  );
});

bot.action("github_cancel_scraping", async (ctx) => {
  await redis.del(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery?.from?.id}`
  );
  await redis.del(`UserWantToContinue:CHATID${ctx.callbackQuery.from.id}`);

  ctx.sendChatAction("typing");
  return ctx.editMessageText(
    "فرایند استخراج با موفقیت لغو و کلید واژه حذف شد ✅",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    }
  );
});

bot.action("github_sortBY_best_match", async (ctx) => {
  const keywords = await redis.get(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery?.from?.id}`
  );
  if (!keywords) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "مدت زمان شما به پایان رسیده مجدد تلاش فرمایید. 🚫",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "⏳ درحال استخراج سورس های مورد نظر، ممکن است کمی طول بکشد. ⌛️"
  );
  await new Promise((resolve) => setTimeout(resolve, 2000));
  let perPage = 1;
  const { count, path } = await scrapSourceCodeFromGitHub(
    keywords,
    perPage,
    "BestMatch"
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));

  ctx.sendChatAction("upload_document");
  await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
    source: fs.createReadStream(path),
    filename: `${keywords}-BestMatchSources.json`,
  });
  fs.unlinkSync(path);

  ctx.sendChatAction("typing");
  ctx.reply(
    `استخراج انجام شد و ${count} سورس یافت شد ✅\n👇🏻 | دوست داری ادامه بدیم به استخراج؟`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⌛️ | ادامه استخراج",
              callback_data: "continue_scrap_source_github",
            },
          ],
          [
            {
              text: "❌ | لغو",
              callback_data: "github_cancel_scraping",
            },
          ],
        ],
      },
    }
  );

  await redis.setex(
    `UserWantToContinue:CHATID${ctx.callbackQuery.from.id}`,
    200,
    JSON.stringify({
      perPage: perPage + 1,
      keywords,
      sortBY: "BestMatch",
    })
  );

  await redis.del(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery.from.id}`
  );
});

bot.action("github_sortBY_most_stars", async (ctx) => {
  const keywords = await redis.get(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery?.from?.id}`
  );
  if (!keywords) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "مدت زمان شما به پایان رسیده مجدد تلاش فرمایید. 🚫",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "⏳ درحال استخراج سورس های مورد نظر، ممکن است کمی طول بکشد. ⌛️"
  );
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let perPage = 1;
  const { count, path } = await scrapSourceCodeFromGitHub(
    keywords,
    perPage,
    "MostStars"
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));

  ctx.sendChatAction("upload_document");
  await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
    source: fs.createReadStream(path),
    filename: `${keywords}-MostStarsSources.json`,
  });
  fs.unlinkSync(path);

  ctx.sendChatAction("typing");
  ctx.reply(
    `استخراج انجام شد و ${count} سورس یافت شد ✅\n👇🏻 | دوست داری ادامه بدیم به استخراج؟`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⌛️ | ادامه استخراج",
              callback_data: "continue_scrap_source_github",
            },
          ],
          [
            {
              text: "❌ | لغو",
              callback_data: "github_cancel_scraping",
            },
          ],
        ],
      },
    }
  );

  await redis.setex(
    `UserWantToContinue:CHATID${ctx.callbackQuery.from.id}`,
    200,
    JSON.stringify({
      perPage: perPage + 1,
      keywords,
      sortBY: "MostStars",
    })
  );

  await redis.del(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery.from.id}`
  );
});

bot.action("github_sortBY_fewest_stars", async (ctx) => {
  const keywords = await redis.get(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery?.from?.id}`
  );
  if (!keywords) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "مدت زمان شما به پایان رسیده مجدد تلاش فرمایید. 🚫",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "⏳ درحال استخراج سورس های مورد نظر، ممکن است کمی طول بکشد. ⌛️"
  );

  await new Promise((resolve) => setTimeout(resolve, 2000));

  let perPage = 1;
  const { count, path } = await scrapSourceCodeFromGitHub(
    keywords,
    perPage,
    "FewestStars"
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));

  ctx.sendChatAction("upload_document");
  await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
    source: fs.createReadStream(path),
    filename: `${keywords}-FewestStarsSources.json`,
  });
  fs.unlinkSync(path);

  ctx.sendChatAction("typing");
  ctx.reply(
    `استخراج انجام شد و ${count} سورس یافت شد ✅\n👇🏻 | دوست داری ادامه بدیم به استخراج؟`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⌛️ | ادامه استخراج",
              callback_data: "continue_scrap_source_github",
            },
          ],
          [
            {
              text: "❌ | لغو",
              callback_data: "github_cancel_scraping",
            },
          ],
        ],
      },
    }
  );

  await redis.setex(
    `UserWantToContinue:CHATID${ctx.callbackQuery.from.id}`,
    200,
    JSON.stringify({
      perPage: perPage + 1,
      keywords,
      sortBY: "FewestStars",
    })
  );

  await redis.del(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery.from.id}`
  );
});

bot.action("github_sortBY_most_forks", async (ctx) => {
  const keywords = await redis.get(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery?.from?.id}`
  );
  if (!keywords) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "مدت زمان شما به پایان رسیده مجدد تلاش فرمایید. 🚫",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "⏳ درحال استخراج سورس های مورد نظر، ممکن است کمی طول بکشد. ⌛️"
  );

  await new Promise((resolve) => setTimeout(resolve, 2000));

  let perPage = 1;
  const { count, path } = await scrapSourceCodeFromGitHub(
    keywords,
    perPage,
    "MostForks"
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));

  ctx.sendChatAction("upload_document");
  await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
    source: fs.createReadStream(path),
    filename: `${keywords}-MostForksSources.json`,
  });
  fs.unlinkSync(path);

  ctx.sendChatAction("typing");
  ctx.reply(
    `استخراج انجام شد و ${count} سورس یافت شد ✅\n👇🏻 | دوست داری ادامه بدیم به استخراج؟`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⌛️ | ادامه استخراج",
              callback_data: "continue_scrap_source_github",
            },
          ],
          [
            {
              text: "❌ | لغو",
              callback_data: "github_cancel_scraping",
            },
          ],
        ],
      },
    }
  );

  await redis.setex(
    `UserWantToContinue:CHATID${ctx.callbackQuery.from.id}`,
    200,
    JSON.stringify({
      perPage: perPage + 1,
      keywords,
      sortBY: "MostForks",
    })
  );

  await redis.del(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery.from.id}`
  );
});

bot.action("github_sortBY_fewest_forks", async (ctx) => {
  const keywords = await redis.get(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery?.from?.id}`
  );
  if (!keywords) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "مدت زمان شما به پایان رسیده مجدد تلاش فرمایید. 🚫",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "⏳ درحال استخراج سورس های مورد نظر، ممکن است کمی طول بکشد. ⌛️"
  );

  await new Promise((resolve) => setTimeout(resolve, 2000));

  let perPage = 1;
  const { count, path } = await scrapSourceCodeFromGitHub(
    keywords,
    perPage,
    "FewestForks"
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));

  ctx.sendChatAction("upload_document");
  await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
    source: fs.createReadStream(path),
    filename: `${keywords}-FewestForksSources.json`,
  });
  fs.unlinkSync(path);

  ctx.sendChatAction("typing");
  ctx.reply(
    `استخراج انجام شد و ${count} سورس یافت شد ✅\n👇🏻 | دوست داری ادامه بدیم به استخراج؟`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⌛️ | ادامه استخراج",
              callback_data: "continue_scrap_source_github",
            },
          ],
          [
            {
              text: "❌ | لغو",
              callback_data: "github_cancel_scraping",
            },
          ],
        ],
      },
    }
  );

  await redis.setex(
    `UserWantToContinue:CHATID${ctx.callbackQuery.from.id}`,
    200,
    JSON.stringify({
      perPage: perPage + 1,
      keywords,
      sortBY: "FewestForks",
    })
  );

  await redis.del(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery.from.id}`
  );
});

bot.action("github_sortBY_last_recentrly_updated", async (ctx) => {
  const keywords = await redis.get(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery?.from?.id}`
  );
  if (!keywords) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "مدت زمان شما به پایان رسیده مجدد تلاش فرمایید. 🚫",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "⏳ درحال استخراج سورس های مورد نظر، ممکن است کمی طول بکشد. ⌛️"
  );
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let perPage = 1;
  const { count, path } = await scrapSourceCodeFromGitHub(
    keywords,
    perPage,
    "lastRecentlyUpdated"
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));

  ctx.sendChatAction("upload_document");
  await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
    source: fs.createReadStream(path),
    filename: `${keywords}-lastRecentlyUpdatedSources.json`,
  });
  fs.unlinkSync(path);

  ctx.sendChatAction("typing");
  ctx.reply(
    `استخراج انجام شد و ${count} سورس یافت شد ✅\n👇🏻 | دوست داری ادامه بدیم به استخراج؟`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⌛️ | ادامه استخراج",
              callback_data: "continue_scrap_source_github",
            },
          ],
          [
            {
              text: "❌ | لغو",
              callback_data: "github_cancel_scraping",
            },
          ],
        ],
      },
    }
  );

  await redis.setex(
    `UserWantToContinue:CHATID${ctx.callbackQuery.from.id}`,
    200,
    JSON.stringify({
      perPage: perPage + 1,
      keywords,
      sortBY: "lastRecentlyUpdated",
    })
  );

  await redis.del(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery.from.id}`
  );
});

bot.action("github_sortBY_recentrly_updated", async (ctx) => {
  const keywords = await redis.get(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery?.from?.id}`
  );
  if (!keywords) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "مدت زمان شما به پایان رسیده مجدد تلاش فرمایید. 🚫",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "⏳ درحال استخراج سورس های مورد نظر، ممکن است کمی طول بکشد. ⌛️"
  );
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let perPage = 1;
  const { count, path } = await scrapSourceCodeFromGitHub(
    keywords,
    perPage,
    "recentlyUpdated"
  );
  await new Promise((resolve) => setTimeout(resolve, 1500));

  ctx.sendChatAction("upload_document");
  await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
    source: fs.createReadStream(path),
    filename: `${keywords}-recentlyUpdatedSources.json`,
  });
  fs.unlinkSync(path);

  ctx.sendChatAction("typing");
  ctx.reply(
    `استخراج انجام شد و ${count} سورس یافت شد ✅\n👇🏻 | دوست داری ادامه بدیم به استخراج؟`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⌛️ | ادامه استخراج",
              callback_data: "continue_scrap_source_github",
            },
          ],
          [
            {
              text: "❌ | لغو",
              callback_data: "github_cancel_scraping",
            },
          ],
        ],
      },
    }
  );

  await redis.setex(
    `UserWantToContinue:CHATID${ctx.callbackQuery.from.id}`,
    200,
    JSON.stringify({
      perPage: perPage + 1,
      keywords,
      sortBY: "recentlyUpdated",
    })
  );

  await redis.del(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery.from.id}`
  );
});

bot.action("continue_scrap_source_github", async (ctx) => {
  const data = await redis.get(
    `UserWantToContinue:CHATID${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(data)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText("مجدد مراحل رو انجام بده. 💬", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔐 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  const { perPage, keywords, sortBY } = JSON.parse(data);

  ctx.sendChatAction("typing");
  ctx.editMessageText("⏳ درحال ادامه استخراج ، ممکن است کمی طول بکشد ⌛️");

  const { count, path } = await scrapSourceCodeFromGitHub(
    keywords,
    perPage,
    sortBY
  );

  ctx.sendChatAction("upload_document");
  await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
    source: fs.createReadStream(path),
    filename: `${keywords}-BestMatchSources.json`,
  });
  fs.unlinkSync(path);

  ctx.sendChatAction("typing");
  ctx.reply(`${count} سورس دیگر با موفقیت یافت و ارسال شد، میخوای ادامه بدی؟`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "⌛️ | ادامه استخراج",
            callback_data: "continue_scrap_source_github",
          },
        ],
        [
          {
            text: "❌ | لغو",
            callback_data: "github_cancel_scraping",
          },
        ],
      ],
    },
  });

  const TTLRedisKey = `UserWantToContinue:CHATID${ctx.callbackQuery.from.id}`;
  const TTLRedisTime = await redis.ttl(TTLRedisKey);
  await redis.expire(TTLRedisKey, TTLRedisTime + 200);
});

bot.action("sourceYabFromUserStack", async (ctx) => {
  const chatID = ctx.callbackQuery.from.id;
  const user = await findByChatID(chatID);

  const userStack = await findUserStacks(user.id);

  if (userStack.length === 0) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      `👈🏻 | برای استفاده از این بخش باید پروفایل خودتو کامل کنی ${ctx.callbackQuery.from.first_name} عزیز:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⏮  | رفتن به پروفایل", callback_data: "myProfile" }],
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const combinedStacksToOneArray = userStack.flatMap((stack) => stack.fields);

  const sourceKeywords = combinedStacksToOneArray.join("+");

  await redis.setex(
    `UserSentKeywordsForSource:CHARID${ctx.callbackQuery.from.id}`,
    200,
    sourceKeywords
  );

  ctx.sendChatAction("typing");
  return ctx.editMessageText(
    "👈🏻 | برای سرچ و نتیجه بهتر طبق خواستت، دوست داری بر چه اساسی فرایند استخراج رو انجام بدم؟\n\n👇🏻| انتخاب کن:",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🟰| مرتبط ترین",
              callback_data: "github_sortBY_best_match",
            },
          ],
          [
            {
              text: "🌟| بیشترین ستاره ➕",
              callback_data: "github_sortBY_most_stars",
            },
            {
              text: "⭐️| کمترین ستاره ➖",
              callback_data: "github_sortBY_fewest_stars",
            },
          ],
          [
            {
              text: "🍴| بیشترین Forks ➕",
              callback_data: "github_sortBY_most_forks",
            },
            {
              text: "🍴| کمترین Forks ➖",
              callback_data: "github_sortBY_fewest_forks",
            },
          ],
          [
            {
              text: "⏱️ | آخرین بروزرسانی",
              callback_data: "github_sortBY_last_recentrly_updated",
            },
            {
              text: "⏰ | اخیرا به روز شده",
              callback_data: "github_sortBY_recentrly_updated",
            },
          ],
          [{ text: "❌| لغو", callback_data: "github_cancel_scraping" }],
        ],
      },
    }
  );
});

bot.action("jobYab", async (ctx) => {
  ctx.sendChatAction("typing");
  return ctx.editMessageText(
    `👈🏻 | به بخش باحال شغل یاب خوش اومدی ${ctx.callbackQuery.from.first_name} جان، تو این بخش برات نسبت به حوزه فعالیتت آگهی های استخدامی جمع آوری میکنم و برات میفرستم.\n\n👇🏻 | میخوای از کدوم وبسایت برات جمع آوری کنم؟`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📒 | وبسایت آی-استخدام",
              callback_data: "jobyab_e-estekhdam",
            },
          ],
          [
            { text: "📕 | وبسایت جابینجا", callback_data: "jobyab_jobinja" },
            { text: "📘 | وبسایت جاب‌ویژن", callback_data: "jobyab_jobvision" },
          ],
          [
            {
              text: "📚 | وبسایت کاربرد (ترکیبی از جابینجا & جاب‌ویژن)",
              callback_data: "jobyab_karbord",
            },
          ],
          [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
        ],
      },
    }
  );
});

bot.action("jobyab_e-estekhdam", async (ctx) => {
  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "👇🏻 | ابتدا اسم تکنولوژی که فعالیت میکنی و سپس با کاراکتر / از هم جدا و استانی که میخوای کار پیدا کنی برام ارسال کن.\n💡|  مثال:\nNode.js/اردبیل",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    }
  );
  return await redis.setex(
    `UserSentJobDataChatID${ctx.callbackQuery.from.id}`,
    120,
    "waitingForUserJobData"
  );
});

bot.action("highest_money_e-estekhdam", async (ctx) => {
  const jobData = await redis.get(
    `UserJobKeywordsChatID${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const { count, path } = await scrapJobFrom_E_Estekhdam(
    technology,
    province,
    "highest_money"
  );

  if (count === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(path);
    await redis.del(`UserJobKeywordsChatID${ctx.callbackQuery.from.id}`);
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(path),
      filename: `${technology}-e-estekhdam_jobs.json`,
    });
    fs.unlinkSync(path);
    await redis.del(`UserJobKeywordsChatID${ctx.callbackQuery.from.id}`);
    ctx.sendChatAction("typing");
    return ctx.reply(
      `استخراج با موفقیت به پایان رسید و ${count} شغل یافت شد و فایل JSON برای شما ارسال شد.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    fs.unlinkSync(path);
    await redis.del(`UserJobKeywordsChatID${ctx.callbackQuery.from.id}`);
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("new_job_e-estekhdam", async (ctx) => {
  const jobData = await redis.get(
    `UserJobKeywordsChatID${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const { count, path } = await scrapJobFrom_E_Estekhdam(
    technology,
    province,
    "new_job"
  );

  if (count === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(path);
    await redis.del(`UserJobKeywordsChatID${ctx.callbackQuery.from.id}`);
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(path),
      filename: `${technology}-e-estekhdam_jobs.json`,
    });
    fs.unlinkSync(path);
    await redis.del(`UserJobKeywordsChatID${ctx.callbackQuery.from.id}`);
    ctx.sendChatAction("typing");
    return ctx.reply(
      `استخراج با موفقیت به پایان رسید و ${count} شغل یافت شد و فایل JSON برای شما ارسال شد.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    fs.unlinkSync(path);
    await redis.del(`UserJobKeywordsChatID${ctx.callbackQuery.from.id}`);
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("match_job_e-estekhdam", async (ctx) => {
  const jobData = await redis.get(
    `UserJobKeywordsChatID${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const { count, path } = await scrapJobFrom_E_Estekhdam(technology, province);

  if (count === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(path);
    await redis.del(`UserJobKeywordsChatID${ctx.callbackQuery.from.id}`);
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(path),
      filename: `${technology}-e-estekhdam_jobs.json`,
    });
    fs.unlinkSync(path);
    await redis.del(`UserJobKeywordsChatID${ctx.callbackQuery.from.id}`);
    ctx.sendChatAction("typing");
    return ctx.reply(
      `استخراج با موفقیت به پایان رسید و ${count} شغل یافت شد و فایل JSON برای شما ارسال شد.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    fs.unlinkSync(path);
    await redis.del(`UserJobKeywordsChatID${ctx.callbackQuery.from.id}`);
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("cancel_job_e-estekhdam", async (ctx) => {
  await redis.del(`UserJobKeywordsChatID${ctx.callbackQuery.from.id}`);

  ctx.sendChatAction("typing");
  return ctx.editMessageText("استخراج با موفقیت لفو شد ✔", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
      ],
    },
  });
});

bot.action("jobyab_karbord", async (ctx) => {
  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "👇🏻 | ابتدا اسم تکنولوژی که فعالیت میکنی و سپس با کاراکتر / از هم جدا و استانی که میخوای کار پیدا کنی برام ارسال کن.\n💡|  مثال:\nNode.js/اردبیل",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    }
  );
  return await redis.setex(
    `UserSentJabKarboardWebsiteData:ChatID:${ctx.callbackQuery.from.id}`,
    120,
    "UserSentJabKarboardWebsiteData"
  );
});

bot.action("highest_money_karboard", async (ctx) => {
  const jobData = await redis.get(
    `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const page = 1;
  const { jobPath, totalJobs } = await scrapJobsFrom_Karboard(
    technology,
    province,
    "highest_money",
    page
  );

  if (totalJobs === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-karboard_jobs.json`,
    });
    fs.unlinkSync(jobPath);
    const calculateJobsReminaing = Math.max(totalJobs - 30, 0);

    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    await redis.setex(
      `UserDataScrapingFromKarboardWantToContinue:CHATID:${ctx.callbackQuery.from.id}`,
      220,
      JSON.stringify({
        page: page + 1,
        province,
        technology,
        remainingJobs: calculateJobsReminaing,
        sortBy: "highest_money",
      })
    );
    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | 30 شغل با موفقیت استخراج شد و فایل JSON ارسال شد. میخوای ادامه بدی؟\n📍${calculateJobsReminaing} شغل از ${totalJobs} کل شغل هنوز باقی مونده`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 | ادامه استخراج",
                callback_data: "continue_job_karboard",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_karboard" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("new_job_karboard", async (ctx) => {
  const jobData = await redis.get(
    `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const page = 1;
  const { jobPath, totalJobs } = await scrapJobsFrom_Karboard(
    technology,
    province,
    "new_job",
    page
  );

  if (totalJobs === 0) {
    ctx.sendChatAction("typing");
    if (fs.existsSync(jobPath)) {
      fs.unlinkSync(jobPath);
    }
    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-karboard_jobs.json`,
    });
    fs.unlinkSync(jobPath);
    const calculateJobsReminaing = Math.max(totalJobs - 30, 0);

    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    await redis.setex(
      `UserDataScrapingFromKarboardWantToContinue:CHATID:${ctx.callbackQuery.from.id}`,
      220,
      JSON.stringify({
        page: page + 1,
        province,
        technology,
        remainingJobs: calculateJobsReminaing,
        sortBy: "new_job",
      })
    );
    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | 30 شغل با موفقیت استخراج شد و فایل JSON ارسال شد. میخوای ادامه بدی؟\n📍${calculateJobsReminaing} شغل از ${totalJobs} کل شغل هنوز باقی مونده`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 | ادامه استخراج",
                callback_data: "continue_job_karboard",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_karboard" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    if (fs.existsSync(jobPath)) {
      fs.unlinkSync(jobPath);
    }
    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("match_job_karboard", async (ctx) => {
  const jobData = await redis.get(
    `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const page = 1;
  const { jobPath, totalJobs } = await scrapJobsFrom_Karboard(
    technology,
    province,
    "match_job",
    page
  );

  if (totalJobs === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-karboard_jobs.json`,
    });
    if (fs.existsSync(jobPath)) {
      fs.unlinkSync(jobPath);
    }
    const calculateJobsReminaing = Math.max(totalJobs - 30, 0);

    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    await redis.setex(
      `UserDataScrapingFromKarboardWantToContinue:CHATID:${ctx.callbackQuery.from.id}`,
      220,
      JSON.stringify({
        page: page + 1,
        province,
        technology,
        remainingJobs: calculateJobsReminaing,
        sortBy: "match_job",
      })
    );
    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | 30 شغل با موفقیت استخراج شد و فایل JSON ارسال شد. میخوای ادامه بدی؟\n📍${calculateJobsReminaing} شغل از ${totalJobs} کل شغل هنوز باقی مونده`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 | ادامه استخراج",
                callback_data: "continue_job_karboard",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_karboard" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    if (fs.existsSync(jobPath)) {
      fs.unlinkSync(jobPath);
    }
    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("continue_job_karboard", async (ctx) => {
  const data = await redis.get(
    `UserDataScrapingFromKarboardWantToContinue:CHATID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(data)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { page, province, technology, remainingJobs, sortBy } =
    JSON.parse(data);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const { jobPath, totalJobs } = await scrapJobsFrom_Karboard(
    technology,
    province,
    sortBy,
    page
  );

  if (totalJobs === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-karboard_jobs.json`,
    });
    if (fs.existsSync(jobPath)) {
      fs.unlinkSync(jobPath);
    }
    const calculateJobsRemaining = Math.max(
      remainingJobs - Math.min(30, remainingJobs),
      0
    );

    const TTLRedisKey = `UserDataScrapingFromKarboardWantToContinue:CHATID:${ctx.callbackQuery.from.id}`;

    const TTLRedisTime = await redis.ttl(TTLRedisKey);
    if (TTLRedisTime > 0) {
      await redis.expire(TTLRedisKey, TTLRedisTime + 200);
    } else {
      await redis.expire(TTLRedisKey, 220);
    }

    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | 30 شغل با موفقیت استخراج شد و فایل JSON ارسال شد. میخوای ادامه بدی؟\n📍${calculateJobsRemaining} شغل از ${remainingJobs} کل شغل هنوز باقی مونده`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 | ادامه استخراج",
                callback_data: "continue_job_karboard",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_karboard" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    if (fs.existsSync(jobPath)) {
      fs.unlinkSync(jobPath);
    }
    await redis.del(
      `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("cancel_job_karboard", async (ctx) => {
  await redis.del(
    `UserKarboardJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
  );
  await redis.del(
    `UserDataScrapingFromKarboardWantToContinue:CHATID:${ctx.callbackQuery.from.id}`
  );

  ctx.sendChatAction("typing");
  return ctx.editMessageText("استخراج با موفقیت لفو شد ✔", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
      ],
    },
  });
});

bot.action("jobyab_jobvision", async (ctx) => {
  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "👇🏻 | ابتدا اسم تکنولوژی که فعالیت میکنی و سپس با کاراکتر / از هم جدا و استانی که میخوای کار پیدا کنی برام ارسال کن.\n💡|  مثال:\nNode.js/اردبیل",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    }
  );
  return await redis.setex(
    `UserSentJabJobvisionWebsiteData:ChatID:${ctx.callbackQuery.from.id}`,
    120,
    "UserSentJabJobvisionWebsiteData"
  );
});
bot.action("highest_money_jobvision", async (ctx) => {
  const jobData = await redis.get(
    `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const page = 1;
  const { jobPath, totalJobs, jobsAdded } = await scrapJobsFrom_JobVision(
    technology,
    province,
    "highest_money",
    page
  );

  if (totalJobs === 0 || jobsAdded === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-jobvision_jobs.json`,
    });
    fs.unlinkSync(jobPath);
    const calculateJobsReminaing = Math.max(totalJobs - jobsAdded, 0);

    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    await redis.setex(
      `UserDataScrapingFromJobVisionWantToContinue:CHATID:${ctx.callbackQuery.from.id}`,
      220,
      JSON.stringify({
        page: page + 1,
        province,
        technology,
        remainingJobs: calculateJobsReminaing,
        sortBy: "highest_money",
      })
    );
    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | ${jobsAdded} شغل با موفقیت استخراج شد و فایل JSON ارسال شد. میخوای ادامه بدی؟\n📍${calculateJobsReminaing} شغل از ${totalJobs} کل شغل هنوز باقی مونده`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 | ادامه استخراج",
                callback_data: "continue_job_jobvision",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_jobvision" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("new_job_jobvision", async (ctx) => {
  const jobData = await redis.get(
    `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const page = 1;
  const { jobPath, totalJobs, jobsAdded } = await scrapJobsFrom_JobVision(
    technology,
    province,
    "highest_money",
    page
  );

  if (totalJobs === 0 || jobsAdded === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-jobvision_jobs.json`,
    });
    fs.unlinkSync(jobPath);
    const calculateJobsReminaing = Math.max(totalJobs - jobsAdded, 0);

    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    await redis.setex(
      `UserDataScrapingFromJobVisionWantToContinue:CHATID:${ctx.callbackQuery.from.id}`,
      220,
      JSON.stringify({
        page: page + 1,
        province,
        technology,
        remainingJobs: calculateJobsReminaing,
        sortBy: "new_job",
      })
    );
    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | ${jobsAdded} شغل با موفقیت استخراج شد و فایل JSON ارسال شد. میخوای ادامه بدی؟\n📍${calculateJobsReminaing} شغل از ${totalJobs} کل شغل هنوز باقی مونده`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 | ادامه استخراج",
                callback_data: "continue_job_jobvision",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_jobvision" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("match_job_jobvision", async (ctx) => {
  const jobData = await redis.get(
    `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const page = 1;
  const { jobPath, totalJobs, jobsAdded } = await scrapJobsFrom_JobVision(
    technology,
    province,
    "match_job",
    page
  );

  if (totalJobs === 0 || jobsAdded === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-jobvision_jobs.json`,
    });
    fs.unlinkSync(jobPath);
    const calculateJobsReminaing = Math.max(totalJobs - jobsAdded, 0);

    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    await redis.setex(
      `UserDataScrapingFromJobVisionWantToContinue:CHATID:${ctx.callbackQuery.from.id}`,
      220,
      JSON.stringify({
        page: page + 1,
        province,
        technology,
        remainingJobs: calculateJobsReminaing,
        sortBy: "match_job",
      })
    );
    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | ${jobsAdded} شغل با موفقیت استخراج شد و فایل JSON ارسال شد. میخوای ادامه بدی؟\n📍${calculateJobsReminaing} شغل از ${totalJobs} کل شغل هنوز باقی مونده`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 | ادامه استخراج",
                callback_data: "continue_job_jobvision",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_jobvision" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("continue_job_jobvision", async (ctx) => {
  const data = await redis.get(
    `UserDataScrapingFromJobVisionWantToContinue:CHATID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(data)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { page, province, technology, remainingJobs, sortBy } =
    JSON.parse(data);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const { jobPath, totalJobs, jobsAdded } = await scrapJobsFrom_JobVision(
    technology,
    province,
    sortBy,
    page
  );

  if (totalJobs === 0 || jobsAdded === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-karboard_jobs.json`,
    });
    if (fs.existsSync(jobPath)) {
      fs.unlinkSync(jobPath);
    }
    const calculateJobsRemaining = Math.max(
      remainingJobs - Math.min(jobsAdded, remainingJobs),
      0
    );

    const TTLRedisKey = `UserDataScrapingFromJobVisionWantToContinue:CHATID:${ctx.callbackQuery.from.id}`;

    const TTLRedisTime = await redis.ttl(TTLRedisKey);
    if (TTLRedisTime > 0) {
      await redis.expire(TTLRedisKey, TTLRedisTime + 230);
    } else {
      await redis.expire(TTLRedisKey, 240);
    }

    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | ${jobsAdded} شغل با موفقیت استخراج شد و فایل JSON ارسال شد. میخوای ادامه بدی؟\n📍${calculateJobsRemaining} شغل از ${remainingJobs} کل شغل هنوز باقی مونده`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 | ادامه استخراج",
                callback_data: "continue_job_karboard",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_karboard" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    if (fs.existsSync(jobPath)) {
      fs.unlinkSync(jobPath);
    }
    await redis.del(
      `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("cancel_job_jobvision", async (ctx) => {
  await redis.del(
    `UserJobvisionJobKeywords:ChatID:${ctx.callbackQuery.from.id}`
  );
  await redis.del(
    `UserDataScrapingFromJobVisionWantToContinue:CHATID:${ctx.callbackQuery.from.id}`
  );
  ctx.sendChatAction("typing");
  return ctx.editMessageText("استخراج با موفقیت لفو شد ✔", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
      ],
    },
  });
});

bot.action("jobyab_jobinja", async (ctx) => {
  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "👇🏻 | ابتدا اسم تکنولوژی که فعالیت میکنی و سپس با کاراکتر / از هم جدا و استانی که میخوای کار پیدا کنی برام ارسال کن.\n💡|  مثال:\nNode.js/اردبیل",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    }
  );
  return await redis.setex(
    `UserSentJabinjaWebsiteData:ChatID:${ctx.callbackQuery.from.id}`,
    120,
    "UserSentJabinjaWebsiteDataStep"
  );
});

bot.action("match_job_jobinja", async (ctx) => {
  const jobData = await redis.get(
    `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const { jobPath, totalJobs, jobsAdded } = await scrapJobsFrom_JobInja(
    technology,
    province,
    "match_job"
  );

  if (totalJobs === 0 || jobsAdded === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-jobinja_jobs.json`,
    });
    fs.unlinkSync(jobPath);

    await redis.del(
      `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | استخراج با موفقیت به پایان رسید و ${totalJobs} شغل نسبت به کلید واژه درخواستی شما یافت شد و فایل JSON برای شما ارسال شد. ✅`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("highest_money_jobinja", async (ctx) => {
  const jobData = await redis.get(
    `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const { jobPath, totalJobs, jobsAdded } = await scrapJobsFrom_JobInja(
    technology,
    province,
    "highest_money"
  );

  if (totalJobs === 0 || jobsAdded === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-jobinja_jobs.json`,
    });
    fs.unlinkSync(jobPath);

    await redis.del(
      `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | استخراج با موفقیت به پایان رسید و ${totalJobs} شغل نسبت به کلید واژه درخواستی شما یافت شد و فایل JSON برای شما ارسال شد. ✅`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("new_job_jobinja", async (ctx) => {
  const jobData = await redis.get(
    `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
  );

  if (!JSON.parse(jobData)) {
    ctx.sendChatAction("typing");
    return ctx.editMessageText(
      "❌ | مدت زمان شما به پایان رسیده، لطفا مجدد مراحل رو انجام بدید .⌛️",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const { technology, province } = JSON.parse(jobData);

  ctx.sendChatAction("typing");
  ctx.editMessageText(
    "💰 | درحال استخراج مشاغل مورد نظر، ممکن است کمی طول بکشد ... ⏳"
  );

  const { jobPath, totalJobs, jobsAdded } = await scrapJobsFrom_JobInja(
    technology,
    province,
    "new_job"
  );

  if (totalJobs === 0 || jobsAdded === 0) {
    ctx.sendChatAction("typing");
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
    );
    return ctx.reply("آگهی فعالی یافت نشد!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
  }

  try {
    ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.callbackQuery.from.id, {
      source: fs.createReadStream(jobPath),
      filename: `${technology}-jobinja_jobs.json`,
    });
    fs.unlinkSync(jobPath);

    await redis.del(
      `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply(
      `👈🏻 | استخراج با موفقیت به پایان رسید و ${totalJobs} شغل نسبت به کلید واژه درخواستی شما یافت شد و فایل JSON برای شما ارسال شد. ✅`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
          ],
        },
      }
    );
  } catch (error) {
    console.log(error);
    fs.unlinkSync(jobPath);
    await redis.del(
      `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
    );
    ctx.sendChatAction("typing");
    return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
  }
});

bot.action("cancel_job_jobinja", async (ctx) => {
  await redis.del(
    `UserJobInjaJobDataInput:ChatID:${ctx.callbackQuery.from.id}`
  );
  ctx.sendChatAction("typing");
  return ctx.editMessageText("استخراج با موفقیت لفو شد ✔", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
      ],
    },
  });
});

bot.action("gitHubOpenSourceProjects", async (ctx) => {
  ctx.sendChatAction("typing");
  return ctx.editMessageText(
    "👈🏻 | به بخش پیدا کردن پروژه های open source از گیت هاب خوش اومدی.\n\n⚠️ | دقت داشته باش این بخش بر اساس پروژه هایی که داخل وبسایت مد نظر ثبت شده است کار میکند نه مستقیم از گیت هاب.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔪 | شروع", callback_data: "startOpenSource_scraping" }],
          [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
        ],
      },
    }
  );
});

bot.action("startOpenSource_scraping", async (ctx) => {
  ctx.deleteMessage();
  ctx.sendChatAction("typing");
  ctx.reply("👇🏻 | زبان برنامه نویس خود را ارسال نمایید");

  return redis.setex(
    `UserSendProgrammingLang:chatid: ${ctx.callbackQuery.from.id}`,
    120,
    "SentLangForGitHubOpenSource"
  );
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
  const unBlockUserStep = await redis.get("unBlockUserStep");
  const removeStack = await redis.get("removeStack");
  const addStack = await redis.get("addStack");
  const editStackTitleStep = await redis.get("editStackTitleStep");
  const WAITING_FOR_STACK_TITLE_FOR_EDIT = await redis.get(
    "WAITING_FOR_STACK_TITLE_FOR_EDIT"
  );

  const newMessageFromChatIdStep = await redis.get(
    `newMessageFromChatId: ${ctx.from.id}`
  );
  const answerMessageToChatIdStep = await redis.get(
    `answerMessageToChatId: ${ctx.from.id}`
  );
  const editGitHubStep = await redis.get(
    `editGitHubStep:ChatID:${ctx.from.id}`
  );
  const editLinkedinStep = await redis.get(
    `editLinkedinStep:ChatID:${ctx.from.id}`
  );
  const editNameStep = await redis.get(`editNameStep:ChatID:${ctx.from.id}`);
  const editCityStep = await redis.get(`editCityStep:ChatID:${ctx.from.id}`);
  const editStackStep = await redis.get(`editStackStep:ChatID:${ctx.from.id}`);

  const userRequestStack = await redis.get(
    `UserRequestStack:ChatID:${ctx.from.id}`
  );

  const UserRequestPackageStep = await redis.get(
    `UserRequestPackage:ChatID:${ctx.from.id}`
  );
  const UserRequestDevToArticleStep = await redis.get(
    `UserRequestDevToArticleStep:CHARID:${ctx.from.id}`
  );
  const UserRequestVirgoolArticleStep = await redis.get(
    `UserRequestVirgoolArticleStep:CHARID:${ctx.from.id}`
  );
  const waitingForUserMediumLink = await redis.get(
    `waitingForUserMediumLink:CHATID${ctx.from.id}`
  );

  const UserRandomKeywordsStep = await redis.get(
    `UserRandomKeywordsStep:CHATID${ctx.from.id}`
  );
  const UserRequestSourceStep = await redis.get(
    `UserRequestSource:CHATID${ctx.from.id}`
  );
  const waitingForUserJobData = await redis.get(
    `UserSentJobDataChatID${ctx.from.id}`
  );
  const jabKarboardWebsiteData = await redis.get(
    `UserSentJabKarboardWebsiteData:ChatID:${ctx.from.id}`
  );
  const jabVisionWebsiteData = await redis.get(
    `UserSentJabJobvisionWebsiteData:ChatID:${ctx.from.id}`
  );
  const jabinjaWebsiteData = await redis.get(
    `UserSentJabinjaWebsiteData:ChatID:${ctx.from.id}`
  );
  const langForGitHubOpenSource = await redis.get(
    `UserSendProgrammingLang:chatid: ${ctx.from.id}`
  );

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
    ctx.reply("فوروارد با موفقیت به تمامی کاربران ارسال شد. ✔");
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
      ctx.reply("🚫 کاربری با ایدی مورد نظر یافت نشد! 🚫", {
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
    ctx.reply("پیام با موفقیت به تمامی کاربران ارسال شد. ✔");
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

  if (unBlockUserStep === "WAITING_FOR_CHATID") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const chatID = parseInt(ctx.message.text);

    if (isNaN(chatID)) return ctx.reply("ایدی فرد درست نمیباشد!");

    await unBanUser(ctx, chatID);
    await redis.del("unBlockUserStep");
  }

  if (newMessageFromChatIdStep === "WAITING_FOR_MESSAGE") {
    const messageId = ctx.message.message_id;
    const fromChatId = await redis.get("fromChatId");
    const admins = await getAllAdmins();

    ctx.sendChatAction("typing");
    ctx.reply(
      "پیام شما با موفقیت دریافت و به ادمین ارسال شد. ✔\nلطفا منتظر پاسخ بمانید.",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      }
    );

    for (const admin of admins) {
      const chatId = Number(admin.chat_id);
      try {
        const { bio, username, first_name } = await ctx.telegram.getChat(
          fromChatId
        );

        const response = `شما پیام جدید دارید از طرف: 👇\n👤نام کاربر: ${first_name}\n🆔 ایدی کاربر: ${fromChatId}\n🔖 یوزرنیم کاربر: @${
          username ? username : "یوزرنیم ندارد"
        }\n 📚 بیو کاربر: ${
          bio ? bio : "بیو ندارد"
        }\n\n <a href= "tg://openmessage?user_id=${fromChatId}">پیوی کاربر </a>
      `;

        await bot.telegram.forwardMessage(chatId, fromChatId, messageId);
        ctx.reply(response, {
          chat_id: chatId,
          reply_markup: {
            inline_keyboard: [
              [{ text: "💬 | پاسخ", callback_data: "answerChat" }],
              [{ text: "🔚 | بستن گفتگو", callback_data: "endCaht" }],
            ],
          },
          parse_mode: "HTML",
        });
        await redis.del(`newMessageFromChatId: ${ctx.from.id}`);
      } catch (error) {
        ctx.sendChatAction("typing");
        ctx.reply(`خطا در ارسال پیام. ${error}`);
      }
    }
  }

  if (answerMessageToChatIdStep === "ANSWERED_MESSAGE_TO_CHATID") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const userChatId = await redis.get("fromChatId");
    const adminChatId = await redis.get("adminChatId");

    const messageId = ctx.message.message_id;

    ctx.sendChatAction("typing");

    ctx.reply("پیام شما با موفقیت ارسال شد. ✔", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔚 | بستن گفتگو", callback_data: "endCaht" }],
        ],
      },
    });
    try {
      ctx.sendChatAction("typing");

      await ctx.telegram.sendMessage(
        userChatId,
        "شما پیام جدید از طرف ادمین دارید. 👇🏻"
      );
      await ctx.telegram.forwardMessage(userChatId, adminChatId, messageId);
      await redis.del(`answerMessageToChatId: ${ctx.from.id}`);
    } catch (error) {
      ctx.sendChatAction("typing");
      ctx.reply(`خطا در ارسال پیام. ${error}`);
    }
  }

  if (editGitHubStep === "WAITING_FOR_LINK") {
    const link = ctx.text;
    if (!link.startsWith("https://github.com/")) {
      return ctx.reply("آدرس معتبر نیست! 🚫\nمجدد بفرست: 👇🏻", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      });
    }

    await editGitHubLink(ctx, link);
    await redis.del(`editGitHubStep:ChatID:${ctx.from.id}`);
  }
  if (editLinkedinStep === "WAITING_FOR_LINK") {
    const link = ctx.text;
    if (!link.startsWith("https://www.linkedin.com/")) {
      return ctx.reply("آدرس معتبر نیست! 🚫\nمجدد بفرست: 👇🏻", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      });
    }

    await editLinkedin(ctx, link);
    await redis.del(`editLinkedinStep:ChatID:${ctx.from.id}`);
  }
  if (editNameStep === "WAITING_FOR_NAME") {
    const name = ctx.text;

    await editName(ctx, name);
    await redis.del(`editNameStep:ChatID:${ctx.from.id}`);
  }
  if (editCityStep === "WAITING_FOR_CITY") {
    const city = ctx.text;

    await editCity(ctx, city);
    await redis.del(`editCityStep:ChatID:${ctx.from.id}`);
  }
  if (editStackStep === "WAITING_FOR_STACK") {
    let stacks = ctx.text.trim();

    stacks = /,/.test(stacks)
      ? stacks.split(",").map((e) => e.trim())
      : [stacks];

    await editStacks(ctx, stacks);
    await redis.del(`editStackStep:ChatID:${ctx.from.id}`);
  }

  if (removeStack === "WAITING_FOR_STACKID") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    await removeStackQuery(ctx);
    await redis.del("removeStack");
  }

  if (addStack === "WAITING_FOR_TITLE") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    let titles = ctx.text.trim();

    titles = /,/.test(titles)
      ? titles.split(",").map((title) => title.trim())
      : [titles];
    await insertStack(ctx, titles);
    await redis.del("addStack");
  }

  if (editStackTitleStep === "WAITING_FOR_STACKID") {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const stackID = Number(ctx.text);

    const result = await checkIsStackInserted(stackID);

    if (result) {
      await redis.setex("WAITING_FOR_STACK_TITLE_FOR_EDIT", 120, stackID);
      await redis.del("editStackTitleStep");
      await ctx.sendChatAction("typing");
      return ctx.reply("👈🏻 | اسم حوزه را جهت ویرایش ارسال نمایید.", {
        reply_markup: {
          keyboard: [[{ text: "🔙 | بازگشت" }]],
          resize_keyboard: true,
          remove_keyboard: true,
        },
      });
    }

    await redis.del("editStackTitleStep");
    await ctx.sendChatAction("typing");
    return ctx.reply("حوزه وجود ندارد ! ❌", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
  }

  if (WAITING_FOR_STACK_TITLE_FOR_EDIT) {
    const userRole = await getUserRole(ctx);
    if (userRole.role !== "ADMIN") return;

    const title = ctx.text;
    const stackID = await redis.get("WAITING_FOR_STACK_TITLE_FOR_EDIT");

    await editStackTitleQuery(Number(stackID), title);

    await redis.del("WAITING_FOR_STACK_TITLE_FOR_EDIT");

    await ctx.sendChatAction("typing");
    return ctx.reply(" ✔.اسم حوزه را با موفقیت ویرایش شد", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
  }

  if (userRequestStack === "WAITING_FOR_STACK") {
    let stack = ctx.text.trim();

    await findTeamMateFromUserRequstStack(ctx, stack);

    await redis.del(`UserRequestStack:ChatID:${ctx.from.id}`);
  }

  if (UserRequestPackageStep === "WAITING_FOR_PACKAGE_KEYWORD") {
    const packageKeyword = ctx.message.text;
    await ctx.sendChatAction("typing");
    await ctx.reply("درحال استخراج 40 پکیج اول, ممکن است کمی طول بکشد .... ⏳");

    let page = 0;
    let perPage = 40;
    const { totalPackagesFound, filePath } = await scraperNPMPackages(
      packageKeyword,
      page,
      perPage
    );
    await ctx.sendChatAction("upload_document");

    await ctx.telegram.sendDocument(ctx.chat.id, {
      source: fs.createReadStream(filePath),
      filename: `${packageKeyword}-packages.json`,
    });
    fs.unlinkSync(filePath);
    await ctx.sendChatAction("typing");
    await ctx.reply(
      `40 پکیج استخراج شد از مجموع ${totalPackagesFound}.\nمیخوای ادامه بدی؟`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌛️ | ادامه استخراج", callback_data: "continue_scrap" }],
            [{ text: "❌ | لغو", callback_data: "cancel_scrap" }],
          ],
        },
      }
    );
    await redis.setex(
      `UserRequestPackageContinue:CHATID${ctx.from.id}`,
      120,
      JSON.stringify({ packageKeyword, page: page + 1, perPage })
    );
  }

  if (UserRequestDevToArticleStep === "WAITING_FOR_ARTICLE_KEYWORD") {
    const keywords = ctx.text.split(",").map((e) => e.trim());

    ctx.sendChatAction("typing");
    ctx.reply(
      "کلید واژه دریافت شد. میخوای بر چه اساسی برات جستجو رو انجام بدم؟\n👈🏻 انتخاب کن:",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "❌ | لغو", callback_data: "cancel_scrap_article" }],
            [
              {
                text: "جستجو براساس مرتبط‌ترین | ✅",
                callback_data: "MostRelevant",
              },
            ],
            [{ text: "جستجو براساس جدیدترین | 🆕", callback_data: "Newest" }],
            [{ text: "جستجو براساس قدیمی‌ترین | 🔎", callback_data: "Oldest" }],
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      }
    );

    await redis.setex(
      `UserKeywords:CHATID${ctx.from.id}`,
      120,
      keywords.join("+")
    );
    await redis.del(`UserRequestDevToArticleStep:CHARID:${ctx.from.id}`);
  }

  if (UserRequestVirgoolArticleStep === "WAITING_FOR_VIRGOOL_ARTICLE_KEYWORD") {
    const keywords = ctx.text
      .split(/[,،]/)
      .map((e) => e.trim())
      .join(" ");

    ctx.sendChatAction("typing");
    ctx.reply("درحال استخراج مقالات ممکن است کمی طول بکشد ... ⏳");

    const { totalArticlesCount, virgoolArticlesPath } =
      await scrapArticlesFromVirgoolWebsite(keywords, 10);
    ctx.sendChatAction("typing");
    ctx.reply(
      `${totalArticlesCount} مقاله با موفقیت از سایت ویرگول استخراج شد ✅, تنها 6 دقیقه فرصت داری فایل خروجی رو دریافت کنی\n👈🏻 برای دریافت رویه دکمه خروجی کلیک کن:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📥 | خروجی", callback_data: "send_virgool_output" }],
            [{ text: "❌ | لغو", callback_data: "cancel_virgool_scrap" }],
          ],
        },
      }
    );
    await redis.setex(
      `UserKeywordsVirgool:CHATID${ctx.from.id}`,
      400,
      JSON.stringify({ keywords, virgoolArticlesPath })
    );
    await redis.del(`UserRequestVirgoolArticleStep:CHARID:${ctx.from.id}`);
  }

  if (waitingForUserMediumLink === "WAITING_FOR_MEDIUM_LINK") {
    let link = ctx.text;

    if (link.startsWith("https://medium.com/")) {
      link = link.replace("https://medium.com/", "https://readmedium.com/");

      ctx.sendChatAction("typing");
      ctx.reply(link);
      await redis.del(`waitingForUserMediumLink:CHATID${ctx.from.id}`);

      ctx.reply("با موفقیت آنلاک شد از لینک بالایی میتونی مقاله رو بخونی  ✔", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      });
      return;
    } else {
      await redis.del(`waitingForUserMediumLink:CHATID${ctx.from.id}`);
      return ctx.reply("لینک ارسالی معتبر نیست دوباره مراحل رو انجام بده 🚫", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      });
    }
  }

  if (UserRandomKeywordsStep === "WAITING_FOR_RANDOM_KEYWORD") {
    const keywords = ctx.text
      .toLocaleLowerCase()
      .split(",")
      .map((e) => e.trim());
    const articlePath = `./src/scraping/${keywords.join(
      " "
    )}-RandomArticles.json`;

    ctx.sendChatAction("typing");

    ctx.reply(
      "کلید واژه‌ با موفقیت دریافت شد، در حال جستجو مقالات ممکن است کمی طول بکشد. ⌛️"
    );

    const { bacancytechnologyArticlesLength } =
      await scrapArticlesFromBacancyWebsite(keywords.join(" "), articlePath);
    const { freecodecampArticlesLength } =
      await scrapSerachingArticleFromFreeCodeCamp(
        keywords.join(" "),
        2,
        articlePath
      );

    ctx.sendChatAction("typing");
    ctx.reply(
      `${
        freecodecampArticlesLength + bacancytechnologyArticlesLength
      } مقاله برات جمع کردم، درحال ارسال فایل JSON 😎`
    );

    await ctx.sendChatAction("upload_document");
    await ctx.telegram.sendDocument(ctx.chat.id, {
      source: fs.createReadStream(articlePath),
      filename: `${keywords.join(" ")}-RandomArticles.json`,
    });
    fs.unlinkSync(articlePath);
    await ctx.sendChatAction("typing");
    ctx.reply("فرایند استخراج با موفقیت به پایان رسید ✔", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
        ],
      },
    });
    await redis.del(`UserRandomKeywordsStep:CHATID${ctx.from.id}`);
  }

  if (UserRequestSourceStep === "WAITING_FOR_SOURCE_KEYWORD") {
    const keywords = ctx.text
      .toLocaleLowerCase()
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e);
    const msgID = ctx.message.message_id - 1 || ctx.message.message_id;

    ctx.sendChatAction("typing");
    ctx.deleteMessage(msgID);
    ctx.reply(
      "👈🏻 | کلید واژه با موفقیت دریافت شد. برای سرچ و نتیجه بهتر طبق خواستت، دوست داری بر چه اساسی فرایند استخراج رو انجام بدم؟\n\n👇🏻| انتخاب کن:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🟰| مرتبط ترین",
                callback_data: "github_sortBY_best_match",
              },
            ],
            [
              {
                text: "🌟| بیشترین ستاره ➕",
                callback_data: "github_sortBY_most_stars",
              },
              {
                text: "⭐️| کمترین ستاره ➖",
                callback_data: "github_sortBY_fewest_stars",
              },
            ],
            [
              {
                text: "🍴| بیشترین Forks ➕",
                callback_data: "github_sortBY_most_forks",
              },
              {
                text: "🍴| کمترین Forks ➖",
                callback_data: "github_sortBY_fewest_forks",
              },
            ],
            [
              {
                text: "⏱️ | آخرین بروزرسانی",
                callback_data: "github_sortBY_last_recentrly_updated",
              },
              {
                text: "⏰ | اخیرا به روز شده",
                callback_data: "github_sortBY_recentrly_updated",
              },
            ],
            [{ text: "❌| لغو", callback_data: "github_cancel_scraping" }],
          ],
        },
      }
    );
    await redis.setex(
      `UserSentKeywordsForSource:CHARID${ctx.from.id}`,
      200,
      keywords.join("+")
    );
    await redis.del(`UserRequestSource:CHATID${ctx.from.id}`);
  }

  if (waitingForUserJobData === "waitingForUserJobData") {
    const keyword = ctx.text.split("/");

    if (keyword.length !== 2) {
      await redis.del(`UserSentJobDataChatID${ctx.from.id}`);
      ctx.deleteMessage();
      return ctx.reply(
        "❌ | فُرمت ارسالی اشتباهه، لطفا طبق فُرمت خواسته شده ارسال کن.\nمجدد مراحلو طی کن.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
            ],
          },
        }
      );
    }
    const technology = keyword[0];
    const province = keyword[1];

    const checkingProvince = validateProvince(province);
    if (!checkingProvince) {
      ctx.sendChatAction("typing");
      ctx.reply(
        "❌ | استانی که ارسال کردی داخل لیست استان های موجود سایت آی-استخدام موجود نیست.\n👇🏻 | لیست استان های موجود برات ارسال کردم.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
            ],
          },
        }
      );
      await redis.del(`UserSentJobDataChatID${ctx.from.id}`);

      return ctx.reply(
        `🌆 | لیست استان های موجود به شرح زیر می‌باشد:\n\n${provinceList
          .join(" ")
          .replace(/ /g, "\n")}`
      );
    }
    const checkingTechnology = validateTechnology(technology);

    if (!checkingTechnology) {
      ctx.sendChatAction("typing");
      ctx.reply(
        "❌ | حوزه که ارسال کردی داخل لیست حوزه های موجود سایت آی-استخدام موجود نیست.\n👇🏻 | لیست حوزه های موجود برات ارسال کردم.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
            ],
          },
        }
      );
      await redis.del(`UserSentJobDataChatID${ctx.from.id}`);

      return ctx.reply(
        `✏️ | لیست حوزه های موجود به شرح زیر می‌باشد:\n\n${technologyList
          .join(" ")
          .replace(/ /g, "\n")}`
      );
    }

    ctx.sendChatAction("typing");
    ctx.reply(
      "🔑 | کلید واژه با موفقیت دریافت شد. حالا میخوای با چه فیلتری برات جستجو رو انجام بدم؟\n👇🏻| انتخاب کن:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💵 | بالاترین‌حقوق",
                callback_data: "highest_money_e-estekhdam",
              },
            ],

            [
              { text: "🆕 | جدید‌ترین", callback_data: "new_job_e-estekhdam" },
              {
                text: "🆗 | مرتبط‌‌ترین",
                callback_data: "match_job_e-estekhdam",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_e-estekhdam" }],
          ],
        },
      }
    );

    await redis.del(`UserSentJobDataChatID${ctx.from.id}`);
    return await redis.setex(
      `UserJobKeywordsChatID${ctx.from.id}`,
      220,
      JSON.stringify({ technology, province })
    );
  }

  if (jabKarboardWebsiteData === "UserSentJabKarboardWebsiteData") {
    const keyword = ctx.text.split("/");

    if (keyword.length !== 2) {
      await redis.del(`UserSentJabKarboardWebsiteData:ChatID:${ctx.from.id}`);
      ctx.deleteMessage();
      return ctx.reply(
        "❌ | فُرمت ارسالی اشتباهه، لطفا طبق فُرمت خواسته شده ارسال کن.\nمجدد مراحلو طی کن.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
            ],
          },
        }
      );
    }
    const technology = keyword[0];
    const province = keyword[1];

    const existProvince = province in karboardWebsiteProvince;

    if (!existProvince) {
      ctx.sendChatAction("typing");
      ctx.reply(
        "❌ | استانی که ارسال کردی داخل لیست استان های موجود سایت کاربرد موجود نیست.\n👇🏻 | لیست استان های موجود برات ارسال کردم.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
            ],
          },
        }
      );

      return ctx.reply(
        `🌆 | لیست استان های موجود به شرح زیر می‌باشد:\n\n${Object.keys(
          karboardWebsiteProvince
        )
          .join(" ")
          .replace(/ /g, "\n")}`
      );
    }
    ctx.sendChatAction("typing");
    ctx.reply(
      "🔑 | کلید واژه با موفقیت دریافت شد. حالا میخوای با چه فیلتری برات جستجو رو انجام بدم؟\n👇🏻| انتخاب کن:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💵 | بالاترین‌حقوق",
                callback_data: "highest_money_karboard",
              },
            ],

            [
              { text: "🆕 | جدید‌ترین", callback_data: "new_job_karboard" },
              {
                text: "🆗 | مرتبط‌‌ترین",
                callback_data: "match_job_karboard",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_karboard" }],
          ],
        },
      }
    );

    await redis.del(`UserSentJabKarboardWebsiteData:ChatID:${ctx.from.id}`);
    return await redis.setex(
      `UserKarboardJobKeywords:ChatID:${ctx.from.id}`,
      220,
      JSON.stringify({
        technology,
        province: karboardWebsiteProvince[province],
      })
    );
  }

  if (jabVisionWebsiteData === "UserSentJabJobvisionWebsiteData") {
    const keyword = ctx.text.split("/");

    if (keyword.length !== 2) {
      await redis.del(`UserSentJabJobvisionWebsiteData:ChatID:${ctx.from.id}`);
      ctx.deleteMessage();
      return ctx.reply(
        "❌ | فُرمت ارسالی اشتباهه، لطفا طبق فُرمت خواسته شده ارسال کن.\nمجدد مراحلو طی کن.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
            ],
          },
        }
      );
    }
    const technology = keyword[0];
    const province = keyword[1];

    const existProvince = province in karboardWebsiteProvince;

    if (!existProvince) {
      ctx.sendChatAction("typing");
      ctx.reply(
        "❌ | استانی که ارسال کردی داخل لیست استان های موجود سایت جاب‌ویژن موجود نیست.\n👇🏻 | لیست استان های موجود برات ارسال کردم.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
            ],
          },
        }
      );

      return ctx.reply(
        `🌆 | لیست استان های موجود به شرح زیر می‌باشد:\n\n${Object.keys(
          karboardWebsiteProvince
        )
          .join(" ")
          .replace(/ /g, "\n")}`
      );
    }
    ctx.sendChatAction("typing");
    ctx.reply(
      "🔑 | کلید واژه با موفقیت دریافت شد. حالا میخوای با چه فیلتری برات جستجو رو انجام بدم؟\n👇🏻| انتخاب کن:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💵 | بالاترین‌حقوق",
                callback_data: "highest_money_jobvision",
              },
            ],

            [
              { text: "🆕 | جدید‌ترین", callback_data: "new_job_jobvision" },
              {
                text: "🆗 | مرتبط‌‌ترین",
                callback_data: "match_job_jobvision",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_jobvision" }],
          ],
        },
      }
    );

    await redis.del(`UserSentJabJobvisionWebsiteData:ChatID:${ctx.from.id}`);

    return await redis.setex(
      `UserJobvisionJobKeywords:ChatID:${ctx.from.id}`,
      220,
      JSON.stringify({
        technology,
        province: karboardWebsiteProvince[province],
      })
    );
  }

  if (jabinjaWebsiteData === "UserSentJabinjaWebsiteDataStep") {
    const keyword = ctx.text.split("/");

    if (keyword.length !== 2) {
      await redis.del(`UserSentJabinjaWebsiteData:ChatID:${ctx.from.id}`);
      ctx.deleteMessage();
      return ctx.reply(
        "❌ | فُرمت ارسالی اشتباهه، لطفا طبق فُرمت خواسته شده ارسال کن.\nمجدد مراحلو طی کن.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
            ],
          },
        }
      );
    }
    const technology = keyword[0];
    const province = keyword[1];

    const checkingProvince = validateProvince(province);
    if (!checkingProvince) {
      ctx.sendChatAction("typing");
      ctx.reply(
        "❌ | استانی که ارسال کردی داخل لیست استان های موجود سایت جابینجا موجود نیست.\n👇🏻 | لیست استان های موجود برات ارسال کردم.",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
            ],
          },
        }
      );

      return ctx.reply(
        `🌆 | لیست استان های موجود به شرح زیر می‌باشد:\n\n${provinceList
          .join(" ")
          .replace(/ /g, "\n")}`
      );
    }

    ctx.sendChatAction("typing");
    ctx.reply(
      "🔑 | کلید واژه با موفقیت دریافت شد. حالا میخوای با چه فیلتری برات جستجو رو انجام بدم؟\n👇🏻| انتخاب کن:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "💵 | بالاترین‌حقوق",
                callback_data: "highest_money_jobinja",
              },
            ],

            [
              { text: "🆕 | جدید‌ترین", callback_data: "new_job_jobinja" },
              {
                text: "🆗 | مرتبط‌‌ترین",
                callback_data: "match_job_jobinja",
              },
            ],
            [{ text: "❌ | لغو", callback_data: "cancel_job_jobinja" }],
          ],
        },
      }
    );

    await redis.del(`UserSentJabinjaWebsiteData:ChatID:${ctx.from.id}`);

    return await redis.setex(
      `UserJobInjaJobDataInput:ChatID:${ctx.from.id}`,
      220,
      JSON.stringify({
        technology,
        province,
      })
    );
  }

  if (langForGitHubOpenSource === "SentLangForGitHubOpenSource") {
    const lang = ctx.text;

    ctx.sendChatAction("typing");
    ctx.reply("درحال استخراج پروژهای متن باز ...");

    const { count, path } = await scrapOpenSourceFromGitHub(lang);

    if (count === 0) {
      ctx.sendChatAction("typing");
      await redis.del(`UserSendProgrammingLang:chatid: ${ctx.from.id}`);

      if (fs.existsSync(path)) fs.unlinkSync(path);
      return ctx.reply(" پروژه ایی نسبت به درخواست شما یافت نشد.", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      });
    }
    try {
      ctx.sendChatAction("upload_document");
      await ctx.telegram.sendDocument(ctx.from.id, {
        source: fs.createReadStream(path),
        filename: `${lang}-openSources.json`,
      });
      if (fs.existsSync(path)) fs.unlinkSync(path);

      await redis.del(`UserSendProgrammingLang:chatid: ${ctx.from.id}`);
      ctx.sendChatAction("typing");
      return ctx.reply(
      `استخراج با موفقیت انجام شد و ${count} پروژه متن باز یافت شد ✔`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 | بازگشت به پنل", callback_data: "backMenu" }],
            ],
          },
        }
      );
    } catch (error) {
      console.log(error);
      if (fs.existsSync(path)) fs.unlinkSync(path);
      await redis.del(`UserSendProgrammingLang:chatid: ${ctx.from.id}`);
      ctx.sendChatAction("typing");
      return ctx.reply("هنگام ارسال فایل خطایی رخ داد!!!");
    }
  }
});

connectToDB();
bot.launch().then(console.log("Bot Running"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
