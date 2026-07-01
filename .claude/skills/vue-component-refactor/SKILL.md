---
name: vue-component-refactor
description: 基于现有组件库重构业务代码，将重复代码替换为标准组件，统一交互和样式规范。
---

# Vue 组件重构 Skill

## 1. 需求任务分析

### 识别重构场景
| 场景类型 | 判断依据 | 处理方式 |
|---------|---------|---------|
| 代码选中重构 | 用户选中重复/冗长代码片段 | 分析选中代码，匹配可替换组件 |
| 描述式重构 | 用户描述"使用xx组件重构" | 解析需求，定位目标文件和替换点 |
| 批量替换 | 多处使用相同模式 | 扫描项目，列出所有替换点 |

### 分析维度
- **功能等价性**：重构后功能必须完全一致
- **数据流兼容性**：props/emits 映射是否匹配
- **样式一致性**：重构后UI效果是否一致或更优
- **边界处理**：空值、loading、错误状态是否处理一致

---

## 2. 业务功能

### 2.1 触发条件
- 选中 Element Plus 原生组件代码（如 `el-date-picker`、`el-select` 等）
- 选中业务中重复实现的表单/表格/对话框等代码
- 用户明确描述"使用 xx 组件重构 xx 功能"
- 检测到项目中多处使用相同模式的代码

### 2.2 具体实现

#### 步骤一：代码分析
```
1. 读取选中/目标代码
2. 识别组件类型和功能点
3. 提取关键配置项（props、events、slots）
4. 检查数据流向和依赖关系
```

#### 步骤二：组件匹配
| 原生组件 | 推荐替换组件 | 映射关系 |
|---------|-------------|---------|
| `el-date-picker[type=datetimerange]` | `DateTimeRangePicker` | 直接替换，保持 v-model |
| `el-select + 远程搜索` | `RemoteSelect` | 封装 search + loading + debounce |
| `el-dialog + 表单` | `FormDialog` | 封装 confirm/close 逻辑 |
| `el-table + 分页` | `DataTable` | 统一分页参数和加载状态 |

#### 步骤三：重构执行
```typescript
// 1. 分析原代码结构
const originalProps = {
  vModel: 'formData.time',
  clearable: false,
  shortcuts: 'timeShortcuts'
}

// 2. 生成新组件代码
// 原代码:
<el-date-picker
  :clearable="false"
  v-model="formData.time"
  type="datetimerange"
  :shortcuts="timeShortcuts"
/>

// 重构后:
<DateTimeRangePicker
  v-model="formData.time"
  :clearable="false"
  :shortcuts="timeShortcuts"
/>
```

#### 步骤四：验证检查
- [ ] 导入语句已添加
- [ ] 组件已注册（局部/全局）
- [ ] Props 传递正确
- [ ] 事件监听正确
- [ ] 插槽内容迁移完整
- [ ] TypeScript 类型正确

### 2.3 边界条件

#### 数据兼容性
| 边界情况 | 处理策略 |
|---------|---------|
| 原代码使用非标准 value-format | 添加 format 转换逻辑或修改组件支持 |
| 原代码有自定义样式覆盖 | 检查新组件是否支持相同样式透传 |
| 原代码依赖 ref 方法调用 | 确认新组件已 expose 相同方法 |
| 原代码有额外事件监听 | 确认新组件已 emit 相同事件 |

#### 回滚策略
- 重构前自动创建代码备份注释
- 复杂重构分步骤提交，便于回滚
- 保留原代码注释3天，确认无误后清理

---

## 3. 总结压缩 Skill

### 核心指令
```
当用户要求重构代码时：
1. 分析 → 识别代码模式和可替换组件
2. 匹配 → 查找组件库中对应封装组件
3. 映射 → 建立 props/emits/slots 对应关系
4. 替换 → 生成新代码并替换
5. 验证 → 检查边界条件和兼容性
```

### 快速判断矩阵
```
看到 el-date-picker[type=datetimerange] → 使用 DateTimeRangePicker
看到 el-select + filterable + remote → 使用 RemoteSelect
看到 el-dialog + el-form + 提交 → 使用 FormDialog
看到 el-table + pagination + loading → 使用 DataTable
```

---

## 4. Skill 检查清单

### 重构前检查
- [ ] 已识别目标代码的功能和边界情况
- [ ] 已确认组件库中存在对应封装组件
- [ ] 已分析 props/emits/slots 的映射关系
- [ ] 已检查样式覆盖和自定义逻辑

### 重构中检查
- [ ] 导入路径正确
- [ ] 组件名拼写正确
- [ ] 所有 props 已正确传递
- [ ] 所有事件监听已迁移
- [ ] 插槽内容已正确处理
- [ ] TypeScript 类型无错误

### 重构后检查
- [ ] 功能等价性验证通过
- [ ] 界面样式无回归
- [ ] 交互行为一致
- [ ] 边界情况处理正确
- [ ] 控制台无警告/错误

### 输出规范
```
📋 重构报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 目标文件: src/views/xxx/index.vue
📍 替换位置: 第 X 行
🔀 组件替换: el-date-picker → DateTimeRangePicker

📊 Props 映射:
  v-model → v-model ✓
  :clearable="false" → :clearable="false" ✓
  :shortcuts → :shortcuts ✓

⚠️  注意事项:
  - 新组件默认宽度 380px，与原代码一致
  - 快捷选项内置，无需额外引入

✅ 检查结果: 通过/需调整
```