const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Setup Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Config URLs
const PREMIERSHIP_URL = 'https://www.premiershiprugby.com/standings?competition=gallagher-premiership';
const SUPER_RUGBY_URL = 'https://super.rugby/superrugby/competition-stats/';
const UNITED_RUGBY_URL = 'https://www.unitedrugby.com/match-centre/table/2024-25';

async function scrapeGallagherPremiership(browser) {
  const page = await browser.newPage();
  await page.goto(PREMIERSHIP_URL, { waitUntil: 'networkidle0' });

  const standings = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return {
        team: cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won: parseInt(cells[3]?.innerText.trim()) || 0,
        drawn: parseInt(cells[4]?.innerText.trim()) || 0,
        lost: parseInt(cells[5]?.innerText.trim()) || 0,
        points: parseInt(cells[6]?.innerText.trim()) || 0,
        competition: 'gallagher-premiership'
      };
    });
  });

  await page.close();

  if (standings.length === 0) {
    console.log('❌ No Gallagher Premiership standings found.');
    return;
  }

  console.log(`✅ Scraped ${standings.length} teams for Gallagher Premiership.`);

  const { error: deleteError } = await supabase
    .from('simple_standings')
    .delete()
    .eq('competition', 'gallagher-premiership');

  if (deleteError) {
    console.error('❌ Failed to delete old Gallagher Premiership records:', deleteError.message);
    return;
  }

  const { error: insertError } = await supabase
    .from('simple_standings')
    .insert(standings);

  if (insertError) {
    console.error('❌ Failed to insert Gallagher Premiership standings:', insertError.message);
    return;
  }

  console.log('✅ Gallagher Premiership standings updated successfully!');
}

async function scrapeSuperRugby(browser) {
  const page = await browser.newPage();
  await page.goto(SUPER_RUGBY_URL, { waitUntil: 'networkidle0' });

  await page.waitForSelector('table tbody tr', { timeout: 15000 });

  const standings = await page.evaluate(() => {
    const table = document.querySelector('table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return {
        team: cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won: parseInt(cells[3]?.innerText.trim()) || 0,
        drawn: parseInt(cells[4]?.innerText.trim()) || 0,
        lost: parseInt(cells[5]?.innerText.trim()) || 0,
        points: parseInt(cells[12]?.innerText.trim()) || 0,
        competition: 'super-rugby'
      };
    });
  });

  await page.close();

  if (standings.length === 0) {
    console.log('❌ No Super Rugby standings found.');
    return;
  }

  console.log(`✅ Scraped ${standings.length} teams for Super Rugby.`);

  const { error: deleteError } = await supabase
    .from('simple_standings')
    .delete()
    .eq('competition', 'super-rugby');

  if (deleteError) {
    console.error('❌ Failed to delete old Super Rugby records:', deleteError.message);
    return;
  }

  const { error: insertError } = await supabase
    .from('simple_standings')
    .insert(standings);

  if (insertError) {
    console.error('❌ Failed to insert Super Rugby standings:', insertError.message);
    return;
  }

  console.log('✅ Super Rugby standings updated successfully!');
}

async function scrapeUnitedRugby(browser) {
  const page = await browser.newPage();
  await page.goto(UNITED_RUGBY_URL, { waitUntil: 'networkidle0' });

  await page.waitForSelector('table tbody tr', { timeout: 15000 });

  const standings = await page.evaluate(() => {
    const table = document.querySelector('table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return {
        team: cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won: parseInt(cells[3]?.innerText.trim()) || 0,
        drawn: parseInt(cells[4]?.innerText.trim()) || 0,
        lost: parseInt(cells[5]?.innerText.trim()) || 0,
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'united-rugby-championship'
      };
    });
  });

  await page.close();

  if (standings.length === 0) {
    console.log('❌ No United Rugby standings found.');
    return;
  }

  console.log(`✅ Scraped ${standings.length} teams for United Rugby.`);

  const { error: deleteError } = await supabase
    .from('simple_standings')
    .delete()
    .eq('competition', 'united-rugby-championship');

  if (deleteError) {
    console.error('❌ Failed to delete old United Rugby records:', deleteError.message);
    return;
  }

  const { error: insertError } = await supabase
    .from('simple_standings')
    .insert(standings);

  if (insertError) {
    console.error('❌ Failed to insert United Rugby standings:', insertError.message);
    return;
  }

  console.log('✅ United Rugby standings updated successfully!');
}

async function scrapeAll() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  await scrapeGallagherPremiership(browser);
  await scrapeSuperRugby(browser);
  await scrapeUnitedRugby(browser);

  await browser.close();
}

scrapeAll();
