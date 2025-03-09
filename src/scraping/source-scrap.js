const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const fs = require("fs");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const scrapSourceCodeFromGitHub = async (kewords, perPage = 1, sortBy) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });

  const page = await browser.newPage();

  let sources = [];

  const sourcePath = `./src/scraping/${kewords}-source.json`;

    let url = `https://github.com/search?q=${kewords}&type=repositories&p=${perPage}`;
    switch (sortBy) {
      case "BestMatch":
        url = url.concat("&s=&o=desc");
        break;
      case "FewestStars":
        url = url.concat("&s=stars&o=asc");
        break;
      case "MostStars":
        url = url.concat("&s=stars&o=desc");
        break;
      case "MostForks":
        url = url.concat("&s=forks&o=desc");
        break;
      case "FewestForks":
        url = url.concat("&s=forks&o=asc");
        break;
      case "recentlyUpdated":
        url = url.concat("&s=updated&o=desc");
        break;
      case "lastRecentlyUpdated":
        url = url.concat("&s=updated&o=asc");
        break;
    }
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000  });

    const content = await page.content();
    const $ = cheerio.load(content);
    $("div[data-testid='results-list'] > div").each((_, element) => {
      const sourceItem = $(element);

      const title = sourceItem.find("div.dcdlju span").text().trim();
      const repositoryName = sourceItem
        .find("a.prc-Link-Link-85e08 span")
        .text()
        .trim();
      const repositoryLink = sourceItem
        .find("a.prc-Link-Link-85e08")
        .attr("href")
        ?.trim();
      const stars = sourceItem
        .find("ul li a[aria-label]")
        .attr("aria-label")
        ?.trim();
      const lang = sourceItem
        .find("ul li span[aria-label]")
        .attr("aria-label")
        ?.trim();
      const updated = sourceItem.find("ul li div[title]").attr("title")?.trim();
      const topics = sourceItem
        .find("div.jgRnBg a")
        .toArray()
        .map((topic) => $(topic).text());

      if (title && repositoryLink) {
        sources.push({
          title,
          repositoryName,
          repositoryLink: `https://github.com${repositoryLink}`,
          stars,
          lang,
          updated,
          topics,
        });
      }
    });
  

  fs.writeFileSync(sourcePath, JSON.stringify(sources, null, 4), "utf-8");
  await browser.close();
  return { count: sources.length, path: sourcePath };
};

module.exports = {
  scrapSourceCodeFromGitHub,
};
