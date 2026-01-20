---
allowed-tools: Bash(gh issue view:*), Bash(gh search:*), Bash(gh issue list:*), Bash(gh pr comment:*), Bash(gh pr diff:*), Bash(gh pr view:*), Bash(gh pr list:*)
description: 依赖更新合成器
disable-model-invocation: false
---

将多个依赖更新 PR 合成为一个，减少 CI 成本，提升效率。

**重要原则**：不要使用 `git merge` 合并 PR，而是直接修改依赖文件并重新生成 lock 文件。

## 执行步骤

### 1. 准备工作

- 确保当前在最新的 main 分支
- 如果不在 main 分支，先切换到 main 并 `git pull` 拉取最新代码

### 2. 收集依赖更新信息

1. 使用 `gh pr list --state open --author app/renovate` 获取所有 Renovate PR
2. 对每个 PR 使用 `gh pr view <number> --json body` 查看详细信息
3. 从 PR body 中提取依赖包名和版本变更信息
4. 分类整理：
   - **前端依赖**：`package.json` 相关的更新
   - **后端依赖**：`pyproject.toml` 相关的更新

### 3. 创建合并分支

```bash
git checkout -b chore/merge-dependencies-$(date +%Y%m%d)
```

### 4. 直接修改依赖文件（核心步骤）

**前端依赖更新**（如果有）：

1. 直接编辑 `frontend/package.json`
2. 更新所有需要升级的依赖版本号
3. 运行 `cd frontend && pnpm install` 重新生成 lock 文件

**后端依赖更新**（如果有）：

1. 直接编辑 `backend/pyproject.toml`
2. 更新所有需要升级的依赖版本号
3. 运行 `cd backend && uv lock --no-cache` 重新生成 lock 文件

### 5. 验证变更

```bash
make check-versions  # 检查版本一致性
make qa              # 代码质量检查
make test            # 运行测试
```

### 6. 提交和推送

1. 将所有变更添加到一个提交：

   ```bash
   git add .
   git commit -m "chore(deps): 合并依赖更新 ($(date +%Y-%m-%d))"
   ```

2. 推送分支：
   ```bash
   git push -u origin chore/merge-dependencies-$(date +%Y%m%d)
   ```

### 7. 创建 PR

使用 `gh pr create` 创建 PR，包含：

- **标题**：`chore(deps): 合并依赖更新 (YYYY-MM-DD)`
- **描述**：
  - 列出所有合并的 PR 编号和依赖变更
  - 说明验证结果（版本检查、质量检查、测试结果）
  - 注明是否有测试失败及原因
  - 标注后续工作（如果有）

## 注意事项

1. **不要使用 git merge**：直接修改文件更高效，避免冲突
2. **分前后端处理**：前后端依赖分开更新，互不干扰
3. **单次提交**：所有依赖更新放在一个提交中，保持历史清晰
4. **完整测试**：确保 `make qa && make test` 都通过后再提交 PR
5. **记录失败**：如有测试失败，在 PR 描述中明确说明原因和后续计划
