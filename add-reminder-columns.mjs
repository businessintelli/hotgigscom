import mysql from 'mysql2/promise';

async function addColumns() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Add reminder columns to interview_panelists if they don't exist
    await connection.execute(`
      ALTER TABLE interview_panelists 
      ADD COLUMN IF NOT EXISTS reminder24hSent BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS reminder1hSent BOOLEAN NOT NULL DEFAULT FALSE
    `);
    console.log('Added reminder columns to interview_panelists');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist');
    } else {
      console.error('Error:', error.message);
    }
  }
  
  await connection.end();
}

addColumns();
