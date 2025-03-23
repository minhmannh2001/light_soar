import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Button, Typography } from '@mui/material';
import Editor from '@monaco-editor/react';
import useSWR from 'swr';
import { AppBarContext } from '../../contexts/AppBarContext';

function EditWorkflow() {
  const { name } = useParams();
  const navigate = useNavigate();
  const appBarContext = React.useContext(AppBarContext);
  const [content, setContent] = React.useState('');

  // Fetch workflow content
  const { data, error } = useSWR(
    `/dags/${name}/spec?remoteNode=${appBarContext.selectedRemoteNode || 'local'}`
  );

  React.useEffect(() => {
    if (data) {
      setContent(data.Spec || '');
    }
    appBarContext.setTitle(`Edit Workflow: ${name}`);
  }, [data, name, appBarContext]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/dags/${name}/spec`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spec: content,
        }),
      });

      if (response.ok) {
        navigate(`/dags/${name}/spec`);
      } else {
        console.error('Failed to save workflow');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  if (error) return <div>Failed to load workflow</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Edit Workflow Specification</Typography>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </Paper>
      <Paper sx={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          defaultLanguage="yaml"
          value={content}
          onChange={(value) => setContent(value || '')}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </Paper>
    </Box>
  );
}

export default EditWorkflow; 