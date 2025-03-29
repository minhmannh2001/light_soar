import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Button, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import useSWR from 'swr';
import { AppBarContext } from '../../contexts/AppBarContext';
import { GetDAGResponse } from '../../models/api';
import DAGEditor from '../../components/atoms/DAGEditor';
import BorderedBox from '../../components/atoms/BorderedBox';
import WorkflowBuilder from '../../components/workflow-builder/WorkflowBuilder';

type EditMode = 'code' | 'visual';

function EditWorkflow() {
  const { name } = useParams();
  const navigate = useNavigate();
  const appBarContext = React.useContext(AppBarContext);
  const [content, setContent] = React.useState('');
  const [editMode, setEditMode] = React.useState<EditMode>('code');

  // Fetch workflow content using the same endpoint as DAGDetails
  const { data, error } = useSWR<GetDAGResponse>(
    `/dags/${name}?tab=spec&remoteNode=${appBarContext.selectedRemoteNode || 'local'}`
  );

  React.useEffect(() => {
    if (data) {
      setContent(data.Definition || '');
    }
    appBarContext.setTitle(`Edit Workflow: ${name}`);
  }, [data, name, appBarContext]);

  const handleSave = async () => {
    try {
      const url = `${getConfig().apiURL}/dags/${name}?remoteNode=${appBarContext.selectedRemoteNode || 'local'}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          value: content,
        }),
      });

      if (response.ok) {
        navigate(`/dags/${name}`);
      } else {
        const errorText = await response.text();
        console.error('Failed to save workflow:', errorText);
        alert(errorText);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow. Please try again.');
    }
  };

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: EditMode | null,
  ) => {
    if (newMode !== null) {
      setEditMode(newMode);
    }
  };

  const renderEditor = () => {
    if (editMode === 'code') {
      return (
        <DAGEditor
          value={content}
          onChange={(value) => setContent(value || '')}
        />
      );
    }

    return <WorkflowBuilder />;
  };

  if (error) return <div>Failed to load workflow</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <Box sx={{ p: 2, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <Paper sx={{ p: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Workflow Definition</Typography>
            <Typography variant="body1" color="text.secondary">
              {name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={editMode}
              exclusive
              onChange={handleModeChange}
              aria-label="edit mode"
              size="small"
            >
              <ToggleButton value="code" aria-label="code editor">
                Code
              </ToggleButton>
              <ToggleButton value="visual" aria-label="visual builder">
                Visual
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="outlined"
              onClick={() => navigate(`/dags/${name}`)}
              sx={{ minWidth: '100px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              sx={{ minWidth: '100px' }}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
        <BorderedBox
          sx={{
            mt: 2,
            px: 2,
            py: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {renderEditor()}
        </BorderedBox>
      </Paper>
    </Box>
  );
}

export default EditWorkflow; 