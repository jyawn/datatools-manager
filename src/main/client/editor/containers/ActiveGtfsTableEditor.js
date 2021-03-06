import { connect } from 'react-redux'

import GtfsTableEditor  from '../components/GtfsTableEditor'
import { fetchFeedSourceAndProject } from '../../manager/actions/feeds'
import {
  addGtfsRow,
  updateGtfsField,
  deleteGtfsRow,
  saveGtfsRow,
  getGtfsTable,
  uploadGtfsFeed,
  downloadGtfsFeed,
  importGtfsFromGtfs,
  loadGtfsEntities,
  receiveGtfsEntities
} from '../actions/editor'

const mapStateToProps = (state, ownProps) => {

  let feedSourceId = ownProps.routeParams.feedSourceId
  let user = state.user
  // find the containing project
  let project = state.projects.all
    ? state.projects.all.find(p => {
        if (!p.feedSources) return false
        return (p.feedSources.findIndex(fs => fs.id === feedSourceId) !== -1)
      })
    : null

  let feedSource
  if (project) {
    feedSource = project.feedSources.find(fs => fs.id === feedSourceId)
  }

  return {
    tableData: state.editor.tableData,
    gtfsEntityLookup: state.editor.gtfsEntityLookup,
    validation: state.editor.validation,
    currentTable: state.routing.locationBeforeTransitions.hash ? state.routing.locationBeforeTransitions.hash.split('#')[1] : 'agency',
    feedSource,
    project,
    user
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const feedSourceId = ownProps.routeParams.feedSourceId
  const feedVersionId = ownProps.routeParams.feedVersionId

  return {
    onComponentMount: (initialProps) => {
      if(!initialProps.feedSource) dispatch(fetchFeedSourceAndProject(feedSourceId))
      if(!initialProps.tableData) dispatch(downloadGtfsFeed(feedVersionId))
      if (initialProps.currentTable) dispatch(getGtfsTable(initialProps.currentTable, feedSourceId))
    },
    newRowClicked: (tableId) => {
      dispatch(addGtfsRow(tableId))
    },
    deleteRowClicked: (tableId, rowIndex) => {
      dispatch(deleteGtfsRow(tableId, rowIndex))
    },
    getGtfsTable: (tableId, feedId) => {
      dispatch(getGtfsTable(tableId, feedId))
    },
    saveRowClicked: (tableId, rowIndex, feedId) => {
      dispatch(saveGtfsRow(tableId, rowIndex, feedId))
    },
    fieldEdited: (tableId, rowIndex, fieldName, newValue) => {
      dispatch(updateGtfsField(tableId, rowIndex, fieldName, newValue))
    },
    feedSaved: (file) => {
      dispatch(uploadGtfsFeed(feedVersionId, file))
      .then(() => {
        console.log('re-downloading');
        dispatch(downloadGtfsFeed(feedVersionId))
      })
    },
    newRowsDisplayed: (tableId, rows, feedSource) => {
      if(feedSource) dispatch(loadGtfsEntities(tableId, rows, feedSource))
    },
    gtfsEntitySelected: (type, entity) => {
      dispatch(receiveGtfsEntities([entity]))
    }
  }
}

const ActiveGtfsTableEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(GtfsTableEditor)

export default ActiveGtfsTableEditor
