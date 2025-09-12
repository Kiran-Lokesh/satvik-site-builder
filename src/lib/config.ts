// Configuration for data sources
export const DATA_SOURCE_CONFIG = {
  // Set to 'airtable' to use Airtable, 'json' to use local JSON files
  get source(): 'json' | 'airtable' {
    return (localStorage.getItem('dataSource') as 'json' | 'airtable') || 'json';
  },
  
  set source(value: 'json' | 'airtable') {
    localStorage.setItem('dataSource', value);
  },
  
  // Fallback to JSON if Airtable fails
  fallbackToJson: true,
  
  // Cache Airtable data for this many minutes
  airtableCacheMinutes: 5,
};

// Helper function to check if we should use Airtable
export const shouldUseAirtable = (): boolean => {
  return DATA_SOURCE_CONFIG.source === 'airtable';
};

// Helper function to check if we should use JSON
export const shouldUseJson = (): boolean => {
  return DATA_SOURCE_CONFIG.source === 'json';
};

// Helper function to get the current data source
export const getCurrentDataSource = (): string => {
  return DATA_SOURCE_CONFIG.source;
};
