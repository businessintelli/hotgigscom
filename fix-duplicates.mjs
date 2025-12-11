import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Get all users
const allUsers = await db.select().from(users);

// Find duplicates
const emailMap = {};
for (const user of allUsers) {
  if (!user.email) continue;
  if (!emailMap[user.email]) {
    emailMap[user.email] = [];
  }
  emailMap[user.email].push(user);
}

// Fix duplicates
for (const [email, userList] of Object.entries(emailMap)) {
  if (userList.length > 1) {
    console.log(`Found ${userList.length} users with email: ${email}`);
    // Keep first, update others
    for (let i = 1; i < userList.length; i++) {
      const user = userList[i];
      const newEmail = `${email.split('@')[0]}+user${user.id}@${email.split('@')[1]}`;
      console.log(`  Updating user ${user.id}: ${email} -> ${newEmail}`);
      await db.update(users).set({ email: newEmail }).where(sql`id = ${user.id}`);
    }
  }
}

console.log('Done!');
await connection.end();
