# GitHub Actions 自动部署配置

## 第一步：配置 GitHub Secrets

在GitHub仓库中配置以下Secrets：

1. 进入仓库页面
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret` 添加以下4个Secrets：

| Name | Value |
|------|-------|
| `SERVER_HOST` | `36.151.142.77` |
| `SERVER_PORT` | `22` |
| `SERVER_USER` | `root` |
| `SERVER_PASSWORD` | 你的服务器密码 |

## 第二步：启用 Actions

1. 进入仓库页面
2. 点击 `Actions` 标签
3. 如果提示启用Actions，点击启用

## 第三步：测试部署

### 方式1：手动触发
1. 进入 `Actions` 标签
2. 选择 `自动部署到生产环境`
3. 点击 `Run workflow` 按钮

### 方式2：自动触发
推送到 `main` 分支后会自动部署：
```bash
git push origin main
```

## 工作流程

```
推送代码到GitHub
    ↓
GitHub Actions触发
    ↓
SSH连接到服务器
    ↓
拉取最新代码
    ↓
重新构建Docker镜像
    ↓
重启服务
    ↓
部署完成
```

## 查看部署日志

1. 进入 `Actions` 标签
2. 点击对应的工作流
3. 查看详细执行日志

## 安全建议

✅ **推荐做法**：
- 使用GitHub Secrets存储敏感信息
- 定期更换服务器密码
- 使用SSH密钥认证（更安全）

❌ **不要做**：
- 在代码中硬编码密码
- 在commit中包含敏感信息
- 公开你的Secrets

## 故障排查

如果部署失败：
1. 检查Secrets是否正确配置
2. 查看Actions日志
3. 确认服务器SSH服务运行正常
4. 确认服务器有足够资源
