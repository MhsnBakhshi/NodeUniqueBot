const rqeuiredChannels = ["@NodeUnique"];
const moment = require("moment-timezone");
const { Markup } = require("telegraf");
const { findByChatID } = require("./qurey");
const { prisma } = require("../db");
const provinceList = [
  "تهران",
  "آذربایجان-شرقی",
  "آذربایجان-غربی",
  "البرز",
  "اردبیل",
  "اصفهان",
  "ایلام",
  "بوشهر",
  "چهارمحال-و-بختیاری",
  "خراسان-جنوبی",
  "خراسان-رضوی",
  "خراسان-شمالی",
  "خوزستان",
  "زنجان",
  "سمنان",
  "سیستان-و-بلوچستان",
  "فارس",
  "قزوین",
  "قم",
  "کردستان",
  "کرمان",
  "کرمانشاه",
  "کهگیلویه-و-بویراحمد",
  "گلستان",
  "گیلان",
  "لرستان",
  "مازندران",
  "مرکزی",
  "هرمزگان",
  "همدان",
  "یزد",
  "تبریز",
  "ارومیه",
  "کرج",
  "شهرکرد",
  "بیرجند",
  "مشهد",
  "بجنورد",
  "اهواز",
  "زاهدان",
  "شیراز",
  "سنندج",
  "یاسوج",
  "گرگان",
  "رشت",
  "خرم-آباد",
  "ساری",
  "اراک",
  "بندرعباس",
  "کیش",
];
const technologyList = [
  "C#",
  "PHP",
  "ASP.NET",
  "JavaScript",
  "Microsoft-SQL-Server",
  ".NET-Core",
  "React.js",
  "Python",
  "Laravel",
  "WordPress",
  "HTML",
  "C++",
  "CSS",
  "Next.js",
  "Angular",
  "Git",
  "MySQL",
  "SQL",
  "UI/UX",
  "Node.js",
  "Java",
  "TypeScript",
  "Django",
  "Figma",
  "Android",
  "Docker",
  "Linux",
  "PostgreSQL",
  "Vue.js",
  "Adobe-Photoshop",
  "Bootstrap",
  "WooCommerce",
  "jQuery",
  "Adobe-Illustrator",
  "Artificial-Intelligence",
  "Delphi",
  "Entity-Framework",
  "iOS",
  "Spring",
  "Tailwind",
  "ASP",
  "React-Native",
  "Adobe-XD",
  "Kubernetes",
  "Machine-Learning",
  "NestJS",
  "Oracle-SQL-Developer",
  "Project-Management",
  "Scrum",
  "SEO",
  "Assembly",
  "Flutter",
  "Objective-C",
  "PyTorch",
  "TensorFlow",
  "TSQL",
  "Unreal-Engine",
  "Visual-Basic",
  "Kotlin",
  "Swift",
  "Xamarin",
  "Nuxt.js",
  "CNC",
  "CodeIgniter",
  "Dart",
  "ElasticSearch",
  "Express.js",
  "Jenkins",
  "MongoDB",
  "NoSQL",
  "OpenEmbedded",
  "OpenNLP",
  "PL/SQL",
  "Power-BI",
  "Redis",
  "Socket.io",
  "Terraform",
  "VBA",
  "Yii",
  "Ruby",
  "Sketch",
  "ABAP",
  "Backbone.js",
  "Bash",
  "Big-Data",
  "Blockchain",
  "CakePHP",
  "Cassandra",
  "Couchbase",
  "Delphi.net",
  "Drupal",
  "DynamoDB",
  "Erlang",
  "Firebase",
  "GIS",
  "GraphQL",
  "Hadoop",
  "Haskell",
  "Hibernate",
  "HSQLDB",
  "Indesign",
  "Joomla",
  "Kendo-Ui",
  "Kepware",
  "Keras",
  "LINQ",
  "Magento",
  "MariaDB",
  "Matlab",
  "Moodle",
  "MQL",
  "MSQL",
  "OpenStack",
  "OWASP",
  "Perl",
  "PgSQL",
  "phpBB",
  "Powershell",
  "Ruby-on-Rails",
  "Rust",
  "SASS",
  "Scala",
  "Shell",
  "Shell-Scripting",
  "SQL-DB2",
  "SQLBase",
  "SQLite",
  "Svelte",
  "SvelteKit",
  "Symfony",
  "Unity",
  "VB.NET",
  "Visual-C#",
  "Visual-C++",
  "Xcode",
  "Zend-Framework",
];

const karboardWebsiteProvince = {
  تهران: "tehran",

  اصفهان: "isfahan",

  البرز: "alborz",

  خراسان_رضوی: "khorasan-razavi",

  فارس: "fars",

  قم: "qhom",

  قزوین: "qhazvin",

  مازندران: "mazandaran",

  کرمان: "kerman",

  آذربایجان_شرقی: "azarbayjan-sharghi",

  گیلان: "gilan",

  یزد: "yazd",

  خوزستان: "khoozestan",

  مرکزی: "markazi",

  آذربایجان_غربی: "azarbayjan-gharbi",

  اردبیل: "ardabil",

  زنجان: "zanjan",

  سمنان: "semnan",
  ایلام: "ilam",

  چهارمحال_و_بختیاری: "chaharmahal-&-bakhtiari",

  خراسان_شمالی: "khorasan-shomali",

  خراسان_جنوبی: "khorasan-jonoobi",

  سیستان_و_بلوچستان: "sistan-&-baluchestan",

  کردستان: "kordestan",

  کرمانشاه: "kermanshah",

  کهگیلویه_و_بویر_احمد: "kohgilooye-&-boyerahmad",

  گلستان: "golestan",

  لرستان: "lorestan",

  هرمزگان: "hormozgan",

  همدان: "hamedan",

  بوشهر: "booshehr",
};
const checkUserMembership = async function (ctx) {
  try {
    const userId = ctx.message?.chat?.id || ctx.callbackQuery?.from?.id;

    let isMember = true;

    for (const channel of rqeuiredChannels) {
      const member = await ctx.telegram.getChatMember(channel, userId);
      if (member.status == "left" || member.status == "kicked") {
        isMember = false;
        break;
      }
    }

    return isMember;
  } catch (error) {
    console.log(error);
  }
};

const sendAdminKeyBoard = (ctx) => {
  return ctx.reply("به پنل مدیریت خوش اومدی: \n یه گزینه انتخاب کن:", {
    reply_markup: {
      keyboard: [
        [{ text: "🔙 | بازگشت به منو" }],
        [{ text: "🔰 | بلاک و آنبلاک‌ کاربر | 🔰" }],
        [
          { text: "📬 | فوروارد همگانی" },
          { text: "✉ | پیام همگانی" },
          { text: "📩 | پیام به کاربر" },
        ],
        [
          { text: "👤 | لیست کاربران" },
          { text: "🆔 | آیدی یاب" },
          { text: "🚨 | حذف کاربر" },
        ],
        [{ text: "👤 | تنظیمات ادمین ها" }, { text: "💻 | تنظیمات حوزه ها" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
};
const sendMainKeyboard = (ctx, role, date, time) => {
  if (role === "ADMIN") {
    ctx.sendChatAction("typing");
    ctx.reply(
      `سلام ${ctx.chat.first_name} عزیز. \n به ربات نود یونیک خوش اومدی یکی از گزینه های زیر رو انتخاب کن:`,
      Markup.inlineKeyboard([
        [Markup.button.callback("ورود به پنل مدیریت | 🔐", "panel_admin")],
        [Markup.button.callback("ورود به پنل کاربری | 🔰", "panel_user")],
        [Markup.button.callback("➖➖➖➖➖➖➖➖➖➖", "none")],

        [
          Markup.button.callback(date, "none"),
          Markup.button.callback("📆 تاریخ", "none"),
        ],
        [
          Markup.button.callback(time, "none"),
          Markup.button.callback("⏰ زمان", "none"),
        ],
      ])
    );
  } else {
    ctx.sendChatAction("typing");
    ctx.reply(
      `سلام ${ctx.chat.first_name} عزیز. \n به ربات نود یونیک خوش اومدی یکی از گزینه های زیر رو انتخاب کن:`,
      Markup.inlineKeyboard([
        [Markup.button.callback("ورود به پنل کاربری | 🔰", "panel_user")],
        [Markup.button.callback("➖➖➖➖➖➖➖➖➖➖", "none")],
        [
          Markup.button.callback(date, "none"),
          Markup.button.callback("📆 تاریخ", "none"),
        ],
        [
          Markup.button.callback(time, "none"),
          Markup.button.callback("⏰ زمان", "none"),
        ],
      ])
    );
  }
};

const sendUserKeyboard = (ctx) => {
  ctx.editMessageText(
    `🌹 | به پنل کاربری خوش اومدی ${ctx.chat.first_name} عزیز.\nیکی از گزینه های زیر را انتخاب کن:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 | بازگشت به منو", callback_data: "backMainMenue" }],
          [
            {
              text: "🐈 | پروژه های Open Source گیتهاب",
              callback_data: "gitHubOpenSourceProjects",
            },
          ],
          [
            { text: "👤 | پروفایل", callback_data: "myProfile" },
            { text: "🫂 | هم تیمی یاب", callback_data: "team_mate" },
          ],

          [
            { text: "📑 | مقاله یاب", callback_data: "articleYab" },
            { text: "🗂 | سورس یاب", callback_data: "sourceYab" },
            { text: "📮| پکیج یاب", callback_data: "packageYab" },
          ],

          [{ text: "💰 | شغل یاب", callback_data: "jobYab" }],
          [
            {
              text: "👨‍💻 | ارتباط با برنامه نویس",
              callback_data: "contactToDev",
            },
          ],
        ],
      },
    }
  );
};

const sendStackKeyBoard = (ctx) => {
  return ctx.reply("👈🏻 | گزینه مورد نظر را انتخاب کنید", {
    reply_markup: {
      keyboard: [
        [{ text: "🖥 | لیست حوزها" }],
        [{ text: "➕ | افزودن حوزه" }, { text: "✏ | ویرایش حوزه" }],
        [{ text: "❌ | حذف حوزه" }],
        [{ text: "🔙 | بازگشت" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
};
const calculateTimestampToIranTime = (timestamp) => {
  const daysOfWeekInPersian = [
    "شنبه", // Sunday
    "یکشنبه", // Monday
    "دوشنبه", // Tuesday
    "سه‌شنبه", // Wednesday
    "چهارشنبه", // Thursday
    "پنج‌شنبه", // Friday
    "جمعه", // Saturday
  ];
  const iranTime = moment.utc(timestamp).tz("Asia/Tehran");

  let dayOfWeekIndex = iranTime.day();

  dayOfWeekIndex = (dayOfWeekIndex + 1) % 7;

  const dayOfWeek = daysOfWeekInPersian[dayOfWeekIndex];
  const formattedDate = iranTime.format("YYYY/MM/DD");
  const formattedTime = iranTime.format("HH:mm:ss");

  const date = `${dayOfWeek} ${formattedDate}`;
  const time = `ساعت ${formattedTime}`;

  return { date, time };
};

const findTeamMateFromUserProfileStack = async (ctx) => {
  const user = await findByChatID(Number(ctx.callbackQuery?.from?.id));

  const userStack = await prisma.userStack.findMany({
    where: { user_id: user.id },
  });

  if (userStack.length === 0) {
    await ctx.sendChatAction("typing");

    return ctx.editMessageText(
      "شما هنوز پروفایل خود را کامل نکردید! \n برای استفاده از این بخش باید پروفایل خود را کامل کنید",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⏮ | رفتن به پروفایل", callback_data: "myProfile" }],
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  let matchedUsers = new Set();

  for (const stack of userStack) {
    const teamMateStack = await prisma.userStack.findMany({
      where: {
        stack_id: stack.stack_id,
      },
      select: {
        user_id: true,
      },
    });

    teamMateStack.forEach((mate) => {
      if (mate.user_id !== user.id) {
        matchedUsers.add(mate.user_id);
      }
    });
  }

  if (matchedUsers.size === 0) {
    await ctx.sendChatAction("typing");

    return ctx.editMessageText(
      "متاسفانه کاربری با حوزه شما در ربات وجود ندارد :(",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }

  const matchedUserDetails = await prisma.user.findMany({
    where: {
      id: { in: Array.from(matchedUsers) },
    },
  });

  let response = "🔎کاربران هم‌حوزه شما:\n\n";

  matchedUserDetails.forEach((mateInfo) => {
    let linkedin = mateInfo.linkedin
      ? `\n🔹 لینکدین: ${mateInfo.linkedin}`
      : "";
    let github = mateInfo.gitHub ? `\n🔹 گیتهاب: ${mateInfo.gitHub}` : "";
    let city = mateInfo.address ? `\n📍 محل سکونت: ${mateInfo.address}` : "";

    response += `👤 اسم: ${mateInfo.name}
    🔗 <a href="tg://openmessage?user_id=${mateInfo.chat_id}">پیوی ${mateInfo.name}</a>${linkedin}${github}${city}\n\n`;
  });

  await ctx.sendChatAction("typing");
  ctx.editMessageText("⌛️ درحال جستجو ... ممکن است کمی زمان بر باشد ⏳");

  await ctx.sendChatAction("typing");
  ctx.deleteMessage();

  return ctx.reply(response, {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
    parse_mode: "HTML",
  });
};

const findTeamMateFromUserRequstStack = async (ctx, stack) => {
  const existStack = await prisma.stack.findFirst({
    where: { fields: stack },
    select: {
      id: true,
      users: true,
    },
  });

  if (!existStack) {
    await ctx.sendChatAction("typing");
    ctx.deleteMessage();
    return ctx.reply(
      "حوزه ارسالی معتبر نمیباشد! لطفا از لیست حوزهای ثبت شده ارسال نمایید! 🚫",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 | بازگشت", callback_data: "backMenu" }],
          ],
        },
      }
    );
  }
  if (existStack.users.length === 0) {
    await ctx.sendChatAction("typing");
    return ctx.reply("متاسفانه کاربری با حوزه ارسالی در ربات وجود ندارد :(", {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
      },
    });
  }

  let matchedUsers = new Set();
  existStack.users.forEach((mate) => {
    matchedUsers.add(mate.user_id);
  });

  const matchedUserDetails = await prisma.user.findMany({
    where: {
      id: { in: Array.from(matchedUsers) },
    },
    select: {
      linkedin: true,
      gitHub: true,
      address: true,
      chat_id: true,
      name: true,
    },
  });

  let response = "🔎کاربران حوزه درخواستی شما:\n\n";

  matchedUserDetails.forEach((mateInfo) => {
    let linkedin = mateInfo.linkedin
      ? `\n🔹 لینکدین: ${mateInfo.linkedin}`
      : "";
    let github = mateInfo.gitHub ? `\n🔹 گیتهاب: ${mateInfo.gitHub}` : "";
    let city = mateInfo.address ? `\n📍 محل سکونت: ${mateInfo.address}` : "";

    response += `👤 اسم: ${mateInfo.name}
    🔗 <a href="tg://openmessage?user_id=${mateInfo.chat_id}">پیوی ${mateInfo.name}</a>${linkedin}${github}${city}\n\n`;
  });

  await ctx.sendChatAction("typing");
  ctx.reply("⌛️ درحال جستجو ... ممکن است کمی زمان بر باشد ⏳");

  await ctx.sendChatAction("typing");
  ctx.deleteMessage(ctx.message.message_id + 1);

  return ctx.reply(response, {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 | بازگشت", callback_data: "backMenu" }]],
    },
    parse_mode: "HTML",
  });
};

const validateProvince = (province) => {
  const existProvince = provinceList.includes(province);

  if (!existProvince) {
    return false;
  }
  return true;
};
const validateTechnology = (technology) => {
  const existTechnology = technologyList.includes(technology);

  if (!existTechnology) {
    return false;
  }
  return true;
};
function convertPersianToEnglishNumbers(text) {
  const persianToEnglish = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
  };

  const pattern = /[۰-۹]/g;

  return text.replace(pattern, (match) => persianToEnglish[match]);
}
module.exports = {
  checkUserMembership,
  convertPersianToEnglishNumbers,
  validateProvince,
  provinceList,
  karboardWebsiteProvince,
  technologyList,
  validateTechnology,
  sendAdminKeyBoard,
  findTeamMateFromUserProfileStack,
  findTeamMateFromUserRequstStack,
  sendMainKeyboard,
  sendUserKeyboard,
  sendStackKeyBoard,
  calculateTimestampToIranTime,
};
