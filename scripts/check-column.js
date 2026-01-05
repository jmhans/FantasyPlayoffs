const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ 
  connectionString: process.env.POSTGRES_URL 
});

async function checkColumn() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'fantasy_playoffs' 
        AND table_name = 'players' 
        AND column_name = 'is_draft_eligible'
    `);
    
    console.log('Column info:', result.rows);
    
    if (result.rows.length === 0) {
      console.log('\n⚠️  Column "is_draft_eligible" NOT FOUND');
    } else {
      console.log('\n✅ Column "is_draft_eligible" EXISTS');
      
      // Also check some sample data
      const sampleData = await pool.query(`
        SELECT name, team, is_draft_eligible 
        FROM fantasy_playoffs.players 
        LIMIT 5
      `);
      console.log('\nSample data:');
      console.table(sampleData.rows);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumn();
