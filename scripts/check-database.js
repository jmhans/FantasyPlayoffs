// Check what's in the database
require('dotenv').config({ path: '.env.local' });
const { drizzle } = require('drizzle-orm/vercel-postgres');
const { sql } = require('@vercel/postgres');
const { pgTable, serial, text, varchar, timestamp, jsonb, integer, pgSchema } = require('drizzle-orm/pg-core');

// Recreate schema inline
const fantasyPlayoffsSchema = pgSchema('fantasy_playoffs');
const players = fantasyPlayoffsSchema.table('players', {
  id: serial('id').primaryKey(),
  espnId: varchar('espn_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  position: varchar('position', { length: 10 }).notNull(),
  team: varchar('team', { length: 10 }).notNull(),
  jerseyNumber: varchar('jersey_number', { length: 10 }),
  status: varchar('status', { length: 20 }),
  imageUrl: text('image_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const db = drizzle(sql);

async function checkDatabase() {
  try {
    const allPlayers = await db.select().from(players);
    
    console.log('Total players in database:', allPlayers.length);
    
    const joshAllen = allPlayers.find(p => p.name.toLowerCase().includes('josh allen'));
    console.log('Josh Allen:', joshAllen ? 'FOUND - ID: ' + joshAllen.id : 'NOT FOUND');
    
    const justinJefferson = allPlayers.find(p => p.name.toLowerCase().includes('justin jefferson'));
    console.log('Justin Jefferson:', justinJefferson ? 'FOUND - ID: ' + justinJefferson.id : 'NOT FOUND');
    
    console.log('\nFirst 20 players:');
    allPlayers.slice(0, 20).forEach(p => {
      console.log(`  ${p.name.padEnd(25)} (${p.position}) - ${p.team} - ESPN ID: ${p.espnId}`);
    });
    
    // Group by position
    console.log('\nPlayers by position:');
    const byPosition = {};
    allPlayers.forEach(p => {
      byPosition[p.position] = (byPosition[p.position] || 0) + 1;
    });
    Object.entries(byPosition).sort((a, b) => b[1] - a[1]).forEach(([pos, count]) => {
      console.log(`  ${pos}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
