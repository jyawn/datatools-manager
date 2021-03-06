import React, {Component, PropTypes} from 'react'
import { connect } from 'react-redux'

const mapStateToProps = (state, ownProps) => {
  return {
    sidebarExpanded: state.ui.sidebarExpanded
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {}
}

class Content extends Component {
  static propTypes = {
    children: PropTypes.node,
    sidebarExpanded: PropTypes.bool
  }

  render () {
    return (
      <div style={{
        position: 'fixed',
        left: this.props.sidebarExpanded ? 150 : 50,
        right: 0,
        bottom: 0,
        top: 0,
        overflowY: 'scroll',
        overflowX: 'hidden'
      }}>
        {this.props.children}
      </div>
    )
  }
}

var PageContent = connect(
  mapStateToProps,
  mapDispatchToProps
)(Content)

export default PageContent
