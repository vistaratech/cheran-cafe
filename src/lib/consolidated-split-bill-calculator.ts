import { type OrderItem } from '@/lib/types';

// Consolidated split bill method types - supporting both simple and advanced use cases
export type SplitMethod = 
  | 'equal' 
  | 'by_item' 
  | 'by_person' 
  | 'percentage' 
  | 'custom_amount'
  | 'shared_items'
  | 'customer_item_assignment'; // For enhanced payment scenarios

// Data structures for different split methods

// Equal split - simple division
export interface EqualSplitConfig {
  method: 'equal';
  numberOfPeople: number;
  includeTaxTips?: boolean;
  roundTo?: 'cent' | 'dollar';
}

// By item assignment - assign specific items to people
export interface ByItemSplitConfig {
  method: 'by_item';
  assignments: {
    itemId: string;
    personId: string;
    quantity?: number;
  }[];
  includeTaxTips?: boolean;
}

// By person - create separate bills
export interface ByPersonSplitConfig {
  method: 'by_person';
  bills: {
    id: string;
    personIds: string[];
    itemQuantities: Record<string, number>;
    customAmount?: number;
  }[];
  includeTaxTips?: boolean;
}

// Percentage split
export interface PercentageSplitConfig {
  method: 'percentage';
  allocations: {
    personId: string;
    percentage: number;
  }[];
  includeTaxTips?: boolean;
  roundTo?: 'cent' | 'dollar';
}

// Custom amount split - each person pays specific amount
export interface CustomAmountSplitConfig {
  method: 'custom_amount';
  allocations: {
    personId: string;
    personName?: string;
    amount: number;
  }[];
  includeTaxTips?: boolean;
}

// Shared items split - mix of shared and individual items
export interface SharedItemsSplitConfig {
  method: 'shared_items';
  sharedItems: {
    itemId: string;
    personIds: string[];
    quantity?: number;
  }[];
  individualItems: {
    itemId: string;
    personId: string;
    quantity?: number;
  }[];
  includeTaxTips?: boolean;
}

// Customer item assignment - for payment processing
export interface CustomerItemAssignmentConfig {
  method: 'customer_item_assignment';
  assignments: any[]; // CustomerPaymentAssignment[]
  includeTaxTips?: boolean;
}

export type SplitConfig = 
  | EqualSplitConfig
  | ByItemSplitConfig
  | ByPersonSplitConfig
  | PercentageSplitConfig
  | CustomAmountSplitConfig
  | SharedItemsSplitConfig
  | CustomerItemAssignmentConfig;

// Result structures
export interface SplitResult {
  personId: string;
  personName?: string;
  amount: number;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    pricePerUnit: number;
    total: number;
  }[];
  tax: number;
  tip: number;
  total: number;
}

export interface SplitCalculationResult {
  results: SplitResult[];
  assignments?: any[]; // For customer item assignment
  totalAmount: number;
  totalTax: number;
  totalTip: number;
  isValid: boolean;
  errorMessage?: string;
}

export class ConsolidatedSplitBillCalculator {
  private orderItems: OrderItem[];
  private subtotal: number;
  private tax: number;
  private tip: number;

  constructor(orderItems: OrderItem[], subtotal: number, tax: number, tip: number = 0) {
    this.orderItems = orderItems;
    this.subtotal = subtotal;
    this.tax = tax;
    this.tip = tip;
  }

  calculate(config: SplitConfig): SplitCalculationResult {
    // First validate the configuration
    const validationError = this.validateConfig(config);
    if (validationError) {
      return this.createInvalidResult(validationError);
    }

    switch (config.method) {
      case 'equal':
        return this.calculateEqualSplit(config);
      case 'by_item':
        return this.calculateByItemSplit(config);
      case 'by_person':
        return this.calculateByPersonSplit(config);
      case 'percentage':
        return this.calculatePercentageSplit(config);
      case 'custom_amount':
        return this.calculateCustomAmountSplit(config);
      case 'shared_items':
        return this.calculateSharedItemsSplit(config);
      case 'customer_item_assignment':
        return this.calculateCustomerItemAssignment(config);
      default:
        return this.createInvalidResult('Unsupported split method');
    }
  }

  private validateConfig(config: SplitConfig): string | null {
    // Common validations
    if (config.includeTaxTips && (this.tax < 0 || this.tip < 0)) {
      return 'Tax and tip amounts must be non-negative';
    }

    switch (config.method) {
      case 'equal':
        return this.validateEqualSplit(config);
      case 'custom_amount':
        return this.validateCustomAmountSplit(config);
      case 'percentage':
        return this.validatePercentageSplit(config);
      case 'customer_item_assignment':
        return this.validateCustomerItemAssignment(config);
      default:
        return null; // Other methods can be validated in their specific handlers
    }
  }

  private validateEqualSplit(config: EqualSplitConfig): string | null {
    if (config.numberOfPeople <= 0) {
      return 'Number of people must be greater than 0';
    }
    
    if (config.numberOfPeople > 50) {
      return 'Number of people cannot exceed 50';
    }
    
    if (!Number.isInteger(config.numberOfPeople)) {
      return 'Number of people must be a whole number';
    }
    
    return null;
  }

  private validateCustomAmountSplit(config: CustomAmountSplitConfig): string | null {
    if (config.allocations.length === 0) {
      return 'At least one person must be added';
    }
    
    if (config.allocations.length > 50) {
      return 'Cannot have more than 50 people';
    }

    let totalAmount = 0;
    
    for (const allocation of config.allocations) {
      if (allocation.personName && allocation.personName.trim().length > 50) {
        return 'Person names cannot exceed 50 characters';
      }
      
      const amount = typeof allocation.amount === 'string' 
        ? parseFloat(allocation.amount) 
        : allocation.amount;
      
      if (isNaN(amount) || amount < 0) {
        return 'Amounts must be non-negative numbers';
      }
      
      if (amount > 10000) {
        return 'Individual amounts cannot exceed $10,000';
      }
      
      totalAmount += amount;
    }

    const expectedTotal = config.includeTaxTips ? this.subtotal + this.tax + this.tip : this.subtotal;
    const difference = Math.abs(totalAmount - expectedTotal);
    
    if (difference > 0.01) {
      return `Total amounts ($${totalAmount.toFixed(2)}) must equal the bill total ($${expectedTotal.toFixed(2)})`;
    }

    return null;
  }

  private validatePercentageSplit(config: PercentageSplitConfig): string | null {
    const totalPercentage = config.allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return 'Percentages must sum to 100%';
    }
    
    if (config.allocations.length === 0) {
      return 'At least one allocation is required';
    }
    
    if (config.allocations.length > 50) {
      return 'Cannot have more than 50 allocations';
    }

    return null;
  }

  private validateCustomerItemAssignment(config: CustomerItemAssignmentConfig): string | null {
    if (!config.assignments || config.assignments.length === 0) {
      return 'At least one customer assignment is required';
    }

    if (config.assignments.length > 20) {
      return 'Cannot have more than 20 customer assignments';
    }

    // Additional validation would go here based on CustomerPaymentAssignment structure
    return null;
  }

  private calculateEqualSplit(config: EqualSplitConfig): SplitCalculationResult {
    const { numberOfPeople, includeTaxTips = true, roundTo = 'cent' } = config;
    
    const totalAmount = includeTaxTips ? this.subtotal + this.tax + this.tip : this.subtotal;
    let amountPerPerson = totalAmount / numberOfPeople;

    // Apply rounding
    if (roundTo === 'dollar') {
      amountPerPerson = Math.round(amountPerPerson);
    } else {
      amountPerPerson = Math.round(amountPerPerson * 100) / 100;
    }

    const results: SplitResult[] = [];
    let remainingAmount = totalAmount;

    // Create person IDs
    for (let i = 0; i < numberOfPeople; i++) {
      const isLastPerson = i === numberOfPeople - 1;
      const personAmount = isLastPerson ? remainingAmount : amountPerPerson;
      
      results.push({
        personId: `person_${i + 1}`,
        personName: `Person ${i + 1}`,
        amount: parseFloat(personAmount.toFixed(2)),
        items: [],
        tax: includeTaxTips ? (this.tax / numberOfPeople) : 0,
        tip: includeTaxTips ? (this.tip / numberOfPeople) : 0,
        total: parseFloat(personAmount.toFixed(2))
      });
      
      remainingAmount -= amountPerPerson;
    }

    return {
      results,
      totalAmount,
      totalTax: includeTaxTips ? this.tax : 0,
      totalTip: includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private calculateCustomAmountSplit(config: CustomAmountSplitConfig): SplitCalculationResult {
    const { allocations, includeTaxTips = true } = config;
    
    const results: SplitResult[] = allocations.map((allocation, index) => {
      const amount = typeof allocation.amount === 'string' 
        ? parseFloat(allocation.amount) 
        : allocation.amount;
      
      return {
        personId: allocation.personId || `person_${index + 1}`,
        personName: allocation.personName || `Person ${index + 1}`,
        amount: parseFloat(amount.toFixed(2)),
        items: [],
        tax: 0,
        tip: 0,
        total: parseFloat(amount.toFixed(2))
      };
    });

    // Distribute tax and tips proportionally if requested
    if (includeTaxTips && (this.tax > 0 || this.tip > 0)) {
      const totalCustomAmount = allocations.reduce((sum, alloc) => {
        const amount = typeof alloc.amount === 'string' ? parseFloat(alloc.amount) : alloc.amount;
        return sum + amount;
      }, 0);
      
      results.forEach(result => {
        const proportion = result.amount / totalCustomAmount;
        result.tax = this.roundAmount(this.tax * proportion, 'cent');
        result.tip = this.roundAmount(this.tip * proportion, 'cent');
        result.total = result.amount + result.tax + result.tip;
      });
    }

    const totalAmount = parseFloat(allocations.reduce((sum, alloc) => {
      const amount = typeof alloc.amount === 'string' ? parseFloat(alloc.amount) : alloc.amount;
      return sum + amount;
    }, 0).toFixed(2));

    return {
      results,
      totalAmount,
      totalTax: includeTaxTips ? this.tax : 0,
      totalTip: includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  // Placeholder implementations for other methods - these would be expanded as needed
  private calculateByItemSplit(config: ByItemSplitConfig): SplitCalculationResult {
    return this.createInvalidResult('By item split method not yet implemented');
  }

  private calculateByPersonSplit(config: ByPersonSplitConfig): SplitCalculationResult {
    return this.createInvalidResult('By person split method not yet implemented');
  }

  private calculatePercentageSplit(config: PercentageSplitConfig): SplitCalculationResult {
    return this.createInvalidResult('Percentage split method not yet implemented');
  }

  private calculateSharedItemsSplit(config: SharedItemsSplitConfig): SplitCalculationResult {
    return this.createInvalidResult('Shared items split method not yet implemented');
  }

  private calculateCustomerItemAssignment(config: CustomerItemAssignmentConfig): SplitCalculationResult {
    // This mirrors the enhanced payment calculator logic
    const updatedAssignments = config.assignments.map(assignment => {
      let itemTotal = 0;
      
      if (assignment.items && assignment.items.length > 0) {
        for (const itemAssignment of assignment.items) {
          const orderItem = this.orderItems.find(item => item.id === itemAssignment.orderItemId);
          if (orderItem) {
            itemTotal += orderItem.menuItem.price * itemAssignment.quantity;
          }
        }
      }

      return {
        ...assignment,
        amount: itemTotal
      };
    });

    // Distribute tax and tips proportionally if requested
    if (config.includeTaxTips && (this.tax > 0 || this.tip > 0)) {
      const totalItemAmount = updatedAssignments.reduce((sum, assignment) => sum + assignment.amount, 0);
      
      updatedAssignments.forEach(assignment => {
        if (totalItemAmount > 0) {
          const proportion = assignment.amount / totalItemAmount;
          assignment.amount += (this.tax + this.tip) * proportion;
        }
      });
    }

    const totalAmount = updatedAssignments.reduce((sum, assignment) => sum + assignment.amount, 0);

    return {
      results: [], // Empty for customer assignment method
      assignments: updatedAssignments,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalTax: config.includeTaxTips ? this.tax : 0,
      totalTip: config.includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private createInvalidResult(errorMessage: string): SplitCalculationResult {
    return {
      results: [],
      totalAmount: 0,
      totalTax: 0,
      totalTip: 0,
      isValid: false,
      errorMessage
    };
  }

  private roundAmount(amount: number, roundTo: 'cent' | 'dollar'): number {
    switch (roundTo) {
      case 'dollar':
        return Math.round(amount);
      case 'cent':
      default:
        return Math.round(amount * 100) / 100;
    }
  }

  // Utility methods
  static generatePersonId(index: number): string {
    return `person_${index + 1}`;
  }

  // Helper method to get unassigned items (for customer assignment)
  getUnassignedItems(assignments: any[]): OrderItem[] {
    const assignedItemMap = new Map<string, number>();
    
    assignments.forEach(assignment => {
      if (assignment.items) {
        assignment.items.forEach((itemAssignment: any) => {
          const currentCount = assignedItemMap.get(itemAssignment.orderItemId) || 0;
          assignedItemMap.set(itemAssignment.orderItemId, currentCount + itemAssignment.quantity);
        });
      }
    });

    const unassignedItems: OrderItem[] = [];
    
    this.orderItems.forEach(orderItem => {
      const assignedCount = assignedItemMap.get(orderItem.id) || 0;
      const remainingQuantity = orderItem.quantity - assignedCount;
      
      if (remainingQuantity > 0) {
        unassignedItems.push({
          ...orderItem,
          quantity: remainingQuantity
        });
      }
    });

    return unassignedItems;
  }

  // Helper method to validate if all items are assigned
  areAllItemsAssigned(assignments: any[]): boolean {
    const unassignedItems = this.getUnassignedItems(assignments);
    return unassignedItems.length === 0;
  }
}