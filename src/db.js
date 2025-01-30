const { PrismaClient } = require( "@prisma/client");
const { Redis } = require( "ioredis");

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URI);

async function connectToDB() {
  try {
    await redis.ping(() =>
      console.log("Connected To Redis Database Successfully")
    );
    await prisma.$connect();
    console.log("Connected To MySQL Database Successfully");
  } catch (error) {
    console.log("Error on connecting detabase ->", error);
    redis.disconnect();
    await prisma.$discount();
    process.exit(1);
  }
}

module.exports = {
  connectToDB,
  redis,
  prisma,
};
