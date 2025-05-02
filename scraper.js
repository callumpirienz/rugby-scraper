// scraper.js
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Setup Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// URLs
const PREMIERSHIP_URL    = 'https://www.skysports.com/rugbyunion/competitions/gallagher-premiership/tables';
const SUPER_RUGBY_URL    = 'https://www.skysports.com/rugbyunion/competitions/super-rugby/tables';
const UNITED_RUGBY_URL   = 'https://www.skysports.com/rugbyunion/competitions/united-rugby-championship/tables';
const TOP14_URL          = 'https://www.skysports.com/rugbyunion/competitions/top-14/tables';
const NRL_URL            = 'https://www.skysports.com/rugbyleague/competitions/telstra-premiership/tables';
const SUPER_LEAGUE_URL   = 'https://www.skysports.com/rugbyleague/competitions/super-league/tables';

// Helper to scrape any generic table
async function scrapeGenericSkyLeague(url, competition) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: 'new' });
  const page    = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000);
    await page.waitForSelector('table tbody tr', { timeout: 30000 });

    const standings = await page.evaluate((competition) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(r => {
        const cells = r.querySelectorAll('td');
        const f = parseInt(cells[6]?.innerText.trim()) || 0;
        const a = parseInt(cells[7]?.innerText.trim()) || 0;
        return {
          team:        cells[1]?.innerText.trim() || '',
          played:      parseInt(cells[2]?.innerText.trim()) || 0,
          won:         parseInt(cells[3]?.innerText.trim()) || 0,
          drawn:       parseInt(cells[4]?.innerText.trim()) || 0,
          lost:        parseInt(cells[5]?.innerText.trim()) || 0,
          for:         f,
          against:     a,
          pd:          f - a,
          points:      parseInt(cells[10]?.innerText.trim()) || 0,
          competition,
        };
      });
    }, competition);

    if (standings.length === 0) {
      console.warn(`⚠️  No data for ${competition}`);
    } else {
      console.log(`✅ Scraped ${standings.length} rows for ${competition}`);
    }

    // delete old, insert new
    await supabase.from('simple_standings').delete().eq('competition', competition);
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error(`❌ Insert error (${competition}):`, error.message);
    else           console.log(`✅ ${competition} updated`);
  } catch (e) {
    console.error(`❌ Failed ${competition}:`, e.message);
  } finally {
    await page.close();
    await browser.close();
  }
}

// UNION-specific functions (same PD logic)
async function scrapeUnionTable(url, competition) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: 'new' });
  const page    = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('table tbody tr', { timeout: 15000 });

    const standings = await page.evaluate((competition) => {
      return Array.from(document.querySelectorAll('table tbody tr')).map(r => {
        const cells = r.querySelectorAll('td');
        const f = parseInt(cells[6]?.innerText.trim()) || 0;
        const a = parseInt(cells[7]?.innerText.trim()) || 0;
        return {
          team:        cells[1]?.innerText.trim() || '',
          played:      parseInt(cells[2]?.innerText.trim()) || 0,
          won:         parseInt(cells[3]?.innerText.trim()) || 0,
          drawn:       parseInt(cells[4]?.innerText.trim()) || 0,
          lost:        parseInt(cells[5]?.innerText.trim()) || 0,
          for:         f,
          against:     a,
          pd:          f - a,
          points:      parseInt(cells[10]?.innerText.trim()) || 0,
          competition,
        };
      });
    }, competition);

    if (standings.length) {
      console.log(`✅ Scraped ${standings.length} for ${competition}`);
      await supabase.from('simple_standings').delete().eq('competition', competition);
      const { error } = await supabase.from('simple_standings').insert(standings);
      if (error) console.error(`❌ Insert (${competition}):`, error.message);
      else       console.log(`✅ ${competition} updated`);
    }
  } catch (e) {
    console.error(`❌ Error ${competition}:`, e.message);
  } finally {
    await page.close();
    await browser.close();
  }
}

async function scrapeAll() {
  // Union comps
  await scrapeUnionTable(PREMIERSHIP_URL, 'gallagher-premiership');
  await scrapeUnionTable(SUPER_RUGBY_URL,    'super-rugby');
  await scrapeUnionTable(UNITED_RUGBY_URL,   'united-rugby-championship');
  await scrapeUnionTable(TOP14_URL,          'top-14');

  // League comps
  await scrapeGenericSkyLeague(NRL_URL,          'nrl');
  await scrapeGenericSkyLeague(SUPER_LEAGUE_URL, 'super-league');
}

scrapeAll();
