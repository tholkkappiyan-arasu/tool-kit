'use client'

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const commonHeaders = [
  { key: 'Accept', value: 'application/json' },
  { key: 'Accept', value: 'application/xml' },
  { key: 'Accept-Language', value: 'en-US' },
  { key: 'Cache-Control', value: 'no-cache' },
  { key: 'Content-Type', value: 'application/json' },
  { key: 'User-Agent', value: 'TuariAPITester/1.0' },
  { key: 'X-Requested-With', value: 'XMLHttpRequest' },
];

interface HeaderSuggestionsProps {
  onSelect: (header: { key: string, value: string }) => void;
}

export function HeaderSuggestions({ onSelect }: HeaderSuggestionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Add Common Header
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {commonHeaders.map((header, index) => (
          <DropdownMenuItem 
            key={`${header.key}-${index}`}
            onClick={() => onSelect(header)}
          >
            {header.key}: {header.value}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}