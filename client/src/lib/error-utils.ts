/**
 * Utility functions for handling and displaying user-friendly errors with incident IDs
 */

// Extract incident ID from API error responses
export function extractIncidentId(error: any): string | null {
  if (!error) return null;
  
  // Check if the error has an incidentId property
  if (error.incidentId) return error.incidentId;
  
  // Check if the error message contains an incident ID
  if (error.message && typeof error.message === 'string') {
    const match = error.message.match(/incident[_\s]?id:?\s*([a-zA-Z0-9\-]+)/i);
    if (match) return match[1];
  }
  
  return null;
}

// Format error message with incident ID for user display
export function formatErrorWithIncidentId(
  title: string, 
  description: string, 
  incidentId: string | null
): { title: string; description: string } {
  if (!incidentId) {
    return { title, description };
  }
  
  return {
    title,
    description: `${description}\n\nIncident ID: ${incidentId}\nPlease include this ID when contacting support.`
  };
}

// Enhanced error message formatting for different error types
export function getEnhancedErrorMessage(
  error: any,
  defaultTitle: string = "Error",
  defaultDescription: string = "An unexpected error occurred. Please try again."
) {
  const incidentId = extractIncidentId(error);
  
  let title = defaultTitle;
  let description = defaultDescription;
  
  // Parse structured error responses
  if (error.message && typeof error.message === 'object') {
    if (error.message.title) title = error.message.title;
    if (error.message.description) description = error.message.description;
  }
  
  return formatErrorWithIncidentId(title, description, incidentId);
}