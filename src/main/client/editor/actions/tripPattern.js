import { secureFetch } from '../../common/util/util'
import { setErrorMessage } from '../../manager/actions/status'
import { setActiveGtfsEntity } from './editor'

//// TRIP PATTERNS

export function requestingTripPatterns (feedId) {
  return {
    type: 'REQUESTING_TRIP_PATTERNS',
    feedId
  }
}

export function receiveTripPatterns (feedId, tripPatterns) {
  return {
    type: 'RECEIVE_TRIP_PATTERNS',
    feedId,
    tripPatterns
  }
}

export function fetchTripPatterns (feedId) {
  return function (dispatch, getState) {
    dispatch(requestingTripPatternsForRoute(feedId))
    const url = `/api/manager/secure/trippattern?feedId=${feedId}`
    return secureFetch(url, getState())
      .then(res => {
        if (res.status >= 400) return []
        return res.json()
      })
      .then(tripPatterns => {
        dispatch(receiveTripPatterns(feedId, tripPatterns))
        return tripPatterns
      })
  }
}

export function undoActiveTripPatternEdits () {
  return {
    type: 'UNDO_TRIP_PATTERN_EDITS'
  }
}

export function addControlPoint (controlPoint, index) {
  return {
    type: 'ADD_CONTROL_POINT',
    controlPoint,
    index
  }
}

export function removeControlPoint (index) {
  return {
    type: 'REMOVE_CONTROL_POINT',
    index
  }
}

export function updateControlPoint (index, point, distance) {
  return {
    type: 'UPDATE_CONTROL_POINT',
    index,
    point,
    distance
  }
}

// TODO: merge the following with the above?

export function requestingTripPatternsForRoute (feedId, routeId) {
  return {
    type: 'REQUESTING_TRIP_PATTERNS_FOR_ROUTE',
    feedId,
    routeId
  }
}

export function receiveTripPatternsForRoute (feedId, routeId, tripPatterns) {
  return {
    type: 'RECEIVE_TRIP_PATTERNS_FOR_ROUTE',
    feedId,
    routeId,
    tripPatterns
  }
}

export function fetchTripPatternsForRoute (feedId, routeId) {
  return function (dispatch, getState) {
    if (routeId === 'new') {
      return []
    }
    dispatch(requestingTripPatternsForRoute(feedId))
    const url = `/api/manager/secure/trippattern?feedId=${feedId}&routeId=${routeId}`
    return secureFetch(url, getState())
      .then(res => {
        if (res.status >= 400) {
          // dispatch(setErrorMessage('Error getting stops for trip pattern'))
          return []
        }
        return res.json()
      })
      .then(tripPatterns => {
        dispatch(receiveTripPatternsForRoute(feedId, routeId, tripPatterns))
        return tripPatterns
      })
  }
}

export function deletingTripPattern (feedId, tripPattern) {
  return {
    type: 'DELETING_TRIP_PATTERN',
    feedId,
    tripPattern
  }
}

export function deleteTripPattern (feedId, tripPattern) {
  return function (dispatch, getState) {
    dispatch(deletingTripPattern(feedId, tripPattern))
    const routeId = tripPattern.routeId
    if (tripPattern.id === 'new') {
      return dispatch(fetchTripPatternsForRoute(feedId, routeId))
    }
    const url = `/api/manager/secure/trippattern/${tripPattern.id}?feedId=${feedId}`
    return secureFetch(url, getState(), 'delete')
      .then(res => res.json())
      .then(tripPattern => {
        dispatch(fetchTripPatternsForRoute(feedId, routeId))
      })
  }
}

export function savedTripPattern (feedId, tripPattern) {
  return {
    type: 'SAVED_TRIP_PATTERN',
    feedId,
    tripPattern
  }
}

export function saveTripPattern (feedId, tripPattern) {
  return function (dispatch, getState) {
    const method = tripPattern.id !== 'new' ? 'put' : 'post'
    const routeId = tripPattern.routeId
    let data = {...tripPattern}
    const url = tripPattern.id !== 'new'
      ? `/api/manager/secure/trippattern/${tripPattern.id}?feedId=${feedId}`
      : `/api/manager/secure/trippattern?feedId=${feedId}`
    data.id = tripPattern.id === 'new' ? null : tripPattern.id
    return secureFetch(url, getState(), method, data)
      .then(res => {
        if (res.status >= 300) {
          dispatch(setErrorMessage('Error saving trip pattern'))
          return dispatch(fetchTripPatternsForRoute(feedId, routeId))
        }
        return res.json()
      })
      .then(tp => {
        dispatch(savedTripPattern(feedId, tripPattern))
        return dispatch(fetchTripPatternsForRoute(feedId, routeId))
          .then((tripPatterns) => {
            if (tripPattern.id === 'new') {
              dispatch(setActiveGtfsEntity(feedId, 'route', routeId, 'trippattern', tp.id))
            }
            return tp
          })
        // return tripPattern
      })
  }
}
