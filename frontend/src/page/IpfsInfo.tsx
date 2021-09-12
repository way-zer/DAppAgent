import { status } from "@api/ipfs"
import { Descriptions, Badge } from "antd"
import React from "react"
import 'antd/dist/antd.css';


export default class IpfsInfo extends React.Component{
	state = {
		info: {running:false, bandwidth:[], peers:[]},
	}

	componentDidMount() {
		status().then(
			(res) => {
				this.setState({
					info: res,
				})
			}
		)
		
	}

	genBandwidth = (dataItem: object) => {
		return(
			<Descriptions  layout='vertical' bordered={true}>
				<Descriptions.Item label='rateIn'>{dataItem.rateIn}</Descriptions.Item>
				<Descriptions.Item label='rateOut'>{dataItem.rateOut}</Descriptions.Item>
				<Descriptions.Item label='totalIn'>{dataItem.totalIn}</Descriptions.Item>
				<Descriptions.Item label='totalOut'>{dataItem.totalOut}</Descriptions.Item>
			</Descriptions>
		)
	}

	genPeers = (dataItem: string) => {
		return(
			<div>{dataItem}<br/></div>
			
		)
	}

	render() {
		return(
		<Descriptions title="IPFS Info" bordered={true} style={{padding: '24px'}}>
			<Descriptions.Item label="Running">{this.state.info.running + ''}</Descriptions.Item>
			<Descriptions.Item label="Bandwidth">{this.state.info.bandwidth.map((dataItem) => this.genBandwidth(dataItem))}</Descriptions.Item>
			<Descriptions.Item label='peers'>{this.state.info.peers.map((dataItem) => this.genPeers(dataItem))}</Descriptions.Item>
		</Descriptions>
		)
	}
}