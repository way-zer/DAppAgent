import React from 'react';
import 'antd/dist/antd.css';
import './App.css';
import { Layout } from 'antd';
import AppMenu from './page/AppMenu';
import AppRouter from './router/AppRouter';
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;

export default class App extends React.Component {
	state = {
		collapsed: false,
	};

	onCollapse = (collapsed: boolean) => {
		this.setState({ collapsed });
	};


	render() {
		const { collapsed } = this.state;
		return (
			<Router history={createBrowserHistory()}>
				<Layout style={{ minHeight: '100vh' }}>
					<Sider collapsible collapsed={collapsed} onCollapse={this.onCollapse}>
						<AppMenu />
					</Sider>
					<Content>
						<AppRouter />
					</Content>
				</Layout>
			</Router>
		);
	}
}