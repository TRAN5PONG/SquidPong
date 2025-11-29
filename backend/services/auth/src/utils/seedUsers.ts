import { recommandedPlayers } from './recommendedPlayers';
import { hashPassword } from './hashedPassword';
import { createAccount } from './utils';

/**
 * Seed recommended players into auth (upsert) and post their profile to user-service via createAccount.
 * Password for all seeded users will be the hashed value of "aaaaaa".
 */
export async function seedRecommendedPlayers(): Promise<void> 
{
  try 
  {
    const plainPassword = 'aaaaaa';
    const hashed = await hashPassword(plainPassword);

    for (const p of recommandedPlayers) {
      const payload = {
        email: p.email,
        username: p.nickname,
        password: hashed,
        firstName: p.first_name,
        lastName: p.last_name,
        avatar: p.avatar,
        banner: p.banner,
        rankDivision: p.rankDivision,
        rankTier: p.rankTier,
      };

      try 
      {
        const user = await createAccount(payload);
        console.log(`Seeded account: ${user.email} (id=${user.id}, username=${user.username})`);
      } 
      catch (err) {
        console.log(`Failed to seed user ${p.email}:`, err);
      }
    }
  } 
  catch (error) {
    console.log('Error while seeding recommended players:', error);
  }
}
