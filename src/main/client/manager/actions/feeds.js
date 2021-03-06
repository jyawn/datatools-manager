import { secureFetch } from '../../common/util/util'
import { fetchProject, fetchProjectWithFeeds } from './projects'
import { setErrorMessage, startJobMonitor } from './status'
import { fetchSnapshots } from '../../editor/actions/snapshots'
// Feed Source Actions

export function requestingFeedSources () {
  return {
    type: 'REQUESTING_FEEDSOURCES'
  }
}

export function receiveFeedSources (projectId, feedSources) {
  return {
    type: 'RECEIVE_FEEDSOURCES',
    projectId,
    feedSources
  }
}

export function fetchProjectFeeds (projectId) {
  return function (dispatch, getState) {
    dispatch(requestingFeedSources())
    const url = '/api/manager/secure/feedsource?projectId=' + projectId
    return secureFetch(url, getState())
      .then(response => response.json())
      .then(feedSources => {
        dispatch(receiveFeedSources(projectId, feedSources))
      })
  }
}

export function fetchUserFeeds (userId) {
  return function (dispatch, getState) {
    dispatch(requestingFeedSources())
    const url = '/api/manager/secure/feedsource?userId=' + userId
    return secureFetch(url, getState())
      .then(response => response.json())
      .then(feedSources => {
        dispatch(receiveFeedSources(feedSources))
      })
  }
}

function requestingPublicFeeds () {
  return {
    type: 'REQUESTING_PUBLIC_FEEDS'
  }
}

function receivePublicFeeds (feeds) {
  return {
    type: 'RECEIVE_PUBLIC_FEEDS',
    feeds
  }
}

export function createFeedSource (projectId) {
  return {
    type: 'CREATE_FEEDSOURCE',
    projectId
  }
}

export function savingFeedSource () {
  return {
    type: 'SAVING_FEEDSOURCE'
  }
}

export function saveFeedSource (props) {
  return function (dispatch, getState) {
    dispatch(savingFeedSource())
    const url = '/api/manager/secure/feedsource'
    return secureFetch(url, getState(), 'post', props)
      .then((res) => {
        return dispatch(fetchProjectWithFeeds(props.projectId))
      })
  }
}

export function updateFeedSource (feedSource, changes) {
  return function (dispatch, getState) {
    dispatch(savingFeedSource())
    const url = '/api/manager/secure/feedsource/' + feedSource.id
    return secureFetch(url, getState(), 'put', changes)
      .then((res) => {
        if (res.status >= 400) {
          console.log(res.json())
          dispatch(setErrorMessage('Error updating feed source.'))
        }
        //return dispatch(fetchProjectFeeds(feedSource.projectId))
        return dispatch(fetchFeedSource(feedSource.id, true))
      })
  }
}

export function updateExternalFeedResource (feedSource, resourceType, properties) {
  return function (dispatch, getState) {
    console.log('updateExternalFeedResource', feedSource, resourceType, properties);
    dispatch(savingFeedSource())
    const url = `/api/manager/secure/feedsource/${feedSource.id}/updateExternal?resourceType=${resourceType}`
    return secureFetch(url, getState(), 'put', properties)
      .then((res) => {
        return dispatch(fetchFeedSource(feedSource.id, true))
      })
  }
}


export function deletingFeedSource (feedSource) {
  return {
    type: 'DELETING_FEEDSOURCE',
    feedSource
  }
}

export function deleteFeedSource (feedSource, changes) {
  return function (dispatch, getState) {
    dispatch(deletingFeedSource(feedSource))
    const url = '/api/manager/secure/feedsource/' + feedSource.id
    return secureFetch(url, getState(), 'delete')
      .then((res) => {
        // if (res.status >= 400) {
        //   return dispatch(setErrorMessage('Error deleting feed source'))
        // }
        return dispatch(fetchProjectFeeds(feedSource.projectId))
      })
  }
}

export function requestingFeedSource () {
  return {
    type: 'REQUESTING_FEEDSOURCE'
  }
}

export function receiveFeedSource (feedSource) {
  return {
    type: 'RECEIVE_FEEDSOURCE',
    feedSource
  }
}

export function fetchFeedSource (feedSourceId, fetchVersions) {
  return function (dispatch, getState) {
    console.log('fetchFeedSource', feedSourceId)
    dispatch(requestingFeedSource())
    const url = '/api/manager/secure/feedsource/' + feedSourceId
    return secureFetch(url, getState())
      .then(res => {
        if (res.status >= 400) {
          // dispatch(setErrorMessage('Error getting feed source'))
          console.log('error getting feed source')
          return null
        }
        return res.json()
      })
      .then(feedSource => {
        if (!feedSource) {
          dispatch(receiveFeedSource(feedSource))
          return feedSource
        }
        console.log('got feedSource', feedSource)
        dispatch(receiveFeedSource(feedSource))
        if(fetchVersions) dispatch(fetchFeedVersions(feedSource))
        return feedSource
      })
  }
}

export function fetchFeedSourceAndProject (feedSourceId, unsecured) {
  return function (dispatch, getState) {
    dispatch(requestingFeedSource())
    const apiRoot = unsecured ? 'public' : 'secure'
    const url = `/api/manager/${apiRoot}/feedsource/${feedSourceId}`
    return secureFetch(url, getState())
      .then(res => {
        if (res.status >= 400) {
          // dispatch(setErrorMessage('Error getting feed source'))
          console.log('error getting feed source')
          return null
        }
        return res.json()
      })
      .then(feedSource => {
        if (!feedSource) {
          dispatch(receiveFeedSource(feedSource))
          return feedSource
        }
        return dispatch(fetchProject(feedSource.projectId, unsecured))
          .then(proj => {
            dispatch(receiveFeedSource(feedSource))
            return feedSource
          })
      })
  }
}

export function fetchPublicFeedSource (feedSourceId) {
  return function (dispatch, getState) {
    dispatch(requestingFeedSource())
    const url = '/api/manager/public/feedsource/' + feedSourceId
    return secureFetch(url, getState())
      .then(response => response.json())
      .then(feedSource => {
        dispatch(receivePublicFeeds())
        return feedSource
      })
  }
}

export function runningFetchFeed () {
  return {
    type: 'RUNNING_FETCH_FEED'
  }
}

export function receivedFetchFeed (feedSource) {
  return {
    type: 'RECEIVED_FETCH_FEED',
    feedSource
  }
}

export function runFetchFeed (feedSource) {
  return function (dispatch, getState) {
    dispatch(runningFetchFeed())
    const url = `/api/manager/secure/feedsource/${feedSource.id}/fetch`
    return secureFetch(url, getState(), 'post')
      .then(res => {
        if (res.status === 304) {
          dispatch(feedNotModified(feedSource, 'Feed fetch cancelled because it matches latest feed version.'))
        }
        else if (res.status >= 400) {
          dispatch(setErrorMessage('Error fetching feed source'))
        }
        else {
          dispatch(receivedFetchFeed(feedSource))
          dispatch(startJobMonitor())
          return res.json()
        }
      })
      .then(result => {
        console.log('fetchFeed result', result)
        // fetch feed source with versions
        return dispatch(fetchFeedSource(feedSource.id, true))
      })
  }
}

//**  FEED VERSION ACTIONS **//

// Get all FeedVersions for FeedSource

export function requestingFeedVersions () {
  return {
    type: 'REQUESTING_FEEDVERSIONS'
  }
}

export function receiveFeedVersions (feedSource, feedVersions) {
  return {
    type: 'RECEIVE_FEEDVERSIONS',
    feedSource,
    feedVersions
  }
}

export function fetchFeedVersions (feedSource, unsecured) {
  return function (dispatch, getState) {
    dispatch(requestingFeedVersions())
    const apiRoot = unsecured ? 'public' : 'secure'
    const url = `/api/manager/${apiRoot}/feedversion?feedSourceId=${feedSource.id}`
    return secureFetch(url, getState())
      .then(response => response.json())
      .then(versions => {
        dispatch(receiveFeedVersions(feedSource, versions))
        return versions
      })
  }
}


export function requestingFeedVersion () {
  return {
    type: 'REQUESTING_FEEDVERSION'
  }
}

export function receiveFeedVersion (feedVersion) {
  return {
    type: 'RECEIVE_FEEDVERSION',
    feedVersion
  }
}

export function fetchFeedVersion (feedVersionId) {
  return function (dispatch, getState) {
    dispatch(requestingFeedVersion())
    const url = `/api/manager/secure/feedversion/${feedVersionId}`
    return secureFetch(url, getState())
      .then(response => response.json())
      .then(version => {
        return dispatch(receiveFeedVersion(version))
      })
  }
}


export function fetchPublicFeedVersions (feedSource) {
  return function (dispatch, getState) {
    dispatch(requestingFeedVersions())
    const url = `/api/manager/public/feedversion?feedSourceId=${feedSource.id}&public=true`
    return secureFetch(url, getState())
      .then(response => response.json())
      .then(versions => {
        dispatch(receiveFeedVersions(feedSource, versions))
      })
  }
}

// Upload a GTFS File as a new FeedVersion

export function uploadingFeed () {
  return {
    type: 'UPLOADING_FEED'
  }
}

export function uploadedFeed (feedSource) {
  return {
    type: 'UPLOADED_FEED',
    feedSource
  }
}

export function feedNotModified (feedSource, message) {
  return {
    type: 'FEED_NOT_MODIFIED',
    feedSource,
    message
  }
}

export function uploadFeed (feedSource, file) {
  return function (dispatch, getState) {
    dispatch(uploadingFeed())
    const url = `/api/manager/secure/feedversion?feedSourceId=${feedSource.id}`

    var data = new FormData()
    data.append('file', file)

    return fetch(url, {
      method: 'post',
      headers: { 'Authorization': 'Bearer ' + getState().user.token },
      body: data
    }).then(res => {
      if (res.status === 304) {
        dispatch(feedNotModified(feedSource, 'Feed upload cancelled because it matches latest feed version.'))
      }
      else if (res.status >= 400) {
        dispatch(setErrorMessage('Error uploading feed source'))
      }
      else {
        dispatch(uploadedFeed(feedSource))
        dispatch(startJobMonitor())
      }
      console.log('uploadFeed result', res)

      // fetch feed source with versions
      return dispatch(fetchFeedSource(feedSource.id, true))
    })
  }
}

// Delete an existing FeedVersion

export function deletingFeedVersion () {
  return {
    type: 'DELETING_FEEDVERSION'
  }
}

export function deleteFeedVersion (feedVersion, changes) {
  return function (dispatch, getState) {
    dispatch(deletingFeedVersion())
    const url = '/api/manager/secure/feedversion/' + feedVersion.id
    return secureFetch(url, getState(), 'delete')
      .then((res) => {
        // fetch feed source with versions
        return dispatch(fetchFeedSource(feedVersion.feedSource.id, true))
      })
  }
}

// Get GTFS validation results for a FeedVersion

export function requestingValidationResult () {
  return {
    type: 'REQUESTING_VALIDATION_RESULT'
  }
}

export function receiveValidationResult (feedVersion, validationResult) {
  return {
    type: 'RECEIVE_VALIDATION_RESULT',
    feedVersion,
    validationResult
  }
}

export function fetchValidationResult (feedVersion, isPublic) {
  return function (dispatch, getState) {
    dispatch(requestingValidationResult())
    const route = isPublic ? 'public' : 'secure'
    const url = `/api/manager/${route}/feedversion/${feedVersion.id}/validation`
    return secureFetch(url, getState())
    .then(response => response.json())
    .then(result => {
      dispatch(receiveValidationResult(feedVersion, result))
    })
  }
}

// Request a FeedVersion isochrone

export function requestingFeedVersionIsochrones () {
  return {
    type: 'REQUESTING_FEEDVERSION_ISOCHRONES'
  }
}

export function receiveFeedVersionIsochrones (feedSource, feedVersion, isochrones) {
  return {
    type: 'RECEIVE_FEEDVERSION_ISOCHRONES',
    feedSource,
    feedVersion,
    isochrones
  }
}

export function fetchFeedVersionIsochrones (feedVersion, fromLat, fromLon, toLat, toLon) {
  return function (dispatch, getState) {
    dispatch(requestingFeedVersionIsochrones())
    const url = `/api/manager/secure/feedversion/${feedVersion.id}/isochrones?fromLat=${fromLat}&fromLon=${fromLon}&toLat=${toLat}&toLon=${toLon}`
    return secureFetch(url, getState())
      .then(response => response.json())
      .then(isochrones => {
        console.log('received isochrones ', isochrones)
        dispatch(receiveFeedVersionIsochrones(feedVersion.feedSource, feedVersion, isochrones))
        return isochrones
      })
  }
}

// Download a GTFS file for a FeedVersion

export function downloadFeedViaToken (feedVersion, isPublic) {
  return function (dispatch, getState) {
    const route = isPublic ? 'public' : 'secure'
    const url = `/api/manager/${route}/feedversion/${feedVersion.id}/downloadtoken`
    secureFetch(url, getState())
    .then(response => response.json())
    .then(result => {
      window.location.assign(`/api/manager/downloadfeed/${result.id}`)
    })
  }
}

// Create a Feed Version from an editor snapshot

export function creatingFeedVersionFromSnapshot () {
  return {
    type: 'CREATING_FEEDVERSION_FROM_SNAPSHOT'
  }
}

export function createFeedVersionFromSnapshot (feedSource, snapshotId) {
  return function (dispatch, getState) {
    dispatch(creatingFeedVersionFromSnapshot())
    const url = `/api/manager/secure/feedversion/fromsnapshot?feedSourceId=${feedSource.id}&snapshotId=${snapshotId}`
    return secureFetch(url, getState(), 'post')
      .then((res) => {
        dispatch(startJobMonitor())
      })
  }
}

// Create a Feed Version from an editor snapshot

export function renamingFeedVersion () {
  return {
    type: 'RENAMING_FEEDVERSION'
  }
}

export function renameFeedVersion (feedSource, feedVersion, name) {
  return function (dispatch, getState) {
    dispatch(renamingFeedVersion())
    const url = `/api/manager/secure/feedversion/${feedVersion.id}/rename?name=${name}`
    return secureFetch(url, getState(), 'put')
      .then((res) => {
        dispatch(fetchFeedVersions(feedSource))
      })
  }
}

//** NOTES ACTIONS **//

export function requestingNotes () {
  return {
    type: 'REQUESTING_NOTES'
  }
}

export function receiveNotesForFeedSource (feedSource, notes) {
  return {
    type: 'RECEIVE_NOTES_FOR_FEEDSOURCE',
    feedSource,
    notes
  }
}

export function fetchNotesForFeedSource (feedSource) {
  return function (dispatch, getState) {
    dispatch(requestingNotes())
    const url = `/api/manager/secure/note?type=FEED_SOURCE&objectId=${feedSource.id}`
    secureFetch(url, getState())
    .then(response => response.json())
    .then(notes => {
      dispatch(receiveNotesForFeedSource(feedSource, notes))
    })
  }
}

export function postNoteForFeedSource (feedSource, note) {
  return function (dispatch, getState) {
    const url = `/api/manager/secure/note?type=FEED_SOURCE&objectId=${feedSource.id}`
    secureFetch(url, getState(), 'post', note)
    .then(response => response.json())
    .then(note => {
      dispatch(fetchNotesForFeedSource(feedSource))
    })
  }
}

export function receiveNotesForFeedVersion (feedVersion, notes) {
  return {
    type: 'RECEIVE_NOTES_FOR_FEEDVERSION',
    feedVersion,
    notes
  }
}

export function fetchNotesForFeedVersion (feedVersion) {
  return function (dispatch, getState) {
    dispatch(requestingNotes())
    const url = `/api/manager/secure/note?type=FEED_VERSION&objectId=${feedVersion.id}`
    secureFetch(url, getState())
    .then(response => response.json())
    .then(notes => {
      dispatch(receiveNotesForFeedVersion(feedVersion, notes))
    })
  }
}

export function postNoteForFeedVersion (feedVersion, note) {
  return function (dispatch, getState) {
    const url = `/api/manager/secure/note?type=FEED_VERSION&objectId=${feedVersion.id}`
    secureFetch(url, getState(), 'post', note)
    .then(response => response.json())
    .then(note => {
      dispatch(fetchNotesForFeedVersion(feedVersion))
    })
  }
}
