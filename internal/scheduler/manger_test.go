package scheduler

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestReadEntries(t *testing.T) {
	expectedNext := time.Date(2020, 1, 1, 1, 0, 0, 0, time.UTC)
	now := expectedNext.Add(-time.Second)

	t.Run("InvalidDirectory", func(t *testing.T) {
		manager := NewDAGJobManager("invalid_directory", nil, "", "")
		jobs, err := manager.Next(context.Background(), expectedNext)
		require.NoError(t, err)
		require.Len(t, jobs, 0)
	})
	t.Run("StartAndNext", func(t *testing.T) {
		th := setupTest(t)
		ctx := context.Background()

		done := make(chan any)
		defer close(done)

		err := th.manager.Start(ctx, done)
		require.NoError(t, err)

		jobs, err := th.manager.Next(ctx, now)
		require.NoError(t, err)
		require.NotEmpty(t, jobs, "jobs should not be empty")

		job := jobs[0]
		next := job.Next
		require.Equal(t, expectedNext, next)
	})
	t.Run("SuspendedJob", func(t *testing.T) {
		th := setupTest(t)
		ctx := context.Background()

		done := make(chan any)
		defer close(done)

		err := th.manager.Start(ctx, done)
		require.NoError(t, err)

		beforeSuspend, err := th.manager.Next(ctx, now)
		require.NoError(t, err)

		// find the job and suspend it
		job := findJobByName(t, beforeSuspend, "scheduled_job").Job
		dagJob, ok := job.(*dagJob)
		require.True(t, ok)
		dag := dagJob.DAG
		err = th.client.ToggleSuspend(ctx, dag.Name, true)
		require.NoError(t, err)

		// check if the job is suspended and not returned
		afterSuspend, err := th.manager.Next(ctx, now)
		require.NoError(t, err)
		require.Equal(t, len(afterSuspend), len(beforeSuspend)-1, "suspended job should not be returned")
	})
}

func findJobByName(t *testing.T, jobs []*ScheduledJob, name string) *ScheduledJob {
	t.Helper()

	for _, job := range jobs {
		dagJob, ok := job.Job.(*dagJob)
		if ok && dagJob.DAG.Name == name {
			return job
		}
	}

	t.Fatalf("job %s not found", name)
	return nil
}
