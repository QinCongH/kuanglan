---
name: prototype-doc-generator
description: 原型图片功能点识别与文档生成；通过AI分析原型图自动识别功能模块、分类整理功能点，输出结构化产品文档与前端开发文档（含多语言i18n配置）
agent_created: true
category: 前端开发
author: 禾耳
version: 1.0.0
tags: ["原型", "文档生成"]
---

# 原型图片功能点识别与文档生成

## 任务目标

接收用户上传的原型图片，仅提取原型图中实际呈现的功能点，生成对应的前端技术开发文档（包含多语言配置）。

## 主题风格

项目使用的组件库通过读取用户在第零步选定的模板文件自动识别（默认风格为 Element UI + vxe-table），主题色通过 CSS 变量统一管理，**禁止在样式中硬编码色值**。

| 元素 | 组件类型 | 颜色变量 |
|------|----------|----------|
| 主按钮 | `el-button type="primary"` | `var(--color-primary)` |
| 辅助按钮 | `el-button` | 白色/灰色边框（主题适配） |
| 危险按钮 | `el-button type="danger"` | `var(--color-danger)` |
| 成功按钮/标签 | `el-button type="success"` | `var(--color-success)` |
| 警告按钮/标签 | `el-button type="warning"` | `var(--color-warning)` |
| 卡片容器 | `el-card` | 背景 `var(--color-bg-card)`，边框 `var(--color-border-base)` |
| 表格 | `vxe-table` | 斑马纹，背景 `var(--color-bg-card)` |
| 分页 | `vxe-pager` | Element UI 风格 |
| 标签 | `el-tag` | 可配置颜色，色值使用 CSS 变量 |

> **颜色规范（CSS 变量）**：
> - 待定/警告：`var(--color-warning)`（黄/橙色）
> - 合规/成功：`var(--color-success)`（绿色）
> - 威胁/危险：`var(--color-danger)`（红色）
> - 主色/链接：`var(--color-primary)`（蓝色）

## 主题色变量化配置

所有组件样式中的颜色值必须使用 CSS 变量，禁止硬编码色值。项目应在全局样式文件中定义以下主题变量：

```scss
:root {
  --color-primary: #409EFF;
  --color-primary-light: #66b1ff;
  --color-primary-dark: #3a8ee6;
  --color-success: #67C23A;
  --color-warning: #E6A23C;
  --color-danger: #F56C6C;
  --color-info: #909399;

  --color-text-primary: #303133;
  --color-text-regular: #606266;
  --color-text-secondary: #909399;
  --color-text-placeholder: #C0C4CC;

  --color-border-base: #DCDFE6;
  --color-border-light: #E4E7ED;

  --color-bg-page: #F0F2F5;
  --color-bg-card: #FFFFFF;
  --color-bg-stripe: #FAFAFA;
}
```

### 组件中主题变量引用规范

| 场景 | 变量引用 | 说明 |
|------|----------|------|
| 页面背景 | `background: var(--color-bg-page)` | 最外层容器 |
| 卡片/弹窗背景 | `background: var(--color-bg-card)` | el-card、el-dialog |
| 表格斑马纹 | `background: var(--color-bg-stripe)` | vxe-table 行交替 |
| 主文字色 | `color: var(--color-text-primary)` | 标题、正文 |
| 辅助文字 | `color: var(--color-text-regular)` | 表单标签、表格内容 |
| 边框色 | `border-color: var(--color-border-base)` | 容器、表格边框 |
| 链接/高亮 | `color: var(--color-primary)` | 可点击文字 |

> **核心原则**：文档中生成的样式代码必须使用 CSS 变量引用项目主题色，不得直接写 `#409EFF`、`#FFFFFF` 等硬编码色值。

## 黑白主题兼容

当项目存在黑白色主题（如深色模式 / 浅色模式切换）时，生成的样式代码必须同时兼容两种模式。**默认按"支持黑白主题"生成样式代码**，即使原型图只有浅色主题。

### CSS 变量覆盖方案

在 `[data-theme="dark"]` 或 `.dark` 选择器下覆盖 CSS 变量值：

```scss
// 浅色主题（默认值在 :root 中定义）

// 深色主题
[data-theme="dark"] {
  --color-bg-page: #141414;
  --color-bg-card: #1F1F1F;
  --color-bg-stripe: #2A2A2A;

  --color-text-primary: #E5E5E5;
  --color-text-regular: #B0B0B0;
  --color-text-secondary: #808080;
  --color-text-placeholder: #595959;

  --color-border-base: #434343;
  --color-border-light: #383838;
}
```

### 黑白主题兼容检查清单

生成文档时需逐项确认以下组件的样式兼容性：

| 序号 | 检查项 | 要求 |
|------|--------|------|
| 1 | 页面背景 | 使用 `var(--color-bg-page)` |
| 2 | 卡片/容器背景 | 使用 `var(--color-bg-card)` |
| 3 | 弹窗背景 | 使用 `var(--color-bg-card)` |
| 4 | 表格背景及斑马纹 | 使用 `var(--color-bg-card)` + `var(--color-bg-stripe)` |
| 5 | 输入框/下拉框背景 | 使用 `var(--color-bg-card)`，文字使用变量 |
| 6 | 主文字颜色 | 使用 `var(--color-text-primary)` |
| 7 | 辅助文字颜色 | 使用 `var(--color-text-regular)` |
| 8 | 边框/分割线颜色 | 使用 `var(--color-border-base)` / `var(--color-border-light)` |

> **核心原则**：文档中所有样式代码禁止直接写颜色值（如 `#FFFFFF`、`#303133`），必须使用 CSS 变量，确保黑白主题自由切换。当不确定项目是否支持黑白主题时，默认按照"支持黑白主题"生成样式代码。

## 多语言（i18n）配置

项目使用 Vue I18n 进行国际化处理，文档中需明确列出页面涉及的所有 i18n 键值和对应的中英文翻译。

### i18n 文件结构

```
src/
└── locales/
    ├── zh-CN.js    # 中文语言包
    └── en-US.js    # 英文语言包
```

### i18n Key 命名规范

| 规则 | 示例 | 说明 |
|------|------|------|
| 按页面/模块组织 | `assetAlert.search.ip` | 第一层为模块名 |
| 使用点分隔层级 | `common.button.confirm` | 层级清晰 |
| 公共翻译放 common | `common.pagination.total` | 跨页复用 |
| 页面翻译放模块名 | `assetAlert.table.no` | 页面专属 |

### 文档中的 i18n 输出格式

在各区域详细设计的表格中**必须增加"i18n Key"列**，所有用户可见文本均需标注：

| 字段 | 组件类型 | 绑定字段 | 宽度 | i18n Key |
|------|----------|----------|------|----------|
| 网口 | `el-select` | `queryParams.ifid` | 120px | `assetAlert.filter.ifid` |
| IP | `el-input` | `queryParams.ip` | 130px | `assetAlert.filter.ip` |
| 搜索 | `el-button` | — | — | `common.button.search` |

### i18n 翻译表（文档中必须提供）

```javascript
// zh-CN.js
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
      mac: 'MAC',
      ip: 'IP',
      dataPacket: '数据包',
      flow: '流量',
      lastOnlineTime: '最新上线时间'
    }
  }
}

// en-US.js
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
      mac: 'MAC',
      ip: 'IP',
      dataPacket: 'Data Packet',
      flow: 'Flow',
      lastOnlineTime: 'Last Online Time'
    }
  }
}
```

### 模板中的使用方式

```vue
<template>
  <!-- 页面标题 -->
  <h2>{{ $t('assetAlert.title') }}</h2>

  <!-- 表格列（vxe-table） -->
  <vxe-column field="ip" :title="$t('assetAlert.table.ip')" />

  <!-- 按钮 -->
  <el-button type="primary">{{ $t('common.button.search') }}</el-button>

  <!-- 筛选标签 -->
  <el-form-item :label="$t('assetAlert.filter.ip')">
    <el-input v-model="queryParams.ip" />
  </el-form-item>
</template>
```

> **核心原则**：文档中所有用户可见的文本（按钮文字、表格列头、表单标签、提示信息、弹窗标题等）均需标注对应的 i18n Key，并至少提供中英文翻译对照。

## 模板目录

`references/` 目录中存放所有可用文档模板，每个文件对应一种页面类型的最佳实践：

| 文件名 | 页面类型 | 适用场景 |
|--------|---------|---------|
| `template-dtfy.md` | 详细规范版列表页 | 带筛选条件栏 + 多表格 + 弹窗，需完整的 CSS 变量 / i18n / 组件通信规范说明 |
| `template-dtfyv2.md` | 业务精简版列表页 | 带图表 + 筛选 + 表格 + 弹窗，使用 base-table / base-dialog / Hooks 封装，精简紧凑 |

> 新增模板时，将文件放入 `references/` 目录并在上表补充一行即可。

## 工作流程

### 第零步：收集项目上下文（必须在处理原型图前执行）

在开始分析原型图之前，**必须先向用户确认以下两项**，**合并为一次交互**，使用 `AskUserQuestion` 工具以选项卡片形式呈现：

**问题 1 — 前端技术框架**（单选）
- Vue 2（Options API）
- Vue 3（Composition API / `<script setup>`）
- React（Hooks / Class Component）

**问题 2 — 文档模板选择**（单选）  
根据"模板目录"表格，列出所有可用模板，每个选项附上文件名和一句话用途描述，供用户选择。若 references/ 目录内容有变动，以实际文件为准。

示例选项（以当前模板目录为准，动态列出）：
- 📋 **template-dtfy**（template-dtfy.md）
- ⚡ **template-dtfyv2**（template-dtfyv2.md）
- 🔲 **不使用模板** — 根据原型自由生成，不参照现有模板

> **规则**：
> - 若用户已在问题中明确说明了框架或模板，则跳过对应问题，不重复询问。
> - 组件通信写法、v-model 语法等根据框架版本自动适配。
> - 用户选定模板后，读取对应的 references/ 文件作为文档生成的参照标准，识别其中的组件库（`el-*` → Element UI，`base-table` → 项目封装组件等）。

---

### 第一步：原型图片识别

1. 接收用户提供的原型图片链接
2. 使用 `read_image` 工具解析图片内容
3. **仅提取原型图中明确呈现的元素**，包括：
   - 页面标题与导航
   - 筛选条件栏的输入框、下拉框、按钮
   - 表格列（表头名称）
   - 操作按钮
   - 弹窗及其内部表单
   - 分页器

### 第二步：功能点提取

对原型中识别的每个功能点提取：

| 提取字段 | 来源 |
|---------|------|
| 组件类型 | 根据用户选定模板文件中的组件库风格确定（如 `el-*`、`base-table`、`a-*` 等） |
| 绑定字段 | 根据表单项命名推断，如 queryParams.ip |
| 宽度/尺寸 | 从原型布局中估算 |
| 选项值 | 下拉框的可选值 |
| 交互方式 | 点击/输入/选择等 |

### 第三步：生成前端技术文档

仅输出原型图中实际存在的功能，按以下结构组织：

```markdown
# [页面名称] - 前端技术开发文档

## 1. 页面概述
- 页面路径（根据模块推断）
- 路由名称
- 所属模块
- 页面功能（基于原型描述）
- **前端框架**：[Vue 2 / Vue 3 / React，来自第零步收集]
- **组件库**：[Element UI / Ant Design Vue 等，来自第零步选定模板自动识别]

## 2. 页面结构总览
[ASCII布局图，仅包含原型中的区域]

## 3. 各区域详细设计（每个字段必须标注 i18n Key）
### 3.1 [区域名称，如顶部操作栏]
[表格列出该区域的所有元素，列名包括：字段、组件类型、绑定字段、宽度、i18n Key]

### 3.2 [区域名称，如筛选条件栏]
...

## 4. 弹窗详细设计（每个字段必须标注 i18n Key）
[仅原型中存在的弹窗]

## 5. API 接口清单
[根据原型中的操作推断接口]

## 6. 组件化目录结构

```
src/views/
└── [模块名]/
    └── [页面名]/
        ├── index.vue          # 页面入口
        └── components/        # 页面级组件目录
            ├── [弹窗组件].vue
            ├── [表单组件].vue
            └── [其他组件].vue
```

> **规范说明**：弹窗、公共表单等独立组件放置在页面目录同级的 `components/` 目录下，便于复用和维护。

## 7. 组件通信规范（根据框架版本自动适配写法）
...

## 8. 接口模拟规范（5 条 mock 数据）
...

## 9. 路由配置
...

## 10. 主题色变量配置
...

## 11. 黑白主题兼容样式
...

## 12. 多语言配置（必须输出，详见第四步）
...
```

---

### 第四步：生成多语言配置（必须执行）

文档生成完毕后，**必须单独输出完整的多语言配置**，包含以下内容：

#### 4.1 i18n Key 汇总表

对文档中所有标注了 i18n Key 的文本，整理出统一汇总表：

| 区域 | 中文文本 | i18n Key | zh-CN 值 | en-US 值 |
|------|---------|----------|----------|----------|
| 筛选栏 | 搜索 | `common.button.search` | 搜索 | Search |
| 表格列 | 编号 | `[模块].table.no` | 编号 | No. |
| 弹窗标题 | 标记 | `[模块].dialog.mark.title` | 标记 | Mark |

#### 4.2 zh-CN.js 翻译文件

```javascript
// src/locales/zh-CN.js（[模块名]部分）
export default {
  [模块名]: {
    title: '[页面中文标题]',
    filter: { /* 筛选字段 */ },
    table: { /* 表格列头 */ },
    dialog: { /* 弹窗文本 */ }
  }
}
```

#### 4.3 en-US.js 翻译文件

```javascript
// src/locales/en-US.js（[模块名]部分）
export default {
  [模块名]: {
    title: '[Page English Title]',
    filter: { /* filter fields */ },
    table: { /* table columns */ },
    dialog: { /* dialog texts */ }
  }
}
```

#### 4.4 模板使用示例（根据框架版本适配）

**Vue 2 写法：**
```vue
<template>
  <el-button>{{ $t('common.button.search') }}</el-button>
  <vxe-column :title="$t('[模块].table.ip')" />
</template>
```

**Vue 3 / `<script setup>` 写法：**
```vue
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
<template>
  <el-button>{{ t('common.button.search') }}</el-button>
  <vxe-column :title="t('[模块].table.ip')" />
</template>
```

## 组件通信规范（根据框架版本自动适配写法）

| 场景 | 方案 | 说明 |
|------|------|------|
| 涉及双向绑定 | **v-model** | 优先使用，如弹窗的 visible、form 数据等 |
| 涉及双向绑定（复杂场景） | `$ref` | v-model 无法满足时使用 |
| 无双向绑定 | `props` | 仅父传子，单向数据流 |

### Vue 2 v-model 示例

```vue
<!-- 父组件 -->
<template>
  <Dialog v-model="dialogVisible" />
</template>

<!-- 子组件 Dialog.vue -->
<template>
  <el-dialog :visible.sync="show">...</el-dialog>
</template>
<script>
export default {
  props: { value: Boolean },
  computed: {
    show: {
      get() { return this.value },
      set(val) { this.$emit('input', val) }
    }
  }
}
</script>
```

### Vue 3 `<script setup>` v-model 示例

```vue
<!-- 父组件 -->
<template>
  <Dialog v-model:visible="dialogVisible" />
</template>

<!-- 子组件 Dialog.vue -->
<script setup>
const visible = defineModel('visible', { type: Boolean, default: false })
</script>
<template>
  <el-dialog v-model="visible">...</el-dialog>
</template>
```

## 接口模拟规范

未正式对接接口前，需在代码中模拟 5 条假数据：

```javascript
// mock 数据示例
const mockList = [
  { id: 1, name: '示例数据1', status: 0 },
  { id: 2, name: '示例数据2', status: 1 },
  { id: 3, name: '示例数据3', status: 2 },
  { id: 4, name: '示例数据4', status: 0 },
  { id: 5, name: '示例数据5', status: 1 }
]
```

> **说明**：mock 数据应包含完整的字段结构，便于预览整体页面效果。

## 输出规则

1. **严格基于原型**：只输出原型图中明确呈现的内容，不补充未展示的功能
2. **不预设组件**：不预设表格列、按钮、字段等，除非原型中有
3. **字段命名**：根据中文名称推断英文字段名，如"编号"→"no"、"IP地址"→"ip"
4. **颜色规范**：所有颜色值必须使用 CSS 变量引用（如 `var(--color-primary)`），禁止硬编码色值（如 `#409EFF`）
5. **主题色变量化**：按钮、卡片、标签等组件颜色统一引用 `--color-*` 系列 CSS 变量，遵循项目主题色配置
6. **黑白主题兼容**：所有样式代码默认兼容深色/浅色两种模式，背景、文字、边框色全部使用 CSS 变量
7. **多语言处理（必须执行）**：
   - 所有用户可见文本（按钮文字、表格列头、表单标签、弹窗标题、提示信息等）必须标注 i18n Key
   - 必须在文档末尾单独输出完整的 i18n Key 汇总表 + zh-CN.js + en-US.js 翻译文件（详见第四步）
   - 模板使用示例代码需根据用户选择的框架版本提供对应写法（Vue 2 / Vue 3 / React）
8. **框架自适应**：根据第零步确认的框架版本，组件通信写法自动适配：
   - Vue 2：`v-model` → `value` prop + `$emit('input')`，弹窗用 `:visible.sync`
   - Vue 3：`v-model` → `defineModel()`，弹窗用 `v-model:visible`，`<script setup>` 语法
   - React：`useState` 管理状态，`props` + `onChange` 传递
9. **组件库识别**：读取用户在第零步选定的模板文件，自动识别组件库，不硬编码
10. **API推断**：根据功能操作推断API，如"搜索"→POST list接口、"导出"→GET export接口
11. **组件化规范**：弹窗、公共表单等独立组件放置在页面目录同级的 `components/` 目录下
12. **组件通信规范**：
    - 涉及双向绑定的变量，父子组件通信**优先使用 v-model**，其次使用 `$ref`
    - 不涉及双向绑定的场景，使用 `props` 传递即可
13. **接口模拟规范**：未正式对接接口前，需模拟 5 条假数据用于页面效果预览
14. **参照模板**：使用用户在第零步选定的 `references/` 模板文件，若未选则自由生成

## 使用示例

**输入**：用户提供原型图片链接

**处理**：
1. 使用 `AskUserQuestion` 工具同时询问：前端框架 + 模板选择（第零步）
2. 读取用户选定的 `references/` 模板文件，识别组件库与规范
3. 调用 `read_image` 识别原型
4. 提取原型中的功能元素
5. 参照选定模板生成文档（每个字段标注 i18n Key）
6. 输出完整多语言配置（i18n Key 汇总表 + zh-CN.js + en-US.js）

**输出**：
- 前端技术开发文档（Markdown 格式）
- 多语言配置文件（zh-CN.js、en-US.js）
