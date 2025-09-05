import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string | null>
{
  if(!password)
    return null;
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  return hashed;
}


export async function VerifyPassword(password: string , hashedPassword:any): Promise<boolean>
{
    const isMatch = await bcrypt.compare(password, hashedPassword);

  return isMatch;
}


