// Check user status for davedxn@mit.edu
import { storage } from './server/storage';

// Initialize Firebase Admin (using same config as the server)
import { initializeApp, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize if not already done
let app;
try {
  app = getApp();
} catch (error) {
  // Initialize with service account from environment
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
  app = initializeApp({
    credential: require('firebase-admin').credential.cert(serviceAccount),
    projectId: 'cortex3-790ee'
  });
}

async function checkUserStatus() {
  try {
    console.log('🔍 Checking user status for davedxn@mit.edu...');
    
    // First, check Firebase for the user
    let firebaseUser;
    try {
      const auth = getAuth(app);
      firebaseUser = await auth.getUserByEmail('davedxn@mit.edu');
      console.log(`✅ Firebase user found: ${firebaseUser.uid}`);
    } catch (error) {
      console.log('❌ Firebase user not found!');
      return null;
    }
    
    // Then check our database
    const user = await storage.getUser(firebaseUser.uid);
    
    if (user) {
      console.log('✅ User found in database:');
      console.log(`   User ID: ${user.userId}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Cohort ID: ${user.cohortId || 'None'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Active: ${user.lastActiveAt || 'Never'}`);
    } else {
      console.log('❌ User not found in our database!');
      console.log('   Firebase UID exists but no profile in our system.');
      console.log(`   Firebase UID: ${firebaseUser.uid}`);
    }
    
    return { firebaseUser, dbUser: user };
  } catch (error: any) {
    console.error('❌ Error checking user status:', error.message);
    throw error;
  }
}

// Run the check
checkUserStatus()
  .then((result) => {
    if (!result) {
      console.log(`\n🔧 User not found in Firebase - they may need to sign up first!`);
    } else if (result.dbUser && result.dbUser.role !== 'super_admin') {
      console.log(`\n🔧 User needs to be upgraded to super_admin role!`);
      console.log(`   Current role: ${result.dbUser.role}`);
    } else if (!result.dbUser) {
      console.log(`\n🔧 User needs to be created with super_admin role!`);
      console.log(`   Firebase UID: ${result.firebaseUser.uid}`);
    } else {
      console.log(`\n✅ User already has proper super_admin access!`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });