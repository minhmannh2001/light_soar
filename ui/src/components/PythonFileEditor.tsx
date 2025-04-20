import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Modal, Table, Typography, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useConfig } from '../contexts/ConfigContext';
import fetchJson from '../lib/fetchJson';
import { Box, Grid } from '@mui/material';
import Title from './atoms/Title';
import { AppBarContext } from '../contexts/AppBarContext';
import MonacoEditor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });

interface PythonFile {
  name: string;
  content: string;
}

const PythonFileEditor: React.FC = () => {
  const [files, setFiles] = useState<PythonFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<PythonFile | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [viewMode, setViewMode] = useState(false);
  const config = useConfig();
  const appBarContext = React.useContext(AppBarContext);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

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

  const handleViewFile = async (file: PythonFile) => {
    try {
      const response = await fetchJson<PythonFile>(
        `/python-files/${file.name}`
      );
      setSelectedFile(response);
      setViewMode(true);
      setIsModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch file');
    }
  };

  const handleEditFile = async (file: PythonFile) => {
    try {
      const response = await fetchJson<PythonFile>(
        `/python-files/${file.name}`
      );
      setSelectedFile(response);
      setViewMode(false);
      setIsModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch file');
    }
  };

  const handleCreateFile = async () => {
    try {
      if (!newFileName) {
        message.error('File name cannot be empty');
        return;
      }

      // Add .py extension if not present
      const fileName = newFileName.endsWith('.py')
        ? newFileName
        : `${newFileName}.py`;

      await fetchJson(`/python-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fileName,
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
      const response = await fetch(
        `${config.apiURL}/python-files/${file.name}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setFiles(files.filter((f) => f.name !== file.name));
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
            icon={<EyeOutlined />}
            onClick={() => handleViewFile(record)}
          />
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

  const renderModalTitle = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: '32px',
      }}
    >
      <span>
        {viewMode
          ? `View File: ${selectedFile?.name}` // Removed .py extension
          : selectedFile
          ? 'Edit File'
          : 'Create New File'}
      </span>
      {selectedFile && (
        <Button
          type="text"
          icon={viewMode ? <EditOutlined /> : <EyeOutlined />}
          onClick={() => setViewMode(!viewMode)}
        >
          {viewMode ? 'Switch to Edit' : 'Switch to View'}
        </Button>
      )}
    </div>
  );

  const renderModalFooter = () => {
    if (!selectedFile) {
      return [
        <Button key="cancel" onClick={() => setIsModalVisible(false)}>
          Cancel
        </Button>,
        <Button
          key="create"
          type="primary"
          onClick={handleCreateFile}
          disabled={!newFileName}
        >
          Create
        </Button>,
      ];
    }

    return [
      <Button key="close" onClick={() => setIsModalVisible(false)}>
        Close
      </Button>,
      !viewMode && (
        <Button key="save" type="primary" onClick={handleSaveFile}>
          Save Changes
        </Button>
      ),
    ].filter(Boolean);
  };

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor
  ) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && value !== undefined) {
      setSelectedFile({ ...selectedFile, content: value });
    }
  };

  const renderModalContent = () => {
    if (!selectedFile) {
      return (
        <Box sx={{ p: 3 }}>
          <Input
            placeholder="Enter file name (without .py extension)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            size="large"
            autoFocus
          />
        </Box>
      );
    }

    return (
      <Box>
        <Box
          sx={{
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: '#fafafa',
            px: 3,
            py: 2,
          }}
        >
          {!viewMode ? (
            <Input
              value={selectedFile.name.replace(/\.py$/, '')}
              onChange={(e) =>
                setSelectedFile({
                  ...selectedFile,
                  name: e.target.value,
                })
              }
              size="large"
              style={{ maxWidth: '50%' }}
              suffix=".py"
            />
          ) : (
            <Typography.Text strong style={{ fontSize: '16px' }}>
              {selectedFile.name}
            </Typography.Text>
          )}
        </Box>

        <Box sx={{ mt: 0 }}>
          {viewMode ? (
            <Box
              sx={{
                p: 3,
                backgroundColor: '#fafafa',
                borderRadius: 1,
                mx: 3,
                my: 2,
                border: '1px solid #f0f0f0',
                maxHeight: '60vh',
                overflow: 'auto',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {selectedFile.content}
              </pre>
            </Box>
          ) : (
            <Box sx={{ mx: 3, my: 2 }}>
              <MonacoEditor
                height="60vh"
                language="python"
                value={selectedFile.content}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                  },
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  tabSize: 4,
                  wordWrap: 'on',
                  padding: { top: 10, bottom: 10 },
                  theme: 'vs',
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    );
  };

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
            setViewMode(false);
            setIsModalVisible(true);
          }}
        >
          Create New File
        </Button>
      </Box>

      <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 1 }}>
        <Table columns={columns} dataSource={files} rowKey="name" />
      </Box>

      <Modal
        title={renderModalTitle()}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={1000}
        footer={renderModalFooter()}
        bodyStyle={{ padding: 0 }}
        style={{
          top: 90, // Increased from 20 to 60 to move modal lower
          zIndex: 1000,
        }}
        maskStyle={{
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          zIndex: 999,
        }}
      >
        {renderModalContent()}
      </Modal>
    </Box>
  );
};

export default PythonFileEditor;
