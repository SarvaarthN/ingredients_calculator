"use client";

import { UNIT_GROUPS } from "@/lib/units";

export function UnitSelect({
  value,
  onChange,
  id,
  className = "select",
  ariaLabel,
}: {
  value: string;
  onChange: (unit: string) => void;
  id?: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      id={id}
      className={className}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    >
      {UNIT_GROUPS.map((group) => (
        <optgroup key={group.kind} label={group.title}>
          {group.units.map((unit) => (
            <option key={unit.id || "count"} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
