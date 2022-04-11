import React from 'react';
import 'antd/dist/antd.css';
import './App.css';
import { Layout } from 'antd';
import AppMenu from './page/AppMenu';
import AppRouter from './router/AppRouter';
import UserAvatar from './page/UserAvatar';
import { BrowserRouter } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;

export default class App extends React.Component {

	render() {

    return (
      <BrowserRouter>
        <Layout>
          <Header style={{zIndex : 1, position: 'fixed', width: '100%'}}>
            <div style={{float: 'right', margin: 'auto'}}>
             <UserAvatar />
            </div>
            <AppMenu/>  
          </Header>
          <Content style={{padding: '0 50px', marginTop: 64}}>
            <AppRouter/>
          </Content>
          <Footer style={{textAlign: 'center'}}>This is footer</Footer>
        </Layout>
      </BrowserRouter>
    );
  }
}
