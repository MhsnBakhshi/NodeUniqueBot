const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const fs = require("fs");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const scrapJobFrom_E_Estekhdam = async (technology, province, sortBy) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });

  const page = await browser.newPage();

  let jobs = [];

  const jobsPath = `./src/scraping/${technology}-${province}-jobs.json`;

  let url = `https://www.e-estekhdam.com/search/استخدام-برنامه-نویس-در-${province}-مسلط-به-${technology}`;
  switch (sortBy) {
    case "new_job":
      url = url.concat("?sort=جدیدترین");
      break;
    case "highest_money":
      url = url.concat("?sort=بالاترین-حقوق");
      break;
  }

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  let scrollAttempts = 0;
  const maxScrolls = 5;

  while (scrollAttempts < maxScrolls) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const filterExpiredJobs = await page.$$("div.search-list div.expired");

    if (filterExpiredJobs.length > 0) {
      break;
    }

    scrollAttempts++;
  }

  const content = await page.content();
  const $ = cheerio.load(content);

  $("div.search-list div.job-list-item").each((index, element) => {
    const jobItem = $(element);

    const title = jobItem.find("div.title span").text().trim();
    const link = jobItem.find("a[target='_blank']").attr("href")?.trim();
    const compamyName = jobItem.find("div.company div").text().trim();

    const locationElements = jobItem.find("div.provinces span").toArray();
    const locationParts = locationElements
      .map((elem) => $(elem).text().trim())
      .filter((item) => item.length > 0);
    const location = locationParts.join(", ");

    const typeOfCooperationElement = jobItem
      .find("div.contract span")
      .toArray();
    const typeOfCooperationParts = typeOfCooperationElement
      .map((elem) => $(elem).text().trim())
      .filter((item) => item.length > 0);
    const typeOfCooperation = typeOfCooperationParts.join(", ");

    const level = jobItem.find("div.position-level span").text().trim();
    const salary = jobItem.find("div.salary span").text().trim();

    if (title && link) {
      jobs.push({
        title,
        link: `https://www.e-estekhdam.com${link}`,
        compamyName,
        location: location || "قرار داده نشده",
        typeOfCooperation: typeOfCooperation || "قرار داده نشده",
        level: level || "قرار داده نشده",
        salary: salary || "قرار داده نشده",
      });
    }
  });

  fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 4), "utf-8");
  await browser.close();
  return { count: jobs.length, path: jobsPath };
};

module.exports = {
  scrapJobFrom_E_Estekhdam,
};
