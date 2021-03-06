import React from 'react'
import { connect } from 'react-redux'
import moment from 'moment'

import { editAlert, deleteAlert } from '../actions/alerts'
import { setVisibilitySearchText, setVisibilityFilter } from '../actions/visibilityFilter'

import AlertsList from '../components/AlertsList'

import { getFeedsForPermission } from '../../common/util/permissions'

const getVisibleAlerts = (alerts, visibilityFilter) => {
  if (!alerts) return []
  let visibleAlerts = alerts.filter(alert =>
    alert.title.toLowerCase().indexOf((visibilityFilter.searchText || '').toLowerCase()) !== -1)
  let now = moment()
  switch (visibilityFilter.filter) {
    case 'ALL':
      return visibleAlerts
    case 'ACTIVE':
      return visibleAlerts.filter(alert =>
        moment(alert.start).isBefore(now) &&
        moment(alert.end).isAfter(now) &&
        alert.published
      )
    case 'FUTURE':
      return visibleAlerts.filter(alert => moment(alert.start).isAfter(now))
    case 'ARCHIVED':
      return visibleAlerts.filter(alert => moment(alert.end).isBefore(now))
    case 'DRAFT':
      return visibleAlerts.filter(alert => !alert.published)
  }
  return visibleAlerts
}

const mapStateToProps = (state, ownProps) => {
  console.log('all alerts', state.alerts.all)
  // if (state.projects.active !== null && state.projects.active.feeds !== null )
  return {
    isFetching: state.alerts.isFetching,
    alerts: getVisibleAlerts(state.alerts.all, state.alerts.filter),
    visibilityFilter: state.alerts.filter,
    editableFeeds: getFeedsForPermission(state.projects.active, state.user, 'edit-alert'),
    publishableFeeds: getFeedsForPermission(state.projects.active, state.user, 'approve-alert')
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onEditClick: (alert) => dispatch(editAlert(alert)),
    onDeleteClick: (alert) => dispatch(deleteAlert(alert)),
    searchTextChanged: (text) => dispatch(setVisibilitySearchText(text)),
    visibilityFilterChanged: (filter) => dispatch(setVisibilityFilter(filter))
  }
}

const VisibleAlertsList = connect(
  mapStateToProps,
  mapDispatchToProps
)(AlertsList)

export default VisibleAlertsList
