
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
  Box
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
  const [selectedProduct, setSelectedProduct] = React.useState<string>("")
  
  // 每个环节当前显示的话术索引（左侧流程）
  const [segmentIndices, setSegmentIndices] = React.useState<Record<string, number>>({})

  // 动态字段映射辅助函数
  const getFieldKey = React.useCallback((item: any, keywords: string[]) => {
    return Object.keys(item).find(k => keywords.some(kw => k.includes(kw)))
  }, [])

  const getField = React.useCallback((item: any, keywords: string[]) => {
    const key = getFieldKey(item, keywords)
    return key ? item[key] : null
  }, [getFieldKey])

  // 初始化布局逻辑
  const initializeLayout = React.useCallback((result: TableData[]) => {
    if (result.length > 0) {
      // 1. 尝试初始化场景
      const sceneKey = getFieldKey(result[0], ['场景', '类别', '分类'])
      if (sceneKey) {
        const scenes = Array.from(new Set(result.map(item => String(item[sceneKey])).filter(Boolean)))
        const defaultScene = scenes.find(s => s.includes('灯饰介绍')) || scenes[0]
        setSelectedScene(defaultScene)

        // 2. 尝试初始化该场景下的第一个产品
        const productKey = getFieldKey(result[0], ['产品', '名称', '标题'])
        if (productKey) {
          const products = result
            .filter(item => String(item[sceneKey]) === defaultScene)
            .map(item => String(item[productKey]))
            .filter(Boolean)
          if (products.length > 0) {
            setSelectedProduct(products[0])
          }
        }
      }
    }
  }, [getFieldKey])

  const loadData = React.useCallback(async (urlOverride?: string) => {
    setLoading(true)
    try {
      const result = await fetchFeishuData(urlOverride || csvUrl)
      setData(result)
      initializeLayout(result)
    } finally {
      setLoading(false)
    }
  }, [csvUrl, initializeLayout])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // 处理在线链接更新
  const handleUrlUpdate = () => {
    setCsvUrl(tempUrl)
    setDialogOpen(false)
    loadData(tempUrl)
  }

  // 处理本地文件上传
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
        initializeLayout(result)
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
      const module = getField(item, ['模块', '环节', '阶段']) || '通用流程'
      if (!groups[module]) groups[module] = []
      groups[module].push(item)
    })
    return groups
  }, [data, getField])

  // 计算属性：所有可用场景
  const allScenes = React.useMemo(() => {
    if (data.length === 0) return []
    const key = getFieldKey(data[0], ['场景', '类别', '分类'])
    if (!key) return []
    return Array.from(new Set(data.map(item => String(item[key])).filter(Boolean)))
  }, [data, getFieldKey])

  // 计算属性：当前场景下的所有产品
  const productsInScene = React.useMemo(() => {
    if (data.length === 0 || !selectedScene) return []
    const sceneKey = getFieldKey(data[0], ['场景', '类别', '分类'])
    const productKey = getFieldKey(data[0], ['产品', '名称', '标题'])
    if (!sceneKey || !productKey) return []
    
    return Array.from(new Set(
      data
        .filter(item => String(item[sceneKey]) === selectedScene)
        .map(item => String(item[productKey]))
        .filter(Boolean)
    ))
  }, [data, selectedScene, getFieldKey])

  // 计算属性：选中的具体话术
  const activeScript = React.useMemo(() => {
    if (data.length === 0 || !selectedScene || !selectedProduct) return null
    const sceneKey = getFieldKey(data[0], ['场景', '类别', '分类'])
    const productKey = getFieldKey(data[0], ['产品', '名称', '标题'])
    if (!sceneKey || !productKey) return null

    return data.find(item => 
      String(item[sceneKey]) === selectedScene && 
      String(item[productKey]) === selectedProduct
    )
  }, [data, selectedScene, selectedProduct, getFieldKey])

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

  // 当场景改变时，重置产品选中项
  const handleSceneChange = (scene: string) => {
    setSelectedScene(scene)
    const sceneKey = getFieldKey(data[0], ['场景', '类别', '分类'])
    const productKey = getFieldKey(data[0], ['产品', '名称', '标题'])
    const firstProduct = data.find(item => String(item[sceneKey]) === scene)?.[productKey!]
    setSelectedProduct(firstProduct ? String(firstProduct) : "")
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full bg-white hover:bg-slate-50 border-slate-200 shadow-sm">
                <Settings className="h-4 w-4 mr-2" /> 数据源设置
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>配置直播话术表数据源</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="url" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">在线链接 (URL)</TabsTrigger>
                  <TabsTrigger value="upload">本地上传 (CSV)</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">CSV 文件地址</Label>
                    <Input 
                      id="url" 
                      placeholder="请输入 CSV 文件的 https 链接" 
                      value={tempUrl} 
                      onChange={(e) => setTempUrl(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400">支持飞书导出的公共链接或 GitHub Raw 链接</p>
                  </div>
                  <Button onClick={handleUrlUpdate} className="w-full">更新链接并同步</Button>
                </TabsContent>
                <TabsContent value="upload" className="space-y-4 py-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:bg-slate-50 transition-colors cursor-pointer relative">
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-600">点击或拖拽 CSV 文件到此处</p>
                    <p className="text-[10px] text-slate-400 mt-1">仅支持 .csv 格式</p>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
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
            {/* 左侧：策略链路 */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <Layers className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">策略流程话术</h2>
                    <p className="text-xs text-slate-400 mt-0.5">根据直播阶段自动适配最优口播模板</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => loadData()} className="text-primary font-bold hover:bg-primary/5">
                  <RotateCcw className="h-4 w-4 mr-1.5" /> 随机重置
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
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />
                  
                  {Object.keys(segments).map((moduleName, index) => {
                    const idx = segmentIndices[moduleName] || 0
                    const currentItem = segments[moduleName][idx]
                    return (
                      <div key={moduleName} className="relative pl-14 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="absolute left-0 top-0 w-12 h-12 bg-white border-4 border-slate-50 rounded-2xl flex items-center justify-center shadow-md z-10">
                          <span className="text-primary font-black text-lg">{index + 1}</span>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg text-slate-800">{moduleName}</span>
                              <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold py-1 px-3 text-[10px]">
                                备选 {idx + 1}
                              </Badge>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleShuffle(moduleName)}
                              className="rounded-full border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 gap-2 font-bold px-4 transition-all"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> 换个版本
                            </Button>
                          </div>
                          
                          <div className="bg-slate-50/80 rounded-3xl p-6 border border-slate-100 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                             <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap font-medium">
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
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>未检测到有效的流程数据</p>
                </div>
              )}
            </div>

            {/* 右侧：产品核心展示（联动筛选） */}
            <div className="col-span-12 lg:col-span-5 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-emerald-100 p-2 rounded-xl">
                    <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">产品核心展示</h2>
                    <p className="text-xs text-slate-400 mt-0.5">多维联动筛选，精准获取话术</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* 第一级：场景 */}
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">直播场景 (第一级)</Label>
                    <Select value={selectedScene} onValueChange={handleSceneChange}>
                      <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 focus:ring-primary/10">
                        <SelectValue placeholder="请选择场景" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[300px]">
                        {allScenes.length > 0 ? (
                          allScenes.map(scene => (
                            <SelectItem key={scene} value={scene} className="font-semibold text-slate-600 py-2.5 cursor-pointer">
                              {scene}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">暂无场景</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 第二级：产品 */}
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">具体产品 (第二级)</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 focus:ring-primary/10">
                        <SelectValue placeholder="请选择产品" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[300px]">
                        {productsInScene.length > 0 ? (
                          productsInScene.map(prod => (
                            <SelectItem key={prod} value={prod} className="font-semibold text-slate-600 py-2.5 cursor-pointer">
                              {prod}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">该场景下暂无产品</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 核心话术展示区 */}
              <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden group min-h-[500px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-110" />
                <div className="flex items-center gap-2 mb-8 relative">
                  <Badge className="bg-emerald-500 text-white border-none px-4 py-1 rounded-full font-bold">
                    核心卖点话术
                  </Badge>
                  {selectedProduct && (
                    <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50/30 px-3 py-1 rounded-full font-bold">
                      <Box className="w-3 h-3 mr-1.5" /> {selectedProduct}
                    </Badge>
                  )}
                </div>
                
                <ScrollArea className="h-[400px] pr-6 relative">
                  <div className="text-slate-700 leading-relaxed text-xl font-semibold whitespace-pre-wrap">
                    {activeScript ? (
                      getContent(activeScript)
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full pt-20 text-slate-300">
                        <ShoppingBag className="h-16 w-16 mb-4 opacity-10" />
                        <p className="text-sm">请在上方选择场景和产品</p>
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
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">底层数据映射表</h2>
                <p className="text-slate-400 mb-10 font-medium">查看当前数据源的所有原始字段内容</p>
                <DataTable data={data} />
             </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t py-6 px-10">
        <div className="flex justify-between items-center max-w-[1700px] mx-auto text-xs text-slate-400 font-bold">
          <p>© 2024 直播话术智能看板 · 双级联动话术引擎</p>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="uppercase tracking-widest text-[10px]">Data Stream Active</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
