import fetch from 'isomorphic-fetch'
import { browserHistory } from 'react-router'

import { isTokenExpired } from '../util/jwtHelper'
import UserPermissions from './UserPermissions'
import { getConfigProperty } from '../util/config'

// import '../../assets/mtc_manager_logo.png'

import icon from '../../assets/application_logo.png'

export default class Auth0Manager {

  constructor (props) {
    this.props = props
    this.lock = new Auth0Lock(props.client_id, props.domain)
    this.auth0 = new Auth0({clientID: props.client_id, domain: props.domain})
  }

  loggedIn () {
    // Checks if there is a saved token and it's still valid
    const token = this.getToken()
    return !!token && !isTokenExpired(token)
  }

  getToken () {
    // Retrieves the user token from localStorage
    return localStorage.getItem('userToken')
  }

  checkExistingLogin () {
    // Get the user token if we've saved it in localStorage before
    var userToken = this.getToken()

    if (userToken) return this.loginFromToken(userToken)

    // check if we have returned from an SSO redirect
    var hash = this.lock.parseHash()
    if (hash && hash.id_token) { // the user came back from the login (either SSO or regular login)
      // save the token
      localStorage.setItem('userToken', hash.id_token)

      // redirect to "targetUrl" if any
      let newLocation = hash.state || ''
      browserHistory.push(newLocation)

    } else {
      // check if logged in elsewhere via SSO
      this.auth0.getSSOData((err, data) => {
        if (!err && data.sso) {
          // there is! redirect to Auth0 for SSO
          this.lock.$auth0.signin({
            callbackOnLocationHash: true
          })
        } else { // assume that we are not logged in
        }
      })
    }

    return null
  }

  loginFromToken (token) {
    return fetch('https://' + this.props.domain + '/tokeninfo?id_token=' + token, {
      method: 'post'
    }).then((res) => {
      if(res.status >= 400) { // check for bad response, generally an expired token
        // TODO: better handling of expired tokens
        return this.loginViaLock({closable: false})
      }
      return res.json()
    }).then((profile) => {
      return constructUserObj(token, profile)
    }).catch((err) => {
      console.log('error getting profile', err)
    })
  }

  loginViaLock (additionalLockOptions) {
    return new Promise((resolve, reject) => {
      var lockOptions = {
        connections: ['Username-Password-Authentication'],
        // callbackURL: getConfigProperty('application.url'),
        icon: getConfigProperty('application.logo') ? getConfigProperty('application.logo') : icon,
        disableSignupAction: true,
        // disableResetAction: true,
        authParams: {
          state: window.location.href
        },
        ...additionalLockOptions
      }
      if (this.props.logo) lockOptions.icon = this.props.logo
      this.lock.show(lockOptions, (err, profile, token) => {
        if (err) {
          console.log('Error w/ lock login', err)
          reject(err)
        }
        // save token to localStorage
        localStorage.setItem('userToken', token)

        // initialize auto log out check
        // this.setupSingleLogout()

        //this.userLoggedIn(token, profile)
        resolve(constructUserObj(token, profile))
      })
    })
  }

  logout () {
    localStorage.removeItem('userToken')
    var redirect = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port: '')
    window.location.replace('https://' + this.props.domain + '/v2/logout?returnTo=' + redirect)
  }

  resetPassword() {
    this.lock.showReset((err) => {
      if (!err) this.lock.hide()
    })
  }

  setupSingleLogout () {
    setInterval(() => {
      // if the token is not in local storage, there is nothing to check (i.e. the user is already logged out)
      if (!localStorage.getItem('userToken')) return

      this.auth0.getSSOData((err, data) => {
        // if there is still a session, do nothing
        if (err || (data && data.sso)) return

        // if we get here, it means there is no session on Auth0,
        // then remove the token and redirect to #login
        localStorage.removeItem('userToken')
        window.location.href = '/'
      })
    }, 5000)
  }
}

function constructUserObj (token, profile) {
  return {
    token,
    profile,
    permissions: new UserPermissions(profile.app_metadata.datatools)
  }
}

module.exports = Auth0Manager
