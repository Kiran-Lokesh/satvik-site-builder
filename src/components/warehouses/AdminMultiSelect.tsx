import React, { useState, useMemo, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Admin {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

interface AdminMultiSelectProps {
  admins: Admin[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export const AdminMultiSelect: React.FC<AdminMultiSelectProps> = ({
  admins,
  selectedIds,
  onChange,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAdmins = useMemo(() => {
    if (!searchTerm) return admins;
    const term = searchTerm.toLowerCase();
    return admins.filter(
      (admin) =>
        admin.email?.toLowerCase().includes(term) ||
        admin.displayName?.toLowerCase().includes(term)
    );
  }, [admins, searchTerm]);

  const handleToggle = useCallback((adminId: string, checked?: boolean) => {
    // Use the checked parameter if provided (from checkbox), otherwise determine from current state
    const shouldBeSelected = checked !== undefined ? checked : !selectedIds.includes(adminId);
    const newSelectedIds = shouldBeSelected
      ? [...selectedIds, adminId]
      : selectedIds.filter((id) => id !== adminId);
    
    // Only call onChange if the selection actually changed
    const currentSet = new Set(selectedIds);
    const newSet = new Set(newSelectedIds);
    if (currentSet.size !== newSet.size || ![...newSet].every(id => currentSet.has(id))) {
      onChange(newSelectedIds);
    }
  }, [selectedIds, onChange]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search admins..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Checkbox List */}
      <div className="border rounded-md max-h-60 overflow-y-auto">
        {filteredAdmins.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchTerm ? 'No admins found' : 'No admins available'}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredAdmins.map((admin) => {
              const isChecked = selectedIds.includes(admin.id);
              return (
                <div
                  key={admin.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                >
                  <Checkbox
                    id={`admin-${admin.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      handleToggle(admin.id, checked === true);
                    }}
                  />
                  <label
                    htmlFor={`admin-${admin.id}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    <div className="font-medium">
                      {admin.displayName || 'No name'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {admin.email}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

