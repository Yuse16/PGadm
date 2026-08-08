"use client";

import { Select } from "./ui/input";

export interface FilterOption {
  value: string;
  label: string;
}

export function CatalogFilters({
  status,
  onStatusChange,
  statusOptions,
}: {
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: FilterOption[];
}) {
  return (
    <Select
      aria-label="Filtrar por estado"
      value={status}
      onChange={(event) => onStatusChange(event.target.value)}
      className="w-44"
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
