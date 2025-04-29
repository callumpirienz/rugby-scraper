const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_URL = 'https://www.datawrapper.de/_/Q69CZ/';

async function scrapeStandings() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  // Adjust the selector based on the actual table structure
  const standings = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return {
        team: cells[0]?.innerText.trim(),
        played: parseInt(cells[1]?.innerText.trim()),
        points: parseInt(cells[2]?.innerText.trim())
      };
    });
  });

  await browser.close();

  if (standings.length === 0) {
    console.log('No standings found. Aborting.');
    return;
  }

  await supabase.from('standings').delete().neq('id', 0);

  const { error } = await supabase.from('standings').insert(standings);
  if (error) throw error;

  console.log(`✅ Standings updated: ${standings.length} records.`);
}

scrapeStandings();
