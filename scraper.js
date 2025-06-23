const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Setup Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// URLs – existing
const PREMIERSHIP_URL           = 'https://www.skysports.com/rugbyunion/competitions/gallagher-premiership/tables';
const SUPER_RUGBY_URL           = 'https://www.skysports.com/rugbyunion/competitions/super-rugby/tables';
const UNITED_RUGBY_URL          = 'https://www.skysports.com/rugbyunion/competitions/united-rugby-championship/tables';
const TOP14_URL                 = 'https://www.skysports.com/rugbyunion/competitions/top-14/tables';
const NRL_URL                   = 'https://www.skysports.com/rugbyleague/competitions/telstra-premiership/tables';
const SUPER_LEAGUE_URL          = 'https://www.skysports.com/rugbyleague/competitions/super-league/tables';

// URLs – new rugby league
const WOMENS_SUPER_LEAGUE_URL   = 'https://www.skysports.com/rugbyleague/competitions/womens-super-league/tables';
const RL_CHAMPIONSHIP_URL       = 'https://www.skysports.com/rugbyleague/competitions/championship/tables';

// URLs – new rugby union
const SIX_NATIONS_URL           = 'https://www.skysports.com/rugbyunion/competitions/six-nations/tables';
const WOMENS_SIX_NATIONS_URL    = 'https://www.skysports.com/rugbyunion/competitions/womens-six-nations/tables';
const UNION_CHAMPIONSHIP_URL    = 'https://www.skysports.com/rugbyunion/competitions/championship/tables';
const RUGBY_CHAMPIONSHIP_URL    = 'https://www.skysports.com/rugbyunion/competitions/the-rugby-championship/tables';
const CURRIE_CUP_URL            = 'https://www.skysports.com/rugbyunion/competitions/currie-cup/tables';
const BUNNINGS_NPC_URL          = 'https://www.skysports.com/rugbyunion/competitions/bunnings-npc/tables';

// Generic scraper for league tables from Sky Sports Rugby League
async function scrapeGenericSkyLeague(url, competition) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('table tbody tr', { timeout: 30000 });

    const standings = await page.evaluate((competition) => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          team:   cells[1]?.innerText.trim() || '',
          played: parseInt(cells[2]?.innerText.trim()) || 0,
          won:    parseInt(cells[3]?.innerText.trim()) || 0,
          drawn:  parseInt(cells[4]?.innerText.trim()) || 0,
          lost:   parseInt(cells[5]?.innerText.trim()) || 0,
          // generic uses cells[8] for PD, cells[10] for points
          pd:     parseInt(cells[8]?.innerText.trim()) || 0,
          points: parseInt(cells[10]?.innerText.trim()) || 0,
          competition
        };
      });
    }, competition);

    if (!standings.length) {
      console.warn(`⚠️  No data found for ${competition}`);
    } else {
      console.log(`✅ Scraped ${standings.length} teams for ${competition}`);
    }

    await supabase.from('simple_standings').delete().eq('competition', competition);
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error(`❌ Supabase insert error for ${competition}:`, error.message);
    else console.log(`✅ ${competition} standings updated successfully!`);
  } catch (err) {
    console.error(`❌ Failed scraping ${competition}:`, err.message);
  } finally {
    await page.close();
    await browser.close();
  }
}

// Dedicated NRL scraper with custom cell indices
async function scrapeNRL() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: 'new' });
  const page = await browser.newPage();

  try {
    await page.goto(NRL_URL, { waitUntil: 'networkidle2' });
    await page.waitForSelector('table tbody tr', { timeout: 30000 });

    const standings = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          team:   cells[1]?.innerText.trim() || '',
          played: parseInt(cells[2]?.innerText.trim()) || 0,
          won:    parseInt(cells[3]?.innerText.trim()) || 0,
          drawn:  parseInt(cells[4]?.innerText.trim()) || 0,
          lost:   parseInt(cells[5]?.innerText.trim()) || 0,
          pd:     parseInt(cells[6]?.innerText.trim()) || 0,  // custom index
          points: parseInt(cells[6]?.innerText.trim()) || 0,  // custom index
          competition: 'nrl'
        };
      });
    });

    if (!standings.length) {
      console.warn('⚠️  No data found for NRL');
    } else {
      console.log(`✅ Scraped ${standings.length} teams for NRL`);
    }

    await supabase.from('simple_standings').delete().eq('competition', 'nrl');
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error('❌ Supabase insert error for NRL:', error.message);
    else console.log('✅ NRL standings updated successfully!');
  } catch (err) {
    console.error('❌ Failed scraping NRL:', err.message);
  } finally {
    await page.close();
    await browser.close();
  }
}

// Dedicated union scrapers
async function scrapeGallagherPremiership(browser) { /* unchanged */ }
async function scrapeSuperRugby(browser)          { /* unchanged */ }
async function scrapeUnitedRugby(browser)        { /* unchanged */ }
async function scrapeTop14(browser)              { /* unchanged */ }

async function scrapeAll() {
  // Union – dedicated
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });
  await scrapeGallagherPremiership(browser);
  await scrapeSuperRugby(browser);
  await scrapeUnitedRugby(browser);
  await scrapeTop14(browser);
  await browser.close();

  // Rugby League – dedicated NRL
  await scrapeNRL();

  // Rugby League – other comps generic
  await scrapeGenericSkyLeague(SUPER_LEAGUE_URL,        'super-league');
  await scrapeGenericSkyLeague(WOMENS_SUPER_LEAGUE_URL, 'womens-super-league');
  await scrapeGenericSkyLeague(RL_CHAMPIONSHIP_URL,     'rl-championship');

  // Rugby Union – generic for additional comps
  await scrapeGenericSkyLeague(SIX_NATIONS_URL,         'six-nations');
  await scrapeGenericSkyLeague(WOMENS_SIX_NATIONS_URL,  'womens-six-nations');
  await scrapeGenericSkyLeague(UNION_CHAMPIONSHIP_URL,  'union-championship');
  await scrapeGenericSkyLeague(RUGBY_CHAMPIONSHIP_URL,  'the-rugby-championship');
  await scrapeGenericSkyLeague(CURRIE_CUP_URL,          'currie-cup');
  await scrapeGenericSkyLeague(BUNNINGS_NPC_URL,        'bunnings-npc');
}

scrapeAll();
