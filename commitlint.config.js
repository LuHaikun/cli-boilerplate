/**
 * commitlint 配置
 * @returns {Object} commitlint 配置
 */
const configs = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型可选值
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新增功能
        'fix', // 修复bug
        'docs', // 文档注释
        'style', // 代码格式(不影响代码运行的变动)
        'refactor', // 重构(既不增加新功能，也不是修复bug)
        'perf', // 性能优化
        'test', // 增加测试
        'chore', // 构建过程或辅助工具的变动
        'revert', // 回退
        'build', // 打包
      ],
    ],
    'type-empty': [2, 'never'], // type不能为空
    'scope-empty': [2, 'never'], // scope非必填项，用于描述改动的范围，可以是文件的名称，最好包含路径
    'scope-case': [2, 'always', 'lower-case'], // scope小写
    'scope-enum': [2, 'always', ['root', 'src']], // scope 枚举限制
    'subject-empty': [2, 'never'], // subject必填项，这次提交的日志信息，提交日志必须有意义。
    'subject-full-stop': [2, 'never', '.'], // subject结尾不加'.'
    'header-max-length': [2, 'always', 72], // header最长72
  },
}

export default configs
