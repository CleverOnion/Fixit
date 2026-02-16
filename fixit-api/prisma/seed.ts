import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量（从项目根目录）
const envPath = path.resolve(process.cwd(), '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

// 初始邀请码
const INVITATION_CODE = 'FIXIT2050';

async function main() {
  console.log('🌱 Starting database seed...');

  // 检查是否已有系统邀请码
  const existingSystemCodes = await prisma.invitationCode.findMany({
    where: { createdBy: null },
  });

  if (existingSystemCodes.length > 0) {
    console.log(`✅ Found ${existingSystemCodes.length} existing system invitation codes, skipping seed`);
    console.log('Existing codes:', existingSystemCodes.map(c => c.code).join(', '));
    return;
  }

  // 创建初始邀请码
  try {
    await prisma.invitationCode.create({
      data: {
        code: INVITATION_CODE,
        createdBy: null, // 系统创建的邀请码
      },
    });
    console.log(`  ✓ Created invitation code: ${INVITATION_CODE}`);
  } catch (error) {
    // 如果邀请码已存在，跳过
    if (error.code === 'P2002') {
      console.log(`  ⊗ Invitation code already exists: ${INVITATION_CODE}`);
    } else {
      throw error;
    }
  }

  console.log('');
  console.log('✅ Database seed completed!');
  console.log(`📝 Created invitation code: ${INVITATION_CODE}`);
  console.log('');
  console.log('🔑 Use this code to register:');
  console.log(`   "${INVITATION_CODE}"`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
