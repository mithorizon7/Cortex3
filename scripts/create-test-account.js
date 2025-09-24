#!/usr/bin/env node
/**
 * Script to create a test account for CORTEX application
 * Run with: node scripts/create-test-account.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// Firebase configuration - using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Test account credentials
const TEST_EMAIL = 'test.user@cortexapp.dev';
const TEST_PASSWORD = 'TestUser2024!';
const TEST_DISPLAY_NAME = 'CORTEX Test User';

async function createTestAccount() {
  try {
    console.log('🔧 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    console.log('👤 Creating test account...');
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🔑 Password: ${TEST_PASSWORD}`);
    
    const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const user = userCredential.user;
    
    console.log('✅ User account created successfully!');
    console.log(`🆔 User ID: ${user.uid}`);
    
    // Update the profile with display name
    await updateProfile(user, {
      displayName: TEST_DISPLAY_NAME
    });
    
    console.log('✅ Profile updated with display name!');
    console.log('');
    console.log('🎉 Test account is ready to use!');
    console.log('');
    console.log('📋 Test Account Credentials:');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   Display Name: ${TEST_DISPLAY_NAME}`);
    console.log('');
    console.log('💡 You can now sign in to the CORTEX application using these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating test account:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('');
      console.log('ℹ️  Test account already exists! You can use:');
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Password: ${TEST_PASSWORD}`);
    } else if (error.code === 'auth/weak-password') {
      console.log('❌ Password is too weak. Please use a stronger password.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('❌ Invalid email format.');
    } else {
      console.log('❌ Unexpected error:', error);
    }
    
    process.exit(1);
  }
}

// Run the script
createTestAccount();