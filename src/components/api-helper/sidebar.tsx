'use client'

import { useState } from 'react'
import { Box, History, ChevronRight, LayoutGrid, Plus, MoreVertical, Save, Share } from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Collection {
  id: string
  name: string
  items?: Collection[]
}

const collections: Collection[] = [
  {
    id: '1',
    name: 'Azure REST 2021 (Keep)',
    items: [
      { id: '1-1', name: 'Authentication' },
      { id: '1-2', name: 'Resources' }
    ]
  },
  {
    id: '2',
    name: 'Postman Echo',
    items: [
      { id: '2-1', name: 'Requests' },
      { id: '2-2', name: 'Responses' }
    ]
  },
  {
    id: '3',
    name: 'powerbi',
    items: [
      { id: '3-1', name: 'API Endpoints' }
    ]
  }
]

export function ApiSidebar() {
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set(['1']))

  const toggleCollection = (id: string) => {
    const newExpanded = new Set(expandedCollections)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCollections(newExpanded)
  }

  const renderCollectionItem = (item: Collection, level = 0) => {
    const hasItems = item.items && item.items.length > 0
    const isExpanded = expandedCollections.has(item.id)

    return (
      <div key={item.id} className="w-full">
        <div 
          className={cn(
            "flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-sm cursor-pointer text-sm",
            level > 0 && "ml-4"
          )}
          onClick={() => hasItems && toggleCollection(item.id)}
        >
          {hasItems && (
            <ChevronRight className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              isExpanded && "transform rotate-90"
            )} />
          )}
          <span className="truncate">{item.name}</span>
        </div>
        {hasItems && isExpanded && (
          <div className="mt-1">
            {item.items!.map(subItem => renderCollectionItem(subItem, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-80 bg-background border-r flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Box className="h-4 w-4" />
          </Button>
          <span className="font-semibold">Collections</span>
        </div>
        <Button variant="ghost" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-2">
          {collections.map(collection => renderCollectionItem(collection))}
        </div>
      </div>

      <div className="border-t">
        <div className="p-4 hover:bg-accent cursor-pointer">
          <div className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" />
            <span>History</span>
          </div>
        </div>
        <div className="p-4 hover:bg-accent cursor-pointer">
          <div className="flex items-center gap-2 text-sm">
            <LayoutGrid className="h-4 w-4" />
            <span>Workspace</span>
          </div>
        </div>
      </div>
    </div>
  )
}

