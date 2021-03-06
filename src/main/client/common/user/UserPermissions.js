import { getConfigProperty } from '../util/config'

export default class UserPermissions {
  constructor (datatoolsApps) {
    // check for map of datatools apps and get the right application
    const datatoolsJson = datatoolsApps && datatoolsApps.constructor === Array
      ? datatoolsApps.find(dt => dt.client_id === getConfigProperty('auth0.client_id'))
      : datatoolsApps
    this.appPermissionLookup = {}
    if (datatoolsJson && datatoolsJson.permissions) {
      for (var appPermission of datatoolsJson.permissions) {
        this.appPermissionLookup[appPermission.type] = appPermission
      }
    }

    this.projectLookup = {}
    if (datatoolsJson && datatoolsJson.projects) {
      for (var project of datatoolsJson.projects) {
        this.projectLookup[project.project_id] = project
      }
    }
  }

  isApplicationAdmin () {
    return ('administer-application' in this.appPermissionLookup)
  }

  hasProject (projectId) {
    return (projectId in this.projectLookup)
  }

  isProjectAdmin (projectId) {
    if (this.isApplicationAdmin()) return true
    return this.hasProject(projectId) && this.getProjectPermission(projectId, 'administer-project') != null
  }

  getProjectPermissions (projectId) {
    if (!this.hasProject(projectId)) return null
    return this.projectLookup[projectId].permissions
  }

  getProjectDefaultFeeds (projectId) {
    if (!this.hasProject(projectId)) return null
    return this.projectLookup[projectId].defaultFeeds || []
  }

  hasProjectPermission (projectId, permissionType) {
    if (this.isProjectAdmin(projectId)) return true
    let p = this.getProjectPermission(projectId, permissionType)
    return (p !== null)
  }

  getProjectPermission (projectId, permissionType) {
    if (!this.hasProject(projectId)) return null
    var projectPermissions = this.getProjectPermissions(projectId)
    for (var permission of projectPermissions) {
      if (permission.type === permissionType) return permission
    }
    return null
  }

  hasFeed (listOfFeeds, feedId) {
    if (listOfFeeds.indexOf('*') > -1) return true
    else if (listOfFeeds.indexOf(feedId) > -1) return true
    return null
  }

  hasFeedPermission (projectId, feedId, permissionType) {
    if (this.isProjectAdmin(projectId)) return true
    let p = this.getProjectPermission(projectId, permissionType)
    if (p !== null) {
      let defaultFeeds = this.getProjectDefaultFeeds(projectId)
      let permissionFeeds = p.feeds || []
      if (this.hasFeed(defaultFeeds, feedId)) return true
      if (this.hasFeed(permissionFeeds, feedId)) return true
    }
    return null
  }
}

module.exports = UserPermissions
