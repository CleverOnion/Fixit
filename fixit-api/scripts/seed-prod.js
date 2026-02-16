const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const INVITATION_CODE = 'FIXIT2050';

async function main() {
  try {
    const existing = await prisma.invitationCode.count({ where: { createdBy: null } });

    if (existing === 0) {
      console.log('Creating invitation code...');
      try {
        await prisma.invitationCode.create({ data: { code: INVITATION_CODE, createdBy: null } });
        console.log('  ✓ Created:', INVITATION_CODE);
      } catch (e) {
        if (e.code !== 'P2002') throw e;
        console.log('  ⊗ Already exists:', INVITATION_CODE);
      }
      console.log('✅ Invitation code created');
    } else {
      console.log('✅ Invitation code already exists');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
