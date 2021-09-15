import React from "react";
import { Form, Input, Button, Checkbox, FormInstance, message } from 'antd';
import { create } from "@api/apps";

export default class AppCreate extends React.Component{

    formRef = React.createRef<FormInstance>();

    submit = () => {
        create(this.formRef.current?.getFieldValue('appname')).then(
            message.success('创建成功！')
        )
    }

    render() {
        return (
            <Form size='middle'
              name="basic"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 8 }}
              initialValues={{ remember: true }}
              autoComplete="off"
              ref={this.formRef}
            >
              <Form.Item
                label="Appname"
                name="appname"
                rules={[{ required: true, message: 'Please input your appname!' }]}
              >
                <Input />
              </Form.Item>
        
              <Form.Item wrapperCol={{ offset: 8, span: 8 }}>
                <Button type="primary" onClick={()=>this.submit()}>
                  Submit
                </Button>
              </Form.Item>
            </Form>
        )
    }
}