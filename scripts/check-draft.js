const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ 
  connectionString: process.env.POSTGRES_URL 
});

async function checkDraft() {
  try {
    const result = await pool.query(`
      SELECT id, season_year, total_rounds, current_round, current_pick, is_complete
      FROM fantasy_playoffs.drafts 
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No draft found in database');
    } else {
      console.log('✅ Draft found:');
      console.table(result.rows);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDraft();
