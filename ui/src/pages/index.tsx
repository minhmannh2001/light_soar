import React from 'react';
import { ListWorkflowsResponse } from '../models/api';
import { Box, Grid } from '@mui/material';
import { SchedulerStatus } from '../models';
import { statusColorMapping } from '../consts';
import DashboardMetric from '../components/molecules/DashboardMetric';
import DashboardTimechart from '../components/molecules/DashboardTimechart';
import Title from '../components/atoms/Title';
import { AppBarContext } from '../contexts/AppBarContext';
import useSWR from 'swr';
import { useConfig } from '../contexts/ConfigContext';

type metrics = Record<SchedulerStatus, number>;

const defaultMetrics: metrics = {} as metrics;
for (const value in SchedulerStatus) {
  if (!isNaN(Number(value))) {
    const status = Number(value) as SchedulerStatus;
    defaultMetrics[status] = 0;
  }
}

function Dashboard() {
  const [metrics, setMetrics] = React.useState<metrics>(defaultMetrics);
  const appBarContext = React.useContext(AppBarContext);
  const config = useConfig();
  const { data } = useSWR<ListWorkflowsResponse>(
    `/dags?limit=${config.maxDashboardPageLimit}&remoteNode=${
      appBarContext.selectedRemoteNode || 'local'
    }`,
    null,
    {
      refreshInterval: 10000,
    }
  );

  React.useEffect(() => {
    if (!data) {
      return;
    }
    const m = { ...defaultMetrics };
    data.DAGs?.forEach((wf) => {
      if (wf.Status && wf.Status.Status) {
        const status = wf.Status.Status;
        m[status] += 1;
      }
    });
    setMetrics(m as metrics);
  }, [data]);

  React.useEffect(() => {
    appBarContext.setTitle('Dashboard');
  }, [appBarContext]);

  return (
    <Box sx={{ mx: 2, width: '100%' }}>
      {/* Metrics Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {(
          [
            [SchedulerStatus.Success, 'Successful'],
            [SchedulerStatus.Error, 'Failed'],
            [SchedulerStatus.Running, 'Running'],
            [SchedulerStatus.Cancel, 'Canceled'],
          ] as Array<[SchedulerStatus, string]>
        ).map(([status, label]) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Box
              sx={{
                px: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 180,
              }}
            >
              <DashboardMetric
                title={label}
                color={statusColorMapping[status].backgroundColor}
                value={metrics[status]}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Timeline Section */}
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: 1,
          p: 2,
          boxShadow: 1,
        }}
      >
        <Title>{`Timeline in ${config.tz}`}</Title>
        <DashboardTimechart data={data?.DAGs || []} />
      </Box>
    </Box>
  );
}
export default Dashboard;
