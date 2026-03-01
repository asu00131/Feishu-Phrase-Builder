"use client"

import * as React from "react"
import { DataTable } from "@/components/dashboard/data-table"
import { AIInsight } from "@/components/dashboard/ai-insight"
import { fetchFeishuData } from "@/lib/mock-data"
import { TableData } from "@/lib/types"
import { LayoutDashboard, Database, RefreshCcw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [data, setData] = React.useState<TableData[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchFeishuData()
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg shadow-md shadow-primary/20">
               <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">数据看板</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href="https://bea9ijqf1k.feishu.cn/wiki/US1ewpweWiIHc0kLYR1cL8vQnOf" 
              target="_blank" 
              className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              查看飞书原始数据
            </a>
            <Button variant="ghost" size="icon" onClick={loadData} disabled={loading} className="rounded-full">
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-medium mb-1">
              <Database className="h-4 w-4" />
              <span>项目进度追踪</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">实时数据概览</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              此看板实时同步自飞书 Wiki 数据库，展示了当前所有进行中的核心项目状态。支持多维度筛选与智能 AI 洞察分析。
            </p>
          </div>

          <div className="shrink-0">
             {!loading && <AIInsight currentData={data} />}
          </div>
        </div>

        {loading ? (
          <div className="w-full h-96 flex flex-col items-center justify-center space-y-4 bg-white/50 border rounded-2xl animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-slate-500 font-medium">正在拉取最新数据...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <DataTable data={data} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="container mx-auto px-4 text-center">
           <p className="text-sm text-muted-foreground">
             &copy; 2024 数据看板 · 基于 Feishu API 提供动力 · 智能 AI 驱动
           </p>
        </div>
      </footer>
    </div>
  )
}