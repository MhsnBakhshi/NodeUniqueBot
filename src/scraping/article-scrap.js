const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const fs = require("fs");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());
const scrapArticlesFromDevToWebsite = async (keywords, sortBy) => {
  const browser = await puppeteer.launch({
    headless: true
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
      defaultViewport: null,
    });

    const page = await browser.newPage();

    const url = `https://virgool.io/search/posts?q=${keywords}`;

    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector("div.app-layout-children article", {
      timeout: 20000,
    });

    for (let i = 0; i < limit; i++) {
      const loadMoreButton = await page.$(
        "div.app-layout-children button.css-adloc5"
      );
      if (!loadMoreButton) {
        break;
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
    console.error("Error in loading more articles:", error.message);
  }
};

const scrapSerachingArticleFromFreeCodeCamp = async (
  keywords,
  limit,
  articlePath
) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
    );

    const url = `https://www.freecodecamp.org/news/tag/${keywords}/`;

    await page.goto(url, { waitUntil: "networkidle2" });

    await page.waitForSelector("section.post-feed article.post-card", {
      timeout: 60000,
    });

    let lastHeight = await page.evaluate(() => document.body.scrollHeight);
    let clickCount = 0;

    while (clickCount < limit) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((resolve) => setTimeout(resolve, 2000));

      let newHeight = await page.evaluate(() => document.body.scrollHeight);

      if (newHeight === lastHeight) {
        break;
      }

      lastHeight = newHeight;

      const loadMoreExists = await page.$(
        "div.read-more-row button#readMoreBtn"
      );
      if (loadMoreExists) {
        await page.waitForSelector("div.read-more-row button#readMoreBtn", {
          visible: true,
          timeout: 10000,
        });
        await page.click("div.read-more-row button#readMoreBtn");
        clickCount++;
        break;
      }
    }

    const content = await page.content();
    const $ = cheerio.load(content);
    const articles = [];

    $("section.post-feed article.post-card").each((i, element) => {
      const articleItem = $(element);

      const title = articleItem.find("h2.post-card-title a").text().trim();
      const link = articleItem
        .find("h2.post-card-title a")
        .attr("href")
        ?.trim();
      const authour = articleItem.find("a.meta-item").text().trim();
      const authourProfile = articleItem
        .find("a.meta-item")
        .attr("href")
        ?.trim();
      const tagName = articleItem.find("span.post-card-tags a").text().trim();
      const tagLink = articleItem
        .find("span.post-card-tags a")
        .attr("href")
        ?.trim();
      const publishedAt = articleItem.find("time.meta-item").text().trim();

      if (link && title) {
        articles.push({
          title,
          link: `https://www.freecodecamp.org${link}`,
          tagName,
          tagLink: `https://www.freecodecamp.org${tagLink}`,
          authour: authour ?? null,
          authourProfile:
            `https://www.freecodecamp.org${authourProfile}` ?? null,
          publishedAt: publishedAt ?? null,
        });
      }
    });

    let existingArticles = [];
    if (fs.existsSync(articlePath)) {
      const fileContent = fs.readFileSync(articlePath, "utf-8");
      existingArticles = JSON.parse(fileContent);
    }

    existingArticles.push(...articles);

    fs.writeFileSync(
      articlePath,
      JSON.stringify(existingArticles, null, 4),
      "utf-8"
    );

    await browser.close();
    return {
      freecodecampArticlesLength: articles.length ?? 0,
    };
  } catch (error) {
    console.error("Error in loading more articles:", error.message);
    return {
      freecodecampArticlesLength: 0,
    };
  }
};
const scrapArticlesFromBacancyWebsite = async (keywords, articlePath) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
    );

    const url = `https://www.bacancytechnology.com/blog/?s=${keywords}`;

    await page.goto(url, { waitUntil: "networkidle2" });

    await page.waitForSelector("div.row.gy-4 div.col-lg-4.col-md-6", {
      timeout: 40000,
    });

    const content = await page.content();
    const $ = cheerio.load(content);

    const articles = [];

    $("div.row.gy-4 div.col-lg-4.col-md-6").each((i, element) => {
      const articleItem = $(element);

      const title = articleItem.find("div.blog-tital").text().trim();
      const link = articleItem.find("div.blog-box a").attr("href")?.trim();

      const publishedAt = articleItem
        .find("span.date.pr-2.text-primary")
        .text()
        .trim();

      if (link && title) {
        articles.push({
          title,
          link,
          publishedAt,
        });
      }
    });

    fs.writeFileSync(articlePath, JSON.stringify(articles, null, 4), "utf-8");

    await browser.close();
    return {
      bacancytechnologyArticlesLength: articles.length ?? 0,
    };
  } catch (error) {
    console.error("Error in loading more articles:", error.message);
    return {
      bacancytechnologyArticlesLength: 0,
    };
  }
};

module.exports = {
  scrapArticlesFromDevToWebsite,
  scrapArticlesFromVirgoolWebsite,
  scrapArticlesFromBacancyWebsite,
  scrapSerachingArticleFromFreeCodeCamp,
};
