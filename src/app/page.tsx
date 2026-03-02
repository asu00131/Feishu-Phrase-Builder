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
  Link as LinkIcon,
  ChevronDown,
  Box,
  Clock,
  MessageSquare
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
  
  // 数据源配置状态
  const [csvUrl, setCsvUrl] = React.useState('https://raw.githubusercontent.com/asu00131/Feishu-Phrase-Builder/refs/heads/main/src/app/%E7%9B%B4%E6%92%AD%E8%AF%9D%E6%9C%AF_%E6%95%B0%E6%8D%AE%E8%A1%A8.csv')
  const [tempUrl, setTempUrl] = React.useState(csvUrl)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  // 联动筛选状态
  const [selectedScene, setSelectedScene] = React.useState<string>("")
  const [selectedItem, setSelectedItem] = React.useState<string>("")
  
  // 每个环节当前显示的话术索引（左侧流程）
  const [segmentIndices, setSegmentIndices] = React.useState<Record<string, number>>({})

  // 动态字段映射辅助函数
  const getFieldKey = React.useCallback((item: any, keywords: string[]) => {
    if (!item) return undefined
    const keys = Object.keys(item).filter(k => k !== 'id')
    // 优先完全匹配
    const exactMatch = keys.find(k => keywords.some(kw => k === kw))
    if (exactMatch) return exactMatch
    // 其次模糊匹配
    return keys.find(k => keywords.some(kw => k.includes(kw)))
  }, [])

  const getField = React.useCallback((item: any, keywords: string[]) => {
    const key = getFieldKey(item, keywords)
    return key ? item[key] : null
  }, [getFieldKey])

  // 计算属性：第一级过滤字段名称 (优先找“场景”，否则找分类，最后找第一列)
  const primaryFilterKey = React.useMemo(() => {
    if (data.length === 0) return null
    const keys = Object.keys(data[0]).filter(k => k !== 'id')
    const sceneKey = keys.find(k => k === '场景')
    if (sceneKey) return sceneKey
    const keywordMatch = keys.find(k => ['类别', '分类', '模块', '维度'].some(kw => k.includes(kw)))
    return keywordMatch || keys[0]
  }, [data])

  // 计算属性：第二级过滤字段名称 (排除掉第一级后的识别)
  const secondaryFilterKey = React.useMemo(() => {
    if (data.length === 0 || !primaryFilterKey) return null
    const keys = Object.keys(data[0]).filter(k => k !== 'id' && k !== primaryFilterKey)
    const keywordMatch = keys.find(k => ['产品', '名称', '自动序号', '序号', '时间段'].some(kw => k.includes(kw)))
    return keywordMatch || keys[0]
  }, [data, primaryFilterKey])

  // 初始化布局逻辑
  const initializeLayout = React.useCallback((result: TableData[]) => {
    if (result.length > 0 && primaryFilterKey) {
      const scenes = Array.from(new Set(result.map(item => String(item[primaryFilterKey])).filter(Boolean)))
      // 优先寻找“灯饰介绍”作为默认选中
      const defaultScene = scenes.find(s => s.includes('灯饰介绍')) || scenes[0]
      setSelectedScene(defaultScene)

      if (secondaryFilterKey) {
        const items = result
          .filter(item => String(item[primaryFilterKey]) === defaultScene)
          .map(item => String(item[secondaryFilterKey]))
          .filter(Boolean)
        if (items.length > 0) {
          setSelectedItem(items[0])
        }
      }
    }
  }, [primaryFilterKey, secondaryFilterKey])

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

  // 监听数据和字段识别变化来初始化
  React.useEffect(() => {
    if (data.length > 0 && primaryFilterKey) {
      initializeLayout(data)
    }
  }, [data, primaryFilterKey, initializeLayout])

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
      } catch (err) {
        console.error("CSV 解析失败", err)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  // 计算属性：左侧策略环节
  const segments = React.useMemo(() => {
    const groups: Record<string, TableData[]> = {}
    data.forEach(item => {
      const module = getField(item, ['话术模块', '模块', '环节', '阶段']) || '通用流程'
      if (!groups[module]) groups[module] = []
      groups[module].push(item)
    })
    return groups
  }, [data, getField])

  // 计算属性：第一级的所有可用选项
  const allScenes = React.useMemo(() => {
    if (data.length === 0 || !primaryFilterKey) return []
    return Array.from(new Set(data.map(item => String(item[primaryFilterKey])).filter(Boolean)))
  }, [data, primaryFilterKey])

  // 计算属性：当前选定下的第二级选项
  const itemsInScene = React.useMemo(() => {
    if (data.length === 0 || !selectedScene || !primaryFilterKey || !secondaryFilterKey) return []
    return Array.from(new Set(
      data
        .filter(item => String(item[primaryFilterKey]) === selectedScene)
        .map(item => String(item[secondaryFilterKey]))
        .filter(Boolean)
    ))
  }, [data, selectedScene, primaryFilterKey, secondaryFilterKey])

  // 计算属性：激活的话术
  const activeScript = React.useMemo(() => {
    if (data.length === 0 || !selectedScene || !selectedItem || !primaryFilterKey || !secondaryFilterKey) return null
    return data.find(item => 
      String(item[primaryFilterKey]) === selectedScene && 
      String(item[secondaryFilterKey]) === selectedItem
    )
  }, [data, selectedScene, selectedItem, primaryFilterKey, secondaryFilterKey])

  const handleShuffle = (module: string) => {
    const count = segments[module]?.length || 0
    if (count <= 1) return
    setSegmentIndices(prev => ({
      ...prev,
      [module]: (prev[module] !== undefined ? (prev[module] + 1) % count : 1)
    }))
  }

  const getContent = (item: any) => {
    return getField(item, ['长段话术', '政策口径', '话术', '内容', '文本', '描述']) || "暂无内容"
  }

  const handleSceneChange = (scene: string) => {
    setSelectedScene(scene)
    if (primaryFilterKey && secondaryFilterKey) {
      const firstItem = data.find(item => String(item[primaryFilterKey]) === scene)?.[secondaryFilterKey]
      setSelectedItem(firstItem ? String(firstItem) : "")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">直播话术智能看板</h1>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-slate-100/50 p-1">
              <TabsTrigger value="preview" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-semibold">
                直播预览
              </TabsTrigger>
              <TabsTrigger value="config" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-semibold">
                底层数据
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full bg-white hover:bg-slate-50 border-slate-200 shadow-sm">
                <Settings className="h-4 w-4 mr-2" /> 数据源设置
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>配置数据源</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="url" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">在线链接</TabsTrigger>
                  <TabsTrigger value="upload">本地上传</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">CSV 地址</Label>
                    <Input id="url" value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} />
                  </div>
                  <Button onClick={handleUrlUpdate} className="w-full">同步更新</Button>
                </TabsContent>
                <TabsContent value="upload" className="space-y-4 py-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:bg-slate-50 relative cursor-pointer">
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-600">点击上传 CSV</p>
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 p-8">
        {activeTab === "preview" ? (
          <div className="grid grid-cols-12 gap-8 max-w-[1700px] mx-auto">
            {/* 左侧：策略流程 */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <Layers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">策略流程话术</h2>
                    <p className="text-xs text-slate-400 mt-0.5">根据话术模块自动分类</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => loadData()} className="text-primary font-bold">
                  <RotateCcw className="h-4 w-4 mr-1.5" /> 随机重置
                </Button>
              </div>

              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-white rounded-[2.5rem] border border-slate-100" />
                  ))}
                </div>
              ) : Object.keys(segments).length > 0 ? (
                <div className="space-y-6 relative">
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/20 to-transparent" />
                  {Object.keys(segments).map((moduleName, index) => {
                    const idx = segmentIndices[moduleName] || 0
                    const currentItem = segments[moduleName][idx]
                    return (
                      <div key={moduleName} className="relative pl-14">
                        <div className="absolute left-0 top-0 w-12 h-12 bg-white border-4 border-slate-50 rounded-2xl flex items-center justify-center shadow-md z-10">
                          <span className="text-primary font-black text-lg">{index + 1}</span>
                        </div>
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg text-slate-800">{moduleName}</span>
                              <Badge variant="secondary" className="bg-primary/5 text-primary border-none py-0.5 px-3">
                                版本 {idx + 1}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleShuffle(moduleName)} className="rounded-full border-slate-200">
                              <RotateCcw className="h-3.5 w-3.5 mr-2" /> 换个版本
                            </Button>
                          </div>
                          <div className="bg-slate-50/80 rounded-3xl p-6 border border-slate-100">
                             <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">
                               {getContent(currentItem)}
                             </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400">
                  <p>未检测到话术模块数据</p>
                </div>
              )}
            </div>

            {/* 右侧：产品核心展示 (双级联动) */}
            <div className="col-span-12 lg:col-span-5 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-emerald-100 p-2 rounded-xl">
                    <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">核心展示筛选</h2>
                    <p className="text-xs text-slate-400 mt-0.5">双级联动精准定位</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* 第一级：主维度 (下拉框保持整洁) */}
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {primaryFilterKey || '第一级筛选'}
                    </Label>
                    <Select value={selectedScene} onValueChange={handleSceneChange}>
                      <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700">
                        <SelectValue placeholder="请选择场景" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {allScenes.map(scene => (
                          <SelectItem key={scene} value={scene} className="font-semibold">
                            {scene}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 第二级：次维度 (按钮集合展示) */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {secondaryFilterKey || '具体内容'}
                    </Label>
                    <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto p-1 scrollbar-hide">
                      {itemsInScene.map(item => {
                        // 寻找该条目对应的具体数据，以提取展示用的辅助字段（如时间段）
                        const representative = data.find(d => 
                          String(d[primaryFilterKey || ""]) === selectedScene && 
                          String(d[secondaryFilterKey || ""]) === item
                        );
                        const timeSegment = getField(representative, ['时间段', '时段', '分钟', '时长']);
                        const displayLabel = timeSegment ? `${item} (${timeSegment})` : item;

                        return (
                          <Button
                            key={item}
                            variant={selectedItem === item ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                            className={cn(
                              "rounded-full px-4 h-9 font-semibold transition-all border-slate-200",
                              selectedItem === item 
                                ? "shadow-md scale-105 bg-primary text-primary-foreground" 
                                : "bg-white hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            {displayLabel}
                          </Button>
                        )
                      })}
                      {itemsInScene.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-4">请先选择有效的场景维度</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 核心话术展示区 */}
              <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden min-h-[500px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full -mr-24 -mt-24" />
                <div className="flex items-center gap-2 mb-8 relative">
                  <Badge className="bg-emerald-500 text-white border-none px-4 py-1 rounded-full font-bold">
                    核心口播话术
                  </Badge>
                  {selectedItem && (
                    <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50/30 px-3 py-1 rounded-full font-bold">
                      <Box className="w-3 h-3 mr-1.5" /> {selectedItem}
                    </Badge>
                  )}
                </div>
                
                <ScrollArea className="h-[400px] pr-6 relative">
                  <div className="text-slate-700 leading-relaxed text-xl font-semibold whitespace-pre-wrap">
                    {activeScript ? (
                      <div className="space-y-6">
                        {/* 展示短句话术或时间段信息 */}
                        {(getField(activeScript, ['短句话术']) || getField(activeScript, ['时间段'])) && (
                          <div className="bg-slate-50 p-4 rounded-2xl text-base text-slate-500 border-l-4 border-primary/30">
                            {getField(activeScript, ['短句话术']) || `当前时段: ${getField(activeScript, ['时间段'])}`}
                          </div>
                        )}
                        <div>{getContent(activeScript)}</div>
                        {/* 政策口径展示 */}
                        {getField(activeScript, ['政策口径']) && (
                          <div className="mt-8 pt-6 border-t border-dashed text-sm text-emerald-600 font-bold flex items-start gap-2">
                            <Sparkles className="h-4 w-4 mt-1 shrink-0" />
                            <span>政策口径：{getField(activeScript, ['政策口径'])}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full pt-20 text-slate-300">
                        <ShoppingBag className="h-16 w-16 mb-4 opacity-10" />
                        <p className="text-sm">请在上方选择具体项以查看详情</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto">
             <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100">
                <h2 className="text-3xl font-black text-slate-800 mb-2">底层数据映射表</h2>
                <DataTable data={data} />
             </div>
          </div>
        )}
      </main>
    </div>
  )
}
