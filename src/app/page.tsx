
"use client"

import * as React from "react"
import { fetchFeishuData, parseCSVContent } from "@/lib/mock-data"
import { TableData } from "@/lib/types"
import { 
  RefreshCcw, 
  RotateCcw,
  Layers,
  ShoppingBag,
  Sparkles,
  Settings,
  Upload,
  ChevronDown,
  Box,
  MessageSquare,
  User,
  Mic2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DataTable } from "@/components/dashboard/data-table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const [data, setData] = React.useState<TableData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("preview")
  
  // Refs for smooth scrolling
  const scriptAreaRef = React.useRef<HTMLDivElement>(null)
  const qaDetailRef = React.useRef<HTMLDivElement>(null)

  // Data source config
  const [csvUrl, setCsvUrl] = React.useState('https://raw.githubusercontent.com/asu00131/Feishu-Phrase-Builder/refs/heads/main/src/app/%E7%9B%B4%E6%92%AD%E8%AF%9D%E6%9C%AF_%E6%95%B0%E6%8D%AE%E8%A1%A8.csv')
  const [tempUrl, setTempUrl] = React.useState(csvUrl)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  // Independent States for Core Pitch (Right Panel)
  const [selectedScene, setSelectedScene] = React.useState<string>("")
  const [selectedItem, setSelectedItem] = React.useState<string>("")

  // Independent States for QA (Left Panel Bottom)
  const [selectedQACategory, setSelectedQACategory] = React.useState<string>("")
  const [selectedQAId, setSelectedQAId] = React.useState<string>("")
  
  // Left Strategy Process State
  const [segmentIndices, setSegmentIndices] = React.useState<Record<string, number>>({})

  // --- Dynamic Field Mapping Helpers ---

  const getFieldKey = React.useCallback((item: any, keywords: string[], exclude: string[] = []) => {
    if (!item) return undefined
    const keys = Object.keys(item).filter(k => k !== 'id' && !exclude.some(ex => k.includes(ex)))
    const exactMatch = keys.find(k => keywords.some(kw => k === kw))
    if (exactMatch) return exactMatch
    return keys.find(k => keywords.some(kw => k.includes(kw)))
  }, [])

  const getField = React.useCallback((item: any, keywords: string[], exclude: string[] = []) => {
    const key = getFieldKey(item, keywords, exclude)
    return key ? item[key] : null
  }, [getFieldKey])

  // --- Logic for Core Pitch (Right Panel) ---

  const primaryFilterKey = React.useMemo(() => {
    if (data.length === 0) return null
    const keys = Object.keys(data[0]).filter(k => k !== 'id' && !k.includes('提问') && !k.includes('回答'))
    const sceneKey = keys.find(k => k === '场景')
    if (sceneKey) return sceneKey
    const keywordMatch = keys.find(k => ['类别', '分类', '模块'].some(kw => k.includes(kw)))
    return keywordMatch || keys[0]
  }, [data])

  const secondaryFilterKey = React.useMemo(() => {
    if (data.length === 0 || !primaryFilterKey) return null
    const keys = Object.keys(data[0]).filter(k => k !== 'id' && k !== primaryFilterKey && !k.includes('提问') && !k.includes('回答'))
    const keywordMatch = keys.find(k => ['产品', '名称', '自动序号'].some(kw => k.includes(kw)))
    return keywordMatch || keys[0]
  }, [data, primaryFilterKey])

  // --- Logic for QA Section (Left Panel Bottom) ---

  const qaCategoryKey = React.useMemo(() => {
    if (data.length === 0) return null
    const keys = Object.keys(data[0])
    return keys.find(k => k === '提问类型') || keys.find(k => k.includes('提问类型')) || null
  }, [data])

  const qaIdKey = "自动序号"

  const qaQuestionKey = React.useMemo(() => {
    if (data.length === 0) return null
    const keys = Object.keys(data[0])
    // Strictly find "提问" or "具体问题", avoiding "提问类型"
    return keys.find(k => k === '提问') || keys.find(k => k === '具体问题') || keys.find(k => k.includes('提问') && !k.includes('类型')) || null
  }, [data])

  const qaAnswerKey = React.useMemo(() => {
    if (data.length === 0) return null
    const keys = Object.keys(data[0])
    return keys.find(k => k === '回答') || keys.find(k => k === '答案') || keys.find(k => k === '内容') || keys.find(k => k.includes('回答')) || null
  }, [data])

  // --- Initialization Logic ---

  const initializeLayout = React.useCallback((result: TableData[]) => {
    if (result.length > 0) {
      // Core Pitch Init
      if (primaryFilterKey) {
        const scenes = Array.from(new Set(result.map(item => String(item[primaryFilterKey])).filter(Boolean)))
        const defaultScene = scenes.find(s => s.includes('灯饰介绍')) || scenes[0]
        setSelectedScene(defaultScene)
        if (secondaryFilterKey) {
          const firstItem = result.find(item => String(item[primaryFilterKey]) === defaultScene)?.[secondaryFilterKey]
          setSelectedItem(firstItem ? String(firstItem) : "")
        }
      }
      // QA Init
      if (qaCategoryKey) {
        const categories = Array.from(new Set(result.map(item => String(item[qaCategoryKey || ""])).filter(Boolean)))
        if (categories.length > 0) {
          setSelectedQACategory(categories[0])
          const firstQA = result.find(item => String(item[qaCategoryKey || ""]) === categories[0])?.[qaIdKey]
          setSelectedQAId(firstQA ? String(firstQA) : "")
        }
      }
    }
  }, [primaryFilterKey, secondaryFilterKey, qaCategoryKey])

  const loadData = React.useCallback(async (urlOverride?: string) => {
    setLoading(true)
    try {
      const result = await fetchFeishuData(urlOverride || csvUrl)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [csvUrl])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  React.useEffect(() => {
    if (data.length > 0) {
      initializeLayout(data)
    }
  }, [data, initializeLayout])

  // --- UI Handlers ---

  const handleUrlUpdate = () => {
    setCsvUrl(tempUrl)
    setDialogOpen(false)
    loadData(tempUrl)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      try {
        const result = parseCSVContent(text)
        setData(result)
        setDialogOpen(false)
      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
    reader.readAsText(file)
  }

  // --- Computed Views ---

  const strategySegments = React.useMemo(() => {
    const groups: Record<string, TableData[]> = {}
    data.forEach(item => {
      const module = getField(item, ['话术模块', '环节', '阶段']) || '通用流程'
      if (!groups[module]) groups[module] = []
      groups[module].push(item)
    })
    return groups
  }, [data, getField])

  const pitchScenes = React.useMemo(() => {
    if (!primaryFilterKey) return []
    return Array.from(new Set(data.map(item => String(item[primaryFilterKey])).filter(Boolean)))
  }, [data, primaryFilterKey])

  const pitchItems = React.useMemo(() => {
    if (!selectedScene || !primaryFilterKey || !secondaryFilterKey) return []
    return Array.from(new Set(
      data.filter(item => String(item[primaryFilterKey]) === selectedScene)
          .map(item => String(item[secondaryFilterKey])).filter(Boolean)
    ))
  }, [data, selectedScene, primaryFilterKey, secondaryFilterKey])

  const activePitchScript = React.useMemo(() => {
    if (!selectedScene || !selectedItem || !primaryFilterKey || !secondaryFilterKey) return null
    return data.find(item => 
      String(item[primaryFilterKey]) === selectedScene && String(item[secondaryFilterKey]) === selectedItem
    )
  }, [data, selectedScene, selectedItem, primaryFilterKey, secondaryFilterKey])

  // QA Computed
  const qaCategories = React.useMemo(() => {
    if (!qaCategoryKey) return []
    return Array.from(new Set(data.map(item => String(item[qaCategoryKey || ""])).filter(Boolean)))
  }, [data, qaCategoryKey])

  const qaItems = React.useMemo(() => {
    if (!selectedQACategory || !qaCategoryKey) return []
    return data.filter(item => String(item[qaCategoryKey || ""]) === selectedQACategory)
  }, [data, selectedQACategory, qaCategoryKey])

  const activeQAScript = React.useMemo(() => {
    if (!selectedQAId) return null
    return data.find(item => String(item[qaIdKey]) === selectedQAId)
  }, [data, selectedQAId])

  const handleShuffleProcess = (module: string) => {
    const count = strategySegments[module]?.length || 0
    if (count <= 1) return
    setSegmentIndices(prev => ({ ...prev, [module]: ((prev[module] || 0) + 1) % count }))
  }

  const handlePitchItemClick = (item: string) => {
    setSelectedItem(item)
    scriptAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleQAItemClick = (id: string) => {
    setSelectedQAId(id)
    qaDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden sm:block">
            <TabsList className="bg-slate-100/50 p-1">
              <TabsTrigger value="preview" onClick={scrollToTop} className="px-6 font-semibold">直播预览</TabsTrigger>
              <TabsTrigger value="config" onClick={scrollToTop} className="px-6 font-semibold">底层数据</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full shadow-sm">
                <Settings className="h-4 w-4 mr-2" /> <span className="hidden xs:inline">数据源设置</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>配置数据源</DialogTitle></DialogHeader>
              <Tabs defaultValue="url" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">在线链接</TabsTrigger>
                  <TabsTrigger value="upload">本地上传</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4 py-4">
                  <Input value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} placeholder="CSV URL" />
                  <Button onClick={handleUrlUpdate} className="w-full">同步更新</Button>
                </TabsContent>
                <TabsContent value="upload" className="space-y-4 py-4">
                  <div className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center relative">
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm">点击上传 CSV</p>
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        {activeTab === "preview" ? (
          <div className="grid grid-cols-12 gap-6 max-w-[1700px] mx-auto">
            
            {/* Left Column: Process & QA */}
            <div className="col-span-12 lg:col-span-7 space-y-10">
              
              {/* Strategy Process */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-xl"><Layers className="h-5 w-5 text-blue-600" /></div>
                    <h2 className="text-xl font-bold text-slate-800">策略流程话术</h2>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => loadData()} className="text-primary"><RotateCcw className="h-4 w-4 mr-1.5" /> 随机重置</Button>
                </div>
                {loading ? <div className="h-32 bg-white rounded-3xl animate-pulse" /> : 
                  <div className="space-y-4 relative">
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-100" />
                    {Object.keys(strategySegments).map((module, i) => {
                      const idx = segmentIndices[module] || 0
                      const item = strategySegments[module][idx]
                      return (
                        <div key={module} className="relative pl-14">
                          <div className="absolute left-0 top-0 w-12 h-12 bg-white border-2 border-slate-50 rounded-2xl flex items-center justify-center shadow-sm z-10 text-primary font-bold">{i+1}</div>
                          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-bold text-slate-800">{module} <Badge variant="secondary" className="ml-2 font-normal">v{idx+1}</Badge></span>
                              <Button variant="outline" size="sm" onClick={() => handleShuffleProcess(module)} className="h-8 rounded-full text-xs">换个版本</Button>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 text-slate-700 leading-relaxed whitespace-pre-wrap">{getField(item, ['长段话术', '内容', '文本']) || "暂无内容"}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                }
              </section>

              {/* QA Section - Improved with compression and dialogue style */}
              <section className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-3 px-2">
                  <div className="bg-amber-100 p-2 rounded-xl"><MessageSquare className="h-5 w-5 text-amber-600" /></div>
                  <h2 className="text-xl font-bold text-slate-800">常见提问答疑</h2>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">问题分类</Label>
                      <Select value={selectedQACategory} onValueChange={setSelectedQACategory}>
                        <SelectTrigger className="rounded-xl h-10 font-bold border-slate-200"><SelectValue placeholder="选择类型" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {qaCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">点击选择具体问题</Label>
                    <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto p-1 scrollbar-hide">
                      {qaItems.map(item => {
                        const id = String(item[qaIdKey] || "")
                        const question = String(item[qaQuestionKey || ""] || "").substring(0, 15)
                        return (
                          <Button
                            key={id}
                            variant={selectedQAId === id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleQAItemClick(id)}
                            className={cn(
                              "rounded-full px-3 h-8 text-xs font-semibold transition-all border-slate-200",
                              selectedQAId === id ? "bg-amber-600 text-white shadow-md" : "bg-white text-slate-600"
                            )}
                          >
                            {id} {question ? `(${question}...)` : ""}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* QA Dialogue Area - Extremely compressed */}
                  <div ref={qaDetailRef} className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100 space-y-3">
                    {activeQAScript ? (
                      <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm">Q</div>
                          <div className="bg-amber-100/50 p-3 rounded-2xl rounded-tl-none border border-amber-200/50 flex-1">
                            <p className="text-amber-900 text-sm font-bold leading-snug">{String(activeQAScript[qaQuestionKey || ""] || "未知提问")}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm">A</div>
                          <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 flex-1 shadow-sm">
                            <p className="text-slate-700 text-base font-semibold leading-relaxed whitespace-pre-wrap">{String(activeQAScript[qaAnswerKey || ""] || "暂无对策")}</p>
                            {activeQAScript["政策口径"] && (
                              <div className="mt-2 pt-2 border-t border-dashed border-slate-100 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                <Mic2 className="w-3 h-3" /> 政策：{activeQAScript["政策口径"]}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-300 text-sm">请在上方选择具体问题</div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Product Core Pitch */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-emerald-100 p-2 rounded-xl"><ShoppingBag className="h-5 w-5 text-emerald-600" /></div>
                  <h2 className="text-xl font-bold text-slate-800">核心话术筛选</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{primaryFilterKey || '分类'}</Label>
                    <Select value={selectedScene} onValueChange={setSelectedScene}>
                      <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {pitchScenes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{secondaryFilterKey || '产品'}</Label>
                    <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-1 scrollbar-hide">
                      {pitchItems.map(item => (
                        <Button
                          key={item}
                          variant={selectedItem === item ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePitchItemClick(item)}
                          className={cn(
                            "rounded-full px-4 h-9 font-semibold transition-all border-slate-200",
                            selectedItem === item ? "bg-primary text-white shadow-md scale-105" : "bg-white text-slate-600"
                          )}
                        >
                          {item}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pitch Display Card */}
              <div ref={scriptAreaRef} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 min-h-[400px]">
                <div className="flex items-center gap-2 mb-6">
                  <Badge className="bg-emerald-500 text-white border-none px-4 py-1 rounded-full font-bold">核心讲解话术</Badge>
                  {selectedItem && <Badge variant="outline" className="border-emerald-200 text-emerald-600 px-3 py-1 rounded-full">{selectedItem}</Badge>}
                </div>
                
                <div className="text-slate-700 leading-relaxed text-lg font-semibold whitespace-pre-wrap">
                  {activePitchScript ? (
                    <div className="space-y-6">
                      {(activePitchScript["短句话术"] || activePitchScript["时间段"]) && (
                        <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-500 border-l-4 border-primary/50">
                          {activePitchScript["短句话术"] || `推荐时段: ${activePitchScript["时间段"]}`}
                        </div>
                      )}
                      <div>{getField(activePitchScript, ['长段话术', '内容', '文本']) || "未检测到讲解话术字段"}</div>
                      {activePitchScript["政策口径"] && (
                        <div className="mt-6 pt-4 border-t border-dashed text-sm text-emerald-600 font-bold flex items-start gap-2">
                          <Mic2 className="h-4 w-4 mt-1 shrink-0" />
                          <span>政策提示：{activePitchScript["政策口径"]}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                      <ShoppingBag className="h-12 w-12 mb-4 opacity-10" />
                      <p className="text-sm">请选择具体产品以查看详情</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto">
             <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <DataTable data={data} />
             </div>
          </div>
        )}
      </main>
    </div>
  )
}
