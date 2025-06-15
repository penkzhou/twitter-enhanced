# 📊 Codecov 测试覆盖率设置指南

## 🚀 快速开始

### 1. 注册 Codecov 账号

1. 访问 [codecov.io](https://about.codecov.io/)
2. 点击 "Sign Up" 并选择 "Sign up with GitHub"
3. 授权 Codecov 访问你的 GitHub 账号

### 2. 添加仓库到 Codecov

1. 登录 Codecov 后，点击 "Add a repository"
2. 找到 `twitter_enhanced` 仓库
3. 点击 "Setup repo" 按钮

### 3. 获取 Upload Token

1. 在仓库设置页面，找到 "Upload Token"
2. 复制 token（格式类似：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

### 4. 添加 Token 到 GitHub Secrets

1. 在 GitHub 仓库页面，进入 `Settings` → `Secrets and variables` → `Actions`
2. 点击 "New repository secret"
3. 创建新的 secret：
   - **Name**: `CODECOV_TOKEN`
   - **Value**: 粘贴从 Codecov 复制的 token

## ✅ 配置验证

### 本地测试覆盖率生成
```bash
# 生成覆盖率报告
npm run test:coverage

# 查看覆盖率文件是否生成
ls -la coverage/lcov.info
```

### 推送代码触发 CI
```bash
git add .
git commit -m "feat: Add Codecov integration"
git push origin main
```

### 检查 Codecov 报告

1. 在 GitHub Actions 中查看工作流执行日志
2. 查看 "Upload coverage to Codecov" 步骤是否成功
3. 访问 Codecov 仓库页面查看覆盖率报告

## 🎯 覆盖率徽章

### 添加到 README.md

在 README.md 顶部添加覆盖率徽章：

```markdown
# Twitter Enhanced

[![codecov](https://codecov.io/gh/penkzhou/twitter_enhanced/branch/main/graph/badge.svg?token=YOUR_TOKEN)](https://codecov.io/gh/penkzhou/twitter_enhanced)
[![CI](https://github.com/penkzhou/twitter_enhanced/actions/workflows/test.yml/badge.svg)](https://github.com/penkzhou/twitter_enhanced/actions/workflows/test.yml)

[原有的 README 内容...]
```

替换 `YOUR_TOKEN` 为你的实际 token（可选，公开仓库不需要）。

## 📈 覆盖率目标设置

### 当前配置 (codecov.yml)

```yaml
coverage:
  status:
    project:
      default:
        target: auto  # 自动设置目标
        threshold: 1% # 允许 1% 的波动
```

### 逐步提高目标

随着测试增加，可以调整目标：

```yaml
# Phase 1: 基础阶段
target: 20%

# Phase 2: 成长阶段  
target: 40%

# Phase 3: 成熟阶段
target: 60%

# Phase 4: 生产阶段
target: 70%
```

## 🔧 高级配置

### 多环境覆盖率合并

如果有多个测试环境（单元测试、集成测试、E2E）：

```yaml
# .github/workflows/test.yml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./coverage/lcov.info
    flags: unittests,node-${{ matrix.node-version }}
    name: node-${{ matrix.node-version }}
```

### PR 评论配置

Codecov 会自动在 PR 中添加覆盖率报告评论：

```yaml
# codecov.yml
comment:
  layout: "reach,diff,flags,files,footer"
  behavior: default
  require_changes: false  # 即使没有变化也显示评论
```

## 📊 覆盖率报告功能

### Codecov 提供的功能

1. **覆盖率趋势图** - 查看项目覆盖率随时间的变化
2. **文件浏览器** - 查看每个文件的具体覆盖情况
3. **PR 对比** - 查看 PR 对覆盖率的影响
4. **未覆盖代码高亮** - 快速定位需要测试的代码

### 本地覆盖率报告

```bash
# 生成 HTML 覆盖率报告
npm run test:coverage

# 在浏览器中打开报告
open coverage/lcov-report/index.html
```

## 🚨 常见问题

### 1. Token 权限错误
**问题**: `Error: Codecov token not found`
**解决**: 确保在 GitHub Secrets 中正确添加了 `CODECOV_TOKEN`

### 2. 覆盖率文件未找到
**问题**: `Error: No coverage files found`
**解决**: 确保 `npm run test:ci` 生成了 `coverage/lcov.info` 文件

### 3. PR 没有显示覆盖率评论
**解决**: 
- 检查 Codecov 是否有仓库访问权限
- 确保 codecov.yml 中的 comment 配置正确
- 等待几分钟，评论可能有延迟

## 📋 检查清单

- [ ] Codecov 账号已创建
- [ ] 仓库已添加到 Codecov
- [ ] CODECOV_TOKEN 已添加到 GitHub Secrets
- [ ] codecov.yml 配置文件已创建
- [ ] CI 工作流已更新
- [ ] 首次 CI 运行成功
- [ ] Codecov 报告页面可访问
- [ ] README 添加了覆盖率徽章

## 🔗 相关链接

- [Codecov 文档](https://docs.codecov.com/)
- [Codecov GitHub Action](https://github.com/codecov/codecov-action)
- [覆盖率最佳实践](https://docs.codecov.com/docs/best-practices)

---

**🎉 完成以上步骤后，你的项目就拥有了专业的测试覆盖率追踪系统！**