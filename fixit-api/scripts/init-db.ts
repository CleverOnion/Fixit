import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
const envPath = path.resolve(process.cwd(), '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

async function main() {
  try {
    console.log('🗄️  Initializing Fixit database...\n');

    // 运行迁移
    console.log('📦 Running migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env },
    });

    console.log('\n🌱 Running seed...');
    execSync('npx prisma db seed', {
      stdio: 'inherit',
      env: { ...process.env },
    });

    console.log('\n✅ Database initialization complete!');
  } catch (error) {
    console.error('\n❌ Initialization failed:', error);
    process.exit(1);
  }
}

main();
