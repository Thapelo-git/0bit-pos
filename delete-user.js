const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. CHANGE THIS EMAIL TO THE USER YOU WANT TO DELETE
const TARGET_EMAIL = 'm.thapelo10310@gmail.com'; 

async function run() {
  const emailClean = TARGET_EMAIL.toLowerCase().trim();
  console.log(`🚀 Attempting to purge user: ${emailClean}`);

  try {
    // Delete relational vendor profiles first to avoid foreign key violations
    const profilePurge = await prisma.vendorProfile.deleteMany({
      where: {
        user: { email: emailClean }
      }
    });
    console.log(`✨ Deleted profiles found: ${profilePurge.count}`);

    // Delete the actual user account row
    const userPurge = await prisma.user.delete({
      where: { email: emailClean }
    });
    console.log(`✅ Successfully removed user ID: ${userPurge.id} (${userPurge.email})`);

  } catch (error) {
    if (error.code === 'P2025') {
      console.log('❌ That email address does not exist in the database.');
    } else {
      console.error('⚠️ Database error occurred:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

run();