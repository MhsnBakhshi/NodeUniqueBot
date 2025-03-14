const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const fs = require("fs");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { convertPersianToEnglishNumbers } = require("../utils/actions");

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

const scrapJobsFrom_Karboard = async (
  technology,
  province,
  sortBy,
  offset = 1
) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });

  const page = await browser.newPage();

  let jobs = [];

  const jobPath = `./src/scraping/${technology}-${province}-karboardJobs.json`;

  let url = `https://karbord.io/jobs/in-${province}-cities?keyword=${technology}&page=${offset}&pagesize=30`;
  switch (sortBy) {
    case "new_job":
      url = url.concat("&sort=0");
      break;

    case "match_job":
      url = url.concat("&sort=1");
      break;

    case "highest_money":
      url = url.concat("&sort=2");
      break;
  }

  await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });

  const content = await page.content();
  const $ = cheerio.load(content);

  await page.waitForSelector(
    "app-jobs-job-card-list div.jobs__job-card-container",
    { timeout: 20000 }
  );
  await page.waitForSelector("div.body-short-01 span.inline-block", {
    timeout: 20000,
  });
  const totalJobs = $("div.body-short-01 span.inline-block").text().trim() || 0;
  $("app-jobs-job-card-list div.jobs__job-card-container").each(
    (index, element) => {
      const jobItem = $(element);

      const title = jobItem.find("h4.!text-neutral-700").text().trim();
      const link = jobItem
        .find("a.job-card__recommendation")
        .attr("href")
        ?.trim();
      const compamyName = jobItem.find("span.mb-4").text().trim();
      const publishedDate =
        jobItem.find(".label-01").text().trim().replace(/\s+/g, " ") +
        " " +
        jobItem.find(".label-02").text().trim().replace(/\s+/g, " ");
      const location = jobItem
        .find("li.job-card__location__item")
        .toArray()
        .map((elem) => $(elem).text().trim())
        .join(", ");

      const salary = jobItem.find("span.mr-2").text().trim();

      if (title && link) {
        jobs.push({
          title,
          link: `https://karbord.io${link}`,
          compamyName,
          location,
          publishedDate: publishedDate || "قرار داده نشده",
          salary: salary || "قرار داده نشده",
        });
      }
    }
  );
  fs.writeFileSync(jobPath, JSON.stringify(jobs, null, 4), "utf-8");

  await browser.close();
  return {
    totalJobs: convertPersianToEnglishNumbers(totalJobs),
    jobPath,
  };
};

const scrapJobsFrom_JobVision = async (
  technology,
  province,
  sortBy,
  offset = 1
) => {
  let jobs = [];
  const jobPath = `./src/scraping/${technology}-${province}-JobVisionJobs.json`;
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    });

    const page = await browser.newPage();

    let url = `https://jobvision.ir/jobs/keyword/${technology}/category/developer-in-all-cities-of-${province}?page=${offset}`;
    switch (sortBy) {
      case "new_job":
        url = url.concat("&sort=0");
        break;

      case "match_job":
        url = url.concat("&sort=1");
        break;

      case "highest_money":
        url = url.concat("&sort=2");
        break;
    }

    await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });

    const content = await page.content();
    const $ = cheerio.load(content);
    

    const totalJobs = $("h1.seo-title b").text().trim();

    $("job-card-list job-card").each((index, element) => {
      const jobItem = $(element);

      const title = jobItem.find("div.job-card-title").text().trim();
      const link = jobItem.find("a.desktop-job-card").attr("href")?.trim();
      const compamyName = jobItem
        .find("a.text-black.line-height-24.pointer-events-none")
        .text()
        .trim();
      const publishedDate = jobItem
        .find("span.d-flex.align-items-center")
        .text()
        .trim();
      const location = jobItem
        .find("span.text-secondary.pointer-events-none.ng-star-inserted")
        .text()
        .trim();

      const salary = jobItem.find("span.font-size-12px").text().trim();

      if (title && link) {
        jobs.push({
          title,
          link: `https://jobvision.ir${link}`,
          compamyName,
          location,
          publishedDate: publishedDate || "قرار داده نشده",
          salary: salary || "قرار داده نشده",
        });
      }
    });
    fs.writeFileSync(jobPath, JSON.stringify(jobs, null, 4), "utf-8");

    await browser.close();
    return {
      totalJobs: convertPersianToEnglishNumbers(totalJobs) || 0,
      jobsAdded: jobs.length,
      jobPath,
    };
  } catch (error) {
    console.log(error);
    fs.writeFileSync(jobPath, JSON.stringify(jobs, null, 4), "utf-8");
    return {
      totalJobs: 0,
      jobsAdded: jobs.length,
      jobPath,
    };
  }
};

const scrapJobsFrom_JobInja = async () => {}

module.exports = {
  scrapJobFrom_E_Estekhdam,
  scrapJobsFrom_Karboard,
  scrapJobsFrom_JobVision,
};
