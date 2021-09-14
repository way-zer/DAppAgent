import { Route, Switch, withRouter, Redirect } from 'react-router-dom'
import React from 'react'
import IpfsInfo from '../page/IpfsInfo'
import AppCreate from '../page/AppCreate'
import AppInfo from '../page/AppInfo'
import AppSearch from '../page/AppSearch'

class AppRouter extends React.Component{
    render() {
        return (
            <Switch>
                <Route exact path='/ipfsinfo' component={IpfsInfo}/>
                <Route exact path='/appcreate' component={AppCreate} />
                <Route exact path='/appinfo' component={AppInfo} />
                <Route exact path='/appsearch' component={AppSearch} />
                <Redirect to='/ipfsinfo' />
            </Switch>
        )
    }
}

export default withRouter(AppRouter);