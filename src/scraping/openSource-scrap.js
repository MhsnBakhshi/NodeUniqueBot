const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const fs = require("fs");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const scrapOpenSourceFromGitHub = async (lang) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });

  const page = await browser.newPage();

  let sources = [];

  const sourcePath = `./src/scraping/${lang}-OpenSource.json`;

  let url = `https://goodfirstissue.dev/language/${lang.toLowerCase()}`;

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  const content = await page.content();
  const $ = cheerio.load(content);
  $("div.p-4.w-full > div").each((_, element) => {
    const sourceItem = $(element);

    const title = sourceItem
      .find("a[rel='noopener noreferrer']")
      .attr("title")
      ?.trim();
    const link = sourceItem
      .find("a[rel='noopener noreferrer']")
      .attr("href")
      ?.trim();

      const starsText = sourceItem.find("div:contains('stars:')").text()?.trim();
      const starsMatch = starsText.match(/stars:\s*([\d\.KM]+)/i);
      const stars = starsMatch ? starsMatch[1] : null;
      
      const lastActivityText = sourceItem.find("div:contains('last activity:')").text()?.trim();
      const lastActivityMatch = lastActivityText.match(/last activity:\s*([\w\s\d]+?)(?=\blang:|\bstars:|$)/i);
      const lastActivity = lastActivityMatch ? lastActivityMatch[1].trim() : null;
      
      

    if (title && link) {
      sources.push({
        title,
        link,
        stars,
        lastActivity,
      });
    }
  });

  fs.writeFileSync(sourcePath, JSON.stringify(sources, null, 4), "utf-8");
  await browser.close();
  return { count: sources.length, path: sourcePath };
};

module.exports = {
  scrapOpenSourceFromGitHub,
};
