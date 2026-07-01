# 告警封堵页面 - 前端技术开发文档

## 1. 页面概述

| 项目 | 说明 |
|------|------|
| 路径 | `/alarm-handling/alarm-blocking`，路由名 `AlertBlock` |
| 功能 | 告警封堵统计柱状图 + 多维度筛选查询 + 封堵/解封/删除/人工封堵操作 |
| 类型 | 列表页（图表 + 筛选 + 表格 + 弹窗） |

## 2. 页面结构

```
┌─────────────────────────────────────────────────────┐
│  柱状图：告警(蓝) vs 封堵(红)，默认近7天              │  ← base-up-down #up
│─────────────────────────────────────────────────────│
│  链路[▼]  MAC[____]  IP[____]  威胁名称[▼]          │
│  攻击时间[datetimerange]  封堵时间[datetimerange]    │
│  [搜索] [重置]                                       │
│                              [配置][批量解封][人工封堵]│
│─────────────────────────────────────────────────────│
│  base-table（多选+分页）                              │  ← base-up-down 默认插槽
│  序号│链路│MAC│攻击IP│攻击次数│威胁名称│威胁等级│...   │
└─────────────────────────────────────────────────────┘

弹窗：封堵(IP+模式) │ 删除(confirm) │ 人工封堵(IP+模式，IP可编辑)
```

## 3. 图表区域

ECharts 分组柱状图，蓝色系列=告警次数，红色系列=封堵次数。接口：`GET /api/alert-block/statistics?days=7`。

```javascript
const chartOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['告警', '封堵'] },
  xAxis: { type: 'category', data: dates },
  yAxis: { type: 'value', name: '次数' },
  series: [
    { name: '告警', type: 'bar', data: alertCounts, itemStyle: { color: 'var(--color-primary)' } },
    { name: '封堵', type: 'bar', data: blockCounts, itemStyle: { color: 'var(--color-danger)' } },
  ]
}
```

## 4. 筛选栏

| 字段 | 组件 | 绑定 | 宽度 | 备注 |
|------|------|------|------|------|
| 链路 | `el-select` | `linkId` | 150px | 下拉，选项来自 `/api/common/links` |
| MAC | `el-input` | `mac` | 160px | — |
| IP | `el-input` | `ip` | 150px | — |
| 威胁名称 | `el-select` | `threatName` | 180px | 选项来自 `/api/common/threat-names` |
| 攻击时间 | `el-date-picker type="datetimerange"` | `attackTimeRange` | 320px | `value-format="yyyy/MM/dd HH:mm:ss"` |
| 封堵时间 | `el-date-picker type="datetimerange"` | `blockTimeRange` | 320px | 同上 |

搜索/重置按钮调用 `useSearch` 的 `loadData` / `resetData`。

## 5. 操作按钮栏

| 按钮 | 功能 |
|------|------|
| 配置 | 打开配置弹窗/页面 |
| 批量解封 | 对勾选的已封堵记录执行 `POST /api/alert-block/batch-unblock`，需先勾选 |
| 人工封堵 | 打开人工封堵弹窗 |

## 6. 数据表格

组件：`base-table`（项目封装），多选+分页。

### 列定义（useData.js）

| 列 | prop | 宽度 | 备注 |
|----|------|------|------|
| 序号 | `no` | 60px | fixed |
| 链路 | `linkName` | 100px | — |
| MAC | `mac` | 160px | — |
| 攻击IP | `attackIp` | 130px | — |
| 攻击次数 | `attackCount` | 100px | — |
| 威胁名称 | `threatName` | 150px | — |
| 威胁等级 | `threatLevel` | 100px | el-tag：高=danger，中=warning，低=info |
| 最新告警时间 | `alertTime` | 160px | YYYY-MM-DD HH:mm:ss |
| 状态 | `status` | 100px | el-tag：已封堵=success，未封堵=info |
| 封堵时间 | `blockTime` | 160px | 未封堵显示"-" |
| 封堵方式 | `blockMode` | 120px | 未封堵显示"-" |
| 操作 | `operation` | 180px | fixed right，`#operationDefault` 插槽 |

### 操作列

**规范**：操作列在 `useData.js` 的 `columnData` 中定义（`prop: 'operation'`, `fixed: 'right'`），通过 `#operationDefault` 插槽渲染按钮，不使用内置 `showOperate` + `#moreOperate`。

```vue
<template #operationDefault="{ data }">
  <template v-if="data.row.status === 'unblocked'">
    <el-button link type="primary" @click="handleBlock(data.$index)">封堵</el-button>
    <el-button link type="danger" @click="handleDelete(data.$index)">删除</el-button>
  </template>
  <template v-if="data.row.status === 'blocked'">
    <el-button link type="success" @click="handleUnblock(data.$index)">解封</el-button>
    <el-button link type="danger" @click="handleDelete(data.$index)">删除</el-button>
  </template>
</template>
```

### base-table 分页

Props：`showPagination`、`total`、`v-model:pageSize`、`v-model:pageNum`。

## 7. 弹窗

### 封装规范

弹窗操作封装为组件，放页面同级 `components/` 目录。组件包含触发按钮，通过 `default` 作用域插槽（`{ open }`）自定义触发主体；不提供插槽时显示默认按钮。内部通过 `useUpdate` Hook 管理显隐和表单，`@success` 事件通知父组件刷新。Expose `open(row)` 方法。

```
src/views/alarm-handling/alarm-blocking/
├── index.vue
├── hook/useData.js
└── components/
    ├── BlockDialog.vue          # 封堵弹窗
    └── ManualBlockDialog.vue    # 人工封堵弹窗
```

### 封堵弹窗（BlockDialog）

- 宽度 450px，表单：IP（`el-input`，有 rowId 时只读）+ 模式（`el-select`）
- IP 必填校验 + 模式必填校验
- 确认提交：`POST /api/alert-block/block`，参数 `{ id, ip, mode }`

### 人工封堵弹窗（ManualBlockDialog）

- 宽度 450px，表单：IP（`el-input`，可编辑）+ 模式（`el-select`）
- IP 必填 + IP 格式校验（正则）+ 模式必填校验
- 确认提交：`POST /api/alert-block/manual-block`，参数 `{ ip, mode }`

### 删除

使用 `useDelete` Hook + `ElMessageBox.confirm` 二次确认，不单独创建弹窗组件。
提交：`DELETE /api/alert-block/{id}` 或 `POST /api/alert-block/delete`。

## 8. API 接口

| 接口 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/alert-block/statistics` | GET | 柱状图统计 | `days`（默认7） |
| `/api/alert-block/list` | POST | 列表分页 | `queryParams` + `pager` |
| `/api/alert-block/block` | POST | 单条封堵 | `{ id, ip, mode }` |
| `/api/alert-block/unblock` | POST | 单条解封 | `{ id }` |
| `/api/alert-block/batch-unblock` | POST | 批量解封 | `{ ids: [] }` |
| `/api/alert-block/delete` | POST/DELETE | 删除 | `{ id }` |
| `/api/alert-block/manual-block` | POST | 人工封堵 | `{ ip, mode }` |
| `/api/alert-block/config` | GET/POST | 封堵配置 | 配置对象 |
| `/api/common/links` | GET | 链路下拉选项 | — |
| `/api/common/threat-names` | GET | 威胁名称下拉选项 | — |

## 9. Hooks 使用

所有业务逻辑基于项目 Hooks，禁止重复造轮子。

| Hook | 导出 | 本页面用途 |
|------|------|-----------|
| `useSearch` | `formData`, `tableData`, `loadData`, `resetData`, `reloadData`, `searchFormRef` | 筛选查询、分页、数据加载、重置 |
| `useDelete` | `deleteHandler`, `select`, `idList` | 单条删除（含二次确认） |
| `useUpdate` | `submit`, `openHandle`, `closeHandle`, `updateFormData`, `updateFormRef`, `updateFormRules`, `showHandle`, `rowId` | 封堵弹窗、人工封堵弹窗 |
| `useUpdateStatus` | `updateStatusHandler`, `select`, `idList` | 封堵/解封状态切换、批量解封 |

核心调用：

```javascript
// 查询
await loadData({ api: getAlertBlockList, sendData: formData })

// 单条封堵
openBlockDialog({ row: { ip: row.attackIp }, id: row.id })
await submitBlock({ addApi: blockAlert, sendData: blockFormData })

// 单条解封
await updateStatusHandler({ api: unblockAlert, hideMessageBox: false, sendData: { id: row.id } })

// 批量解封
await updateStatusHandler({ api: batchUnblockAlert, hideMessageBox: false, multiple: true, sendData: { ids: statusIdList.value } })

// 删除
await deleteHandler({ api: deleteAlert, hideMessageBox: false, sendData: { id: row.id } })
```

表格多选通过 base-table `@select` 事件获取 `{ rowList, idList }`，传递给 `useUpdateStatus.select`。

## 10. i18n 配置

文件名即命名空间：`alarm-block.json` → `$t('alarm-block.xxx')`。JSON 顶层不嵌套文件名 key。glob 自动扫描加载，无需手动注册。

**配置位置**：`apps/web-ele/src/locales/langs/{zh-CN,en-US}/alarm-block.json`

**公共文案**使用 `common.*`（取消、确认、删除等），定义在 `packages/locales/src/langs/{lang}/common.json`。

**Key 命名规范**：`alarm-block.{模块}.{字段}`，模块包括 chart / filter / table / button / dialog / status / threatLevel / blockMode / validation / datePicker。

**JS 中使用**：`import { $t } from '#/locales'`；模板中直接 `$t()`。

## 11. 注意事项

1. 筛选条件变更后，图表与表格数据同步刷新
2. 批量解封仅允许勾选已封堵记录，通过 base-table `rowSelectCondition` 控制
3. 空值统一显示"-"，可在 `useSearch` 的 `loadData` 中统一处理
4. 时间格式统一 `YYYY-MM-DD HH:mm:ss`
5. UI 组件统一 Element Plus（`el-*`），模板中无需手动导入；`ElMessage`/`ElMessageBox`/图标需手动 import
6. 页面使用Page组件插槽，表格用 `base-table`，弹窗用 `base-dialog`，布局用 `base-up-down`
7. 页面所有文案必须 i18n，禁止硬编码中文
