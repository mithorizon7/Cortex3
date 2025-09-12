// Quick validation test script
import { validateDataset } from './shared/validate-dataset';

async function runValidation() {
  try {
    console.log('🔍 Starting dataset validation...');
    const result = await validateDataset();
    console.log('✅ Validation completed successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

runValidation();