import { Upload, message, Button, Modal, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { fileUpload } from '@api/file';

const FileUpload = () => {
  const [visible, setVisible] = useState(false);
  const [file, setFile] = useState();
  const [uploading, setUploading] = useState(false);
  const [path, setPath] = useState('');

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('file', file, file.name);
    setUploading(true);
    fileUpload(file, path).then(() => {
      setVisible(false);
      setUploading(false);
      message.success('上传成功');
    })
  }

  const handleChange = (event: any) => {
    setPath(event.target.value);
  }

  const props = {
    showUploadList: false,
    beforeUpload: file => {
      setFile(file);
      return false;
    }
  }

  return (
    <>
      <Button type="primary" onClick={showModal}>
        上传文件
      </Button>
      <Modal
        title="上传文件"
        visible={visible}
        onOk={handleUpload}
        okText="上传"
        confirmLoading={uploading}
        onCancel={handleCancel}
        cancelText="取消"
        okButtonProps={{disabled: !(file != undefined && path !== '')}}
      >
        <Upload {...props}>
          <Button icon={<UploadOutlined />} onClick={handleUpload}>选择文件</Button>
        </Upload>
        <Input onChange={handleChange} placeholder="请输入路径" />
      </Modal>
    </>
  );
};

export default FileUpload;