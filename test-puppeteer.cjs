const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('Browser launched. Opening page...');
  const page = await browser.newPage();
  
  // Set fake cookie to test if it affects anything
  await page.setCookie({
    name: 'reddit_session',
    value: 'test_fake_cookie_123',
    domain: '.reddit.com',
    path: '/'
  });

  console.log('Navigating to Reddit...');
  const response = await page.goto('https://www.reddit.com/explore/most_visited/', { waitUntil: 'networkidle2' });
  
  const title = await page.title();
  const html = await page.content();
  
  console.log("Status:", response.status());
  console.log("Title:", title);
  console.log("ReCAPTCHA?", html.includes('Prove your humanity'));
  
  const subCount = await page.$$eval('faceplate-number', els => els.length);
  console.log("Faceplate numbers found:", subCount);
  
  await browser.close();
})();
