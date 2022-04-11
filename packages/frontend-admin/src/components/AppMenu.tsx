import React from 'react';
import {Menu} from 'antd';
import {HomeOutlined, SettingOutlined} from '@ant-design/icons';
import {Link, useLocation} from 'react-router-dom';

export default function AppMenu() {
    let location = useLocation();
    return <Menu theme="dark" activeKey={location.pathname} mode="horizontal">
        <Menu.Item key="/" icon={<HomeOutlined/>}>
            <Link to={'/'}>首页</Link>
        </Menu.Item>
        <Menu.Item key="/setting" icon={<SettingOutlined/>}>
            <Link to={'/setting'}>设置</Link>
        </Menu.Item>
    </Menu>;
};
