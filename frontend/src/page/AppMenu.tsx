import React from 'react';
import { Menu } from 'antd';
import {
	DesktopOutlined,
	FileOutlined,
	UserOutlined,
} from '@ant-design/icons';
import {withRouter} from 'react-router-dom'

const { SubMenu } = Menu;

class AppMenu extends React.Component {
	state = {
		selectedKey: '1',
	};

	handleClick = (key: string) => {
		this.setState({
			selectedKey: key,
		})
		this.props.history.push(key);
	}

	render() {
		return (
                <Menu theme="dark" defaultSelectedKeys={['/ipfsinfo']} mode="inline" onSelect={(event) => { this.handleClick(event.key) }}>
                    <Menu.Item key="/ipfsinfo" icon={<UserOutlined />}>
                        用户
                    </Menu.Item>
                    <SubMenu key='sub1' icon={<DesktopOutlined />} title='应用' >
                        <Menu.Item key="/appinfo" >
                            查看应用
                        </Menu.Item>
                        <Menu.Item key="/appcreate" >
                            创建应用
                        </Menu.Item>
                        <Menu.Item key="/appsearch" >
                            搜索应用
                        </Menu.Item>
                    </SubMenu>
                    <SubMenu key='sub2' icon={<FileOutlined />} title='文件'>
                        
                        <Menu.Item key="/fileinfo">
                            查看文件
                        </Menu.Item>
                    </SubMenu>
                </Menu>
		);
	}
}

export default withRouter(AppMenu);