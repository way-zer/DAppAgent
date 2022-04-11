import React from "react";
import { Avatar, Popover } from "antd";
import { AntDesignOutlined } from '@ant-design/icons';
import UserPopover from "./UserPopover";

export default function UserAvatar() {
  return ( 
      <Popover content={UserPopover}>
        <Avatar
          size={40}
          icon={<AntDesignOutlined />}
        />
      </Popover>
  );
}