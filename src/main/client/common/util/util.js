import { UserAuthWrapper } from 'redux-auth-wrapper'
import { routerActions, push } from 'react-router-redux'
import fetch from 'isomorphic-fetch'
import { setErrorMessage } from '../../manager/actions/status'

export function defaultSorter(a, b) {
  if(a.isCreating && !b.isCreating) return -1
  if(!a.isCreating && b.isCreating) return 1
  if(a.name.toLowerCase() < b.name.toLowerCase()) return -1
  if(a.name.toLowerCase() > b.name.toLowerCase()) return 1
  return 0
}

export function versionsSorter (a, b) {
  // if(a.isCreating && !b.isCreating) return -1
  // if(!a.isCreating && b.isCreating) return 1
  if(a.feedSource.name < b.feedSource.name) return -1
  if(a.feedSource.name > b.feedSource.name) return 1
  return 0
}

export function retrievalMethodString (method) {
  switch (method) {
    case 'MANUALLY_UPLOADED': return 'Manually Uploaded'
    case 'FETCHED_AUTOMATICALLY': return 'Fetched Automatically'
    case 'PRODUCED_IN_HOUSE': return 'Produced In-house'
  }
}

export function secureFetch (url, state, method, payload, raw) {
  // return function (dispatch, getState) {
  var opts = {
    method: method || 'get',
    headers: {
      'Authorization': 'Bearer ' + state.user.token,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
  if (payload) opts.body = JSON.stringify(payload)
  return fetch(url, opts)
    // .then(res => {
    //   // if raw response is requested
    //   if (raw) return res
    //
    //   // check for errors
    //   if (res.status >= 500) {
    //     dispatch(setErrorMessage('Network error!'))
    //     return null
    //   } else if (res.status >= 300) {
    //     res.text().then(text => {
    //       dispatch(setErrorMessage(text))
    //     })
    //     return null
    //   } else {
    //     return res.json()
    //   }
    // })
  // }
}

export function generateUID () {
    return ('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4)
}

export function generateRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateRandomColor () {
    var letters = '0123456789ABCDEF'.split('')
    var color = ''
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}
// export function invertHex (hexnum) {
//   if(hexnum.length != 6) {
//     alert('Hex color must be six hex numbers in length.')
//     return false
//   }
//
//   hexnum = hexnum.toUpperCase()
//   var splitnum = hexnum.split('')
//   var resultnum = ''
//   var simplenum = 'FEDCBA9876'.split('')
//   var complexnum = new Array()
//   complexnum.A = '5'
//   complexnum.B = '4'
//   complexnum.C = '3'
//   complexnum.D = '2'
//   complexnum.E = '1'
//   complexnum.F = '0'
//
//   for(var i=0; i<6; i++){
//     if(!isNaN(splitnum[i])) {
//       resultnum += simplenum[splitnum[i]]
//     } else if(complexnum[splitnum[i]]){
//       resultnum += complexnum[splitnum[i]]
//     } else {
//       alert('Hex colors must only include hex numbers 0-9, and A-F')
//       return false
//     }
//   }
//
//   return resultnum
// }
export function idealTextColor (bgColor) {
  var nThreshold = 105
  var components = getRGBComponents(bgColor)
  var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114)

  return ((255 - bgDelta) < nThreshold) ? '000000' : 'FFFFFF'
}

function getRGBComponents(color) {

    var r = color.substring(1, 3)
    var g = color.substring(3, 5)
    var b = color.substring(5, 7)

    return {
       R: parseInt(r, 16),
       G: parseInt(g, 16),
       B: parseInt(b, 16)
    }
}
// export const UserIsAuthenticated = UserAuthWrapper({
//   authSelector: state => state.user,
//   predicate: user => user.profile !== null,
//   // redirectAction: routerPush,
//   failureRedirectPath: '/',
//   allowRedirectBack: false,
//   wrapperDisplayName: 'UserIsAuthenticated'
// })
//
// export const UserIsAdmin = UserAuthWrapper({
//   authSelector: state => state.user,
//   predicate: user => user.permissions && user.permissions.isApplicationAdmin(),
//   // redirectAction: routerPush,
//   failureRedirectPath: '/',
//   allowRedirectBack: false,
//   wrapperDisplayName: 'UserIsAdmin'
// })

export function isValidZipFile (file) {
  let nameArray = file.name.split('.')
  return (
    ( // check for various possible zip file types
      file.type === 'application/zip' ||
      file.type === 'application/x-zip' ||
      file.type === 'application/octet-stream' ||
      file.type === 'application/x-zip-compressed'
    ) && nameArray[nameArray.length - 1] === 'zip'
  )
}
