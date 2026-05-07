export default function (template: string) {
  return `import ${template} from './${template}'

export default ${template}
`
}
