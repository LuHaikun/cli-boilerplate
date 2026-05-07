---
title: mktpl - 创建组件模板
sidebar_label: mktpl
---

# 创建组件模板

## 简介

### 创建开发 React.Class 组件模板

为了提高开发效率，使用 mktpl 命令，可以创建一个组件文件夹里面
包含[component].jsx、index.js、style.scss 开发套件

## 基本使用

```shell
$ oh-my-cli mktpl <componentName> [path]
```

> 举例：$ oh-my-cli mktpl --type func Login ./src/views

- --type 或者 -t 已某种组件类型创建 [class|func] 缺省时默认 class
- 最后一个是可选参数，路径参数可以接收绝对路径，相对路径或者不填

### 提示：--type [type] 可以放在 mktpl 命令之后的任何位置

## 参数

|     属性名      |                          描述                          | 必填项 |
| :-------------: | :----------------------------------------------------: | :----: |
| `componentName` |                      新建组件名称                      |   是   |
|     `path`      | 新建组件文件夹地址为空时创建在当前命令执行时所处的位置 |   否   |
