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
module.exports = {
  insertUser,
  getUserRole,
  getAllChatID,
};
