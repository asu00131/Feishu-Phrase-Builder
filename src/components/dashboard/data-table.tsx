"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { TableData, SortConfig } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface DataTableProps {
  data: TableData[]
}

export function DataTable({ data }: DataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 5

  const handleSort = (key: keyof TableData) => {
    let direction: 'asc' | 'desc' | null = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null
    }
    setSortConfig({ key, direction })
  }

  const filteredData = React.useMemo(() => {
    return data.filter((item) =>
      Object.values(item).some((val) =>
        val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [data, searchTerm])

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredData, sortConfig])

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedData.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedData, currentPage])

  const totalPages = Math.ceil(sortedData.length / itemsPerPage)

  const getStatusBadge = (status: TableData['status']) => {
    const variants: Record<string, string> = {
      '进行中': 'bg-blue-100 text-blue-800 border-blue-200',
      '已完成': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      '未开始': 'bg-slate-100 text-slate-800 border-slate-200',
      '延迟': 'bg-rose-100 text-rose-800 border-rose-200',
    }
    return <Badge className={`${variants[status] || ''} font-normal border shadow-none`}>{status}</Badge>
  }

  const getPriorityBadge = (priority: TableData['priority']) => {
    const variants: Record<string, string> = {
      '高': 'text-rose-500',
      '中': 'text-amber-500',
      '低': 'text-slate-400',
    }
    return <span className={`${variants[priority]} font-semibold`}>● {priority}</span>
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索项目、负责人..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="hidden md:flex gap-2">
             <Filter className="h-4 w-4" /> 筛选
           </Button>
           <Button variant="outline" size="sm" className="hidden md:flex gap-2">
             导出
           </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[250px]">
                <button
                  onClick={() => handleSort('projectName')}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  项目名称
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>负责人</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>
                 <button
                  onClick={() => handleSort('priority')}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  优先级
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="min-w-[150px]">进度</TableHead>
              <TableHead className="text-right">截止日期</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-900">{row.projectName}</TableCell>
                  <TableCell>{row.owner}</TableCell>
                  <TableCell>{getStatusBadge(row.status)}</TableCell>
                  <TableCell>{getPriorityBadge(row.priority)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress value={row.progress} className="h-2 w-full" />
                      <span className="text-xs text-muted-foreground w-8">{row.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-500 font-mono text-xs">{row.endDate}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                   未找到匹配的数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4 px-2">
        <div className="text-sm text-muted-foreground">
          显示 {sortedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} 至 {Math.min(currentPage * itemsPerPage, sortedData.length)} 项，共 {sortedData.length} 项
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> 上一页
          </Button>
          <div className="flex items-center gap-1">
             {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
               <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setCurrentPage(page)}
               >
                 {page}
               </Button>
             ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            下一页 <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}