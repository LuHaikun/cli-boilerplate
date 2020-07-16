const isEmpty = (obj) => {
  let isEmpty = false
  if (obj === undefined || obj === null || obj === '') {
    isEmpty = true
  } else if (Array.isArray(obj) && obj.length === 0) {
    isEmpty = true
  } else if (obj.constructor === Object && Object.keys(obj).length === 0) {
    isEmpty = true
  }
  return isEmpty
}

/**
 * null,undefined,false 转为 ''
 * @param value
 * @param str
 * @return {*|string}
 */
const toBlank = (value, str = '') => {
  return value || value === 0 ? value + '' : str
}

module.exports = {
  isEmpty: isEmpty,
  toBlank: toBlank
}
