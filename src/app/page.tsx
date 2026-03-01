
"use client"

import * as React from "react"
import { fetchFeishuData } from "@/lib/mock-data"
import { TableData } from "@/lib/types"
import { 
  LayoutDashboard, 
  Settings, 
  RefreshCcw, 
  Sparkles,
  Volume2,
  ChevronRight,
  RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AIInsight } from "@/components/dashboard/ai-insight"
import { DataTable } from "@/components/dashboard/data-table"

export default function DashboardPage() {
  const [data, setData] = React.useState<TableData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("preview")
  
  // 选中的产品分类
  const [selectedCategory, setSelectedCategory] = React.useState<string>("")
  // 每个环节当前显示的话术索引
  const [segmentIndices, setSegmentIndices] = React.useState<Record<string, number>>({})

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchFeishuData()
      setData(result)
      if (result.length > 0) {
        // 初始选中第一个分类
        const categories = Array.from(new Set(result.map(item => item['产品分类'] || item['分类'] || item['产品名称']).filter(Boolean)))
        if (categories.length > 0) setSelectedCategory(categories[0] as string)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // 按模块分组数据（左侧环节）
  const segments = React.useMemo(() => {
    const groups: Record<string, TableData[]> = {}
    data.forEach(item => {
      const module = item['话术模块'] || item['环节'] || '通用'
      if (!groups[module]) groups[module] = []
      groups[module].push(item)
    })
    return groups
  }, [data])

  // 所有分类（右侧标签）
  const allCategories = React.useMemo(() => {
    return Array.from(new Set(data.map(item => item['产品分类'] || item['分类'] || item['产品名称']).filter(Boolean)))
  }, [data])

  // 当前分类下的话术
  const categoryScripts = React.useMemo(() => {
    return data.filter(item => (item['产品分类'] || item['分类'] || item['产品名称']) === selectedCategory)
  }, [data, selectedCategory])

  const handleShuffle = (module: string) => {
    const count = segments[module]?.length || 0
    if (count <= 1) return
    setSegmentIndices(prev => ({
      ...prev,
      [module]: (prev[module] !== undefined ? (prev[module] + 1) % count : 1)
    }))
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F1F5F9]">
      {/* Top Nav Tabs */}
      <header className="bg-white border-b px-6 py-2 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-transparent border-none gap-4">
              <TabsTrigger value="preview" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-none shadow-none gap-2 font-bold px-4">
                <Sparkles className="h-4 w-4" /> 直播预览
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary border-none shadow-none gap-2 font-bold px-4">
                <Settings className="h-4 w-4" /> 配置映射
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-4">
          {!loading && data.length > 0 && <AIInsight currentData={data} />}
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-full bg-white">
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 同步数据
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        {activeTab === "preview" ? (
          <div className="grid grid-cols-12 gap-6 max-w-[1600px] mx-auto">
            
            {/* Left Column: Strategy Flow */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">策略流程话术</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5">
                  <RotateCcw className="h-4 w-4 mr-1" /> 换一批
                </Button>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-dashed animate-pulse text-slate-400">正在加载策略流程...</div>
              ) : Object.keys(segments).length > 0 ? (
                Object.keys(segments).map((moduleName, index) => {
                  const idx = segmentIndices[moduleName] || 0
                  const currentItem = segments[moduleName][idx]
                  return (
                    <div key={moduleName} className="relative pl-10 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${index * 100}ms` }}>
                      {/* Step Number */}
                      <div className="absolute left-0 top-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary/20 z-10">
                        {index + 1}
                      </div>
                      {/* Connector Line */}
                      {index !== Object.keys(segments).length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2" />
                      )}

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800">{moduleName}</span>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 font-medium">
                              链路策略话术 #{idx + 1}
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleShuffle(moduleName)}
                            className="text-primary hover:bg-primary/5 gap-1 font-bold text-xs"
                          >
                            <RotateCcw className="h-3 w-3" /> 换版
                          </Button>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 min-h-[120px]">
                           <div className="flex items-center gap-2 mb-3">
                             <div className="w-1 h-4 bg-primary rounded-full" />
                             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">口播提示文本</span>
                           </div>
                           <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                             {currentItem?.['话术内容'] || `未找到“${moduleName}”内容`}
                           </p>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-4">
                           <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> 名词</span>
                              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 重点</span>
                              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> 轻声</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed text-slate-400">
                  暂无流程数据，请检查 CSV 字段是否包含“话术模块”或“环节”
                </div>
              )}
            </div>

            {/* Right Column: Product Category & Script */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              {/* Product Categories */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <ChevronRight className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">核心展示 (产品分类)</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {allCategories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full px-5 h-9 font-medium transition-all ${
                        selectedCategory === cat 
                        ? "bg-slate-800 text-white shadow-md" 
                        : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cat}
                    </Button>
                  ))}
                  {allCategories.length === 0 && <p className="text-slate-400 text-sm">未检测到产品分类</p>}
                </div>
              </div>

              {/* Selected Product Script Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                
                <div className="flex items-center justify-between mb-6 relative">
                  <div className="flex items-center gap-3">
                     <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-50">产品核心展示 #1</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full text-xs font-bold gap-2 border-slate-200">
                    <Volume2 className="h-3.5 w-3.5" /> 点击试听
                  </Button>
                </div>

                <div className="space-y-4 relative">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">口播展示文本</span>
                  </div>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="text-slate-700 leading-loose text-lg whitespace-pre-wrap">
                      {categoryScripts.length > 0 ? (
                        categoryScripts[0]['话术内容'] || categoryScripts[0]['内容'] || "暂无话术详情"
                      ) : (
                        "请在上方选择一个产品分类以查看详细话术内容"
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
             <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">底层数据映射表</h2>
                <DataTable data={data} />
             </div>
          </div>
        )}
      </main>

      {/* Footer Meta */}
      <footer className="bg-white/50 border-t py-4 px-6">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto">
          <p className="text-xs text-slate-400 font-medium italic">
            智能话术系统 v2.0 · 自动适配 CSV 字段解析 · 数据源已链接
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded uppercase font-bold text-slate-500">Auto-Scaling</span>
            <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded uppercase font-bold text-emerald-600">Sync Active</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
