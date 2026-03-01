"use client"

import * as React from "react"
import { DataTable } from "@/components/dashboard/data-table"
import { AIInsight } from "@/components/dashboard/ai-insight"
import { fetchFeishuData } from "@/lib/mock-data"
import { TableData } from "@/lib/types"
import { LayoutDashboard, Database, RefreshCcw, ExternalLink, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [data, setData] = React.useState<TableData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchFeishuData()
      setData(result)
      setLastUpdated(new Date().toLocaleTimeString())
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
               <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">直播话术库</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {loading ? '正在同步' : '实时在线'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {lastUpdated && !loading && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <Clock className="h-3 w-3" />
                最后更新: {lastUpdated}
              </div>
            )}
            <a 
              href="https://github.com/asu00131/Feishu-Phrase-Builder" 
              target="_blank" 
              className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              查看 GitHub 源码
            </a>
            <Button variant="ghost" size="icon" onClick={loadData} disabled={loading} className="rounded-full hover:bg-slate-100">
              <RefreshCcw className={`h-4 w-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2 uppercase tracking-widest">
              <Database className="h-4 w-4" />
              <span>Streaming Assets</span>
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">直播话术内容管理</h2>
            <p className="text-slate-500 mt-3 max-w-2xl text-lg leading-relaxed">
              当前数据已连接至 GitHub 原始 CSV 表。您可以实时查看直播话术的分类、内容及负责人信息。
            </p>
          </div>

          <div className="shrink-0">
             {!loading && data.length > 0 && <AIInsight currentData={data} />}
          </div>
        </div>

        {loading ? (
          <div className="w-full h-[500px] flex flex-col items-center justify-center space-y-6 bg-white/60 border border-slate-200 border-dashed rounded-3xl animate-pulse">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-slate-900 font-bold text-xl">数据抓取中...</p>
              <p className="text-slate-500 mt-1">正在连接 GitHub 原始文件</p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
             <DataTable data={data} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
           <p className="text-sm text-slate-400 font-medium">
             &copy; 2024 Intelligent Dashboard · 数据源: 直播话术_数据表.csv
           </p>
        </div>
      </footer>
    </div>
  )
}
