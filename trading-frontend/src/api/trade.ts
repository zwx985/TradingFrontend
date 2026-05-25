import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export interface TradeRecord {
  id: string
  amount: string
  createTime: string
  updateTime: string
}

export interface TradeAllListResponse {
  totalCount: number
  totalAmount: string
  records: TradeRecord[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
  code: string | null
}

export function getAllList() {
  return request.get<ApiResponse<TradeAllListResponse>>('/v1/trade-project/all-list')
}

export function addTrade(data: { amount: string; createTime?: string }) {
  return request.post<ApiResponse<string>>('/v1/trade-project/add', data)
}

export function updateTrade(data: { id: string; amount: string }) {
  return request.post<ApiResponse<string>>('/v1/trade-project/update', data)
}

export function deleteTrade(id: string) {
  return request.delete<ApiResponse<void>>(`/v1/trade-project/${id}`)
}

export function searchTrade(params: {
  id?: string
  amount?: string
  createTime?: string
  amountSort?: string
  createTimeSort?: string
  updateTimeSort?: string
}) {
  return request.post<ApiResponse<TradeRecord[]>>('/v1/trade-project/search', params)
}

export function getToday() {
  return request.get<ApiResponse<TradeRecord>>('/v1/trade-project/today')
}
