import {Route, Switch, withRouter, Redirect} from 'react-router-dom';
import React from 'react';
import HomePage from '../page/HomePage';
import UserSetting from '../page/UserSetting';


class AppRouter extends React.Component {
  render() {
    return (
      <Switch>
        <Route exact path="/homepage" component={HomePage}/>
        <Route exact path="/usersetting" component={UserSetting}/>
        <Redirect to="/homepage"/>
      </Switch>
    );
  }
}

export default withRouter(AppRouter);
