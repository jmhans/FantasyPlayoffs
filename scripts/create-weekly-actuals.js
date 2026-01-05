require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function createWeeklyActualsTable() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Creating weekly_actuals table...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS fantasy_playoffs.weekly_actuals (
        id serial PRIMARY KEY NOT NULL,
        player_id integer NOT NULL,
        espn_id text NOT NULL,
        season integer NOT NULL,
        week integer NOT NULL,
        fantasy_points integer NOT NULL,
        stats json,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `;
    
    await sql`
      ALTER TABLE fantasy_playoffs.weekly_actuals 
      DROP CONSTRAINT IF EXISTS weekly_actuals_player_id_players_id_fk
    `;
    
    await sql`
      ALTER TABLE fantasy_playoffs.weekly_actuals 
      ADD CONSTRAINT weekly_actuals_player_id_players_id_fk 
      FOREIGN KEY (player_id) 
      REFERENCES fantasy_playoffs.players(id) 
      ON DELETE cascade 
      ON UPDATE no action
    `;
    
    console.log('✅ Table created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
}

createWeeklyActualsTable();
