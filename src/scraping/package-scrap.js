const cheerio = require("cheerio");
const fs = require("fs");
const puppeteer = require("puppeteer-core");

scraperNPMPackages = async (packageName, pageSize, perPage) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });

  const page = await browser.newPage();

  const url = `https://www.npmjs.com/search?q=${packageName}&page=${pageSize}&perPage=${perPage}`;
  await page.goto(url, { waitUntil: "networkidle2" });

  const content = await page.content();
  const $ = cheerio.load(content);

  let packages = [];

  const totalPackagesFound = $("h2._0007f802")
    .text()
    .trim()
    .split(" ")
    .reverse()
    .pop();

  const filePath = "./src/scraping/package-scrap.json";

  $("section.ef4d7c63").each((index, element) => {
    if (index >= perPage) return false;

    const packageItem = $(element);

    const name = packageItem.find("a[href^='/package/'] h3").text().trim();
    const link = packageItem.find("a[href^='/package/']").attr("href")?.trim();
    const desc = packageItem.find("p._8fbbd57d").text().trim();
    const totalDownloads = packageItem
      .find("svg.octicon-download")
      .parent()
      .text()
      .trim();
    const versionInfo = packageItem.find("._66c2abad").text().trim();
    const versionParts = versionInfo.split("•").map((item) => item.trim());

    const version = versionParts[1] ?? null;
    const lastPublish = versionParts[2] ?? null;
    const license = versionParts[4] ?? null;

    let tags = [];

    packageItem.find("ul.cf33f2b9 li").each((_, ele) => {
      const tagName = $(ele).find("a").text().trim();
      const tagLink = $(ele).find("a").attr("href")?.trim();
      tags.push({ name: tagName, link: `https://www.npmjs.com${tagLink}` });
    });

    if (name && link) {
      packages.push({
        name,
        link: `https://www.npmjs.com${link}`,
        desc,
        totalDownloads,
        version,
        lastPublish,
        license,
        tags,
      });
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(packages, null, 4), "utf-8");

  await browser.close();
  return { totalPackagesFound, filePath};
};

module.exports = {
  scraperNPMPackages,
};
