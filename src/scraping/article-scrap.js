const puppeteer = require("puppeteer-core");
const cheerio = require("cheerio");
const fs = require("fs");

const scrapArticlesFromDevToWebsite = async (keywords, sortBy) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });

  const page = await browser.newPage();

  const baseURL = "https://dev.to";

  let url = null;

  if (sortBy === "MostRelevant") {
    url = `${baseURL}/search?q=${keywords}`;
  }
  if (sortBy === "Newest") {
    url = `${baseURL}/search?q=${keywords}&sort_by=published_at&sort_direction=desc`;
  }
  if (sortBy === "Oldest") {
    url = `${baseURL}/search?q=${keywords}&sort_by=published_at&sort_direction=asc`;
  }

  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForSelector("div#substories article", { timeout: 20000 });

  const content = await page.content();
  const $ = cheerio.load(content);
  const articlePath = "./src/scraping/DevToArticles.json";

  const articles = [];

  $("div#substories article").each((index, element) => {
    const articleItem = $(element);

    const title = articleItem
      .find("a.crayons-story__hidden-navigation-link")
      .text()
      .trim();
    const link = articleItem
      .find("a.crayons-story__hidden-navigation-link")
      .attr("href")
      ?.trim();

    const authour = articleItem
      .find("a.crayons-story__secondary")
      .text()
      .trim();
    const authourProfile = articleItem
      .find("a.crayons-story__secondary")
      .attr("href")
      ?.trim();

    const readTime = articleItem
      .find("small.crayons-story__tertiary")
      .text()
      .trim();
    const reactionCont = articleItem
      .find("span.hidden")
      .text()
      .trim()
      .slice(0, 1);
    const createdTime = articleItem.find("time").text().trim();

    const tags = [];

    articleItem
      .find("div.crayons-story__tags a.crayons-tag--monochrome")
      .each((i, tag) => {
        const tagElement = $(tag);
        const tagTitle = tagElement.text().trim();
        const tagLink = `${baseURL}${tagElement.attr("href")?.trim()}`;

        tags.push({ title: tagTitle, link: tagLink });
      });

    if (title && link) {
      articles.push({
        title,
        link: `${baseURL}${link}`,
        readTime,
        authour,
        authourProfile: `${baseURL}${authourProfile}`,
        reactionCont,
        createdTime,
        tags,
      });
    }
  });

  fs.writeFileSync(articlePath, JSON.stringify(articles, null, 4), "utf-8");
  await browser.close();
  return { articlePath, articlesTotalCount: articles.length };
};

module.exports = {
  scrapArticlesFromDevToWebsite,
};
