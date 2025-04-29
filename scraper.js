const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_URL = 'https://www.premiershiprugby.com/standings?competition=gallagher-premiership';

async function scrapeStandings() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  });

  const page = await browser.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  // Adjust the selector based on the actual table structure
const standings = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('table tbody tr'));
  return rows.map(row => {
    const cells = row.querySelectorAll('td');
    return {
      team: cells[1]?.innerText.trim() || '', // was 0
      played: parseInt(cells[2]?.innerText.trim()) || 0,
      won: parseInt(cells[3]?.innerText.trim()) || 0,
      drawn: parseInt(cells[4]?.innerText.trim()) || 0,
      lost: parseInt(cells[5]?.innerText.trim()) || 0,
      points: parseInt(cells[6]?.innerText.trim()) || 0
    };
  });
});


  await browser.close();

  if (standings.length === 0) {
    console.log('❌ No standings found. Aborting.');
    return;
  }

  console.log(`✅ Scraped ${standings.length} standings, updating database...`);

  // Clear old data
  const { error: deleteError } = await supabase.from('simple_standings').delete().not('id', 'is', null);
  if (deleteError) {
    console.error('❌ Failed to delete old records:', deleteError.message);
    return;
  }

  // Insert new standings
  const { error: insertError } = await supabase.from('simple_standings').insert(standings);
  if (insertError) {
    console.error('❌ Failed to insert new standings:', insertError.message);
    return;
  }

  console.log('✅ Standings updated successfully!');
}

scrapeStandings();
