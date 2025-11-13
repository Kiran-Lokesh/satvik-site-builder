// Configuration for data sources
export type DataSource = 'local' | 'sanity' | 'backend';
export type Environment = 'local' | 'test' | 'prod';

export const DATA_SOURCE_CONFIG = {
  // Get data source from environment variable or default to 'local'
  get source(): DataSource {
    // Check environment variable first
    const envSource = import.meta.env.VITE_DATA_SOURCE as DataSource;
    if (envSource && ['local', 'sanity', 'backend'].includes(envSource)) {
      return envSource;
    }
    
    // Check localStorage for runtime switching
    const storedSource = localStorage.getItem('dataSource') as DataSource;
    if (storedSource && ['local', 'sanity', 'backend'].includes(storedSource)) {
      return storedSource;
    }
    
    // Default to backend (Commerce Service)
    return 'backend';
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

export const isBackendDataSource = (): boolean => {
  return DATA_SOURCE_CONFIG.source === 'backend';
};

export const getCurrentDataSource = (): DataSource => {
  return DATA_SOURCE_CONFIG.source;
};

// Function to switch data source at runtime
export const switchDataSource = (source: DataSource): void => {
  const previousSource = DATA_SOURCE_CONFIG.source;
  DATA_SOURCE_CONFIG.source = source;
  
  // Log the data source switch
  console.log(`🔄 Data source switched: ${previousSource.toUpperCase()} → ${source.toUpperCase()}`);
  
  // Clear any cached data when switching
  localStorage.removeItem('productDataCache');
  localStorage.removeItem('cacheTimestamp');
};

// Environment configuration
export const getEnvironment = (): Environment => {
  const envVar = import.meta.env.VITE_ENVIRONMENT as Environment;
  if (envVar && ['local', 'test', 'prod'].includes(envVar)) {
    return envVar;
  }
  // Default to prod for safety
  return 'prod';
};

export const isLocalEnvironment = (): boolean => {
  return getEnvironment() === 'local';
};

export const isTestEnvironment = (): boolean => {
  return getEnvironment() === 'test';
};

export const isProdEnvironment = (): boolean => {
  return getEnvironment() === 'prod';
};
