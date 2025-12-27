// Test the scoring system with our database
import { db } from '../app/lib/db/index.js';
import { players, rosterEntries, seasons, participants } from '../app/lib/db/schema.js';
import { eq } from 'drizzle-orm';

async function test() {
  try {
    console.log('Testing roster player query...\n');
    
    const currentYear = new Date().getFullYear();
    
    const activeRosters = await db
      .select({
        playerId: rosterEntries.playerId,
        playerName: rosterEntries.playerName,
        position: rosterEntries.position,
        team: rosterEntries.team,
        espnId: players.espnId,
        participantName: participants.name,
      })
      .from(rosterEntries)
      .innerJoin(players, eq(rosterEntries.playerId, players.id))
      .innerJoin(participants, eq(rosterEntries.participantId, participants.id))
      .innerJoin(seasons, eq(rosterEntries.participantId, seasons.participantId))
      .where(eq(seasons.year, currentYear));

    console.log(`Found ${activeRosters.length} players on rosters for ${currentYear}`);
    
    if (activeRosters.length > 0) {
      console.log('\nSample players:');
      activeRosters.slice(0, 5).forEach(p => {
        console.log(`- ${p.playerName} (${p.position}, ${p.team}) - ESPN ID: ${p.espnId || 'MISSING'} - Owner: ${p.participantName}`);
      });
      
      const withoutEspnId = activeRosters.filter(p => !p.espnId);
      if (withoutEspnId.length > 0) {
        console.log(`\n⚠️  Warning: ${withoutEspnId.length} players are missing ESPN IDs`);
        console.log('Sample players without ESPN ID:');
        withoutEspnId.slice(0, 3).forEach(p => {
          console.log(`- ${p.playerName} (${p.position})`);
        });
      }
    } else {
      console.log('\n⚠️  No players found on rosters!');
      console.log('Checking if there are any roster entries...');
      
      const allRosters = await db.select().from(rosterEntries);
      console.log(`Total roster entries: ${allRosters.length}`);
      
      const allSeasons = await db.select().from(seasons);
      console.log(`Total seasons: ${allSeasons.length}`);
      console.log('Season years:', allSeasons.map(s => s.year).join(', '));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
