import { info } from "@api/apps";
import { Input, Result, Card, Descriptions } from "antd";
import React from "react";

export default class AppSearch extends React.Component {

    state = {
        showResult: false,
        resultStatus: 'error',
        showDescriptions: false,
        title: '',
        name: '',
        cid: '',
        prod: '',
    }

    handleSearch = (name: string) => {
        info(name).then(
            (res) => {
                
                if('error' in res) {
                    this.setState({
                        showResult: true,
                        showDescriptions: false,
                        resultStatus: 'error',
                        title: res.error,
                    })
                    
                }
                else {
                    this.setState({
                        showResult: true,
                        showDescriptions: true,
                        resultStatus: 'success',
                        name: res.name,
                        cid: res.cid,
                        prod: res.prod,
                    })
                }
            }
        );
    }

    render() {
        return (
            <div>
                <Input.Search placeholder="输入App名称" onSearch={this.handleSearch} style={{ width: 200 }} />
                {
                    this.state.showResult ? (
                        <Result status={this.state.resultStatus} title={this.state.title} />
                    ) : ''
                }{
                    this.state.showDescriptions ? (
                        <Descriptions bordered={true} style={{padding: '24px'}} layout='vertical'>
                            <Descriptions.Item label='name'>{this.state.name}</Descriptions.Item>
                            <Descriptions.Item label='cid'>{this.state.cid}</Descriptions.Item>
                            <Descriptions.Item label='prod'>{this.state.prod}</Descriptions.Item>
                        </Descriptions>
                    ) : ''
                }
            </div>
        )
    }
}