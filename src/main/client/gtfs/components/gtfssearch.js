import React, { PropTypes } from 'react'
import fetch from 'isomorphic-fetch'
import { Panel, Grid, Row, Col, Button, Glyphicon, Label } from 'react-bootstrap'
import { PureComponent, shallowEqual } from 'react-pure-render'
import { Map, Marker, Popup, TileLayer, Polyline, MapControl } from 'react-leaflet'
import Select from 'react-select'

import { getFeed, getFeedId } from '../../common/util/modules'

export default class GtfsSearch extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      value: this.props.value
    };
  }

  cacheOptions (options) {
    options.forEach(o => {
      this.options[o.value] = o.feature
    })
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.value !== nextProps.value && typeof this.props.value !== 'undefined') {
      this.setState({value: nextProps.value})
    }
  }

  renderOption (option) {
    return <span style={{ color: 'black' }}>{option.stop ? <Glyphicon glyph="map-marker" /> : <Glyphicon glyph="option-horizontal" />} {option.label} <Label>{option.agency ? option.agency.name : ''}</Label> {option.link}</span>
  }
  onChange (value) {
    // if (typeof value !== 'undefined')
      this.setState({value})
  }
  render() {
    console.log('render search feeds', this.props.feeds)
    const getRouteName = (route) => {
      let routeName = route.route_short_name && route.route_long_name ? `${route.route_short_name} - ${route.route_long_name}` :
        route.route_long_name ? route.route_long_name :
        route.route_short_name ? route.route_short_name : null
      return routeName
    }
    const getStops = (input) => {
      const feedIds = this.props.feeds.map(getFeedId)
      // console.log(feedIds)
      if (!feedIds.length) return []

      const limit = this.props.limit ? '&limit=' + this.props.limit : ''
      const nameQuery = input ? '&name=' + input : ''
      const url = this.props.filterByRoute ? `/api/manager/stops?route=${this.props.filterByRoute.route_id}&feed=${feedIds.toString()}${limit}` : `/api/manager/stops?feed=${feedIds.toString()}${nameQuery}${limit}`
      return fetch(url)
        .then((response) => {
          return response.json()
        })
        .then((stops) => {
          const stopOptions = stops !== null && stops.length > 0
            ? stops.map(stop => {
              const agency = getFeed(this.props.feeds, stop.feed_id)
              return {
                stop,
                value: stop.stop_id,
                label: `${stop.stop_name} (${stop.stop_id})`,
                agency: agency
              }
            })
            : []
          return stopOptions
        })
        .catch((error) => {
          console.log(error)
          return []
        })
    }
    const getRoutes = (input) => {
      const feedIds = this.props.feeds.map(getFeedId)
      console.log(feedIds)

      if (!feedIds.length) return []

      // don't need to use limit here
      // const limit = this.props.limit ? '&limit=' + this.props.limit : ''
      const nameQuery = input ? '&name=' + input : ''
      const url = this.props.filterByStop ? `/api/manager/routes?stop=${this.props.filterByStop.stop_id}&feed=${feedIds.toString()}` : `/api/manager/routes?feed=${feedIds.toString()}${nameQuery}`
      return fetch(url)
        .then((response) => {
          return response.json()
        })
        .then((routes) => {
          const routeOptions = routes !== null && routes.length > 0
            ? routes.map(route => (
              {
                route,
                value: route.route_id,
                label: `${getRouteName(route)} (${route.route_id})`,
                agency: getFeed(this.props.feeds, route.feed_id)}
            ))
            : []
          return routeOptions
        })
        .catch((error) => {
          console.log(error)
          return []
        })
    }
    const getOptions = (input) => {

      const entities = typeof this.props.entities !== 'undefined' ? this.props.entities : ['routes', 'stops']
      let entitySearches = []
      if (entities.indexOf('stops') > -1){
        entitySearches.push(getStops(input))
      }
      if (entities.indexOf('routes') > -1){
        entitySearches.push(getRoutes(input))
      }
      return Promise.all(entitySearches).then((results) => {
        const stops = results[0]
        const routes = typeof results[1] !== 'undefined' ? results[1] : []
        const options = { options: [...stops,...routes] }
        // console.log('search options', options)
        return options
      })
    }
    const handleChange = (input) => {
      console.log(input)
      this.onChange(input)
      this.props.onChange(input)
      console.log(this.state)
    }

    const onFocus = (input) => {
      // clear options to onFocus to ensure only valid route/stop combinations are selected
      this.refs.gtfsSelect.loadOptions('')
    }

    const placeholder = 'Begin typing to search for ' + this.props.entities.join(' or ') + '...'
    return (
    <Select.Async
      ref='gtfsSelect'
      tabIndex={this.props.tabIndex ? this.props.tabIndex : null}
      cache={false}
      onFocus={onFocus}
      filterOptions={true}
      multi={this.props.multi !== null ? this.props.multi : false}
      minimumInput={this.props.minimumInput !== null ? this.props.minimumInput : 1}
      clearable={this.props.clearable}
      placeholder={this.props.placeholder || placeholder}
      loadOptions={getOptions}
      value={this.state.value}
      optionRenderer={this.renderOption}
      onChange={handleChange} />
    )
  }
}
