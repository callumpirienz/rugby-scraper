const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Setup Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// URLs
const PREMIERSHIP_URL = 'https://www.skysports.com/rugbyunion/competitions/gallagher-premiership/tables';
const SUPER_RUGBY_URL = 'https://www.skysports.com/rugbyunion/competitions/super-rugby/tables';
const UNITED_RUGBY_URL = 'https://www.skysports.com/rugbyunion/competitions/united-rugby-championship/tables';
const TOP14_URL = 'https://www.skysports.com/rugbyunion/competitions/top-14/tables';
const NRL_URL = 'https://www.skysports.com/rugbyleague/competitions/telstra-premiership/tables';
const SUPER_LEAGUE_URL = 'https://www.skysports.com/rugbyleague/competitions/super-league/tables';

// Generic scraper for league tables from Sky Sports Rugby League
async function scrapeGenericSkyLeague(url, competition) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000);
    await page.waitForSelector('table', { timeout: 30000 });

    const standings = await page.evaluate((competition) => {
      const table = document.querySelector('table');
      if (!table) return [];

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
          competition
        };
      });
    }, competition);

    if (!standings.length) {
      console.warn(⚠️  No data found for ${competition});
    } else {
      console.log(✅ Scraped ${standings.length} teams for ${competition});
    }

    await supabase.from('simple_standings').delete().eq('competition', competition);
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error(❌ Supabase insert error for ${competition}:, error.message);
    else console.log(✅ ${competition} standings updated successfully!);
  } catch (err) {
    console.error(❌ Failed scraping ${competition}:, err.message);
  } finally {
    await page.close();
    await browser.close();
  }
}

// Dedicated union scrapers
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
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'gallagher-premiership'
      };
    });
  });

  await page.close();

  if (standings.length) {
    console.log(✅ Scraped ${standings.length} teams for Gallagher Premiership.);
    await supabase.from('simple_standings').delete().eq('competition', 'gallagher-premiership');
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error('❌ Insert error:', error.message);
    else console.log('✅ Gallagher Premiership standings updated successfully!');
  }
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
        drawn: parseInt(cells[4]?.innerText.trim()) || 0,
        lost: parseInt(cells[5]?.innerText.trim()) || 0,
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'super-rugby'
      };
    });
  });

  await page.close();

  if (standings.length) {
    console.log(✅ Scraped ${standings.length} teams for Super Rugby.);
    await supabase.from('simple_standings').delete().eq('competition', 'super-rugby');
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error('❌ Insert error:', error.message);
    else console.log('✅ Super Rugby standings updated successfully!');
  }
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

  if (standings.length) {
    console.log(✅ Scraped ${standings.length} teams for United Rugby.);
    await supabase.from('simple_standings').delete().eq('competition', 'united-rugby-championship');
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error('❌ Insert error:', error.message);
    else console.log('✅ United Rugby standings updated successfully!');
  }
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

  if (standings.length) {
    console.log(✅ Scraped ${standings.length} teams for Top 14.);
    await supabase.from('simple_standings').delete().eq('competition', 'top-14');
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error('❌ Insert error:', error.message);
    else console.log('✅ Top 14 standings updated successfully!');
  }
}

// Main entry
async function scrapeAll() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });

  await scrapeGallagherPremiership(browser);
  await scrapeSuperRugby(browser);
  await scrapeUnitedRugby(browser);
  await scrapeTop14(browser);

  // Close browser before launching new ones for league scraping
  await browser.close();

  // League scrapers use independent browser sessions
  await scrapeGenericSkyLeague(NRL_URL, 'nrl');
  await scrapeGenericSkyLeague(SUPER_LEAGUE_URL, 'super-league');
}

scrapeAll();
