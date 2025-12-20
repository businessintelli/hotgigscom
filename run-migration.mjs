import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const connection = await createConnection(process.env.DATABASE_URL);
import { readFileSync } from "fs";

const sql = readFileSync("./add-bot-interview-tables.sql", "utf-8");

// Split by semicolon and filter out empty statements
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => {
    if (!s) return false;
    // Remove comment lines
    const lines = s.split('\n').filter(line => !line.trim().startsWith('--'));
    return lines.join('\n').trim().length > 0;
  })
  .map((s) => {
    // Remove inline comments
    return s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim();
  });

console.log(`Executing ${statements.length} SQL statements...`);

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];
  if (!statement) continue;
  
  try {
    console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
    await connection.execute(statement);
    console.log(`✓ Success`);
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    if (!error.message.includes("already exists")) {
      throw error;
    }
  }
}

console.log("\n✓ Migration completed successfully!");
await connection.end();
process.exit(0);
