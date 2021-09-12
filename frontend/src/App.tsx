import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import './App.css';
import { Layout, Menu, Breadcrumb } from 'antd';
import {
	DesktopOutlined,
	PieChartOutlined,
	FileOutlined,
	TeamOutlined,
	UserOutlined,
} from '@ant-design/icons';
import IpfsInfo from './page/IpfsInfo';
import AppInfo from './page/AppInfo';
import AppCreate from './page/AppCreate';
import AppSearch from './page/AppSearch';

const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;

export default class App extends React.Component {
	state = {
		collapsed: false,
		selectedKey: '1',
	};

	onCollapse = (collapsed: boolean) => {
		this.setState({ collapsed });
	};

	content = () => {
		if(this.state.selectedKey === '1')
			return (
				<IpfsInfo />
			)
		else if(this.state.selectedKey === '2')
			return (
				<AppInfo />
			)
		else if(this.state.selectedKey === '3')
			return(
				<AppCreate />
			)
		else if(this.state.selectedKey === '4')
			return(
				<AppSearch />
			)
		else
			return (
				<div></div>
			)
	}

	handleClick = (key: string) => {
		this.setState({
			selectedKey: key,
		})
	}

	render() {
		const { collapsed } = this.state;
		return (
			<Layout style={{ minHeight: '100vh' }}>
				<Sider collapsible collapsed={collapsed} onCollapse={this.onCollapse}>
					<Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" onSelect={(event) => { this.handleClick(event.key) }}>
						<Menu.Item key="1" icon={<UserOutlined />}>
							用户
						</Menu.Item>
						<SubMenu key='sub2' icon={<DesktopOutlined />} title='应用' >
							<Menu.Item key="2" >
								查看应用
							</Menu.Item>
							<Menu.Item key="3" >
								创建应用
							</Menu.Item>
							<Menu.Item key="4" >
								搜索应用
							</Menu.Item>
						</SubMenu>
						<SubMenu key='sub3' icon={<FileOutlined />} title='文件'>
							<Menu.Item key="9" >
								查看文件
							</Menu.Item>
						</SubMenu>
					</Menu>
				</Sider>
				<div style={{textAlign:'center', width:'100%', height:'100%', margin: '70px'}} >
					<this.content />
				</div>
			</Layout>
		);
	}
}