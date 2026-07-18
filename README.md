# 自见

自见是一款本地优先的个人专注与日程管理应用。它把任务、每日编排、周日程、真实活动记录、专注计时、习惯打卡和复盘统计放在一个轻量界面中，并可通过 Capacitor 打包为 Android 应用。

应用的编排能力完全在本地运行，不依赖 OpenAI API、联网模型或远程推理服务。Supabase 仅用于用户主动登录后的跨设备状态同步。

## 核心功能

- **每日编排**：确定性的“均衡编排”和“截止前冲刺”，支持预览、勾选并采用计划时段。
- **周日程**：桌面端七列周视图与重叠事件分栏；移动端使用日期条和单日计划列表。
- **时间轴与专注**：记录真实任务或习惯活动，关联专注计时，避免同一次活动重复统计。
- **任务与备忘**：任务、DDL、提醒、备忘录与可靠删除墓碑，避免跨设备同步后复活。
- **习惯打卡**：支持是否、次数、时长三种指标，提供连续天数、完成率、趋势和 90 天热力图。
- **数据与同步**：本地 JSON 状态、完整备份导入导出，以及可选的 Supabase 跨设备同步。
- **个性化**：多套柔和主题、主题化植物头像和可同步的自定义用户名。

## OpenAI Build Week 新增内容

本项目在 OpenAI Build Week 期间完成了从 UI 草稿到可安装应用的主要迭代，包括：

- 确定性本地每日编排引擎、计划采用和日程展示；
- 截止前冲刺候选生成、选择、冲突复核与多日合并；
- 任务和备忘删除墓碑及跨设备防复活合并；
- 移动端周日程、重叠 lane 与局部 `+N` 汇总；
- `activitySessions` 真实活动记录及活动—专注—时间轴闭环；
- 习惯数据、每日打卡、统计热力图及编排建议；
- 来源感知返回导航、“我的”页面和移动端 UI 收尾；
- root → `www` → Android assets 的确定性资源同步与校验。

## Codex 参与开发说明

项目由开发者与 OpenAI Codex 协作完成。Codex 用于代码审查、功能实现、测试设计、回归验证、构建脚本和发布检查；产品决策、范围批准、人工验收和最终发布由开发者完成。

Codex 不作为应用运行时依赖。应用不会把任务、习惯或个人记录发送给 OpenAI，也不会在运行时调用 GPT、OpenAI API 或 Edge Function。

## 截图

> 截图占位：发布 GitHub Release 前补充首页 / 每日编排、移动端周日程、时间轴、习惯统计和“我的”页面截图。

| 首页与编排 | 周日程与时间轴 | 习惯与统计 |
| --- | --- | --- |
| 待补充 | 待补充 | 待补充 |

## Web 运行

要求：Node.js 与 npm；本地预览还需要可用的 Python 3。

```bash
npm install
npm start
```

浏览器打开：

```text
http://127.0.0.1:5174/
```

如果 Service Worker 缓存了旧版本，可访问 `/clear-cache.html` 清理缓存后重新打开。

## 测试

```bash
npm test
```

当前发布基线：**370/370 项自动测试通过**。测试覆盖编排算法、DOM 集成、采用与冲突校验、删除墓碑、活动/专注联动、习惯统计、移动端周日程和 Web 资源一致性。

## Android 运行与构建

要求：Node.js、JDK 21、Android SDK，以及可用的 Android 构建工具。

根目录是唯一可信 Web 源码；`www/` 是 Capacitor 构建输入。不要手工修改 `www/` 中的业务文件。

```bash
# 生成并验证 www，再同步到 Android assets
npm run android:prepare

# 同步后构建 Debug APK
npm run android:build
```

Debug APK 默认位于：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

维护者使用本地且被 Git 忽略的签名配置构建 Release：

```bash
npm run android:prepare
cd android
gradlew.bat assembleRelease
```

签名文件、密码和 `release-signing.properties` 不应提交到仓库。

## Release APK

正式签名的 Android 2.0 APK 将作为 GitHub **Releases** 页面中 `v2.0.0` 的附件提供，建议下载 `app-release.apk` 后校验 SHA-256：

```text
C41E3BB6BB7511341F8958B178B8F1CFB09991E92624DEB0E691D012B08CACE5
```

Windows：

```powershell
Get-FileHash .\app-release.apk -Algorithm SHA256
```

macOS / Linux：

```bash
sha256sum app-release.apk
```

校验值不一致时请勿安装。当前发布包名为 `com.zijian.focus`，`versionName` 为 `2.0`，`versionCode` 为 `9`。

## 数据隐私与 Supabase 安全

- 用户数据默认保存在设备本地；只有用户启用并登录同步后，完整状态 JSON 才会写入 Supabase。
- 客户端包含的 Supabase URL 与 publishable key 属于公开客户端配置，不能替代数据库权限控制；仓库和 Release 中绝不能包含 service-role key、密码或签名密钥。
- 同步表为 `public.user_states`，主键 `user_id` 关联 `auth.users(id)`。
- `supabase-setup.sql` 启用 RLS，撤销 `anon` 表权限，并要求 authenticated 用户在查询、插入、更新、删除时满足 `auth.uid() = user_id`。
- 公开部署前必须在 Supabase 控制台确认该 SQL 已实际执行、RLS 仍启用、四条策略均存在，并用两个测试账号验证不能互读或互改数据。
- Android 端可能请求通知、精确闹钟和使用情况访问权限；相关能力仅在用户授权后使用。
- 导出的备份文件可能包含个人任务、习惯和活动记录，应由用户自行安全保管。

## 许可证

本项目采用 [MIT License](./LICENSE)。
