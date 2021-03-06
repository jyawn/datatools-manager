import { connect } from 'react-redux'
import { browserHistory } from 'react-router'

import FeedSourceViewer from '../components/FeedSourceViewer'

import { createFeedInfo } from '../../editor/actions/feedInfo'

import {
  deleteFeedVersion,
  downloadFeedViaToken,
  fetchFeedSourceAndProject,
  fetchFeedSource,
  fetchFeedVersions,
  fetchNotesForFeedSource,
  fetchNotesForFeedVersion,
  fetchValidationResult,
  postNoteForFeedSource,
  postNoteForFeedVersion,
  renameFeedVersion,
  runFetchFeed,
  updateExternalFeedResource,
  uploadFeed,
  updateFeedSource
} from '../actions/feeds'

import { updateTargetForSubscription } from '../../manager/actions/user'
import { createDeploymentFromFeedSource } from '../../manager/actions/deployments'
import { loadFeedVersionForEditing } from '../../editor/actions/snapshots'
import { downloadGtfsPlusFeed } from '../../gtfsplus/actions/gtfsplus'

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
  } else if (!project && !state.projects.isFetching) {
    feedSource = null
  }
  let isFetching = state.projects.isFetching
  /*let feedVersionIndex
  let routeVersionIndex = +ownProps.routeParams.feedVersionIndex
  let hasVersionIndex = typeof ownProps.routeParams.feedVersionIndex !== 'undefined'
  if (feedSource && typeof feedSource.feedVersions !== 'undefined') {
    if ((hasVersionIndex && isNaN(routeVersionIndex)) || routeVersionIndex > feedSource.feedVersions.length || routeVersionIndex < 0) {
      console.log(`version index ${routeVersionIndex} is invalid`)
      // cannot use browserHistory.push in middle of state transition
      // browserHistory.push(`/feed/${feedSourceId}`)
      window.location.href = `/feed/${feedSourceId}`
    } else {
      feedVersionIndex = hasVersionIndex
        ? routeVersionIndex
        : feedSource.feedVersions.length
    }
  }*/
  return {
    feedSource,
    feedSourceId,
    //feedVersionIndex,
    activeComponent: ownProps.routeParams.subpage,
    activeSubComponent: ownProps.routeParams.subsubpage,
    project,
    user,
    isFetching
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const feedSourceId = ownProps.routeParams.feedSourceId
  return {
    createDeployment: (feedSource) => {
      dispatch(createDeploymentFromFeedSource(feedSource))
      .then((deployment) => {
        browserHistory.push(`/deployment/${deployment.id}`)
      })
    },
    loadFeedVersionForEditing: (feedVersion) => {
      dispatch(loadFeedVersionForEditing(feedVersion))
    },
    deleteFeedVersionConfirmed: (feedSource, feedVersion) => {
      dispatch(deleteFeedVersion(feedSource, feedVersion))
    },
    downloadFeedClicked: (feedVersion) => { dispatch(downloadFeedViaToken(feedVersion)) },
    externalPropertyChanged: (feedSource, resourceType, propName, newValue) => {
      dispatch(updateExternalFeedResource(feedSource, resourceType, { [propName]: newValue }))
    },
    feedSourcePropertyChanged: (feedSource, propName, newValue) => {
      return dispatch(updateFeedSource(feedSource, { [propName]: newValue }))
    },
    feedVersionRenamed: (feedSource, feedVersion, name) => {
      dispatch(renameFeedVersion(feedSource, feedVersion, name))
    },
    gtfsPlusDataRequested: (feedVersion) => {
      dispatch(downloadGtfsPlusFeed(feedVersion.id))
    },
    newNotePostedForFeedSource: (feedSource, note) => {
      dispatch(postNoteForFeedSource(feedSource, note))
    },
    newNotePostedForVersion: (version, note) => {
      dispatch(postNoteForFeedVersion(version, note))
    },
    notesRequestedForFeedSource: (feedSource) => {
      dispatch(fetchNotesForFeedSource(feedSource))
    },
    notesRequestedForVersion: (feedVersion) => {
      dispatch(fetchNotesForFeedVersion(feedVersion))
    },
    onComponentMount: (initialProps) => {
      let unsecured = true
      if (initialProps.user.profile !== null) {
        unsecured = false
      }
      if (!initialProps.project) {
        dispatch(fetchFeedSourceAndProject(feedSourceId, unsecured))
        .then((feedSource) => {
          // go back to projects list if no feed source found
          if (!feedSource) {
            // browserHistory.push('/project')
            return null
          }
          return dispatch(fetchFeedVersions(feedSource, unsecured))
        })
      } else if (!initialProps.feedSource) {
        dispatch(fetchFeedSource(feedSourceId, unsecured))
        .then((feedSource) => {
          return dispatch(fetchFeedVersions(feedSource, unsecured))
        })
      } else if (!initialProps.feedSource.versions) {
        dispatch(fetchFeedVersions(initialProps.feedSource, unsecured))
      }
    },
    componentDidUpdate: (prevProps, newProps) => {
      let unsecured = true
      if (newProps.user.profile !== null) {
        unsecured = false
      }
      if (prevProps.feedSource && newProps.feedSource && prevProps.feedSource.id !== newProps.feedSource.id) {
        dispatch(fetchFeedSource(feedSourceId, unsecured))
        .then((feedSource) => {
          return dispatch(fetchFeedVersions(feedSource, unsecured))
        })
      }
    },
    fetchFeed: (feedSource) => { dispatch(runFetchFeed(feedSource)) },
    updateUserSubscription: (profile, target, subscriptionType) => { dispatch(updateTargetForSubscription(profile, target, subscriptionType)) },
    uploadFeed: (feedSource, file) => { dispatch(uploadFeed(feedSource, file)) },
    fetchValidationResult: (feedSource, feedVersion) => {
      dispatch(fetchValidationResult(feedVersion))
    },
    createFeedInfo: (feedSourceId) => {
      dispatch(createFeedInfo(feedSourceId))
    }
  }
}

const ActiveFeedSourceViewer = connect(
  mapStateToProps,
  mapDispatchToProps
)(FeedSourceViewer)

export default ActiveFeedSourceViewer
