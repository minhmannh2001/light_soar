import React, { useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { GetDAGResponse } from '../../../models/api';
import DAGStatus from '../../../components/organizations/DAGStatus';
import { DAGContext } from '../../../contexts/DAGContext';
import DAGSpec from '../../../components/organizations/DAGSpec';
import ExecutionHistory from '../../../components/organizations/ExecutionHistory';
import ExecutionLog from '../../../components/organizations/ExecutionLog';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import Title from '../../../components/atoms/Title';
import DAGActions from '../../../components/molecules/DAGActions';
import DAGEditButtons from '../../../components/molecules/DAGEditButtons';
import LoadingIndicator from '../../../components/atoms/LoadingIndicator';
import { AppBarContext } from '../../../contexts/AppBarContext';
import useSWR from 'swr';
import StatusChip from '../../../components/atoms/StatusChip';
import { CalendarToday, TimerSharp } from '@mui/icons-material';
import moment from 'moment-timezone';
import { SchedulerStatus, Status } from '../../../models';
import { DAGStatusContext } from '../../../contexts/DAGStatusContext';

type Params = {
  name: string;
  tab?: string;
};

function DAGDetails() {
  const params = useParams<Params>();
  const appBarContext = React.useContext(AppBarContext);
  const { pathname } = useLocation();

  const baseUrl = `/dags/${encodeURI(params.name!)}`;
  const { data, isValidating, mutate } = useSWR<GetDAGResponse>(
    `/dags/${params.name}?tab=${params.tab ?? ''}&${new URLSearchParams(
      window.location.search
    ).toString()}&remoteNode=${appBarContext.selectedRemoteNode || 'local'}`,
    null,
    {
      refreshInterval: 2000,
    }
  );
  const [status, setStatus] = React.useState<Status | undefined>();

  const refreshFn = React.useCallback(() => {
    setTimeout(() => mutate(), 500);
  }, [mutate, params.name]);

  React.useEffect(() => {
    if (data) {
      appBarContext.setTitle(data.Title);
      setStatus(data.DAG?.Status);
    }
  }, [data, appBarContext]);

  const tab = useMemo(() => {
    return params.tab || 'status';
  }, [params]);

  if (!params.name || !data || !data.DAG) {
    return <LoadingIndicator />;
  }

  const ctx = {
    data: data,
    refresh: refreshFn,
    name: params.name,
  };

  const statusCtx = {
    data: status,
    setData: setStatus,
  };

  const formatDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return '--';
    const duration = moment.duration(moment(endDate).diff(moment(startDate)));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <DAGContext.Provider value={ctx}>
      <DAGStatusContext.Provider value={statusCtx}>
        <Stack
          sx={{
            width: '100%',
            direction: 'column',
          }}
        >
          <Box
            sx={{
              mx: 4,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Title>{data.Title}</Title>
            <Stack direction="row" spacing={2} alignItems="center">
              <DAGStatusContext.Consumer>
                {(status) => (
                  <DAGActions
                    status={status.data}
                    dag={data?.DAG?.DAG}
                    name={params.name!}
                    refresh={refreshFn}
                    redirectTo={`${baseUrl}`}
                  />
                )}
              </DAGStatusContext.Consumer>
            </Stack>
          </Box>

          <Box
            sx={{
              mx: 4,
              mb: 2,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <DAGEditButtons name={params.name} />
          </Box>

          {data.DAG?.Status?.Status != SchedulerStatus.None ? (
            <Stack
              direction="row"
              spacing={2}
              sx={{ mx: 4, alignItems: 'center' }}
            >
              {data.DAG?.Status?.Status ? (
                <StatusChip status={data.DAG.Status.Status}>
                  {data.DAG.Status.StatusText || ''}
                </StatusChip>
              ) : null}

              <Stack
                direction="row"
                color={'text.secondary'}
                sx={{ alignItems: 'center', ml: 1 }}
              >
                <CalendarToday sx={{ mr: 0.5 }} />
                {data?.DAG?.Status?.FinishedAt
                  ? moment(data.DAG.Status.FinishedAt).format(
                    'MMM D, YYYY HH:mm:ss Z'
                  )
                  : '--'}
              </Stack>

              <Stack
                direction="row"
                color={'text.secondary'}
                sx={{ alignItems: 'center', ml: 1 }}
              >
                <TimerSharp sx={{ mr: 0.5 }} />
                {data?.DAG?.Status?.FinishedAt
                  ? formatDuration(
                    data?.DAG?.Status?.StartedAt,
                    data?.DAG?.Status?.FinishedAt
                  )
                  : data?.DAG?.Status?.StartedAt
                    ? formatDuration(
                      data?.DAG?.Status?.StartedAt,
                      moment().toISOString()
                    )
                    : '--'}
              </Stack>
            </Stack>
          ) : null}

          <Stack
            sx={{
              mx: 4,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Tabs value={`${pathname}`}>
              <LinkTab label="Status" value={`${baseUrl}`} />
              <LinkTab label="Spec" value={`${baseUrl}/spec`} />
              <LinkTab label="History" value={`${baseUrl}/history`} />
              {pathname == `${baseUrl}/log` ||
                pathname == `${baseUrl}/scheduler-log` ? (
                <Tab label="Log" value={pathname} />
              ) : null}
            </Tabs>
          </Stack>

          <Box sx={{ mx: 4, flex: 1 }}>
            {tab == 'status' ? (
              <DAGStatus
                DAG={data.DAG}
                name={params.name}
                refresh={refreshFn}
              />
            ) : null}
            {tab == 'spec' ? <DAGSpec data={data} /> : null}
            {tab == 'history' ? (
              <ExecutionHistory
                logData={data.LogData}
                isLoading={isValidating}
              />
            ) : null}
            {tab == 'scheduler-log' ? <ExecutionLog log={data.ScLog} /> : null}
            {tab == 'log' ? <ExecutionLog log={data.StepLog} /> : null}
          </Box>
        </Stack>
      </DAGStatusContext.Provider>
    </DAGContext.Provider>
  );
}
export default DAGDetails;

interface LinkTabProps {
  label?: string;
  value: string;
}

function LinkTab({ value, ...props }: LinkTabProps) {
  return (
    <Link to={value}>
      <Tab value={value} {...props} />
    </Link>
  );
}
