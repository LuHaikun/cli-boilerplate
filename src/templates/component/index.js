module.exports = function (template) {
  return `import ${template} from './${template}'

export default ${template}
`
}
