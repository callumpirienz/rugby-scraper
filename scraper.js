updated_scraper_code = """
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Setup Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Config URLs
const PREMIERSHIP_URL = 'https://www.premiershiprugby.com/standings?competition=gallagher-premiership';
const SUPER_RUGBY_URL = 'https://www.skysports.com/rugbyunion/competitions/super-rugby/tables';
const UNITED_RUGBY_URL = 'https://www.unitedrugby.com/match-centre/table/2024-25';
const TOP14_URL = 'https://www.skysports.com/rugbyunion/competitions/top-14/tables';
const NRL_URL = 'https://www.skysports.com/rugbyleague/competitions/telstra-premiership/tables';
const SUPER_LEAGUE_URL = 'https://www.skysports.com/rugbyleague/competitions/super-league/tables';

async function scrapeNRL(browser) {
  const page = await browser.newPage();
  await page.goto(NRL_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('table.standing-table__table tbody tr', { timeout: 15000 });

  const standings = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table.standing-table__table tbody tr'));
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return {
        team: cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won: parseInt(cells[3]?.innerText.trim()) || 0,
        drawn: parseInt(cells[4]?.innerText.trim()) || 0,
        lost: parseInt(cells[5]?.innerText.trim()) || 0,
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'nrl'
      };
    });
  });

  await page.close();

  if (standings.length === 0) {
    console.log('❌ No NRL standings found.');
    return;
  }

  console.log(`✅ Scraped ${standings.length} teams for NRL.`);

  await supabase.from('simple_standings').delete().eq('competition', 'nrl');
  const { error } = await supabase.from('simple_standings').insert(standings);
  if (error) console.error('❌ Insert error:', error.message);
  else console.log('✅ NRL standings updated successfully!');
}

async function scrapeSuperLeague(browser) {
  const page = await browser.newPage();
  await page.goto(SUPER_LEAGUE_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('table.standing-table__table tbody tr', { timeout: 15000 });

  const standings = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table.standing-table__table tbody tr'));
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return {
        team: cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won: parseInt(cells[3]?.innerText.trim()) || 0,
        drawn: parseInt(cells[4]?.innerText.trim()) || 0,
        lost: parseInt(cells[5]?.innerText.trim()) || 0,
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'super-league'
      };
    });
  });

  await page.close();

  if (standings.length === 0) {
    console.log('❌ No Super League standings found.');
    return;
  }

  console.log(`✅ Scraped ${standings.length} teams for Super League.`);

  await supabase.from('simple_standings').delete().eq('competition', 'super-league');
  const { error } = await supabase.from('simple_standings').insert(standings);
  if (error) console.error('❌ Insert error:', error.message);
  else console.log('✅ Super League standings updated successfully!');
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
  await scrapeNRL(browser);
  await scrapeSuperLeague(browser);

  await browser.close();
}

scrapeAll();
"""

updated_scraper_code[:1500]  # Preview only first part of the updated code
