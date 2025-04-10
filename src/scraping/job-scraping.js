const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const fs = require("fs");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { convertPersianToEnglishNumbers } = require("../utils/actions");

puppeteer.use(StealthPlugin());

const scrapJobFrom_E_Estekhdam = async (technology, province, sortBy) => {
  const browser = await puppeteer.launch({
    headless: true,
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

const scrapJobsFrom_JobInja = async (technology, province, sortBy) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
    );

    let offset = 1;

    let baseUrl = `https://jobinja.ir/jobs?&filters%5Bjob_categories%5D%5B0%5D=&filters%5Bkeywords%5D%5B0%5D=${technology}&filters%5Blocations%5D%5B0%5D=${province}&preferred_before=1742026128`;
    switch (sortBy) {
      case "new_job":
        baseUrl = baseUrl.concat("&sort_by=published_at_desc");
        break;

      case "match_job":
        baseUrl = baseUrl.concat("&sort_by=relevance_desc");
        break;

      case "highest_money":
        baseUrl = baseUrl.concat("&sort_by=salary_from_desc");
        break;
    }

    await page.goto(`${baseUrl}&page=${offset}`, {
      waitUntil: "networkidle2",
      timeout: 200000,
    });

    const content = await page.content();
    const $ = cheerio.load(content);
    const jobs = [];
    const jobPath = `./src/scraping/${technology}-${province}-JobinjaJobs.json`;

    const totalJobsFoundPart = $(
      "h3.c-jobSearchState__numberOfResults span.c-jobSearchState__numberOfResultsEcho"
    )
      .text()
      .trim()
      .split(" ");
    const totalJobsFound = convertPersianToEnglishNumbers(
      totalJobsFoundPart[0]
    );

    while (jobs.length < totalJobsFound) {
      await page.goto(`${baseUrl}&page=${offset}`, {
        waitUntil: "networkidle2",
        timeout: 90000,
      });
      const pageContent = await page.content();
      const $$ = cheerio.load(pageContent);

      $$("ul.c-jobListView__list li").each((index, element) => {
        const jobCard = $$(element);

        let details = [];

        jobCard
          .find("ul.o-listView__itemComplementInfo li.c-jobListView__metaItem")
          .each((index, ele) => {
            details.push(
              $$(ele)
                .find("li span")
                ?.text()
                ?.trim()
                ?.replace(/[\n]*/gm, "")
                .replace(/\s{2,}/gm, "")
            );
          });

        let title = jobCard.find("a.c-jobListView__titleLink").text().trim();
        let link = jobCard
          .find("a.c-jobListView__titleLink")
          .attr("href")
          ?.trim();

        if (title && link) {
          jobs.push({
            title,
            link,
            details,
          });
        }
      });

      offset++;
      if (jobs.length >= totalJobsFound) break;
    }

    fs.writeFileSync(jobPath, JSON.stringify(jobs, null, 4), "utf-8");
    await browser.close();
    return {
      totalJobs: totalJobsFound,
      jobsAdded: jobs.length,
      jobPath,
    };
  } catch (error) {
    console.log("Error on scraping jobinja data");
    console.log(error);
    return {
      totalJobs: 0,
      jobsAdded: jobs.length,
      jobPath,
    };
  }
};

module.exports = {
  scrapJobFrom_E_Estekhdam,
  scrapJobsFrom_Karboard,
  scrapJobsFrom_JobVision,
  scrapJobsFrom_JobInja,
};
