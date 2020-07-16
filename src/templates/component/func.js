module.exports = function (template) {
  return `import React, { useState, useEffect } from 'react'

import style from './style.scss'

const ${template} = (props) => {
  useEffect(() => {

  }, [])
  return (
    <div className={style['${template.toLowerCase()}-wrapper']}>
      内容页
    </div>
  )
}

export default ${template}
`
}
