const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Config: URLs
const PREMIERSHIP_URL = 'https://www.premiershiprugby.com/standings?competition=gallagher-premiership';
const SUPER_RUGBY_URL = 'https://super.rugby/superrugby/competition-stats/';

async function scrapePage(browser, url, competition) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  let standings = [];

  if (competition === 'gallagher-premiership') {
    standings = await page.evaluate(() => {
const table = document.querySelector('table'); // just the first table
const rows = Array.from(table.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          team: cells[1]?.innerText.trim() || '',
          played: parseInt(cells[2]?.innerText.trim()) || 0,
          won: parseInt(cells[3]?.innerText.trim()) || 0,
          drawn: parseInt(cells[4]?.innerText.trim()) || 0,
          lost: parseInt(cells[5]?.innerText.trim()) || 0,
          points: parseInt(cells[6]?.innerText.trim()) || 0
        };
      });
    });
  }

if (competition === 'super-rugby') {
  standings = await page.evaluate(() => {
    const table = document.querySelector('table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      const team = cells[1]?.innerText.trim() || '';
      const played = parseInt(cells[2]?.innerText.trim()) || 0;
      const won = parseInt(cells[3]?.innerText.trim()) || 0;
      const drawn = parseInt(cells[4]?.innerText.trim()) || 0;
      const lost = parseInt(cells[5]?.innerText.trim()) || 0;
      const points = parseInt(cells[14]?.innerText.trim()) || 0; // Adjust the index based on actual table structure in super rugby comp. page

      return { team, played, won, drawn, lost, points };
    });
  });
}



  await page.close();

  // Add competition field
  const enriched = standings.map(team => ({ ...team, competition }));

  if (enriched.length === 0) {
    console.log(`❌ No standings found for ${competition}`);
    return;
  }

  console.log(`✅ Scraped ${enriched.length} teams for ${competition}. Updating...`);

  // Clear old data for this competition
  const { error: deleteError } = await supabase
    .from('simple_standings')
    .delete()
    .eq('competition', competition);

  if (deleteError) {
    console.error(`❌ Failed to delete old ${competition} records:`, deleteError.message);
    return;
  }

  const { error: insertError } = await supabase
    .from('simple_standings')
    .insert(enriched);

  if (insertError) {
    console.error(`❌ Failed to insert ${competition} standings:`, insertError.message);
    return;
  }

  console.log(`✅ ${competition} standings updated successfully!`);
}

async function scrapeAll() {
  const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: 'new'
});


  await scrapePage(browser, PREMIERSHIP_URL, 'gallagher-premiership');
  await scrapePage(browser, SUPER_RUGBY_URL, 'super-rugby');

  await browser.close();
}

scrapeAll();
