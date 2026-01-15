'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Checkbox } from '@tpmjs/ui/Checkbox/Checkbox';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Pagination } from '@tpmjs/ui/Pagination/Pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { useState } from 'react';
import { FieldsetSection, SubSection } from './shared';

export function SectionPatternTables(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const mockData = [
    { id: '1', name: '@tpmjs/parser', category: 'utility', downloads: 125432, status: 'active', score: 0.92 },
    { id: '2', name: '@tpmjs/validator', category: 'validation', downloads: 89231, status: 'active', score: 0.87 },
    { id: '3', name: '@tpmjs/transform', category: 'data', downloads: 45678, status: 'beta', score: 0.81 },
    { id: '4', name: '@tpmjs/executor', category: 'runtime', downloads: 34521, status: 'active', score: 0.78 },
    { id: '5', name: '@tpmjs/config', category: 'utility', downloads: 23456, status: 'deprecated', score: 0.65 },
  ];

  const toggleRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === mockData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(mockData.map(d => d.id));
    }
  };

  return (
    <FieldsetSection title="17. table patterns" id="table-patterns">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Data table patterns for displaying, sorting, filtering, and acting on tabular data.
      </p>

      <SubSection title="sortable columns">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Click column headers to sort. Show sort direction with icons.
        </p>
        <div className="bg-surface border border-dashed border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-surface-2">
                  <div className="flex items-center gap-2">
                    name
                    <Icon icon="chevronDown" size="xs" className="text-foreground-tertiary" />
                  </div>
                </TableHead>
                <TableHead>category</TableHead>
                <TableHead className="text-right cursor-pointer hover:bg-surface-2">
                  <div className="flex items-center gap-2 justify-end">
                    downloads
                    <Icon icon="chevronDown" size="xs" className="text-accent" />
                  </div>
                </TableHead>
                <TableHead className="text-right">score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.slice(0, 3).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono">{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="text-right font-mono">{row.downloads.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{row.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SubSection>

      <SubSection title="row selection + bulk actions">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Select rows to enable bulk actions. Show action bar when rows are selected.
        </p>
        <div className="bg-surface border border-dashed border-border">
          {/* Bulk action bar */}
          {selectedRows.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-accent/10 border-b border-border">
              <span className="font-mono text-sm">
                {selectedRows.length} item{selectedRows.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">export</Button>
                <Button size="sm" variant="destructive">delete</Button>
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.length === mockData.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>name</TableHead>
                <TableHead>category</TableHead>
                <TableHead>status</TableHead>
                <TableHead className="text-right">downloads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((row) => (
                <TableRow key={row.id} className={selectedRows.includes(row.id) ? 'bg-accent/5' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono">{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === 'active' ? 'success' : row.status === 'deprecated' ? 'error' : 'warning'}
                      size="sm"
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.downloads.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SubSection>

      <SubSection title="pagination">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Use pagination for large datasets. Show page info and navigation.
        </p>
        <div className="space-y-6">
          {/* Full pagination */}
          <div className="bg-surface p-4 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-4">full pagination</p>
            <Pagination
              page={page}
              totalPages={10}
              onPageChange={setPage}
              showFirstLast
              showPrevNext
            />
          </div>

          {/* Simple pagination */}
          <div className="bg-surface p-4 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-4">simple pagination</p>
            <Pagination
              page={page}
              totalPages={10}
              onPageChange={setPage}
              variant="simple"
            />
          </div>

          {/* Minimal pagination */}
          <div className="bg-surface p-4 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-4">minimal pagination</p>
            <Pagination
              page={page}
              totalPages={10}
              onPageChange={setPage}
              variant="minimal"
            />
          </div>
        </div>
      </SubSection>

      <SubSection title="empty & loading states">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Empty state */}
          <div className="bg-surface border border-dashed border-border">
            <div className="p-12 text-center">
              <Icon icon="folder" size="lg" className="text-foreground-tertiary mx-auto mb-4" />
              <p className="font-mono text-sm text-foreground mb-2">no tools found</p>
              <p className="font-sans text-xs text-foreground-secondary mb-4">
                Try adjusting your filters or create your first tool.
              </p>
              <Button size="sm">create tool</Button>
            </div>
          </div>

          {/* Loading state */}
          <div className="bg-surface border border-dashed border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>name</TableHead>
                  <TableHead>category</TableHead>
                  <TableHead className="text-right">downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 bg-muted animate-pulse w-32" /></TableCell>
                    <TableCell><div className="h-4 bg-muted animate-pulse w-20" /></TableCell>
                    <TableCell className="text-right"><div className="h-4 bg-muted animate-pulse w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SubSection>

      <SubSection title="density integration">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Tables respect the page density mode for compact views.
        </p>
        <div className="bg-surface p-4 border border-dashed border-border">
          <h4 className="font-mono text-sm font-medium mb-3">row heights by density</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-mono text-xs text-foreground-tertiary">compact</p>
              <p className="font-mono text-lg">36px</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-xs text-foreground-tertiary">comfortable</p>
              <p className="font-mono text-lg">48px</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-xs text-foreground-tertiary">spacious</p>
              <p className="font-mono text-lg">64px</p>
            </div>
          </div>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}
