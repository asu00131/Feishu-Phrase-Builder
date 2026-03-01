"use client"

import * as React from "react"
import { fetchFeishuData } from "@/lib/mock-data"
import { TableData } from "@/lib/types"
import { 
  RefreshCcw, 
  Sparkles,
  RotateCcw,
  Layers,
  ShoppingBag
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
        // 自动识别分类字段并设置初始选中
        const firstItem = result[0]
        const catKey = Object.keys(firstItem).find(k => k.includes('分类') || k.includes('产品') || k.includes('名称'))
        if (catKey) {
          const categories = Array.from(new Set(result.map(item => item[catKey]).filter(Boolean)))
          if (categories.length > 0) setSelectedCategory(categories[0] as string)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // 动态字段映射辅助函数
  const getField = (item: any, keywords: string[]) => {
    const key = Object.keys(item).find(k => keywords.some(kw => k.includes(kw)))
    return key ? item[key] : null
  }

  // 按模块分组数据（左侧环节）
  const segments = React.useMemo(() => {
    const groups: Record<string, TableData[]> = {}
    data.forEach(item => {
      const module = getField(item, ['模块', '环节', '阶段']) || '通用流程'
      if (!groups[module]) groups[module] = []
      groups[module].push(item)
    })
    return groups
  }, [data])

  // 所有分类（右侧标签）
  const allCategories = React.useMemo(() => {
    const key = data.length > 0 ? Object.keys(data[0]).find(k => k.includes('分类') || k.includes('产品') || k.includes('类别')) : null
    if (!key) return []
    return Array.from(new Set(data.map(item => item[key]).filter(Boolean)))
  }, [data])

  // 当前分类下的话术
  const categoryScripts = React.useMemo(() => {
    const key = data.length > 0 ? Object.keys(data[0]).find(k => k.includes('分类') || k.includes('产品') || k.includes('类别')) : null
    if (!key || !selectedCategory) return []
    return data.filter(item => item[key] === selectedCategory)
  }, [data, selectedCategory])

  const handleShuffle = (module: string) => {
    const count = segments[module]?.length || 0
    if (count <= 1) return
    setSegmentIndices(prev => ({
      ...prev,
      [module]: (prev[module] !== undefined ? (prev[module] + 1) % count : 1)
    }))
  }

  const getContent = (item: any) => {
    return getField(item, ['话术', '内容', '文本', '描述']) || "暂无话术详情"
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* 顶部导航 */}
      <header className="bg-white border-b px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">直播话术生成器</h1>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-slate-100/50 p-1">
              <TabsTrigger value="preview" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-semibold transition-all">
                直播预览
              </TabsTrigger>
              <TabsTrigger value="config" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-semibold transition-all">
                底层数据
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-4">
          {!loading && data.length > 0 && <AIInsight currentData={data} />}
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-full bg-white hover:bg-slate-50 border-slate-200">
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 同步飞书数据
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8">
        {activeTab === "preview" ? (
          <div className="grid grid-cols-12 gap-8 max-w-[1700px] mx-auto">
            
            {/* 左列：策略流程 (7/12) */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <Layers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">策略链路话术</h2>
                    <p className="text-xs text-slate-400 mt-0.5">根据直播阶段自动适配最优口播模板</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => loadData()} className="text-primary font-bold hover:bg-primary/5">
                  <RotateCcw className="h-4 w-4 mr-1.5" /> 随机换一批
                </Button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-white rounded-3xl border border-dashed animate-pulse flex items-center justify-center text-slate-300">
                      加载环节数据...
                    </div>
                  ))}
                </div>
              ) : Object.keys(segments).length > 0 ? (
                <div className="space-y-6 relative">
                  {/* 时间轴线 */}
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />
                  
                  {Object.keys(segments).map((moduleName, index) => {
                    const idx = segmentIndices[moduleName] || 0
                    const currentItem = segments[moduleName][idx]
                    return (
                      <div key={moduleName} className="relative pl-14 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                        {/* 环节序号 */}
                        <div className="absolute left-0 top-0 w-12 h-12 bg-white border-4 border-slate-50 rounded-2xl flex items-center justify-center shadow-md z-10">
                          <span className="text-primary font-black text-lg">{index + 1}</span>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg text-slate-800">{moduleName}</span>
                              <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold py-1 px-3">
                                版本 {idx + 1}
                              </Badge>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleShuffle(moduleName)}
                              className="rounded-full border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 gap-2 font-bold px-4 transition-all"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> 换个说法
                            </Button>
                          </div>
                          
                          <div className="bg-slate-50/80 rounded-3xl p-6 border border-slate-100 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                             <div className="flex items-center gap-2 mb-4">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Script Content</span>
                             </div>
                             <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap font-medium">
                               {getContent(currentItem)}
                             </p>
                          </div>
                          
                          <div className="flex justify-between items-center mt-6">
                             <div className="flex gap-4">
                               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                 核心名词
                               </div>
                               <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                 重读强调
                               </div>
                             </div>
                             <div className="text-[10px] font-bold text-slate-300 italic">
                               建议语速：中速 (180-200字/min)
                             </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>未检测到有效的流程数据，请检查 CSV 字段</p>
                </div>
              )}
            </div>

            {/* 右列：产品核心 (5/12) */}
            <div className="col-span-12 lg:col-span-5 space-y-8">
              {/* 产品分类选择 */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-emerald-100 p-2 rounded-xl">
                    <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">产品核心展示</h2>
                    <p className="text-xs text-slate-400 mt-0.5">选择分类快速查看对应带货话术</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {allCategories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-2xl px-5 h-10 font-bold transition-all border-slate-200 ${
                        selectedCategory === cat 
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105" 
                        : "bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {cat}
                    </Button>
                  ))}
                  {allCategories.length === 0 && (
                    <div className="text-slate-400 text-sm py-4 italic">等待数据同步...</div>
                  )}
                </div>
              </div>

              {/* 选中产品的话术详情卡片 */}
              <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden group min-h-[500px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-110" />
                
                <div className="flex items-center justify-between mb-8 relative">
                  <Badge className="bg-emerald-500 text-white border-none px-4 py-1 rounded-full font-bold shadow-sm shadow-emerald-200">
                    核心卖点话术
                  </Badge>
                </div>

                <div className="space-y-6 relative">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Script Details</span>
                  </div>
                  
                  <ScrollArea className="h-[450px] pr-6">
                    <div className="text-slate-700 leading-relaxed text-xl font-semibold whitespace-pre-wrap">
                      {categoryScripts.length > 0 ? (
                        getContent(categoryScripts[0])
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full pt-20 text-slate-300">
                          <ShoppingBag className="h-16 w-16 mb-4 opacity-10" />
                          <p className="text-sm">请在上方选择分类以刷新话术</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                  <span>Smart Live System v2.0</span>
                  <span>Data Synced via GitHub</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-500">
             <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">底层数据映射表</h2>
                    <p className="text-slate-400 mt-1 font-medium">查看从 CSV 文件中解析出的所有原始字段</p>
                  </div>
                </div>
                <DataTable data={data} />
             </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t py-6 px-10">
        <div className="flex justify-between items-center max-w-[1700px] mx-auto">
          <div className="flex items-center gap-6">
            <p className="text-xs text-slate-400 font-bold">
              © 2024 直播话术智能看板 · 自动适配 CSV 架构
            </p>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[9px] border-slate-100 text-slate-400 rounded-sm">UTF-8</Badge>
              <Badge variant="outline" className="text-[9px] border-slate-100 text-slate-400 rounded-sm">AUTO-MAPPING</Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Source Connected</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
