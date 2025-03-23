import React from 'react';
import { Button, Stack } from '@mui/material';
import { AppBarContext } from '../../contexts/AppBarContext';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';

type Props = {
  name: string;
};

export default function DAGEditButtons({ name }: Props) {
  const appBarContext = React.useContext(AppBarContext);
  const navigate = useNavigate();

  const handleRename = async () => {
    const val = window.prompt('Please input the new DAG name', '');
    if (!val) {
      return;
    }
    if (val.indexOf(' ') != -1) {
      alert('DAG name cannot contain space');
      return;
    }
    const url = `${getConfig().apiURL}/dags/${name}?remoteNode=${appBarContext.selectedRemoteNode || 'local'
      }`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'rename',
        value: val,
      }),
    });
    if (resp.ok) {
      window.location.href = `/dags/${val}`;
    } else {
      const e = await resp.text();
      alert(e);
    }
  };

  return (
    <Stack direction="row" spacing={1}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<EditIcon />}
        onClick={() => navigate(`/dags/${name}/edit`)}
        sx={{
          backgroundColor: 'primary.main',
          '&:hover': {
            backgroundColor: 'primary.dark',
          }
        }}
      >
        Edit
      </Button>
      <Button
        variant="outlined"
        onClick={handleRename}
        sx={{
          color: 'text.secondary',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'primary.main',
            color: 'primary.main',
          }
        }}
      >
        Rename
      </Button>
      <Button
        variant="outlined"
        color="error"
        onClick={async () => {
          if (!confirm('Are you sure to delete the DAG?')) {
            return;
          }
          const url = `${getConfig().apiURL}/dags/${name}`;
          const resp = await fetch(url, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (resp.ok) {
            window.location.href = '/dags/';
          } else {
            const e = await resp.text();
            alert(e);
          }
        }}
      >
        Delete
      </Button>
    </Stack>
  );
}
