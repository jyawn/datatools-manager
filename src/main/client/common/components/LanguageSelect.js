import React, { PropTypes } from 'react'
import fetch from 'isomorphic-fetch'
import { Glyphicon, Label, FormControl } from 'react-bootstrap'
import { PureComponent, shallowEqual } from 'react-pure-render'
import Select from 'react-select'

import languages from '../util/languages'
import { getComponentMessages, getMessage } from '../util/config'

export default class LanguageSelect extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: this.props.value
    };
  }

  cacheOptions (options) {
    options.forEach(o => {
      this.options[o.value] = o.feature
    })
  }

  componentWillReceiveProps (nextProps) {
    if (!shallowEqual(nextProps.value, this.props.value)) {
      this.setState({value: nextProps.value})
      console.log('props received', this.state.value)
    }
  }
  renderOption (option) {
    return <span style={{ color: 'black' }}>{option.region ? <Glyphicon glyph="globe" /> : <Glyphicon glyph="option-horizontal" />} {option.label} {option.link}</span>
  }
  onChange (value) {
    this.setState({value})
  }
  render() {
    // console.log('render search feeds', this.props.feeds)
    const messages = getComponentMessages('LanguageSelect')

    const options = languages.map(lang => ({value: lang.code, label: lang.name}))
    const handleChange = (input) => {
      this.onChange(input)
      this.props.onChange && this.props.onChange(input)
    }

    const onFocus = (input) => {
      // clear options to onFocus to ensure only valid route/stop combinations are selected
      // this.refs.gtfsSelect.loadOptions('')
    }

    const placeholder = getMessage(messages, 'placeholder')
    return (
    <Select
      ref='langSelect'
      tabIndex={this.props.tabIndex ? this.props.tabIndex : null}
      cache={false}
      style={{marginBottom: '20px'}}
      onFocus={onFocus}
      filterOptions={true}
      minimumInput={this.props.minimumInput !== null ? this.props.minimumInput : 1}
      clearable={this.props.clearable}
      placeholder={this.props.placeholder || placeholder}
      options={options}
      value={this.state.value}
      onChange={handleChange} />
    )
  }
}
