import React, {Component, PropTypes} from 'react'
import { Grid, Row, Col, ButtonGroup, Button, Glyphicon, Tabs, Tab } from 'react-bootstrap'
import { Link, browserHistory } from 'react-router'

import ManagerPage from '../../../common/components/ManagerPage'
import Breadcrumbs from '../../../common/components/Breadcrumbs'
import IssuesMap from './IssuesMap'
import IsochroneMap from './IsochroneMap'
import GtfsValidationSummary from './GtfsValidationSummary'
import TripsChart from './TripsChart'
import { getComponentMessages, getMessage } from '../../../common/util/config'

export default class GtfsValidationExplorer extends Component {

  constructor (props) {
    super(props)
    this.state = {
      activeTab: 'issues'
    }
  }

  componentWillMount () {
    // this.props.onComponentMount(this.props)
    if (this.props.version && !this.props.version.validationResult) {
      this.props.fetchValidationResult(this.props.version)
    }
  }

  componentWillReceiveProps (nextProps) {
    //
    if(this.props.version && nextProps && nextProps.version &&
        this.props.version.id !== nextProps.version.id &&
        !nextProps.version.validationResult) {
      this.props.fetchValidationResult(nextProps.version)
    }
  }

  render() {
    const version = this.props.version
    const messages = getComponentMessages('GtfsValidationExplorer')

    if (!version || !this.props.version.validationResult) {
      return (
        <ManagerPage ref='page'>
          <Grid>
            <Row>
              <Col xs={12}>
              </Col>
            </Row>
          </Grid>
        </ManagerPage>
      )
    }

    const tabRowStyle = { marginTop: '20px' }

    return (
          <Row>
            <Col xs={12}>
              <Tabs id='validation-explorer-tabs'
                activeKey={this.state.activeTab}
                animation={false}
                onSelect={(key) => {
                  this.setState({activeTab: key})
                  setTimeout(() => {
                    const map = this.refs[key + '-map']
                    if(map) map.initializeMap()
                  }, 100); // Adjust timeout to tab transition
                }}
              >
                <Tab eventKey="issues" title="Validation Issues">
                  <Row style={tabRowStyle}>
                    <Col xs={7}>
                      <IssuesMap
                        ref="issues-map"
                        version={version}
                        initialized={true}
                      />
                    </Col>
                    <Col xs={5}>
                      <GtfsValidationSummary
                        validationResult={version.validationResult}
                        version={version}
                        fetchValidationResult={() => { this.props.fetchValidationResult(version) }}
                      />
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="isochrones" title="Accessibility Explorer">
                  <Row style={tabRowStyle}>
                    <Col xs={12}>
                      <IsochroneMap
                        ref="isochrones-map"
                        fetchIsochrones={this.props.fetchIsochrones}
                        version={version}
                      />
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="time" title="Time-based Validation">
                  <Row style={tabRowStyle}>
                    <Col xs={12}>
                      <TripsChart data={version.validationResult.tripsPerDate}/>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </Col>
          </Row>
    )
  }
}
