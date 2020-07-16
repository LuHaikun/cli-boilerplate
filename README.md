基于 node + docz 的cli命令行脚手架

可以通过 github 的 issue 进行 bug 或者建议的反馈

# 安装

```bash
git clone git@github.com:LuHaikun/cli-boilerplate.git

cd cli-boilerplate/

npm install
```

修改 `package.json` 的 `name` 和 `version` 字段为项目需要的值

# 运行项目

## 运行开发环境

```bash
npm run dev
```

## 打包项目

```bash
// 项目编译
npm run build

// 项目部署
npm run deploy
```

# 功能

* commit-msg 校验
* 动态路由加载
* 环境变量配置
* 命令行配置

# Bug

# Feature

* 脚手架升级设计
* 拆分命令组件
* 需要还可集成数据库