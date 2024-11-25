import Link from 'next/link'
import { Grid } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const tools = [
  {
    title: "API Helper",
    description: "Test and debug API endpoints with a Postman-like interface. Send requests, inspect responses, and manage collections.",
    category: "API Development",
    href: "/api-helper"
  },
]

export default function Home() {
  return (
    <main className="container mx-auto p-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Grid className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Developer Tools</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, index) => (
          <Link href={tool.href} key={index} className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="text-sm text-muted-foreground mb-2">{tool.category}</div>
                <CardTitle>{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}

