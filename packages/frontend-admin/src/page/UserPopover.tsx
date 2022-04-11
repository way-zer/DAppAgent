import { Button, Input, Modal } from "antd";
import React from "react";



export default function UserPopover() {

    const [peerModalVisible, setPeerModalVisible] = React.useState(false);
    const [appModalVisible, setAppModalVisible] = React.useState(false);
    const [appAddr, setAppAddr] = React.useState("");
    const [peerAddr, setPeerAddr] = React.useState("");

    const showPeerModal = () => {
        setPeerModalVisible(true);
    }
    const showAppModal = () => {
        setAppModalVisible(true);
    } 

    const handlePeerModalOk = () => {
        setPeerModalVisible(false);
        
    }

    const handlePeerModalCancel = () => {
        setPeerModalVisible(false);
    }

    const handleAppModalOk = () => {
        setAppModalVisible(false);
    }

    const handleAppModalCancel = () => {
        setAppModalVisible(false);
    }

    const handleAppAddrChange = (e) => {
        setAppAddr(e.target.value);
    }

    const handlePeerAddrChange = (e) => {
        setPeerAddr(e.target.value);
    }

    return (
        <div>
            <Button onClick={showPeerModal}>
                连接Peer
            </Button>
            <br/>
            <Button onClick={showAppModal}>
                打开App
            </Button>
            <Modal title={"连接Peer"} visible={peerModalVisible} 
            onOk={handlePeerModalOk} onCancel={handlePeerModalCancel}
            okText="确认" cancelText="取消">
                <Input placeholder="请输入peer地址" onChange={handlePeerAddrChange}/>
            </Modal>

            <Modal title={"打开App"} visible={appModalVisible} 
            onOk={handleAppModalOk} onCancel={handleAppModalCancel}
            okText="确认" cancelText="取消">
                <Input placeholder="请输入app地址" onChange={handleAppAddrChange}/>
            </Modal>
        </div>
    )
}