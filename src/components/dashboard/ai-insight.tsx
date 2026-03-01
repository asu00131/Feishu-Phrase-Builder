"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, X, RefreshCw } from "lucide-react"
import { dataInsightSummary } from "@/ai/flows/data-insight-summary-flow"
import { TableData } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AIInsightProps {
  currentData: TableData[]
}

export function AIInsight({ currentData }: AIInsightProps) {
  const [insight, setInsight] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  const generateInsight = async () => {
    if (currentData.length === 0) return
    
    setIsLoading(true)
    setIsOpen(true)
    try {
      const result = await dataInsightSummary({ data: currentData })
      setInsight(result.summary)
    } catch (error) {
      console.error("AI Insight failed:", error)
      setInsight("无法生成洞察，请稍后再试。")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button 
        onClick={generateInsight}
        className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium flex items-center gap-2 shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95"
      >
        <Sparkles className="h-4 w-4" />
        AI 数据洞察
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-xl shadow-2xl border-primary/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">智能数据分析</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-muted-foreground animate-pulse">正在深度分析当前表格数据...</p>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    <div className="flex justify-end mb-4">
                        <Button variant="outline" size="sm" onClick={generateInsight} className="text-xs h-7 gap-1">
                            <RefreshCw className="h-3 w-3" /> 重新分析
                        </Button>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {insight}
                    </p>
                  </div>
                )}
              </ScrollArea>
              {!isLoading && (
                <div className="p-4 bg-slate-50 border-t text-center">
                   <p className="text-[10px] text-muted-foreground">AI 洞察基于当前显示的表格数据生成。结果仅供参考。</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}