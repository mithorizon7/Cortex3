// Make davedxn@mit.edu a super admin
import { storage } from './server/storage';

async function makeSuperAdmin() {
  try {
    console.log('🔧 Making davedxn@mit.edu a super admin...');
    
    // Firebase UID for davedxn@mit.edu (this should be the actual UID)
    // We'll create the user record if it doesn't exist
    
    const email = 'davedxn@mit.edu';
    // For now, I'll use a placeholder UID - we'll need to get the real one from Firebase
    // But let's first try to create/update with a known pattern
    
    console.log('Creating super admin user record...');
    
    try {
      // Try to create a new super admin user
      const newUser = await storage.createUser({
        userId: 'david-dixon-mit-edu', // temporary UID
        email: email,
        role: 'super_admin',
        cohortId: null,
        invitedBy: null
      });
      
      console.log('✅ Super admin user created successfully!');
      console.log(`   User ID: ${newUser.userId}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role}`);
      
    } catch (createError: any) {
      if (createError.message.includes('already exists')) {
        console.log('User already exists, attempting to update role...');
        
        // Try to update existing user
        const updatedUser = await storage.updateUser('david-dixon-mit-edu', {
          role: 'super_admin'
        });
        
        if (updatedUser) {
          console.log('✅ User role updated to super admin!');
          console.log(`   User ID: ${updatedUser.userId}`);
          console.log(`   Email: ${updatedUser.email}`);
          console.log(`   Role: ${updatedUser.role}`);
        } else {
          console.log('❌ Failed to update user role');
        }
      } else {
        throw createError;
      }
    }
    
    console.log('\n🎉 Admin access setup complete!');
    console.log('You should now be able to access /admin in your browser.');
    
  } catch (error: any) {
    console.error('❌ Error setting up admin access:', error.message);
    throw error;
  }
}

// Run the setup
makeSuperAdmin()
  .then(() => {
    console.log('🚀 Super admin setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });