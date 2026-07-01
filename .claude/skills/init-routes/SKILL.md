---

name: init-routes

description: 根据目录结构分析出路由目录文件夹结构，自动生成 Vue 页面文件和路由配置。

license: Complete terms in LICENSE.txt

---

  

## 用法

  

在对话中描述你的目录结构，我会：

  

1. 创建所有页面文件夹和 `index.vue` 文件

2. 生成对应的路由配置文件

  

## 输入格式

  

提供树形结构的目录描述：

  

```

# 系统管理

## 网络管控

## 访问控制

## 流量过滤

## 黑白名单

# 资产管理

## 资产列表

## 资产拓扑

# 系统配置

```

井号代表目录等级

## 输出

  

- **页面文件**: `/src/views/{模块}/{页面}/index.vue`

- **路由配置**: `/src/router/routes/modules/{模块}.ts`

  

此处页面文件路径和路由配置路径根据项目结构动态设置

  

## 命名规则

  

| 输入 | 文件夹名 | 路由名 | 组件名 | 多语言键 |

|------|----------|--------|--------|----------|

| 网络管控 | network-control | NetworkControl | NetworkControl | networkControl |

| PING/探活 | ping-probe | PingProbe | PingProbe | pingProbe |

  

### 多语言键命名规范

  

- 模块级：`page.{模块名}.title`

- 页面级：`page.{模块名}.{页面名}`

- 嵌套级：`page.{模块名}.{子模块}.{页面名}`

  

示例：

- `page.systemManagement.title` - 系统管理菜单标题

- `page.systemManagement.networkControl.accessControl` - 访问控制页面标题

  

## 菜单图标配置

  

### 1. 自动检测图标库

  

执行路由初始化前，自动检测项目中支持的图标方案：

  

```

检测步骤：

1. 扫描 package.json 中的图标依赖

   - @iconify/vue → 支持 iconify 格式（如：mdi:github, carbon:workspace）

   - lucide-vue-next → 支持 lucide 格式（如：lucide:settings）

  

2. 检测项目中的图标导入方式

   - 检查 图标组件 的使用方式

   - 确定图标组件的注册位置

  

3. 查看现有路由中的图标使用示例

   - 确认图标格式的正确写法

```

  

### 2. 图标配置策略

  

#### 2.1 默认图标映射表

  

- 根据菜单名称智能匹配默认图标

  

#### 3.2 每一级菜单图标配置规则

  

**必须遵循的规则**：

- ✅ 每一级菜单（包括模块级、子模块级）都必须配置 `meta.icon`

- ✅ 叶子节点页面（有 component 的）可以不配置 icon，但配置了更佳

- ✅ 模块级菜单必须使用有辨识度的图标

- ✅ 子模块级菜单可以使用与模块级相关的图标变体

  

**路由层级图标配置示例**：

  

```typescript

{

  meta: {

    title: '系统管理',

    icon: 'lucide:settings',  // 模块级 - 必须配置

    order: 700,

  },

  name: 'SystemManagement',

  path: '/system-management',

  children: [

    {

      meta: {

        title: '网络管控',

        icon: 'lucide:network',  // 子模块级 - 必须配置

      },

      name: 'NetworkControl',

      path: '/system-management/network-control',

      children: [

        {

          meta: {

            title: '访问控制',

            icon: 'lucide:shield-check',  // 页面级 - 建议配置

          },

          name: 'AccessControl',

          path: '/system-management/network-control/access-control',

          component: () => import('#/views/...'),

        },

      ],

    },

  ],

}

```

  

### 4. 图标配置安全策略

  

- **图标存在性验证**：配置的图标必须在项目依赖的图标库中存在

- **格式合法性检查**：允许 `lucide:` 和 `iconify:` 格式的图标或项目支持的其他格式

- **非法图标回退**：若图标不存在或格式错误，回退到默认图标 `lucide:file`

- **禁止注入**：禁止在 icon 字段中使用任意字符串或 HTML

  

### 5. 图标配置流程

  

```

1. 检测项目图标库（@iconify/vue, lucide-vue-next 等）

2. 解析用户提供的目录结构

3. 为每个模块/页面匹配默认图标

   ├── 模块级菜单 → 根据模块名称匹配图标

   ├── 子模块级菜单 → 根据子模块名称匹配图标

   └── 页面级菜单 → 根据页面名称匹配图标（可选）

4. 生成路由配置时，确保每一级都有 meta.icon

5. 验证图标格式是否符合项目规范

6. 生成带完整图标配置的路由文件

```

  

### 6. 用户自定义图标

  

用户可以在目录结构中指定图标：

  

```

# 系统管理 [lucide:settings]

## 网络管控 [lucide:network]

## 访问控制 [lucide:shield-check]

# 资产管理 [lucide:database]

## 资产列表 [lucide:list]

```

  

格式：`[图标名]` 紧跟在目录名称后，使用项目支持的图标格式

  

## 多语言检测与配置

  

### 1. 自动检测机制

  

执行路由初始化前，自动检测项目中的多语言配置：

  

```

检测路径（按优先级排序）：

1. /src/locales/langs/{lang}/page.json

2. /src/locales/{lang}.json

3. /packages/locales/src/langs/{lang}/*.json

4. /src/i18n/locales/{lang}.json

```

  

### 2. 检测逻辑

  

- **若存在多语言配置**：

  - 路由中使用 `$t('page.{模块}.{页面}')` 格式

  - 自动在对应语言文件中添加缺失的翻译键

  - 保留已有翻译，仅追加新键

- **若不存在多语言配置**：

  - 路由中直接使用中文标题

  - 不创建多语言文件

  

### 3. 多语言文件更新策略

  

```

检查目标语言文件是否存在

├── 存在 → 读取现有内容

│   ├── 键已存在 → 保留原值，跳过

│   └── 键不存在 → 追加新键（中文作为默认值）

└── 不存在 → 跳过（不创建新文件）

```

  

### 4. 支持的多语言格式

  

- **JSON 格式**：`{ "page": { "module": { "title": "标题" } } }`

- **TypeScript 格式**：`export default { page: { module: { title: "标题" } } }`

  

### 5. 生成示例

  

**检测到多语言配置时生成的路由**：

```typescript

{

  meta: {

    title: $t('page.systemManagement.networkControl.accessControl'),

  },

  name: 'AccessControl',

  path: '/system-management/network-control/access-control',

  component: () => import('#/views/system-management/network-control/access-control/index.vue'),

}

```

  

**未检测到多语言配置时生成的路由**：

```typescript

{

  meta: {

    title: '访问控制',

  },

  name: 'AccessControl',

  path: '/system-management/network-control/access-control',

  component: () => import('#/views/system-management/network-control/access-control/index.vue'),

}

```

  

## 示例

  

**提示词**:

```

请帮我初始化以下路由结构：

  

# 安全管理

## 防火墙管理

## 规则配置

## 日志审计

## 策略管理

## 入侵检测

## 实时监控

## 告警管理

```

  

**我会创建**:

1. 6 个页面文件夹和 `index.vue` 文件

2. 1 个路由配置文件 `security-management.ts`

3. 包含完整的路由层级结构和菜单配置

  

## 边界条件与安全检查

  

在执行任何操作前，必须遵守以下边界条件：

  

### 1. 目录存在性检查（防覆盖）

  

- **创建目录前**：检查目标目录是否已存在

  - 若存在：跳过创建，保留现有目录及其所有内容

  - 若不存在：安全创建新目录

  

### 2. 文件存在性检查（防覆盖）

  

- **创建 `index.vue` 前**：检查文件是否已存在

  - 若存在：跳过写入，保留现有文件内容，向用户报告

  - 若不存在：创建新文件并写入模板

  

### 3. 路由配置合并策略

  

- **生成路由文件前**：检查路由配置文件是否已存在

  - 若存在：

    1. 读取现有路由配置

    2. **增量合并**：仅添加新路由，保留现有路由定义

    3. 避免删除或修改已有路由项

  - 若不存在：创建全新的路由配置文件

  

### 4. 多语言文件安全策略

  

- **检测多语言配置前**：扫描项目确定多语言方案

  - 若存在：记录路径和格式，供后续使用

  - 若不存在：路由中使用硬编码标题

- **更新多语言文件前**：检查目标文件是否存在

  - 若存在：

    1. 读取现有翻译内容

    2. **增量追加**：仅添加缺失的键，保留所有已有翻译

    3. 以中文作为新键的默认值

  - 若不存在：跳过（不创建新的多语言文件）

  

- **多语言键命名**：统一使用 camelCase 格式

  - 例：`networkControl` 而非 `network-control`

  

### 5. 禁止的操作

  

以下操作**严格禁止**：

- ❌ 删除任何现有目录或文件

- ❌ 覆盖/重写已有页面文件

- ❌ 清空现有路由配置后重写

- ❌ 批量替换整个 views 或 router 目录

- ❌ 删除或覆盖已有翻译内容

- ❌ 创建全新的多语言文件（仅更新已有文件）

  

### 6. 用户确认机制

  

当检测到以下情况时，需向用户报告并确认：

- 目录已存在但结构不同

- 路由配置存在冲突（如相同 path 的不同定义）

- 需要修改现有文件的情况

- 多语言文件格式不支持（非 JSON/TypeScript）

- 多语言键命名冲突（已有相同键但不同含义）

  

## 操作流程

  

```

1. 解析用户提供的目录结构

2. 检查目标项目路径

3. 检测图标库配置

   ├── 扫描 package.json 中的图标依赖（@iconify/vue, lucide-vue-next）

   ├── 查看现有路由中的图标使用示例

   └── 确定项目支持的图标格式和命名规范

4. 检测多语言配置

   ├── 扫描常见多语言文件路径

   ├── 确定项目使用的多语言方案

   └── 记录检测结果供后续使用

5. 对每个模块/页面：

   ├── 检查目录是否存在 → 存在则跳过，不存在则创建

   ├── 检查 index.vue 是否存在 → 存在则跳过，不存在则创建

   ├── 检查路由配置是否存在 → 存在则增量合并，不存在则新建

   ├── 根据图标检测结果为每一级菜单配置 meta.icon

   └── 根据多语言检测结果生成对应的路由配置

6. 若存在多语言配置 → 更新语言文件（追加新键，保留已有）

7. 生成操作报告（成功创建/已存在跳过/冲突需确认/图标配置状态/多语言更新状态）

8. 仅执行安全的创建操作

```

  

## 注意事项

  

- 所有页面使用统一的 Vue 3 模板结构

- 支持多级嵌套路由

- 路由 `order` 按模块顺序自动递增

- **图标配置原则**：

  - 每一级菜单（模块级、子模块级）都必须配置 `meta.icon`

  - 自动根据菜单名称智能匹配默认图标

  - 支持 `lucide:` 和 `iconify:` 格式的图标

  - 图标不存在时自动回退到 `lucide:file`

  - 优先使用 Lucide 图标库（与项目现有风格保持一致）

- **多语言适配原则**：

  - 自动检测项目多语言方案，无需手动配置

  - 优先使用 `$t()` 函数，回退到硬编码中文

  - 新键以中文作为默认值，开发者后续可自行翻译

  - 支持嵌套对象格式的多语言文件

- **操作原则：只增不改，安全第一**