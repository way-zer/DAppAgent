import React from 'react';
import { Menu } from 'antd';
import {
	DesktopOutlined,
	FileOutlined,
	HomeOutlined,
	SettingOutlined,
	UserOutlined,
} from '@ant-design/icons';
import {withRouter} from 'react-router-dom'

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
                <Menu theme="dark" defaultSelectedKeys={['/homepage']} mode="horizontal" onSelect={(event) => { this.handleClick(event.key) }}>
                    <Menu.Item key="/homepage" icon={<HomeOutlined />}>
                        首页
                    </Menu.Item>
                    <Menu.Item key="/usersetting" icon={<SettingOutlined />}>
                        设置
                    </Menu.Item>
                </Menu>
		);
	}
}

export default withRouter(AppMenu);