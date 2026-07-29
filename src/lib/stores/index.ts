// Consolidated export barrel for all stores
// Normalized stores (single source of truth)
export * from './current-order-store';
export * from './menu-store';
export * from './user-store';
export * from './reports-store';
export { default as useKDSStore } from './kds-store';

// Feature stores
export * from './inventory-store';
export * from './payments-store';
export * from './workstations-store';
export * from './users-store';
export * from './roles-store';
export * from './i18n-store';

// Utils
export * from './utils';