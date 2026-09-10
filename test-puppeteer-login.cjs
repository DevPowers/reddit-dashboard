const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const response = await page.goto('https://www.reddit.com/login/', { waitUntil: 'networkidle2' });
  const html = await page.content();
  console.log("Status:", response.status());
  console.log("Title:", await page.title());
  console.log("Blocked:", html.includes('whoa there, pardner'));
  await browser.close();
})();
