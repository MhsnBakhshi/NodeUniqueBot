const { Markup } = require("telegraf");
const { prisma, redis } = require("../db");

const insertUser = async (ctx) => {
  const chatID = ctx.chat.id;
  const name = ctx.chat.first_name;
  const isUserAlreadyExist = await prisma.user.findFirst({
    where: { chat_id: chatID },
  });

  const userCount = await prisma.user.count();

  if (!isUserAlreadyExist) {
    await prisma.user.create({
      data: {
        chat_id: chatID,
        name,
        role: userCount === 0 ? "ADMIN" : "USER",
      },
    });
  }
};

const getUserRole = async (ctx) => {
  const chatID = ctx.chat.id;

  const userRole = await prisma.user.findFirst({
    where: { chat_id: chatID },
    select: {
      role: true,
    },
  });

  return userRole;
};

const getAllChatID = async () => {
  const chatIDs = await prisma.user.findMany({
    select: {
      chat_id: true,
    },
  });

  return chatIDs;
};
const findByChatID = async (chatID) => {
  const user = await prisma.user.findUnique({
    where: {
      chat_id: chatID,
    },
  });

  return user;
};

const findAndRemove = async (chatID, ctx) => {
  const user = await findByChatID(chatID);

  if (user) {
    await prisma.user.delete({
      where: {
        chat_id: chatID,
      },
    });
    ctx.reply("کاربر با موفقیت حذف شد ✔", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
    return;
  } else {
    ctx.reply("کاربری با ایدی مورد نظر یافت نشد!", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
    return;
  }
};
const findAndChangeRole = async (chatID, ctx, role, message) => {
  const user = await findByChatID(chatID);

  if (user) {
    await prisma.user.update({
      where: {
        chat_id: chatID,
      },
      data: {
        role: role,
      },
    });
    ctx.reply(message, {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
    return;
  } else {
    ctx.reply("🚫 کاربری با ایدی مورد نظر یافت نشد! 🚫", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
    return;
  }
};

const getAllAdmins = async () => {
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    select: {
      chat_id: true,
    },
  });

  return admins;
};

const isUserBanned = async (chatID) => {
  const isBanned = await prisma.ban.findFirst({
    where: {
      chat_id: chatID,
    },
  });

  if (isBanned) {
    return true;
  } else {
    return false;
  }
};

const banUser = async (ctx, chatID) => {
  await prisma.ban.create({
    data: {
      chat_id: chatID,
    },
  });
  ctx.reply("کاربر با موفقیت مسدود شد. ✔", {
    reply_markup: {
      keyboard: [[{ text: "🔙 | بازگشت" }]],
      resize_keyboard: true,
      remove_keyboard: true,
    },
  });
  return;
};

const unBanUser = async (ctx, chatID) => {
  const isUserban = await isUserBanned(chatID);
  if (isUserban) {
    const banRecord = await prisma.ban.findFirst({
      where: { chat_id: chatID },
    });

    await prisma.ban.delete({
      where: {
        id: banRecord.id,
      },
    });
    ctx.reply("کاربر با موفقیت رفع مسدود شد. ✔", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
    return;
  }

  return ctx.reply("🚫 کاربر مسدود نمیباشد 🚫");
};

const getAllBans = async () => {
  const bans = prisma.ban.findMany({
    select: {
      chat_id: true,
    },
  });
  return bans;
};

const findUserStacks = async (userID) => {
  const findUserStackIds = await prisma.userStack.findMany({
    where: {
      user_id: userID,
    },
    select: {
      stack_id: true,
    },
  });

  const stackIds = findUserStackIds.map((userStack) => userStack.stack_id);

  const stacks = await prisma.stack.findMany({
    where: {
      id: { in: stackIds },
    },
    select: {
      fields: true,
    },
  });

  return stacks;
};
const getAllStacks = async () => {
  const stacks = await prisma.stack.findMany({
    select: {
      fields: true,
      id: true,
    },
    orderBy: {
      created_at: "asc",
    },
  });
  return stacks;
};

const editGitHubLink = async (ctx, link) => {
  const chatID = Number(ctx.from.id);
  const user = await findByChatID(chatID);
  await prisma.user.update({
    where: {
      chat_id: user.chat_id,
    },
    data: {
      gitHub: link,
    },
  });
  ctx.sendChatAction("typing");
  return ctx.reply("لینک گیت هابت با موفقیت به پروفایلت اضافه شد. ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
};
const editLinkedin = async (ctx, link) => {
  const chatID = Number(ctx.from.id);
  const user = await findByChatID(chatID);
  await prisma.user.update({
    where: {
      chat_id: user.chat_id,
    },
    data: {
      linkedin: link,
    },
  });
  ctx.sendChatAction("typing");
  return ctx.reply("لینک لینکدینت با موفقیت به پروفایلت اضافه شد. ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
};
const editName = async (ctx, name) => {
  const chatID = Number(ctx.from.id);
  const user = await findByChatID(chatID);
  await prisma.user.update({
    where: {
      chat_id: user.chat_id,
    },
    data: {
      name,
    },
  });
  ctx.sendChatAction("typing");
  return ctx.reply("اسم پروفایلت با موفقیت ویرایش شد. ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
};
const editCity = async (ctx, city) => {
  const chatID = Number(ctx.from.id);
  const user = await findByChatID(chatID);
  await prisma.user.update({
    where: {
      chat_id: user.chat_id,
    },
    data: {
      address: city.trim(),
    },
  });
  ctx.sendChatAction("typing");
  return ctx.reply("منطقه سکونت با موفقیت ویرایش شد. ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
};

const editStacks = async (ctx, stacks) => {
  const chatID = Number(ctx.from.id);
  const user = await findByChatID(chatID);

  for (const stack of stacks) {
    const isExistStack = await prisma.stack.findMany({
      where: {
        fields: stack,
      },
    });

    if (isExistStack.length === 0) {
      await ctx.sendChatAction("typing");
      return ctx.reply("حوزه ارسالی در لیست حوزه ها وجود ندارد! 🚫", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "👥 | ارتباط مستقیم با برنامه نویس بات",
                url: "https://t.me/iDvMH",
              },
            ],

            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      });
    }

    await prisma.userStack.create({
      data: {
        stack_id: isExistStack[0].id,
        user_id: user.id,
      },
    });
  }
  await ctx.sendChatAction("typing");
  return ctx.reply("لیست حوزه فعالیت شما با موفقیت ویرایش شد. ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
};

const removeUserStacks = async (ctx, chatID) => {
  const user = await findByChatID(Number(chatID));

  const isUserHasStack = await prisma.userStack.findMany({
    where: {
      user_id: user.id,
    },
  });

  if (isUserHasStack.length === 0) {
    await ctx.sendChatAction("typing");
    return ctx.editMessageText("لیست حوزه شما خالی است! 🚫", {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    });
  }

  await prisma.userStack.deleteMany({
    where: {
      user_id: user.id,
    },
  });

  await ctx.sendChatAction("typing");
  return ctx.editMessageText("حوزه فعالیت شما با موفقیت حذف شد. ✔", {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
  });
};

const removeStackQuery = async (ctx) => {
  const stackID = ctx.text;

  const isExistStack = await prisma.stack.findFirst({
    where: {
      id: Number(stackID),
    },
  });

  if (!isExistStack) {
    await ctx.sendChatAction("typing");
    return ctx.reply("حوزه یافت نشد ! 🚫", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
  }

  await prisma.stack.delete({
    where: {
      id: isExistStack.id,
    },
  });

  await ctx.sendChatAction("typing");
  return ctx.reply("حوزه با موفقیت حذف شد. ✔", {
    reply_markup: {
      keyboard: [[{ text: "🔙 | بازگشت" }]],
      resize_keyboard: true,
      remove_keyboard: true,
    },
  });
};
const insertStack = async (ctx, titles) => {
  for (const title of titles) {
    const isExistStack = await prisma.stack.findMany({
      where: {
        fields: title.toLocaleLowerCase(),
      },
    });

    if (isExistStack.length === 0) {
      await prisma.stack.createMany({
        data: {
          fields: title.toLocaleLowerCase(),
        },
      });

      await ctx.sendChatAction("typing");
      return ctx.reply("حوزه با موفقیت اضافه شد. ✔", {
        reply_markup: {
          keyboard: [[{ text: "🔙 | بازگشت" }]],
          resize_keyboard: true,
          remove_keyboard: true,
        },
      });
    }
    await ctx.sendChatAction("typing");
    return ctx.reply("حوزه از قبل وجود دارد. ❌", {
      reply_markup: {
        keyboard: [[{ text: "🔙 | بازگشت" }]],
        resize_keyboard: true,
        remove_keyboard: true,
      },
    });
  }
};

module.exports = {
  insertUser,
  insertStack,
  removeUserStacks,
  getUserRole,
  removeStackQuery,
  editLinkedin,
  editName,
  editStacks,
  editCity,
  getAllChatID,
  editGitHubLink,
  findByChatID,
  findUserStacks,
  findAndRemove,
  findAndChangeRole,
  getAllAdmins,
  isUserBanned,
  banUser,
  getAllBans,
  getAllStacks,
  unBanUser,
};
