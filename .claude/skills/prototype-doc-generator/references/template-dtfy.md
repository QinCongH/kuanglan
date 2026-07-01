# 资产告警检索页面 - 前端技术开发文档

## 1. 页面概述

**页面路径：** `/security/alert/asset-alert`
**路由名称：** `AssetAlertHome`
**所属模块：** 安全告警管理
**页面功能：** 展示、查询网络资产的告警信息，支持按网口、Vlan、IP、MAC、时间等条件筛选告警资产，提供标记处置与详情查看功能。

---

## 2. 页面结构总览

```
┌───────────────────────────────────────────────────────────────────┐
│  顶部操作栏：资产告警  资产清单 导入▼ 导出 资产配置               │
├───────────────────────────────────────────────────────────────────┤
│  筛选条件栏：网口 | Vlan | IP | MAC | 时间                        │
│                                    [搜索] [重置]                  │
├───────────────────────────────────────────────────────────────────┤
│  告警资产列表                                                      │
│  ☐|编号|链路|vlan|MAC|IP|数据包|流量|最新上线时间|操作           │
│                                         (标记)(详情)               │
├───────────────────────────────────────────────────────────────────┤
│  详情（资产详情展示区）                                            │
│  ☐|编号|源IP|目的IP|协议|源端口|目的端口|数据包|流量|最新上线时间 │
├───────────────────────────────────────────────────────────────────┤
│  ⚠ 1、待定-告警  2、合规-不告警  3、威胁-告警/封堵                │
└───────────────────────────────────────────────────────────────────┘
```

---

## 3. 各区域详细设计

### 3.1 顶部操作栏

**容器：** `el-card.table-card`

#### 导航标签

| 元素 | 说明 |
|------|------|
| 资产清单 | 路由跳转至 `/security/manage-assets/assets` |
| 资产告警 | 当前页 |

#### 操作按钮

| 按钮 | 组件类型 | 交互 |
|------|----------|------|
| 导入 | `el-dropdown` | 下拉菜单：下载模板、导入 |
| 导出 | `el-button` | 导出告警数据 CSV |
| 资产配置 | `el-button` | 打开资产配置弹窗 |

---

### 3.2 筛选条件栏

**容器：** `el-card.card-p-b`

| 字段 | 组件类型 | 绑定字段 | 宽度 | i18n Key |
|------|----------|----------|------|----------|
| 网口 | `el-select` | `queryParams.ifid` | 120px | `assetAlert.filter.ifid` |
| Vlan | `el-input` | `queryParams.vlanid` | 80px | `assetAlert.filter.vlanid` |
| IP | `el-input` | `queryParams.ip` | 130px | `assetAlert.filter.ip` |
| MAC | `el-input` | `queryParams.mac` | 135px | `assetAlert.filter.mac` |
| 时间 | `el-date-picker` | `queryParams.startTime` / `queryParams.endTime` | 240px | `assetAlert.filter.time` |
| 搜索 | `el-button type="primary"` | — | — | `common.button.search` |
| 重置 | `el-button` | — | — | `common.button.reset` |

---

### 3.3 告警资产列表

**组件：** `vxe-table`

#### 表格列

| 列名 | 字段名 | 宽度 | i18n Key |
|------|--------|------|----------|
| (复选框) | — | 40px | — |
| 编号 | `no` | 80px | `assetAlert.table.no` |
| 链路 | `link` | min-width 80px | `assetAlert.table.link` |
| vlan | `vlanid` | min-width 60px | `assetAlert.table.vlanid` |
| MAC | `mac` | min-width 130px | `assetAlert.table.mac` |
| IP | `ip` | min-width 100px | `assetAlert.table.ip` |
| 数据包 | `dataPacket` | min-width 100px | `assetAlert.table.dataPacket` |
| 流量 | `flow` | min-width 100px | `assetAlert.table.flow` |
| 最新上线时间 | `lastOnlineTime` | min-width 150px | `assetAlert.table.lastOnlineTime` |
| 操作 | — | 自适应 | — |

#### 操作列

| 按钮 | 交互 |
|------|------|
| 标记 | 打开标记弹窗 |
| 详情 | 加载该资产到下方详情表格 |

---

### 3.4 资产详情展示区

**组件：** `vxe-table`

#### 标题

"详情"

#### 表格列

| 列名 | 字段名 | 宽度 | i18n Key |
|------|--------|------|----------|
| (复选框) | — | 40px | — |
| 编号 | `no` | 80px | `assetAlert.detail.no` |
| 源IP | `srcIp` | min-width 100px | `assetAlert.detail.srcIp` |
| 目的IP | `dstIp` | min-width 100px | `assetAlert.detail.dstIp` |
| 协议 | `protocol` | min-width 80px | `assetAlert.detail.protocol` |
| 源端口 | `srcPort` | min-width 80px | `assetAlert.detail.srcPort` |
| 目的端口 | `dstPort` | min-width 80px | `assetAlert.detail.dstPort` |
| 数据包 | `dataPacket` | min-width 100px | `assetAlert.detail.dataPacket` |
| 流量 | `flow` | min-width 100px | `assetAlert.detail.flow` |
| 最新上线时间 | `lastOnlineTime` | min-width 150px | `assetAlert.detail.lastOnlineTime` |

---

### 3.5 告警规则说明区

**容器：** `el-alert` 或自定义提示框
**样式：** 背景 #fffbe6，左边框 #ffc400

| 规则 | 说明 |
|------|------|
| 待定-告警 | 资产状态存疑，触发告警待确认 |
| 合规-不告警 | 资产行为符合安全规范 |
| 威胁-告警/封堵 | 资产属于威胁类，可配置处置策略 |

---

## 4. 弹窗详细设计

### 4.1 标记弹窗

**触发：** 告警列表「标记」按钮

#### 标题

"标记 [IP地址]"

#### 表单

| 字段 | 组件类型 | 绑定 | i18n Key |
|------|----------|------|----------|
| 标识 | `el-select` | `markParams.importance` | `assetAlert.dialog.mark.importance` |

#### 选项

| 值 | 名称 |
|----|------|
| 0 | 待定 |
| 1 | 合规 |
| 2 | 威胁 |

#### 按钮

| 按钮 | 样式 | i18n Key |
|------|------|----------|
| 确定 | `el-button type="primary"` | `common.button.confirm` |
| 取消 | `el-button` | `common.button.cancel` |

---

### 4.2 威胁资产处置策略弹窗

**触发：** 顶部「处置策略」按钮

#### 标题

"威胁资产处置策略"

#### 策略选项

| 选项 | 组件 |
|------|------|
| 加入黑名单 | `el-checkbox` |
| 加入封堵名单 | `el-checkbox` |
| 隔离（动态网络模式有效） | `el-checkbox` |

#### 按钮

| 按钮 | 样式 | i18n Key |
|------|------|----------|
| 确定 | `el-button type="primary"` | `common.button.confirm` |
| 取消 | `el-button` | `common.button.cancel` |

---

### 4.3 资产配置弹窗

**触发：** 顶部「资产配置」按钮

#### 标题

"资产配置"

#### 设计

当资产发现中的IP地址超过【输入框】天未标识自动删除。（1-30）

#### 校验

| 规则 |
|------|
| 必填 |
| 范围：1-30 |
| 类型：数字 |

---

## 5. API 接口清单

| 方法 | HTTP | URL | 说明 |
|------|------|-----|------|
| `alertList` | POST | `/device/alert/alert_list/{pageNum}/{pageSize}` | 分页查询告警列表 |
| `alertDetail` | POST | `/device/alert/alert_detail/{pageNum}/{pageSize}` | 查询资产详情 |
| `markAsset` | POST | `/device/alert/mark_asset` | 标记资产 |
| `threatStrategyGet` | GET | `/device/threat/strategy_get` | 获取处置策略 |
| `threatStrategySet` | POST | `/device/threat/strategy_set` | 保存处置策略 |

---

## 6. 组件清单

| 组件 | 用途 |
|------|------|
| `el-button` | 操作按钮 |
| `el-input` | 文本输入 |
| `el-select` | 下拉选择 |
| `el-date-picker` | 日期选择 |
| `el-checkbox` | 复选框 |
| `el-dialog` | 弹窗 |
| `vxe-table` | 表格 |
| `vxe-pager` | 分页 |

---

## 7. 组件化目录结构

```
src/views/
└── security/
    └── alert/
        └── asset-alert/
            ├── index.vue                    # 页面入口
            └── components/                   # 页面级组件目录
                ├── MarkDialog.vue            # 标记弹窗
                ├── ThreatStrategyDialog.vue # 威胁资产处置策略弹窗
                └── AssetConfigDialog.vue    # 资产配置弹窗
```

> **规范说明**：弹窗、公共表单等独立组件放置在页面目录同级的 `components/` 目录下，便于复用和维护。

---

## 8. 组件通信规范

| 组件 | 通信方式 | 说明 |
|------|----------|------|
| `MarkDialog` | **v-model** | 弹窗显隐 `visible`，待标记资产 `data` |
| `ThreatStrategyDialog` | **v-model** | 弹窗显隐 `visible` |
| `AssetConfigDialog` | **v-model** | 弹窗显隐 `visible`，配置数据 `config` |

### v-model 使用示例

```vue
<!-- index.vue -->
<template>
  <MarkDialog v-model="markDialogVisible" :data="selectedAsset" />
</template>

<!-- MarkDialog.vue -->
<template>
  <el-dialog :visible.sync="showVisible">...</el-dialog>
</template>
<script>
export default {
  props: {
    value: Boolean,  // v-model visible
    data: Object     // 待标记资产数据
  },
  computed: {
    showVisible: {
      get() { return this.value },
      set(val) { this.$emit('input', val) }
    }
  }
}
</script>
```

---

## 9. 接口模拟规范

未正式对接接口前，需模拟 5 条假数据用于页面效果预览：

```javascript
// mock 告警列表数据
const mockAlertList = [
  {
    id: 1,
    no: 1,
    link: 'eth0',
    vlanid: 'VLAN100',
    mac: '00:1A:2B:3C:4D:5E',
    ip: '10.10.10.8',
    dataPacket: '3/5',
    flow: '5.92kb/0kb',
    lastOnlineTime: '2024-05-20 10:30:00'
  },
  {
    id: 2,
    no: 2,
    link: 'eth1',
    vlanid: 'VLAN200',
    mac: '00:1A:2B:3C:4D:6F',
    ip: '2.2.2.9',
    dataPacket: '10/20',
    flow: '12.5kb/8.3kb',
    lastOnlineTime: '2024-05-20 09:15:00'
  },
  {
    id: 3,
    no: 3,
    link: 'eth0',
    vlanid: 'VLAN100',
    mac: '00:1A:2B:3C:4D:7A',
    ip: '192.168.1.100',
    dataPacket: '50/100',
    flow: '256kb/128kb',
    lastOnlineTime: '2024-05-20 08:45:00'
  },
  {
    id: 4,
    no: 4,
    link: 'eth2',
    vlanid: 'VLAN300',
    mac: '00:1A:2B:3C:4D:8B',
    ip: '172.16.0.50',
    dataPacket: '200/500',
    flow: '1.2mb/800kb',
    lastOnlineTime: '2024-05-20 07:30:00'
  },
  {
    id: 5,
    no: 5,
    link: 'eth1',
    vlanid: 'VLAN200',
    mac: '00:1A:2B:3C:4D:9C',
    ip: '10.0.0.25',
    dataPacket: '15/30',
    flow: '45kb/22kb',
    lastOnlineTime: '2024-05-20 06:00:00'
  }
]

// mock 详情列表数据
const mockDetailList = [
  {
    id: 1,
    no: 1,
    srcIp: '10.10.10.8',
    dstIp: '8.8.8.8',
    protocol: 'TCP',
    srcPort: '54321',
    dstPort: '443',
    dataPacket: '3/5',
    flow: '5.92kb/0kb',
    lastOnlineTime: '2024-05-20 10:30:00'
  },
  {
    id: 2,
    no: 2,
    srcIp: '2.2.2.9',
    dstIp: '1.1.1.1',
    protocol: 'UDP',
    srcPort: '12345',
    dstPort: '53',
    dataPacket: '10/20',
    flow: '12.5kb/8.3kb',
    lastOnlineTime: '2024-05-20 09:15:00'
  }
]
```

---

## 10. 路由配置

```javascript
{
  path: '/security/alert',
  children: [
    {
      path: 'asset-alert',
      name: 'AssetAlertHome',
      component: () => import('@/views/security/alert/asset-alert/index.vue')
    }
  ]
}
```

---

## 11. 主题色变量配置

所有组件颜色统一通过 CSS 变量管理，禁止硬编码色值。

### 全局主题变量定义

```scss
// src/styles/theme.scss

:root {
  // 主题色
  --color-primary: #409EFF;
  --color-primary-light: #66b1ff;
  --color-primary-dark: #3a8ee6;

  // 功能色
  --color-success: #67C23A;
  --color-warning: #E6A23C;
  --color-danger: #F56C6C;
  --color-info: #909399;

  // 文字色
  --color-text-primary: #303133;
  --color-text-regular: #606266;
  --color-text-secondary: #909399;
  --color-text-placeholder: #C0C4CC;

  // 边框色
  --color-border-base: #DCDFE6;
  --color-border-light: #E4E7ED;

  // 背景色
  --color-bg-page: #F0F2F5;
  --color-bg-card: #FFFFFF;
  --color-bg-stripe: #FAFAFA;
}
```

### 组件颜色引用对照

| 组件 | CSS 变量引用 | 硬编码（禁止） |
|------|-------------|---------------|
| 主按钮背景 | `var(--color-primary)` | ~~`#409EFF`~~ |
| 危险按钮背景 | `var(--color-danger)` | ~~`#F56C6C`~~ |
| 成功标签文字 | `var(--color-success)` | ~~`#67C23A`~~ |
| 卡片背景 | `var(--color-bg-card)` | ~~`#fff` / `#FFFFFF`~~ |
| 主文字色 | `var(--color-text-primary)` | ~~`#303133`~~ |

---

## 12. 黑白主题兼容样式

### 深色主题变量覆盖

```scss
// src/styles/theme-dark.scss

[data-theme="dark"] {
  // 主题色（深色模式下微调）
  --color-primary: #409EFF;
  --color-primary-light: #337ecc;

  // 功能色（深色模式下适当提亮）
  --color-success: #67C23A;
  --color-warning: #E6A23C;
  --color-danger: #F56C6C;

  // 文字色（深色背景下反转）
  --color-text-primary: #E5E5E5;
  --color-text-regular: #B0B0B0;
  --color-text-secondary: #808080;
  --color-text-placeholder: #595959;

  // 边框色（深色模式下加深）
  --color-border-base: #434343;
  --color-border-light: #383838;

  // 背景色（深色模式下使用暗色）
  --color-bg-page: #141414;
  --color-bg-card: #1F1F1F;
  --color-bg-stripe: #2A2A2A;
}
```

### 主题切换逻辑

```javascript
// src/utils/theme.js
export function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  localStorage.setItem('theme', theme)
}

export function getTheme() {
  return localStorage.getItem('theme') || 'light'
}
```

### 组件样式黑白主题适配示例

```vue
<template>
  <div class="asset-alert-page">
    <el-card class="filter-card">
      <!-- 筛选条件 -->
    </el-card>
    <el-card class="table-card">
      <vxe-table :data="tableData" />
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.asset-alert-page {
  background: var(--color-bg-page);
  padding: 16px;
  min-height: 100%;
}

.filter-card,
.table-card {
  background: var(--color-bg-card);
  border-color: var(--color-border-base);
  margin-bottom: 16px;
}

// vxe-table 深色适配
:deep(.vxe-table) {
  background: var(--color-bg-card);
  color: var(--color-text-regular);

  .vxe-header--row {
    background: var(--color-bg-stripe);
  }

  .vxe-body--row.row--stripe {
    background: var(--color-bg-stripe);
  }
}
</style>
```

---

## 13. 多语言配置

### i18n 文件

```javascript
// src/locales/zh-CN.js 中的资产告警模块
export default {
  assetAlert: {
    title: '资产告警',
    filter: {
      ifid: '网口',
      vlanid: 'Vlan',
      ip: 'IP',
      mac: 'MAC',
      time: '时间'
    },
    table: {
      no: '编号',
      link: '链路',
      vlanid: 'Vlan',
      mac: 'MAC',
      ip: 'IP',
      dataPacket: '数据包',
      flow: '流量',
      lastOnlineTime: '最新上线时间'
    },
    detail: {
      no: '编号',
      srcIp: '源IP',
      dstIp: '目的IP',
      protocol: '协议',
      srcPort: '源端口',
      dstPort: '目的端口',
      dataPacket: '数据包',
      flow: '流量',
      lastOnlineTime: '最新上线时间'
    },
    dialog: {
      mark: {
        importance: '标识'
      }
    }
  }
}
```

```javascript
// src/locales/en-US.js 中的资产告警模块
export default {
  assetAlert: {
    title: 'Asset Alert',
    filter: {
      ifid: 'Interface',
      vlanid: 'VLAN',
      ip: 'IP',
      mac: 'MAC',
      time: 'Time'
    },
    table: {
      no: 'No.',
      link: 'Link',
      vlanid: 'VLAN',
      mac: 'MAC',
      ip: 'IP',
      dataPacket: 'Data Packet',
      flow: 'Flow',
      lastOnlineTime: 'Last Online Time'
    },
    detail: {
      no: 'No.',
      srcIp: 'Source IP',
      dstIp: 'Destination IP',
      protocol: 'Protocol',
      srcPort: 'Source Port',
      dstPort: 'Destination Port',
      dataPacket: 'Data Packet',
      flow: 'Flow',
      lastOnlineTime: 'Last Online Time'
    },
    dialog: {
      mark: {
        importance: 'Label'
      }
    }
  }
}
```

### 模板中使用 i18n

```vue
<template>
  <div class="asset-alert-page">
    <!-- 页面标题 -->
    <h2>{{ $t('assetAlert.title') }}</h2>

    <!-- 筛选条件 -->
    <el-form :model="queryParams">
      <el-form-item :label="$t('assetAlert.filter.ip')">
        <el-input v-model="queryParams.ip" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">
          {{ $t('common.button.search') }}
        </el-button>
        <el-button @click="handleReset">
          {{ $t('common.button.reset') }}
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 表格列 -->
    <vxe-table :data="tableData">
      <vxe-column field="ip" :title="$t('assetAlert.table.ip')" />
      <vxe-column field="mac" :title="$t('assetAlert.table.mac')" />
    </vxe-table>
  </div>
</template>
```
