import React from 'react';
import 'antd/dist/antd.min.css';
import {Layout} from 'antd';
import AppMenu from '../components/AppMenu';
import UserAvatar from '../components/UserAvatar';
import {Outlet} from 'react-router-dom';

const {Header, Content, Footer} = Layout;

export default function App() {
    return <Layout>
        <Header style={{zIndex: 1, position: 'fixed', width: '100%'}}>
            <div style={{float: 'right', margin: 'auto'}}>
                <UserAvatar/>
            </div>
            <AppMenu/>
        </Header>
        <Content style={{padding: '0 50px', marginTop: 64}}>
            <Outlet/>
        </Content>
        <Footer style={{textAlign: 'center'}}>This is footer</Footer>
    </Layout>;
}
