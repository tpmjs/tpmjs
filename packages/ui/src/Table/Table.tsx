import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';

// ============================================================================
// Table Root
// ============================================================================

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Visual style variant */
  variant?: 'default' | 'bordered';
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table
        ref={ref}
        className={cn(
          'w-full caption-bottom text-sm',
          variant === 'bordered' && 'border border-border rounded-lg overflow-hidden',
          className
        )}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

// ============================================================================
// Table Header
// ============================================================================

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('bg-surface-secondary [&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

// ============================================================================
// Table Body
// ============================================================================

const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

// ============================================================================
// Table Footer
// ============================================================================

const TableFooter = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t bg-surface-secondary font-medium', className)}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

// ============================================================================
// Table Row
// ============================================================================

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Whether the row is selected */
  selected?: boolean;
  /** Whether the row is clickable/interactive */
  interactive?: boolean;
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, interactive, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors',
        interactive && 'cursor-pointer hover:bg-surface',
        selected && 'bg-surface',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

// ============================================================================
// Table Head Cell
// ============================================================================

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc' | null;
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sortDirection, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 px-4 text-left align-middle font-medium text-foreground-secondary',
        '[&:has([role=checkbox])]:pr-0',
        sortable && 'cursor-pointer select-none hover:text-foreground',
        className
      )}
      {...props}
    >
      {sortable ? (
        <div className="flex items-center gap-1">
          {children}
          <span className="text-foreground-tertiary">
            {sortDirection === 'asc' && '↑'}
            {sortDirection === 'desc' && '↓'}
            {!sortDirection && '↕'}
          </span>
        </div>
      ) : (
        children
      )}
    </th>
  )
);
TableHead.displayName = 'TableHead';

// ============================================================================
// Table Cell
// ============================================================================

const TableCell = forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'px-4 py-3 align-middle text-foreground',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

// ============================================================================
// Table Caption
// ============================================================================

const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-foreground-secondary', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

// ============================================================================
// Table Empty State
// ============================================================================

export interface TableEmptyProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Number of columns to span */
  colSpan: number;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button/element */
  action?: React.ReactNode;
}

const TableEmpty = forwardRef<HTMLTableRowElement, TableEmptyProps>(
  ({ className, colSpan, icon, title, description, action, ...props }, ref) => (
    <tr ref={ref} className={className} {...props}>
      <td colSpan={colSpan} className="py-16 text-center">
        {icon && <div className="flex justify-center mb-4">{icon}</div>}
        <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
        {description && (
          <p className="text-foreground-secondary mb-4 max-w-md mx-auto">{description}</p>
        )}
        {action && <div className="flex justify-center">{action}</div>}
      </td>
    </tr>
  )
);
TableEmpty.displayName = 'TableEmpty';

// ============================================================================
// Exports
// ============================================================================

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableEmpty,
};
