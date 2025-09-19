// Configuration for data sources
export type DataSource = 'local' | 'sanity';

export const DATA_SOURCE_CONFIG = {
  // Get data source from environment variable or default to 'local'
  get source(): DataSource {
    // Check environment variable first
    const envSource = import.meta.env.VITE_DATA_SOURCE as DataSource;
    if (envSource && ['local', 'sanity'].includes(envSource)) {
      return envSource;
    }
    
    // Check localStorage for runtime switching
    const storedSource = localStorage.getItem('dataSource') as DataSource;
    if (storedSource && ['local', 'sanity'].includes(storedSource)) {
      return storedSource;
    }
    
    // Default to sanity
    return 'sanity';
  },
  
  // Set data source (for runtime switching)
  set source(value: DataSource) {
    localStorage.setItem('dataSource', value);
  },
  
  // Fallback configuration
  fallbackToLocal: true,
  
  // Cache settings
  cacheMinutes: 5,
};

// Helper functions
export const isLocalDataSource = (): boolean => {
  return DATA_SOURCE_CONFIG.source === 'local';
};

export const isSanityDataSource = (): boolean => {
  return DATA_SOURCE_CONFIG.source === 'sanity';
};

export const getCurrentDataSource = (): DataSource => {
  return DATA_SOURCE_CONFIG.source;
};

// Function to switch data source at runtime
export const switchDataSource = (source: DataSource): void => {
  DATA_SOURCE_CONFIG.source = source;
  // Clear any cached data when switching
  localStorage.removeItem('productDataCache');
  localStorage.removeItem('cacheTimestamp');
};
