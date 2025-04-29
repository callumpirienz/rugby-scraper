require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Change this to the real URL you're scraping
const TARGET_URL = 'https://example.com/standings';

async function scrapeStandings() {
    try {
        const { data: html } = await axios.get(TARGET_URL);
        const $ = cheerio.load(html);

        const standings = [];

        $('table.standings-table tr').each((index, element) => {
            const team = $(element).find('td.team-name').text().trim();
            const played = $(element).find('td.played').text().trim();
            const points = $(element).find('td.points').text().trim();

            if (team) {
                standings.push({
                    team,
                    played: parseInt(played),
                    points: parseInt(points)
                });
            }
        });

        if (standings.length === 0) {
            console.log('No standings found. Aborting.');
            return;
        }

        await supabase.from('standings').delete().neq('id', 0);

        const { error } = await supabase.from('standings').insert(standings);
        if (error) throw error;

        console.log(`✅ Standings updated: ${standings.length} records.`);
    } catch (error) {
        console.error('❌ Scraping error:', error.message);
    }
}

scrapeStandings();
