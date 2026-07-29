/**
 * Utility functions for Zustand stores
 */

/**
 * Creates a normalized entity reducer function
 * @param getId Function to extract ID from entity
 * @returns Reducer function for normalizing entities
 */
export const createEntityReducer = <T extends { id: string }>(
  getId: (entity: T) => string = (entity) => entity.id
) => {
  return (entities: Record<string, T>, newEntities: T[]): Record<string, T> => {
    const updatedEntities = { ...entities };
    newEntities.forEach(entity => {
      updatedEntities[getId(entity)] = entity;
    });
    return updatedEntities;
  };
};

/**
 * Creates a selector for getting entities by IDs
 * @param entities Record of entities
 * @returns Function to get entities by array of IDs
 */
export const createSelectorByIds = <T>(
  entities: Record<string, T>
) => {
  return (ids: string[]): T[] => {
    return ids
      .map(id => entities[id])
      .filter(Boolean) as T[];
  };
};

/**
 * Creates a selector for filtering entities
 * @param entities Record of entities
 * @returns Function to filter entities by predicate
 */
export const createSelectorByFilter = <T>(
  entities: Record<string, T>
) => {
  return (predicate: (entity: T) => boolean): T[] => {
    return Object.values(entities).filter(predicate);
  };
};

/**
 * Creates a selector for finding entity by property
 * @param entities Record of entities
 * @returns Function to find entity by property value
 */
export const createSelectorByProperty = <T, K extends keyof T>(
  entities: Record<string, T>
) => {
  return (property: K, value: T[K]): T | undefined => {
    return Object.values(entities).find(entity => entity[property] === value);
  };
};

/**
 * Utility for handling async store actions with loading/error states
 */
export const withAsyncHandling = async <T>(
  action: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): Promise<T | undefined> => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await action();
    setLoading(false);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    setError(errorMessage);
    setLoading(false);
    return undefined;
  }
};

/**
 * Debounce function for optimizing frequent calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for rate limiting
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Deep merge utility for combining objects
 */
export const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const result = { ...target } as T;
  
  Object.keys(source).forEach(key => {
    const typedKey = key as keyof T;
    if (source[typedKey] && typeof source[typedKey] === 'object' && !Array.isArray(source[typedKey])) {
      result[typedKey] = deepMerge(result[typedKey] || ({} as any), source[typedKey] as Partial<T>);
    } else {
      result[typedKey] = source[typedKey] as T[keyof T];
    }
  });
  
  return result;
};

/**
 * Utility for creating computed selectors
 */
export const createSelector = <T, R>(
  dependencies: (() => T)[],
  compute: (...args: T[]) => R
) => {
  return (): R => {
    const deps = dependencies.map(dep => dep());
    return compute(...deps);
  };
};

/**
 * Pagination helper for large datasets
 */
export const paginate = <T>(items: T[], page: number, pageSize: number): T[] => {
  const startIndex = (page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
};

/**
 * Search/filter utility for collections
 */
export const searchInCollection = <T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchTerm) return items;
  
  const normalizedSearchTerm = searchTerm.toLowerCase().trim();
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(normalizedSearchTerm);
      }
      return false;
    });
  });
};

/**
 * Sort utility with multiple criteria
 */
export const multiSort = <T>(
  items: T[],
  sortCriteria: {
    field: keyof T;
    direction: 'asc' | 'desc';
    type?: 'string' | 'number' | 'date';
  }[]
): T[] => {
  return [...items].sort((a, b) => {
    for (const criterion of sortCriteria) {
      const { field, direction, type = 'string' } = criterion;
      const aValue = a[field];
      const bValue = b[field];
      
      let comparison = 0;
      
      switch (type) {
        case 'number':
          comparison = (aValue as number) - (bValue as number);
          break;
        case 'date':
          comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime();
          break;
        case 'string':
        default:
          comparison = String(aValue).localeCompare(String(bValue));
          break;
      }
      
      if (comparison !== 0) {
        return direction === 'asc' ? comparison : -comparison;
      }
    }
    
    return 0;
  });
};