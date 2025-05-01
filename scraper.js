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

  await supabase.from('simple_standings').delete().eq('competition', 'gallagher-premiership');
  const { error } = await supabase.from('simple_standings').insert(standings);
  if (error) console.error('❌ Insert error:', error.message);
  else console.log('✅ Gallagher Premiership standings updated successfully!');
}

async function scrapeSuperRugby(browser) {
  const page = await browser.newPage();
  await page.goto(SUPER_RUGBY_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('table tbody tr', { timeout: 15000 });

  const standings = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return {
        team: cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won: parseInt(cells[3]?.innerText.trim()) || 0,
        drawn: parseInt(cells[4]?.innerText.trim()) || 0, // fixed
        lost: parseInt(cells[5]?.innerText.trim()) || 0,  // fixed
        points: parseInt(cells[10]?.innerText.trim()) || 0,
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

  await supabase.from('simple_standings').delete().eq('competition', 'super-rugby');
  const { error } = await supabase.from('simple_standings').insert(standings);
  if (error) console.error('❌ Insert error:', error.message);
  else console.log('✅ Super Rugby standings updated successfully!');
}

async function scrapeUnitedRugby(browser) {
  const page = await browser.newPage();
  await page.goto(UNITED_RUGBY_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('table tbody tr', { timeout: 15000 });

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

  await supabase.from('simple_standings').delete().eq('competition', 'united-rugby-championship');
  const { error } = await supabase.from('simple_standings').insert(standings);
  if (error) console.error('❌ Insert error:', error.message);
  else console.log('✅ United Rugby standings updated successfully!');
}

async function scrapeTop14(browser) {
  const page = await browser.newPage();
  await page.goto(TOP14_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('table tbody tr', { timeout: 15000 });

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
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'top-14'
      };
    });
  });

  await page.close();

  if (standings.length === 0) {
    console.log('❌ No Top 14 standings found.');
    return;
  }

  console.log(`✅ Scraped ${standings.length} teams for Top 14.`);

  await supabase.from('simple_standings').delete().eq('competition', 'top-14');
  const { error } = await supabase.from('simple_standings').insert(standings);
  if (error) console.error('❌ Insert error:', error.message);
  else console.log('✅ Top 14 standings updated successfully!');
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

  await browser.close();
}

scrapeAll();
