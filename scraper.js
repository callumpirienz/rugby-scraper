const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const PREMIERSHIP_URL = 'https://www.premiershiprugby.com/standings?competition=gallagher-premiership';
const SUPER_RUGBY_URL = 'https://www.skysports.com/rugbyunion/competitions/super-rugby/tables';
const UNITED_RUGBY_URL = 'https://www.unitedrugby.com/match-centre/table/2024-25';
const TOP_14_URL = 'https://www.skysports.com/rugbyunion/competitions/top-14/tables';
const MLR_URL = 'https://www.majorleague.rugby/standings/';

// Existing scrapers omitted for brevity, only adding the new ones

async function scrapeTop14(browser) {
  const page = await browser.newPage();
  await page.goto(TOP_14_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('table tbody tr');

  const standings = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    return Array.from(rows).map(row => {
      const cells = row.querySelectorAll('td');
      return {
        team: cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won: parseInt(cells[3]?.innerText.trim()) || 0,
        drawn: parseInt(cells[4]?.innerText.trim()) || 0,
        lost: parseInt(cells[5]?.innerText.trim()) || 0,
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'top-14'
      };
    });
  });

  await page.close();

  if (standings.length === 0) return console.log('❌ No Top 14 standings found.');

  await supabase.from('simple_standings').delete().eq('competition', 'top-14');
  const { error } = await supabase.from('simple_standings').insert(standings);
  if (error) return console.error('❌ Failed to insert Top 14 standings:', error.message);

  console.log('✅ Top 14 standings updated.');
}

async function scrapeMLR(browser) {
  const page = await browser.newPage();
  await page.goto(MLR_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('table tbody tr');

  const standings = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    return Array.from(rows).map(row => {
      const cells = row.querySelectorAll('td');
      return {
        team: cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won: parseInt(cells[3]?.innerText.trim()) || 0,
        drawn: parseInt(cells[4]?.innerText.trim()) || 0,
        lost: parseInt(cells[5]?.innerText.trim()) || 0,
        points: parseInt(cells[6]?.innerText.trim()) || 0,
        competition: 'mlr'
      };
    });
  });

  await page.close();

  if (standings.length === 0) return console.log('❌ No MLR standings found.');

  await supabase.from('simple_standings').delete().eq('competition', 'mlr');
  const { error } = await supabase.from('simple_standings').insert(standings);
  if (error) return console.error('❌ Failed to insert MLR standings:', error.message);

  console.log('✅ MLR standings updated.');
}

async function scrapeAll() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  await scrapeGallagherPremiership(browser);
  await scrapeSuperRugby(browser);
  await scrapeUnitedRugby(browser);
  await scrapeTop14(browser);
  await scrapeMLR(browser);

  await browser.close();
}

scrapeAll();
