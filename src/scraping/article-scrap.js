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

const scrapArticlesFromVirgoolWebsite = async (keywords, limit) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      defaultViewport: null,
    });

    const page = await browser.newPage();

    const url = `https://virgool.io/search/posts?q=${keywords}`;

    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector("div.app-layout-children article", {
      timeout: 20000,
    });

    for (let i = 0; i < limit; i++) {
      try {
        const loadMoreButton = await page.$(
          "div.app-layout-children button.css-adloc5"
        );
        if (!loadMoreButton) {
          throw new Error("Button not found");
        }

        await loadMoreButton.evaluate((btn) => btn.scrollIntoView());
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const prevArticleCount = await page.$$eval(
          "div.app-layout-children article",
          (articles) => articles.length
        );

        await loadMoreButton.click();

        await page.waitForFunction(
          (prevCount) => {
            return (
              document.querySelectorAll("div.app-layout-children article")
                .length > prevCount
            );
          },
          {},
          prevArticleCount
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        throw new Error(err.message);
      }
    }

    const content = await page.content();
    const $ = cheerio.load(content);
    const virgoolArticlesPath = `./src/scraping/${keywords}-VirgoolArticles.json`;

    const articles = [];
    await page.hover("div.app-layout-children button.direction-rtl");
    await page.click("div.app-layout-children button.direction-rtl");
    $("div.app-layout-children article").each((i, element) => {
      const articleItem = $(element);

      const authour = articleItem
        .find("span.vrgl-typography-ellipsis a")
        .text()
        .trim();
      const authourProfile = articleItem
        .find("span.vrgl-typography-ellipsis a")
        .attr("href")
        ?.trim();
      const title = articleItem
        .find("h3.vrgl-typography-ellipsis")
        .text()
        .trim();
      const shortDesc = articleItem
        .find("span.vrgl-typography-ellipsis-multiple-line")
        .text()
        .trim();
      const link = articleItem
        .find("h3.vrgl-typography-ellipsis")
        .parent("a")
        .attr("href")
        ?.trim();
      const topic = articleItem
        .find("span.tag_vrgl-tag__f6Xpt a")
        .text()
        .trim();

      const readTime = articleItem
        .find("footer span.color-gray-600")
        .text()
        .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
        .trim();
      const likeCount = articleItem
        .find("button[name='like']")
        .next("span")
        .text()
        .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
        .trim();

      const commentCount = articleItem
        .find("a[href$='#--responses'] span")
        .last()
        .text()
        .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
        .trim();

      const createdTime = articleItem
        .find("div.color-gray-700")
        .first()
        .text()
        .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
        .trim();

      if (title && link) {
        articles.push({
          authour,
          authourProfile,
          title,
          shortDesc,
          link,
          topic,
          readTime,
          likeCount,
          commentCount,
          createdTime,
        });
      }
    });

    fs.writeFileSync(
      virgoolArticlesPath,
      JSON.stringify(articles, null, 4),
      "utf-8"
    );

    await browser.close();
    return {
      virgoolArticlesPath,
      totalArticlesCount: articles.length,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  scrapArticlesFromDevToWebsite,
  scrapArticlesFromVirgoolWebsite,
};
