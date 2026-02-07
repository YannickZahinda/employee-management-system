export class DateHelper {
  static toDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try parsing different date formats
    if (typeof value === 'string') {
      // Try YYYY-MM-DD format
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [_, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    
    throw new Error(`Cannot convert to Date: ${value}`);
  }

  static toDateString(value: any): string {
    try {
      const date = this.toDate(value);
      return date.toDateString();
    } catch {
      return 'Date not available';
    }
  }

  static formatDate(value: any, format: string = 'YYYY-MM-DD'): string {
    const date = this.toDate(value);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'full':
        return date.toDateString();
      default:
        return date.toDateString();
    }
  }
}