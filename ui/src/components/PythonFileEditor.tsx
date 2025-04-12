import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Table, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useConfig } from '../contexts/ConfigContext';
import fetchJson from '../lib/fetchJson';
import { Box, Grid } from '@mui/material';
import Title from './atoms/Title';
import { AppBarContext } from '../contexts/AppBarContext';

interface PythonFile {
  name: string;
  content: string;
}

const PythonFileEditor: React.FC = () => {
  const [files, setFiles] = useState<PythonFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<PythonFile | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const config = useConfig();
  const appBarContext = React.useContext(AppBarContext);

  useEffect(() => {
    fetchFiles();
    appBarContext.setTitle('Python Files');
  }, [appBarContext]);

  const fetchFiles = async () => {
    try {
      const response = await fetchJson<PythonFile[]>(`/python-files`);
      setFiles(response);
    } catch (error) {
      message.error('Failed to fetch Python files');
    }
  };

  const handleCreateFile = async () => {
    try {
      await fetchJson(`/python-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFileName,
          content: '',
        }),
      });
      setNewFileName('');
      setIsModalVisible(false);
      fetchFiles();
      message.success('File created successfully');
    } catch (error) {
      message.error('Failed to create file');
    }
  };

  const handleEditFile = async (file: PythonFile) => {
    try {
      const response = await fetchJson<PythonFile>(`/python-files/${file.name}`);
      setSelectedFile(response);
      setIsModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch file');
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    try {
      await fetchJson(`/python-files/${selectedFile.name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedFile),
      });
      setIsModalVisible(false);
      fetchFiles();
      message.success('File saved successfully');
    } catch (error) {
      message.error('Failed to save file');
    }
  };

  const handleDeleteFile = async (file: PythonFile) => {
    try {
      const response = await fetch(`${config.apiURL}/python-files/${file.name}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFiles(files.filter(f => f.name !== file.name));
        message.success('File deleted successfully');
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error('Failed to delete file');
    }
  };

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: PythonFile) => (
        <span>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditFile(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteFile(record)}
          />
        </span>
      ),
    },
  ];

  return (
    <Box sx={{ mx: 4, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Title>Python Files</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedFile(null);
            setNewFileName('');
            setIsModalVisible(true);
          }}
        >
          Create New File
        </Button>
      </Box>

      <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 1 }}>
        <Table
          columns={columns}
          dataSource={files}
          rowKey="name"
        />
      </Box>

      <Modal
        title={selectedFile ? 'Edit File' : 'Create New File'}
        open={isModalVisible}
        onOk={selectedFile ? handleSaveFile : handleCreateFile}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        {selectedFile ? (
          <div>
            <Input
              value={selectedFile.name}
              onChange={e => setSelectedFile({ ...selectedFile, name: e.target.value })}
              style={{ marginBottom: 16 }}
            />
            <textarea
              value={selectedFile.content}
              onChange={e => setSelectedFile({ ...selectedFile, content: e.target.value })}
              style={{ width: '100%', height: 400, fontFamily: 'monospace' }}
            />
          </div>
        ) : (
          <Input
            placeholder="Enter file name (without .py extension)"
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
          />
        )}
      </Modal>
    </Box>
  );
};

export default PythonFileEditor; 