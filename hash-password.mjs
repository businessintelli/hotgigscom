import bcrypt from 'bcryptjs';

const password = 'india143';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
