# CLI Boilerplate Modernization Design

## Goal

将当前 CLI 脚手架升级为一个干净、可靠、可测试、可继续扩展的 TypeScript CLI boilerplate。改造重点是 CLI 工程本身，而不是生成 React、TSX、SCSS 或业务页面文件。

## Current Findings

- 当前 `package.json` 的 `main` 与 `bin` 指向 `dist/index.js`，但 `tsup` 实际输出 `dist/index.cjs`，发布后的 CLI 入口不可用。
- 当前 CJS 构建会把 `import.meta.url` 转成不可用值，运行 `dist/index.cjs --help` 会因为 `createRequire(undefined)` 崩溃。
- `yarn start` 依赖 `tsx`，但项目未安装该依赖，开发命令不可用。
- 生产依赖存在多组老旧依赖链，包括 `archiver`、`inquirer`、`del` 等未使用或高风险依赖。
- `README.md` 与站点文档仍描述 docz、deploy、clone 等不匹配的旧能力。
- 当前 `mktpl` 输出 React JSX 与 SCSS 文件，不符合本项目作为 CLI 脚手架工程的实际方向。
- 项目缺少自动化测试，无法保障 CLI 入口、命令行为和模板生成逻辑。

## Architecture

采用轻量、可测试的 CLI 内核结构：

- `bin/index.ts` 只保留 shebang 与启动入口。
- `src/index.ts` 暴露 `runCli(argv?: string[])`，同时支持真实命令行运行和测试调用。
- `src/commands/mktpl` 负责注册命令、解析参数与协调服务。
- `src/services/template-generator` 负责路径解析、名称校验、覆盖策略、dry-run 与文件写入。
- `src/templates` 只负责生成纯 TypeScript CLI 工程模板内容。
- `src/lib` 保留日志、路径、错误、格式化等通用工具，不包含具体命令业务。

构建策略统一为 ESM：

- 保留 `type: module`。
- `tsup` 输出 `dist/index.js`，与 `package.json#bin` 对齐。
- 避免在 CJS 产物中使用 `import.meta.url`。
- 发布前通过 `prepublishOnly` 执行类型检查、测试与构建。

## CLI Behavior

保留并升级现有命令：

```bash
oh-my-cli mktpl <name> [dirPath]
```

支持参数：

- `-t, --type <type>`：模板类型，支持 `command`、`lib`、`template`，默认 `command`。
- `--dry-run`：只打印将创建的文件列表，不写入磁盘。
- `--force`：目标目录已存在时允许覆盖。
- `--cwd <path>`：指定工作目录，方便测试和自动化脚本使用。

失败策略：

- 名称不合法时返回非 0 exit code，并给出命名要求。
- 目标目录存在且未传 `--force` 时返回非 0 exit code。
- 文件写入失败时返回非 0 exit code，并输出具体错误。
- `--dry-run` 永远不写入磁盘。

## Template Design

脚手架只生成纯 TypeScript CLI 工程模块，不包含 TSX、SCSS、React 或样式文件。

`command` 模板：

```text
commands/<name>/
  index.ts
  types.ts
  __tests__/<name>.test.ts
```

用途：快速创建新的 CLI 子命令骨架。

`lib` 模板：

```text
lib/<name>.ts
__tests__/lib/<name>.test.ts
```

用途：快速创建可复用工具模块。

`template` 模板：

```text
templates/<name>/
  index.ts
  types.ts
  __tests__/<name>.test.ts
```

用途：快速创建新的文本模板模块。

所有生成代码遵循：

- 使用 TypeScript。
- 使用命名导出，不使用 default export。
- 优先使用 `interface` 定义结构类型。
- 使用函数式与声明式写法，不使用类。
- 复杂逻辑使用 `function` 声明。
- 暴露接口处保留简短、实用的注释。

## Dependency Strategy

- 删除当前未使用依赖：`archiver`、`camelcase`、`cross-spawn`、`del`、`inquirer`、`uuid`、`yargs` 等。
- 保留并按需升级核心依赖：`commander`、`chalk`、`fs-extra`。
- 新增测试依赖：`vitest`。
- 新增开发运行依赖：`tsx`，用于本地 CLI 调试。
- 明确使用 Yarn v1 与 `yarn.lock`，文档避免混用 npm audit 流程。

## Testing Strategy

引入 Vitest，覆盖以下行为：

- `runCli(['--help'])` 或真实子进程调用能正常输出帮助信息。
- `runCli(['--version'])` 能正常输出版本号。
- `mktpl --dry-run` 不写入任何文件。
- `mktpl --type command` 生成命令模块骨架。
- `mktpl --type lib` 生成工具模块骨架。
- `mktpl --type template` 生成模板模块骨架。
- 目标目录已存在且未传 `--force` 时失败。
- 目标目录已存在且传 `--force` 时覆盖成功。
- 非法名称会失败并输出明确错误。

测试应优先验证文件内容中的关键结构，而不是对完整字符串做脆弱快照。

## Documentation Strategy

更新文档以匹配真实能力：

- `README.md` 说明项目定位、安装、开发、测试、构建、发布与命令示例。
- Docusaurus 文档只保留真实可用命令，不再描述 docz、clone、deploy 等旧内容。
- 命令文档展示 `command`、`lib`、`template` 三种模板输出结构。
- 文档中明确本项目是 CLI boilerplate，不是 React 组件生成器。

## Success Criteria

- `yarn dev --help` 能正常运行。
- `yarn check` 通过。
- `yarn lint` 通过。
- `yarn test` 通过。
- `yarn build` 输出 `dist/index.js`。
- `node dist/index.js --help` 正常输出帮助信息。
- `oh-my-cli mktpl demo --dry-run` 不写文件并显示计划生成内容。
- `oh-my-cli mktpl demo --type command --cwd <temp>` 能生成纯 TypeScript 命令模板。
- `yarn audit --groups dependencies` 不再报告由已删除未使用生产依赖带来的漏洞。

## Out of Scope

- 不生成 React、TSX、CSS Modules 或 SCSS 文件。
- 不新增项目创建器、远程 clone、数据库集成或大型插件系统。
- 不重写 Docusaurus 站点主题。
- 不引入 Next.js、Ant Design、Zustand 或 nuqs，因为当前目标是 CLI 工程脚手架。
