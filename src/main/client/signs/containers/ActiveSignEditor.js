import React from 'react'
import { connect } from 'react-redux'

import { fetchProjects } from '../actions/projects'
import { saveSign, deleteSign, createSign, setActiveSign, createDisplay } from '../actions/signs'
import { setActiveTitle, setActiveDescription, setActiveUrl, setActiveCause,
  setActiveEffect, setActiveStart, setActiveEnd, setActivePublished,
  addActiveEntity, deleteActiveEntity, updateActiveEntity, updateDisplays,
  toggleConfigForDisplay } from '../actions/activeSign'

import SignEditor from '../components/SignEditor'
import { browserHistory } from 'react-router'
import { getFeedsForPermission } from '../../common/util/permissions'

import '../style.css'

const agencyCompare = function(a, b) {
  if (a.name < b.name)
    return -1;
  if (a.name > b.name)
    return 1;
  return 0;
}
const mapStateToProps = (state, ownProps) => {
  return {
    sign: state.activeSign,
    activeFeeds: state.gtfsFilter.activeFeeds,
    project: state.projects.active,
    user: state.user,
    editableFeeds: getFeedsForPermission(state.projects.active, state.user, 'edit-etid'),
    publishableFeeds: getFeedsForPermission(state.projects.active, state.user, 'approve-etid')
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onComponentMount: (initialProps) => {
      const signId = initialProps.location.pathname.split('/sign/')[1]
      console.log(signId)
      if (initialProps.sign)
        return

      if (!signId) {
        console.log('sign', initialProps.sign)
        dispatch(fetchProjects())
        .then((activeProject) => {
          console.log('done fetching projects')
          if (!initialProps.user.permissions.hasProjectPermission(activeProject.id, 'edit-etid')){
            console.log('cannot create sign!')
            browserHistory.push('/signs')
            return
          }
          return dispatch(createSign())
        })
      }
      else {
        console.log('need to set active sign')
        dispatch(fetchProjects())
        .then((activeProject) => {
          console.log('done fetching projects')
          if (!initialProps.user.permissions.hasProjectPermission(activeProject.id, 'edit-etid')){
            console.log('cannot create sign!')
            browserHistory.push('/signs')
            return
          }
          console.log('getting', signId)
          dispatch(setActiveSign(+signId))
        })
      }
    },
    createDisplay: (displayName) => dispatch(createDisplay(displayName)),
    updateDisplays: (displayList) => dispatch(updateDisplays(displayList)),
    toggleConfigForDisplay: (display, configType, draftConfigId) => dispatch(toggleConfigForDisplay(display, configType, draftConfigId)),
    onSaveClick: (sign) => dispatch(saveSign(sign)),
    onDeleteClick: (sign) => dispatch(deleteSign(sign)),
    onPublishClick: (sign, published) => dispatch(setActivePublished(published)),
    titleChanged: (title) => dispatch(setActiveTitle(title)),
    // descriptionChanged: (description) => dispatch(setActiveDescription(description)),
    urlChanged: (title) => dispatch(setActiveUrl(title)),
    causeChanged: (cause) => dispatch(setActiveCause(cause)),
    effectChanged: (effect) => dispatch(setActiveEffect(effect)),
    startChanged: (start) => dispatch(setActiveStart(start)),
    endChanged: (end) => dispatch(setActiveEnd(end)),
    onAddEntityClick: (type, value, agency, newEntityId) => dispatch(addActiveEntity(type, value, agency, newEntityId)),
    onDeleteEntityClick: (entity) => dispatch(deleteActiveEntity(entity)),
    entityUpdated: (entity, field, value, agency) => dispatch(updateActiveEntity(entity, field, value, agency)),

    editorStopClick: (stop, agency, newEntityId) => dispatch(addActiveEntity('STOP', stop, agency, newEntityId)),
    editorRouteClick: (route, agency, newEntityId) => dispatch(addActiveEntity('ROUTE', route, agency, newEntityId))
  }
}

const ActiveSignEditor = connect(
  mapStateToProps,
  mapDispatchToProps
)(SignEditor)

export default ActiveSignEditor
