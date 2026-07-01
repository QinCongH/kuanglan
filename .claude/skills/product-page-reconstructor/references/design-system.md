# 企业安全产品视觉设计规范

## 色彩系统

### 基础色板
企业安全产品应传达专业感、可信度与紧张感的平衡。

**暗色主题（推荐）**
```css
--bg-base: #0D1117;          /* 最底层背景 */
--bg-surface: #161B22;       /* 卡片/面板背景 */
--bg-elevated: #21262D;      /* 悬浮层/弹窗背景 */
--bg-subtle: #30363D;        /* 次要区域背景 */

--border-default: #30363D;
--border-muted: #21262D;

--text-primary: #E6EDF3;
--text-secondary: #8B949E;
--text-muted: #484F58;
```

**亮色主题（备选）**
```css
--bg-base: #F6F8FA;
--bg-surface: #FFFFFF;
--bg-elevated: #FFFFFF;
--bg-subtle: #F0F2F5;

--border-default: #D0D7DE;
--text-primary: #1F2328;
--text-secondary: #636C76;
```

### 语义色（必须遵守）
```css
/* 安全状态 */
--color-critical: #FF4D4F;   /* 严重威胁 */
--color-high: #FA8C16;       /* 高危 */
--color-medium: #FADB14;     /* 中危 */
--color-low: #52C41A;        /* 低危/正常 */
--color-info: #1890FF;       /* 信息/提示 */

/* 操作色 */
--color-primary: #1677FF;    /* 主操作按钮 */
--color-success: #52C41A;
--color-warning: #FAAD14;
--color-danger: #FF4D4F;
```

### 状态色使用规则
- 严重/高危：使用红色/橙色，配合图标加强
- 正常运行：使用绿色，不要过度强调
- 未知/待分析：使用灰色，避免引发错误警觉

## 字体规范

### 字号层级
```
H1（页面标题）: 20px / Semi-Bold
H2（区域标题）: 16px / Medium
H3（卡片标题）: 14px / Medium
正文: 14px / Regular
辅助文字: 12px / Regular
标签/徽章: 11px / Medium
```

### 数字字体
重要指标数字使用等宽字体或数字专用字体，避免数字跳动：
```css
font-variant-numeric: tabular-nums;
```

## 间距系统

使用 4px 基准网格：
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
```

## 组件规范

### 状态徽章（Status Badge）
```html
<!-- 严重 -->
<span class="badge badge-critical">严重</span>
<!-- CSS: bg-red-500/10, text-red-400, border-red-500/30, rounded-full, px-2 py-0.5, text-xs -->

<!-- 高危 -->
<span class="badge badge-high">高危</span>

<!-- 中危 -->  
<span class="badge badge-medium">中危</span>

<!-- 低危 -->
<span class="badge badge-low">低危</span>
```

### 数据表格
- 行高：48px（舒适）/ 40px（紧凑）
- 奇偶行使用极轻微的背景差异（非强斑马纹）
- 悬停行使用 --bg-elevated 背景
- 操作列固定右侧，悬停时才显示操作按钮

### 卡片
```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 16px;
}

.card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}
```

### 数据可视化
- 图表背景与卡片保持一致，不使用白色底图
- 坐标轴线使用 --border-muted
- 图例文字使用 --text-secondary
- 高亮数据点使用 --color-primary

## 布局模式

### 管理后台三栏布局
```
[左侧导航 200px] | [主内容区] | [右侧详情/操作面板 320px（可收起）]
```

### 监控大屏布局
```
[顶部统计概览] 
[左侧：实时列表 / 右侧：图表+地图]
[底部：操作日志时间轴]
```

### 配置页面布局
```
[面包屑导航]
[页面标题 + 主操作按钮]
[分组配置卡片（竖向堆叠）]
```

## 动效原则

- 页面切换：fade（150ms）
- 卡片展开：height transition（200ms ease-out）
- 弹窗出现：scale(0.95→1) + opacity（150ms）
- 数据更新：数字滚动动效（300ms）
- 状态变更：color transition（100ms）
- 禁止使用 bounce、弹性、过于活泼的动效——企业产品需要稳重感
