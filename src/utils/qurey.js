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
const findAndChangeRole = async (chatID, ctx) => {
  const user = await findByChatID(chatID);

  if (user) {
    await prisma.user.update({
      where: {
        chat_id: chatID,
      },
      data: {
        role: "ADMIN",
      },
    });
    ctx.reply("کاربر با موفقیت ادمین شد ✔", {
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

module.exports = {
  insertUser,
  getUserRole,
  getAllChatID,
  findByChatID,
  findAndRemove,
  findAndChangeRole,
};
