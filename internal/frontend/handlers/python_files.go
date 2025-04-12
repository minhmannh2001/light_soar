package handlers

import (
	"net/http"

	"github.com/dagu-org/dagu/internal/frontend/gen/models"
	"github.com/dagu-org/dagu/internal/frontend/gen/restapi/operations"
	"github.com/dagu-org/dagu/internal/frontend/gen/restapi/operations/python_files"
	"github.com/dagu-org/dagu/internal/frontend/server"
	"github.com/dagu-org/dagu/internal/persistence"
	"github.com/go-openapi/runtime/middleware"
	"github.com/go-openapi/swag"
)

var _ server.Handler = (*PythonFiles)(nil)

// PythonFiles is a handler for Python file management.
type PythonFiles struct{}

// Configure implements server.Handler.
func (h *PythonFiles) Configure(api *operations.DaguAPI) {
	api.PythonFilesListPythonFilesHandler = python_files.ListPythonFilesHandlerFunc(func(params python_files.ListPythonFilesParams) middleware.Responder {
		files, err := persistence.ListPythonFiles()
		if err != nil {
			return python_files.NewListPythonFilesDefault(http.StatusInternalServerError).
				WithPayload(&models.Error{
					Code:    swag.String(models.ErrorCodeInternalError),
					Message: swag.String(err.Error()),
				})
		}
		modelFiles := make([]*models.PythonFile, len(files))
		for i, name := range files {
			modelFiles[i] = &models.PythonFile{Name: swag.String(name)}
		}
		return python_files.NewListPythonFilesOK().WithPayload(modelFiles)
	})

	api.PythonFilesGetPythonFileHandler = python_files.GetPythonFileHandlerFunc(func(params python_files.GetPythonFileParams) middleware.Responder {
		file, err := persistence.GetPythonFile(params.Name)
		if err != nil {
			return python_files.NewGetPythonFileDefault(http.StatusInternalServerError).
				WithPayload(&models.Error{
					Code:    swag.String(models.ErrorCodeInternalError),
					Message: swag.String(err.Error()),
				})
		}
		modelFile := &models.PythonFile{
			Name:    swag.String(file.Name),
			Content: swag.String(file.Content),
		}
		return python_files.NewGetPythonFileOK().WithPayload(modelFile)
	})

	api.PythonFilesCreatePythonFileHandler = python_files.CreatePythonFileHandlerFunc(func(params python_files.CreatePythonFileParams) middleware.Responder {
		persistenceFile := &persistence.PythonFile{
			Name:    *params.Body.Name,
			Content: *params.Body.Content,
		}
		if err := persistence.SavePythonFile(persistenceFile); err != nil {
			return python_files.NewCreatePythonFileDefault(http.StatusInternalServerError).
				WithPayload(&models.Error{
					Code:    swag.String(models.ErrorCodeInternalError),
					Message: swag.String(err.Error()),
				})
		}
		return python_files.NewCreatePythonFileCreated().WithPayload(params.Body)
	})

	api.PythonFilesUpdatePythonFileHandler = python_files.UpdatePythonFileHandlerFunc(func(params python_files.UpdatePythonFileParams) middleware.Responder {
		persistenceFile := &persistence.PythonFile{
			Name:    *params.Body.Name,
			Content: *params.Body.Content,
		}
		if err := persistence.SavePythonFile(persistenceFile); err != nil {
			return python_files.NewUpdatePythonFileDefault(http.StatusInternalServerError).
				WithPayload(&models.Error{
					Code:    swag.String(models.ErrorCodeInternalError),
					Message: swag.String(err.Error()),
				})
		}
		return python_files.NewUpdatePythonFileOK().WithPayload(params.Body)
	})

	api.PythonFilesDeletePythonFileHandler = python_files.DeletePythonFileHandlerFunc(func(params python_files.DeletePythonFileParams) middleware.Responder {
		if err := persistence.DeletePythonFile(params.Name); err != nil {
			return python_files.NewDeletePythonFileDefault(http.StatusInternalServerError).
				WithPayload(&models.Error{
					Code:    swag.String(models.ErrorCodeInternalError),
					Message: swag.String(err.Error()),
				})
		}
		return python_files.NewDeletePythonFileNoContent()
	})
}

func NewPythonFiles() server.Handler {
	return &PythonFiles{}
}
