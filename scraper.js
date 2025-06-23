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

// Generic scraper (works for both league & union)
async function scrapeGenericSkySports(url, competition) {
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

// Dedicated union scrapers
async function scrapeGallagherPremiership(browser) {
  const page = await browser.newPage();
  await page.goto(PREMIERSHIP_URL, { waitUntil: 'networkidle0' });

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
        pd:     parseInt(cells[8]?.innerText.trim()) || 0,
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'gallagher-premiership'
      };
    });
  });

  await page.close();

  if (standings.length) {
    console.log(`✅ Scraped ${standings.length} teams for Gallagher Premiership.`);
    await supabase.from('simple_standings').delete().eq('competition', 'gallagher-premiership');
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error('❌ Insert error:', error.message);
    else console.log('✅ Gallagher Premiership standings updated successfully!');
  }
}


async function scrapeNRL(browser) {
  const page = await browser.newPage();
  await page.goto(NRL_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('table tbody tr', { timeout: 15000 });

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
        pd:     parseInt(cells[6]?.innerText.trim()) || 0,
        points: parseInt(cells[6]?.innerText.trim()) || 0,
        competition: 'nrl'
      };
    });
  });

  await page.close();

  if (standings.length) {
    console.log(`✅ Scraped ${standings.length} teams for NRL.`);
    await supabase.from('simple_standings').delete().eq('competition', 'nrl');
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error('❌ Insert error:', error.message);
    else console.log('✅ NRL standings updated successfully!');
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
        team:   cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won:    parseInt(cells[3]?.innerText.trim()) || 0,
        drawn:  parseInt(cells[4]?.innerText.trim()) || 0,
        lost:   parseInt(cells[5]?.innerText.trim()) || 0,
        pd:     parseInt(cells[8]?.innerText.trim()) || 0,
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'super-rugby'
      };
    });
  });

  await page.close();

  if (standings.length) {
    console.log(`✅ Scraped ${standings.length} teams for Super Rugby.`);
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
        team:   cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won:    parseInt(cells[3]?.innerText.trim()) || 0,
        drawn:  parseInt(cells[4]?.innerText.trim()) || 0,
        lost:   parseInt(cells[5]?.innerText.trim()) || 0,
        pd:     parseInt(cells[8]?.innerText.trim()) || 0,
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'united-rugby-championship'
      };
    });
  });

  await page.close();

  if (standings.length) {
    console.log(`✅ Scraped ${standings.length} teams for United Rugby.`);
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
        team:   cells[1]?.innerText.trim() || '',
        played: parseInt(cells[2]?.innerText.trim()) || 0,
        won:    parseInt(cells[3]?.innerText.trim()) || 0,
        drawn:  parseInt(cells[4]?.innerText.trim()) || 0,
        lost:   parseInt(cells[5]?.innerText.trim()) || 0,
        pd:     parseInt(cells[8]?.innerText.trim()) || 0,
        points: parseInt(cells[10]?.innerText.trim()) || 0,
        competition: 'top-14'
      };
    });
  });

  await page.close();

  if (standings.length) {
    console.log(`✅ Scraped ${standings.length} teams for Top 14.`);
    await supabase.from('simple_standings').delete().eq('competition', 'top-14');
    const { error } = await supabase.from('simple_standings').insert(standings);
    if (error) console.error('❌ Insert error:', error.message);
    else console.log('✅ Top 14 standings updated successfully!');
  }
}

// Main entry
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

  // Rugby League – generic
  await scrapeGenericSkySports(NRL_URL,                 'nrl');
  await scrapeGenericSkySports(SUPER_LEAGUE_URL,        'super-league');
  await scrapeGenericSkySports(WOMENS_SUPER_LEAGUE_URL, 'womens-super-league');
  await scrapeGenericSkySports(RL_CHAMPIONSHIP_URL,     'rl-championship');

  // Rugby Union – generic for additional comps
  await scrapeGenericSkySports(SIX_NATIONS_URL,         'six-nations');
  await scrapeGenericSkySports(WOMENS_SIX_NATIONS_URL,  'womens-six-nations');
  await scrapeGenericSkySports(UNION_CHAMPIONSHIP_URL,  'union-championship');
  await scrapeGenericSkySports(RUGBY_CHAMPIONSHIP_URL,  'the-rugby-championship');
  await scrapeGenericSkySports(CURRIE_CUP_URL,          'currie-cup');
  await scrapeGenericSkySports(BUNNINGS_NPC_URL,        'bunnings-npc');
}

scrapeAll();
