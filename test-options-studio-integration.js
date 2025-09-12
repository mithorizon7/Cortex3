// Quick integration test for Options Studio backend API
const BASE_URL = 'http://localhost:5000';

async function testOptionsStudioAPI() {
  console.log('🧪 Testing Options Studio Integration...\n');
  
  try {
    // Test 1: Get empty session for non-existent assessment
    console.log('1. Testing GET /api/options-studio/:assessmentId for empty session...');
    const testAssessmentId = 'test-assessment-123';
    
    const getResponse = await fetch(`${BASE_URL}/api/options-studio/${testAssessmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (getResponse.ok) {
      const sessionData = await getResponse.json();
      console.log('✅ GET request successful');
      console.log('📄 Empty session response:', JSON.stringify(sessionData, null, 2));
    } else {
      console.log('❌ GET request failed:', getResponse.status, getResponse.statusText);
    }
    
    // Test 2: Create/Update session data
    console.log('\n2. Testing PUT /api/options-studio/:assessmentId to create session...');
    const testSessionData = {
      useCase: 'Test use case for API integration',
      goals: ['goal1', 'goal2'],
      misconceptionResponses: {
        'test-question-1': true,
        'test-question-2': false
      },
      comparedOptions: ['option1', 'option2'],
      reflectionPrompts: ['This is a test reflection'],
      completed: false
    };
    
    // Note: This will fail with 404 because we need a real assessment ID
    // But it will test our API structure
    const putResponse = await fetch(`${BASE_URL}/api/options-studio/${testAssessmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testSessionData)
    });
    
    if (putResponse.ok) {
      const savedSession = await putResponse.json();
      console.log('✅ PUT request successful');
      console.log('📄 Saved session response:', JSON.stringify(savedSession, null, 2));
    } else {
      const errorData = await putResponse.json().catch(() => null);
      console.log('❌ PUT request failed (expected for test assessment):', putResponse.status);
      console.log('📄 Error response:', JSON.stringify(errorData, null, 2));
    }
    
    // Test 3: Test validation with invalid data
    console.log('\n3. Testing validation with invalid session data...');
    const invalidSessionData = {
      useCase: 'Valid use case',
      goals: ['goal1'],
      misconceptionResponses: 'invalid-should-be-object', // This should fail validation
      comparedOptions: ['option1'],
      reflectionPrompts: ['reflection'],
      completed: 'invalid-should-be-boolean' // This should fail validation
    };
    
    const validationResponse = await fetch(`${BASE_URL}/api/options-studio/${testAssessmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidSessionData)
    });
    
    if (validationResponse.ok) {
      console.log('❌ Validation test failed - invalid data was accepted');
    } else {
      const errorData = await validationResponse.json().catch(() => null);
      console.log('✅ Validation test passed - invalid data was rejected:', validationResponse.status);
      console.log('📄 Validation error response:', JSON.stringify(errorData, null, 2));
    }
    
    console.log('\n🎉 API Integration Test Complete!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testOptionsStudioAPI();