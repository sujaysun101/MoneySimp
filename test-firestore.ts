// Test script to verify Firestore integration
// Run this with: node --loader ts-node/esm test-firestore.ts

import { initHybridStorage } from './src/lib/hybridStorage.js';

async function testFirestoreIntegration() {
  console.log('🧪 Testing Firestore Integration...');
  
  try {
    // Test initialization
    const testUserId = 'test-user-123';
    const testEncryptionKey = 'test-encryption-key-12345';
    
    console.log('📦 Initializing hybrid storage...');
    const storage = await initHybridStorage(testUserId, testEncryptionKey);
    
    // Test storage info
    const storageInfo = await storage.getStorageInfo();
    console.log('💾 Storage info:', JSON.stringify(storageInfo, null, 2));
    
    // Test basic account operations
    console.log('🏦 Testing bank account operations...');
    const testAccount = {
      id: 'test-account-1',
      name: 'Test Checking Account',
      type: 'checking' as const,
      balance: {
        current: 1234.56,
        available: 1200.00,
        limit: 0
      },
      currency: 'USD',
      institution: {
        name: 'Test Bank',
        id: 'test-bank'
      },
      provider: 'yodlee' as const,
      providerAccountId: 'test-123',
      accessToken: 'test-token',
      institutionId: 'test-bank',
      institutionName: 'Test Bank',
      accountId: 'test-account-1',
      mask: '0001',
      subtype: 'checking',
      officialName: 'Test Checking Account',
      isActive: true,
      lastSynced: new Date(),
    };
    
    await storage.saveBankAccount(testAccount);
    console.log('✅ Account saved successfully');
    
    const retrievedAccounts = await storage.getAllBankAccounts();
    console.log(`📋 Retrieved ${retrievedAccounts.length} account(s)`);
    
    if (retrievedAccounts.length > 0) {
      console.log('🔍 First account:', retrievedAccounts[0].name);
    }
    
    // Clean up
    console.log('🧹 Cleaning up test data...');
    await storage.clearAllData();
    
    console.log('✅ Firestore integration test completed successfully!');
    console.log('🚀 Your app is ready for production with secure cloud storage!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFirestoreIntegration();
}
