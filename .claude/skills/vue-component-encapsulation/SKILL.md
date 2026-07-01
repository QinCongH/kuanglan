---
name: vue-component-encapsulation
description: 智能封装 Vue 3 可复用组件。支持代码选中/描述式/重构三种模式，自动识别 Props/Emits/Slots，生成完整 TypeScript 类型定义，输出到 src/components/ 目录。
---

# Vue 3 组件智能封装

## 触发条件
- 选中代码要求封装
- 描述功能需求生成组件
- 重构/优化现有组件

## 执行流程

### 1. 需求分析
| 类型 | 策略 |
|------|------|
| 代码选中 | 分析结构，识别数据流、事件、可配置点 |
| 描述式 | 解析需求，设计组件结构和交互 |
| 重构 | 提取 composable，优化 Props 设计 |

### 2. 组件设计
**defineModel 双向绑定**
```typescript
const model = defineModel("");
```

**Props 设计**
```typescript
interface Props {
  modelValue?: any           // v-model
  data?: any[]               // 数据
  disabled?: boolean         // 禁用
  size?: 'small'|'default'|'large'
  placeholder?: string       // 占位文本
  clearable?: boolean        // 可清空
}
```

**继承第三方组件 Props**

当基于非原生 HTML 组件（如 Element Plus）封装时，需透传第三方组件的原生 Props：

```typescript
import { useAttrs } from "vue";

const props = defineProps<{
  // 封装组件特有的 Props
  width?: string | number;
  shortcuts?: TimeShortcut[];
}>();

// 透传所有未声明的 attrs 给底层组件
const attrs = useAttrs();
```

模板中使用 `v-bind="$attrs"` 透传：

```vue
<template>
  <el-date-picker
    v-bind="$attrs"
    v-model="innerValue"
    :style="{ width: widthStyle }"
  />
</template>
```

**继承策略**：
| 场景 | 处理方式 | 示例 |
|------|----------|------|
| 需要自定义默认值的 Prop | 显式声明 + 默认值覆盖 | `clearable: { default: true }` |
| 需要拦截处理的 Prop | 显式声明 + 转换后透传 | `separator: { default: "至" }` |
| 无需处理的 Prop | 通过 `$attrs` 自动透传 | `disabled`, `placeholder` 等 |
| 需要禁用的 Prop | 不传递，组件内部控制 | 封装后不再暴露的原生属性 |

**Emits 设计**
```typescript
const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [value: any, oldValue: any]
  'select': [item: any, index: number]
}>()
```

**Slots 设计**
- `default` - 默认内容
- `item` - 自定义选项（作用域：item, index, selected）
- `empty` - 空状态
- `header/footer` - 头部/底部

**Expose 方法**
```typescript
defineExpose({
  open: () => visible.value = true,
  close: () => visible.value = false,
  clear: () => innerValue.value = undefined
})
```

### 3. 性能优化
- 防抖节流（搜索/滚动）
- 虚拟列表（大数据）
- 计算属性缓存
- v-once 静态内容

### 4. 输出规范

**默认路径**：`src/components/{ComponentName}/`

**文件结构**：
```
ComponentName/
├── index.vue      # 组件主体
├── types.ts       # 类型定义
└── README.md      # 文档
```

**输出前确认**：
```
📦 组件名称: ComponentName
📝 功能描述: xxx
📁 输出路径: src/components/ComponentName/

请选择：
1. 确认输出到默认路径
2. 自定义输出路径
3. 仅输出代码，不保存
```

**冲突处理**：
- 检测同名组件
- 提供覆盖/重命名/合并/取消选项

### 5. 产出格式

1. **分析说明** - Props/Emits/Slots 表格
2. **组件代码** - 完整 `<script setup>` + `<template>`
3. **使用示例** - 基础/多选/自定义插槽

## 代码模板

```vue
<script setup lang="ts">
const props = defineProps({
  modelValue: { type: [String, Number], default: undefined },
  data: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [value: any]
}>()

const innerValue = defineModel('modelValue')

defineExpose({ open, close, clear })
</script>

<template>
  <div class="component-wrapper">
    <slot name="item" :item="item" :index="index" />
  </div>
</template>

<style scoped lang="scss">
.component-wrapper { /* ... */ }
</style>
```

## 检查清单
- [ ] Props 类型定义 + 默认值
- [ ] 继承第三方组件 Props（使用 `v-bind="$attrs"` 透传）
- [ ] Emits 事件定义清晰
- [ ] 支持 v-model
- [ ] 提供必要插槽
- [ ] expose 需要的方法
- [ ] scoped 样式
- [ ] 完整文档示例
