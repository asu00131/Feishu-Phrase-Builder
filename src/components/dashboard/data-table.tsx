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
  Search, 
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react"
import { TableData, SortConfig } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface DataTableProps {
  data: TableData[]
}

export function DataTable({ data }: DataTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // 动态获取表头（排除 id）
  const headers = React.useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0]).filter(key => key !== 'id')
  }, [data])

  const handleSort = (key: string) => {
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
        val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [data, searchTerm])

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!] || ""
      const bValue = b[sortConfig.key!] || ""

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

  const renderCellContent = (key: string, value: any) => {
    // 针对“状态”列的特殊渲染
    if (key.includes('状态') || key.includes('Status')) {
      const variants: Record<string, string> = {
        '启用': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        '停用': 'bg-rose-100 text-rose-800 border-rose-200',
        '进行中': 'bg-blue-100 text-blue-800 border-blue-200',
      }
      return <Badge className={`${variants[value] || 'bg-slate-100'} font-normal border shadow-none`}>{value}</Badge>
    }
    return <span className="text-slate-600 line-clamp-2">{value}</span>
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="在数据表中搜索..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 bg-white border-slate-200 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="flex gap-2 text-slate-600 border-slate-200">
             <Filter className="h-4 w-4" /> 筛选
           </Button>
           <Button variant="outline" size="sm" className="flex gap-2 text-slate-600 border-slate-200">
             <Download className="h-4 w-4" /> 导出 CSV
           </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-slate-200">
              {headers.map((header) => (
                <TableHead key={header} className="font-semibold whitespace-nowrap">
                  <button
                    onClick={() => handleSort(header)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    {header}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                  {headers.map((header) => (
                    <TableCell key={header} className="py-4">
                      {renderCellContent(header, row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length} className="h-48 text-center text-muted-foreground bg-slate-50/30">
                   未找到匹配的数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4 px-2">
        <div className="text-sm text-slate-500">
          共 <span className="font-semibold text-slate-900">{sortedData.length}</span> 条记录
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="text-slate-600"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
          </Button>
          <div className="text-sm font-medium text-slate-600">
            第 {currentPage} 页 / 共 {totalPages || 1} 页
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="text-slate-600"
          >
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
