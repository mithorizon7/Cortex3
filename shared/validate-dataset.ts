import { 
  optionCardSchema, 
  misconceptionQuestionSchema, 
  extendOptionCard, 
  extendMisconceptionQuestion,
  type ExtendedOptionCard 
} from './schema';
import { OPTION_CARDS, MISCONCEPTION_QUESTIONS } from './options-studio-data';

// Runtime validation function for option cards
export function validateOptionCards(): ExtendedOptionCard[] {
  try {
    // First validate against base schema
    const validatedCards = OPTION_CARDS.map(card => optionCardSchema.parse(card));
    
    // Then extend with UI properties
    const extendedCards = validatedCards.map(card => extendOptionCard(card));
    
    console.log('✅ Option cards validation passed:', extendedCards.length, 'cards');
    return extendedCards;
  } catch (error) {
    console.error('❌ Option cards validation failed:', error);
    throw new Error(`Option cards validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Runtime validation function for misconception questions
export function validateMisconceptionQuestions() {
  try {
    // First validate against base schema
    const validatedQuestions = MISCONCEPTION_QUESTIONS.map(question => 
      misconceptionQuestionSchema.parse(question)
    );
    
    // Then extend with UI properties
    const extendedQuestions = validatedQuestions.map(question => 
      extendMisconceptionQuestion(question)
    );
    
    console.log('✅ Misconception questions validation passed:', extendedQuestions.length, 'questions');
    return extendedQuestions;
  } catch (error) {
    console.error('❌ Misconception questions validation failed:', error);
    throw new Error(`Misconception questions validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Complete dataset validation
export function validateDataset() {
  console.log('🔍 Validating Options Studio dataset...');
  
  try {
    const validatedCards = validateOptionCards();
    const validatedQuestions = validateMisconceptionQuestions();
    
    // Additional integrity checks
    console.log('🔍 Running integrity checks...');
    
    // Check that all links in misconception questions reference valid option cards
    const cardIds = new Set(validatedCards.map(card => card.id));
    const invalidLinks: string[] = [];
    
    validatedQuestions.forEach(question => {
      question.links.forEach(link => {
        if (!cardIds.has(link)) {
          invalidLinks.push(`Question ${question.id} references invalid option: ${link}`);
        }
      });
    });
    
    if (invalidLinks.length > 0) {
      console.warn('⚠️ Found invalid option references:', invalidLinks);
    }
    
    // Check for duplicate IDs
    const duplicateCardIds = findDuplicates(validatedCards.map(card => card.id));
    const duplicateQuestionIds = findDuplicates(validatedQuestions.map(q => q.id));
    
    if (duplicateCardIds.length > 0) {
      throw new Error(`Duplicate option card IDs found: ${duplicateCardIds.join(', ')}`);
    }
    
    if (duplicateQuestionIds.length > 0) {
      throw new Error(`Duplicate question IDs found: ${duplicateQuestionIds.join(', ')}`);
    }
    
    console.log('✅ Dataset validation completed successfully!');
    console.log(`   - ${validatedCards.length} option cards validated`);
    console.log(`   - ${validatedQuestions.length} misconception questions validated`);
    console.log(`   - ${invalidLinks.length} integrity warnings`);
    
    return {
      cards: validatedCards,
      questions: validatedQuestions,
      warnings: invalidLinks,
    };
    
  } catch (error) {
    console.error('❌ Dataset validation failed:', error);
    throw error;
  }
}

// Helper function to find duplicates in an array
function findDuplicates<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  
  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }
  
  return Array.from(duplicates);
}

// Export for use in development
if (typeof window !== 'undefined') {
  // Browser environment - attach to window for debugging
  (window as any).validateDataset = validateDataset;
  (window as any).validateOptionCards = validateOptionCards;
  (window as any).validateMisconceptionQuestions = validateMisconceptionQuestions;
}