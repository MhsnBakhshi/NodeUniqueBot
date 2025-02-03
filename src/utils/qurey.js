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
module.exports = {
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
};
