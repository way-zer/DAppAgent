import { status } from "@api/ipfs"
import { Descriptions, Badge } from "antd"
import React from "react"
import 'antd/dist/antd.css';
import {Services} from 'sdk';

export default class IpfsInfo extends React.Component{
	state = {} as {info?:Awaited<ReturnType<Services["system"]["status"]>>}

	componentDidMount() {
		status().then(
			(res) => {
				console.log(res)
				this.setState({
					info: res,
				})
			}
		)
	}

	genBandwidth = (dataItem: IpfsInfo["state"]["info"]["bandwidth"][0]) => {
		return(
			<Descriptions  layout='vertical' bordered column={{xs:1, sm:2,  md:2, lg:4}}>
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
		console.log(this.state.info);
		return(
		<Descriptions title="IPFS Info" bordered={true} column={{lg: 2, sm: 1, xs: 1}}>
		 	<Descriptions.Item label="Running">{this.state.info?.running + ''}</Descriptions.Item>
		 	<Descriptions.Item label="Bandwidth">{this.state.info?.bandwidth?.map((dataItem) => this.genBandwidth(dataItem))}</Descriptions.Item>
		 	<Descriptions.Item label='peers'>{this.state.info?.peers?.map((dataItem) => this.genPeers(dataItem))}</Descriptions.Item>
		</Descriptions>
		)
	}
}