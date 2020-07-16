module.exports = function (template) {
  return `import React, { Component } from 'react'

import style from './style.scss'

class ${template} extends Component {
  constructor (props) {
    super(props)
    this.state = {

    }
  }

  // ------ 生命周期区 ----- //
  componentDidMount = () => {

  }

  componentDidUpdate = (prevProps, prevState) => {

  }

  componentWillUnmount = () => {

  }

  // ------ 数据交互区 ----- //

  getData = () => {

  }

  // ------ 事件绑定区 ----- //

  handleSearch = () => {

  }

  // ------ 公共方法区 ----- //

  render () {
    return (
      <div className={style['${template.toLowerCase()}-wrapper']}>
        内容页
      </div>
    )
  }
}

export default ${template}
`
}
