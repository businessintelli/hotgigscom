import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function createAdmin() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Hash password
  const hashedPassword = await bcrypt.hash('india143', 10);
  
  // Create admin user
  await connection.execute(
    `INSERT INTO users (email, passwordHash, name, role, emailVerified) 
     VALUES (?, ?, ?, ?, ?)`,
    ['info@hotgigs.com', hashedPassword, 'HotGigs Admin', 'admin', true]
  );
  
  console.log('✅ Application admin created: info@hotgigs.com');
  
  await connection.end();
}

createAdmin().catch(console.error);
