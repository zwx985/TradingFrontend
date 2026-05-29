<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAllList,
  addTrade,
  updateTrade,
  deleteTrade,
  searchTrade,
  getToday,
  type TradeRecord,
  type SearchBody,
  type MaxCumulativeProfit,
  type MaxDailyProfit,
  type MaxSubarrayProfit,
} from '@/api/trade'

// 表格数据
const tableData = ref<TradeRecord[]>([])
const loading = ref(false)
const isSearchMode = ref(false)

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 统计数据
const totalCount = ref(0)
const totalAmount = ref('0.00')
const todayAmount = ref<string | null>(null)
const maxCumulativeProfit = ref<MaxCumulativeProfit | null>(null)
const maxDailyProfit = ref<MaxDailyProfit | null>(null)
const maxSubarrayProfit = ref<MaxSubarrayProfit | null>(null)

// 搜索表单
const searchForm = ref({
  amount: '',
  createTime: '',
})

// 排序状态
const sortState = ref({
  amountSort: '',
  createTimeSort: '',
  updateTimeSort: '',
})

// 弹窗控制
const dialogVisible = ref(false)
const dialogTitle = ref('新增交易')
const isEdit = ref(false)

// 表单数据
const form = ref({
  id: '',
  amount: '',
  createTime: '',
})
const formRef = ref<any>(null)

// 表单校验规则
const rules = {
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
}

// 获取统计数据
async function fetchStats() {
  try {
    const res = await getAllList()
    if (res.data.success) {
      totalCount.value = res.data.data.totalCount
      totalAmount.value = res.data.data.totalAmount
      maxCumulativeProfit.value = res.data.data.maxCumulativeProfit
      maxDailyProfit.value = res.data.data.maxDailyProfit
      maxSubarrayProfit.value = res.data.data.maxSubarrayProfit
    }
  } catch {
    // ignore
  }
}

// 获取表格数据（统一走 search，支持排序和分页）
async function fetchTableData(searchParams: any = {}) {
  loading.value = true
  try {
    const request: SearchBody = { ...searchParams }
    if (sortState.value.amountSort) request.amountSort = sortState.value.amountSort
    if (sortState.value.createTimeSort) request.createTimeSort = sortState.value.createTimeSort
    if (sortState.value.updateTimeSort) request.updateTimeSort = sortState.value.updateTimeSort

    const res = await searchTrade({
      request,
      pageIndex: currentPage.value,
      pageSize: pageSize.value,
    })
    if (res.data.success) {
      tableData.value = res.data.data.records
      total.value = res.data.data.total
    } else {
      ElMessage.error(res.data.message || '查询失败')
    }
  } catch {
    ElMessage.error('网络错误，请检查后端是否启动')
  } finally {
    loading.value = false
  }
}

// 查询全部数据（含统计）
async function fetchData() {
  isSearchMode.value = false
  currentPage.value = 1
  await fetchStats()
  await fetchTableData()
}

// 查询当日数据
async function fetchToday() {
  try {
    const res = await getToday()
    if (res.data.success && res.data.data) {
      todayAmount.value = res.data.data.amount
    } else {
      todayAmount.value = null
    }
  } catch {
    todayAmount.value = null
  }
}

// 切换排序
function toggleSort(field: 'amountSort' | 'createTimeSort' | 'updateTimeSort') {
  const current = sortState.value[field]
  // 重置所有排序字段
  sortState.value = { amountSort: '', createTimeSort: '', updateTimeSort: '' }
  if (current === '') {
    sortState.value[field] = 'asc'
  } else if (current === 'asc') {
    sortState.value[field] = 'desc'
  } else {
    sortState.value[field] = ''
  }

  if (isSearchMode.value) {
    handleSearch()
  } else {
    fetchData()
  }
}

// 搜索
async function handleSearch() {
  isSearchMode.value = true
  currentPage.value = 1
  const params: any = {}
  if (searchForm.value.amount) params.amount = searchForm.value.amount
  if (searchForm.value.createTime) params.createTime = searchForm.value.createTime
  await fetchTableData(params)
}

// 页码切换
async function handleCurrentChange(page: number) {
  currentPage.value = page
  await reloadTable()
}

// 每页条数切换
async function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  await reloadTable()
}

// 统一重新加载表格数据
async function reloadTable() {
  if (isSearchMode.value) {
    const params: any = {}
    if (searchForm.value.amount) params.amount = searchForm.value.amount
    if (searchForm.value.createTime) params.createTime = searchForm.value.createTime
    await fetchTableData(params)
  } else {
    await fetchTableData()
  }
}

// 重置搜索
function resetSearch() {
  searchForm.value = { amount: '', createTime: '' }
  sortState.value = { amountSort: '', createTimeSort: '', updateTimeSort: '' }
  currentPage.value = 1
  fetchData()
}

// 打开新增弹窗
function openAdd() {
  isEdit.value = false
  dialogTitle.value = '新增交易'
  form.value = { id: '', amount: '', createTime: '' }
  dialogVisible.value = true
}

// 打开编辑弹窗
function openEdit(row: TradeRecord) {
  isEdit.value = true
  dialogTitle.value = '编辑交易'
  form.value = {
    id: row.id,
    amount: row.amount,
    createTime: row.createTime,
  }
  dialogVisible.value = true
}

// 提交表单
async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  try {
    if (isEdit.value) {
      const res = await updateTrade({ id: form.value.id, amount: form.value.amount })
      if (res.data.success) {
        ElMessage.success('修改成功')
        dialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(res.data.message || '修改失败')
      }
    } else {
      const data: any = { amount: form.value.amount }
      if (form.value.createTime) {
        data.createTime = form.value.createTime
      }
      const res = await addTrade(data)
      if (res.data.success) {
        ElMessage.success('新增成功')
        dialogVisible.value = false
        fetchData()
        fetchToday()
      } else {
        ElMessage.error(res.data.message || '新增失败')
      }
    }
  } catch {
    ElMessage.error('网络错误')
  }
}

// 删除
async function handleDelete(row: TradeRecord) {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' })
    const res = await deleteTrade(row.id)
    if (res.data.success) {
      ElMessage.success('删除成功')
      fetchData()
    } else {
      ElMessage.error(res.data.message || '删除失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchData()
  fetchToday()
})
</script>

<template>
  <div class="trade-manager">
    <h1>交易记录管理</h1>
    <el-alert
      title="提示：所有交易金额均来源于微信消息记录，与实际所得可能存在偏差，仅供参考。"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <!-- 统计卡片 -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-label">总条数</div>
        <div class="stat-value">{{ totalCount }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">赚取总金额</div>
        <div class="stat-value">{{ totalAmount }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">当日金额</div>
        <div class="stat-value">{{ todayAmount ?? '-' }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">历史最高累计</div>
        <div class="stat-value">{{ maxCumulativeProfit?.amount ?? '-' }}</div>
        <div v-if="maxCumulativeProfit?.date" class="stat-sublabel">{{ maxCumulativeProfit.date }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">单日最高</div>
        <div class="stat-value">{{ maxDailyProfit?.amount ?? '-' }}</div>
        <div v-if="maxDailyProfit?.date" class="stat-sublabel">{{ maxDailyProfit.date }}</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-label">连续区间最高</div>
        <div class="stat-value">{{ maxSubarrayProfit?.amount ?? '-' }}</div>
        <div v-if="maxSubarrayProfit?.startDate && maxSubarrayProfit?.endDate" class="stat-sublabel">
          {{ maxSubarrayProfit.startDate }} ~ {{ maxSubarrayProfit.endDate }}
        </div>
      </el-card>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="金额">
          <el-input v-model="searchForm.amount" placeholder="请输入金额" clearable />
        </el-form-item>
        <el-form-item label="创建日期">
          <el-date-picker
            v-model="searchForm.createTime"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <div class="toolbar">
      <el-button type="primary" @click="openAdd">+ 新增交易</el-button>
      <el-button @click="fetchData">刷新</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" v-loading="loading" border style="width: 100%">
      <el-table-column prop="amount" min-width="140">
        <template #header>
          <span class="sortable-header" @click="toggleSort('amountSort')">
            金额
            <span v-if="sortState.amountSort === 'asc'" class="sort-icon">▲</span>
            <span v-else-if="sortState.amountSort === 'desc'" class="sort-icon">▼</span>
            <span v-else class="sort-icon inactive">⇅</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" min-width="160">
        <template #header>
          <span class="sortable-header" @click="toggleSort('createTimeSort')">
            创建日期
            <span v-if="sortState.createTimeSort === 'asc'" class="sort-icon">▲</span>
            <span v-else-if="sortState.createTimeSort === 'desc'" class="sort-icon">▼</span>
            <span v-else class="sort-icon inactive">⇅</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" min-width="160">
        <template #header>
          <span class="sortable-header" @click="toggleSort('updateTimeSort')">
            更新日期
            <span v-if="sortState.updateTimeSort === 'asc'" class="sort-icon">▲</span>
            <span v-else-if="sortState.updateTimeSort === 'desc'" class="sort-icon">▼</span>
            <span v-else class="sort-icon inactive">⇅</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

        <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[10, 20, 50]"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
      style="margin-top: 16px; justify-content: flex-end"
    />

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="金额" prop="amount">
          <el-input v-model="form.amount" placeholder="请输入金额" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="创建日期">
          <el-date-picker
            v-model="form.createTime"
            type="date"
            placeholder="留空默认为今天"
            value-format="YYYY-MM-DD"
            clearable
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.trade-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-sublabel {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.search-card {
  margin-bottom: 16px;
}

.toolbar {
  margin-bottom: 16px;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sort-icon {
  font-size: 12px;
  color: #409eff;
}

.sort-icon.inactive {
  color: #c0c4cc;
}
</style>
