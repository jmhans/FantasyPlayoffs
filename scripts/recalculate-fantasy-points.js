require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

/**
 * Calculate fantasy points from stats (same logic as actuals-actions)
 */
function calculateFantasyPoints(stats) {
  if (!stats) return 0;
  
  let points = 0;
  
  // Passing stats
  const passYds = stats.passingYards || 0;
  const passTDs = stats.passingTouchdowns || 0;
  const passInt = stats.interceptions || 0;
  
  points += passYds / 25; // 0.04 pts per yard (1 pt per 25 yards)
  points += passTDs * 6; // 6 pts per TD
  points += passInt * -2; // -2 pts per INT
  
  // Rushing stats
  const rushYds = stats.rushingYards || 0;
  const rushTDs = stats.rushingTouchdowns || 0;
  
  points += rushYds / 10; // 0.1 pts per yard (1 pt per 10 yards)
  points += rushTDs * 6; // 6 pts per TD
  
  // Receiving stats
  const recYds = stats.receivingYards || 0;
  const recTDs = stats.receivingTouchdowns || 0;
  const receptions = stats.receptions || 0;
  
  points += recYds / 10; // 0.1 pts per yard (1 pt per 10 yards)
  points += recTDs * 6; // 6 pts per TD
  points += receptions * 0.5; // 0.5 pts per reception (Half PPR)
  
  // Fumbles lost
  const fumbles = stats.fumblesLost || 0;
  points += fumbles * -2; // -2 pts per fumble lost
  
  return points;
}

async function recalculateFantasyPoints() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Step 1: Changing fantasy_points column to REAL (decimal)...');
    
    await sql`
      ALTER TABLE fantasy_playoffs.weekly_actuals 
      ALTER COLUMN fantasy_points TYPE real
    `;
    
    console.log('✅ Column type changed to REAL');
    
    console.log('\nStep 2: Fetching all records with stats...');
    
    const records = await sql`
      SELECT id, stats 
      FROM fantasy_playoffs.weekly_actuals 
      WHERE stats IS NOT NULL
    `;
    
    console.log(`Found ${records.length} records to recalculate`);
    
    console.log('\nStep 3: Recalculating fantasy points...');
    
    let updated = 0;
    for (const record of records) {
      const newPoints = calculateFantasyPoints(record.stats);
      
      await sql`
        UPDATE fantasy_playoffs.weekly_actuals 
        SET fantasy_points = ${newPoints},
            updated_at = NOW()
        WHERE id = ${record.id}
      `;
      
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`  Processed ${updated}/${records.length} records...`);
      }
    }
    
    console.log(`\n✅ Successfully recalculated ${updated} records!`);
    
    // Show some sample results
    console.log('\nSample results:');
    const samples = await sql`
      SELECT espn_id, season, week, fantasy_points
      FROM fantasy_playoffs.weekly_actuals
      ORDER BY fantasy_points DESC
      LIMIT 10
    `;
    
    console.table(samples);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

recalculateFantasyPoints();
