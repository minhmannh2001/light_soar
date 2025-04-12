// This file is safe to edit. Once it exists it will not be overwritten

package restapi

import (
	"crypto/tls"
	"net/http"

	pkgmiddleware "github.com/dagu-org/dagu/internal/frontend/middleware"
	"github.com/go-openapi/errors"
	"github.com/go-openapi/runtime"
	"github.com/go-openapi/runtime/middleware"

	"github.com/dagu-org/dagu/internal/frontend/gen/restapi/operations"
	"github.com/dagu-org/dagu/internal/frontend/gen/restapi/operations/dags"
	"github.com/dagu-org/dagu/internal/frontend/gen/restapi/operations/python_files"
	"github.com/dagu-org/dagu/internal/frontend/gen/restapi/operations/system"
)

//go:generate swagger generate server --target ../../frontend --name Dagu --spec ../../../api.v1.yaml --principal any --exclude-main

func configureFlags(api *operations.DaguAPI) {
	// api.CommandLineOptionsGroups = []swag.CommandLineOptionsGroup{ ... }
}

func configureAPI(api *operations.DaguAPI) http.Handler {
	// configure the api here
	api.ServeError = errors.ServeError

	// Set your custom logger if needed. Default one is log.Printf
	// Expected interface func(string, ...interface{})
	//
	// Example:
	// api.Logger = log.Printf

	api.UseSwaggerUI()
	// To continue using redoc as your UI, uncomment the following line
	// api.UseRedoc()

	api.JSONConsumer = runtime.JSONConsumer()

	api.JSONProducer = runtime.JSONProducer()

	if api.DagsCreateDAGHandler == nil {
		api.DagsCreateDAGHandler = dags.CreateDAGHandlerFunc(func(params dags.CreateDAGParams) middleware.Responder {
			return middleware.NotImplemented("operation dags.CreateDAG has not yet been implemented")
		})
	}
	if api.PythonFilesCreatePythonFileHandler == nil {
		api.PythonFilesCreatePythonFileHandler = python_files.CreatePythonFileHandlerFunc(func(params python_files.CreatePythonFileParams) middleware.Responder {
			return middleware.NotImplemented("operation python_files.CreatePythonFile has not yet been implemented")
		})
	}
	if api.DagsDeleteDAGHandler == nil {
		api.DagsDeleteDAGHandler = dags.DeleteDAGHandlerFunc(func(params dags.DeleteDAGParams) middleware.Responder {
			return middleware.NotImplemented("operation dags.DeleteDAG has not yet been implemented")
		})
	}
	if api.PythonFilesDeletePythonFileHandler == nil {
		api.PythonFilesDeletePythonFileHandler = python_files.DeletePythonFileHandlerFunc(func(params python_files.DeletePythonFileParams) middleware.Responder {
			return middleware.NotImplemented("operation python_files.DeletePythonFile has not yet been implemented")
		})
	}
	if api.DagsGetDAGDetailsHandler == nil {
		api.DagsGetDAGDetailsHandler = dags.GetDAGDetailsHandlerFunc(func(params dags.GetDAGDetailsParams) middleware.Responder {
			return middleware.NotImplemented("operation dags.GetDAGDetails has not yet been implemented")
		})
	}
	if api.SystemGetHealthHandler == nil {
		api.SystemGetHealthHandler = system.GetHealthHandlerFunc(func(params system.GetHealthParams) middleware.Responder {
			return middleware.NotImplemented("operation system.GetHealth has not yet been implemented")
		})
	}
	if api.PythonFilesGetPythonFileHandler == nil {
		api.PythonFilesGetPythonFileHandler = python_files.GetPythonFileHandlerFunc(func(params python_files.GetPythonFileParams) middleware.Responder {
			return middleware.NotImplemented("operation python_files.GetPythonFile has not yet been implemented")
		})
	}
	if api.DagsListDAGsHandler == nil {
		api.DagsListDAGsHandler = dags.ListDAGsHandlerFunc(func(params dags.ListDAGsParams) middleware.Responder {
			return middleware.NotImplemented("operation dags.ListDAGs has not yet been implemented")
		})
	}
	if api.PythonFilesListPythonFilesHandler == nil {
		api.PythonFilesListPythonFilesHandler = python_files.ListPythonFilesHandlerFunc(func(params python_files.ListPythonFilesParams) middleware.Responder {
			return middleware.NotImplemented("operation python_files.ListPythonFiles has not yet been implemented")
		})
	}
	if api.DagsListTagsHandler == nil {
		api.DagsListTagsHandler = dags.ListTagsHandlerFunc(func(params dags.ListTagsParams) middleware.Responder {
			return middleware.NotImplemented("operation dags.ListTags has not yet been implemented")
		})
	}
	if api.DagsPostDAGActionHandler == nil {
		api.DagsPostDAGActionHandler = dags.PostDAGActionHandlerFunc(func(params dags.PostDAGActionParams) middleware.Responder {
			return middleware.NotImplemented("operation dags.PostDAGAction has not yet been implemented")
		})
	}
	if api.DagsSearchDAGsHandler == nil {
		api.DagsSearchDAGsHandler = dags.SearchDAGsHandlerFunc(func(params dags.SearchDAGsParams) middleware.Responder {
			return middleware.NotImplemented("operation dags.SearchDAGs has not yet been implemented")
		})
	}
	if api.PythonFilesUpdatePythonFileHandler == nil {
		api.PythonFilesUpdatePythonFileHandler = python_files.UpdatePythonFileHandlerFunc(func(params python_files.UpdatePythonFileParams) middleware.Responder {
			return middleware.NotImplemented("operation python_files.UpdatePythonFile has not yet been implemented")
		})
	}

	api.PreServerShutdown = func() {}

	api.ServerShutdown = func() {}

	return setupGlobalMiddleware(api.Serve(setupMiddlewares))
}

// The TLS configuration before HTTPS server starts.
func configureTLS(tlsConfig *tls.Config) {
	// Make all necessary changes to the TLS configuration here.
}

// As soon as server is initialized but not run yet, this function will be called.
// If you need to modify a config, store server instance to stop it individually later, this is the place.
// This function can be called multiple times, depending on the number of serving schemes.
// scheme value will be set accordingly: "http", "https" or "unix".
func configureServer(s *http.Server, scheme, addr string) {
}

// The middleware configuration is for the handler executors. These do not apply to the swagger.json document.
// The middleware executes after routing but before authentication, binding and validation.
func setupMiddlewares(handler http.Handler) http.Handler {
	return handler
}

// The middleware configuration happens before anything, this middleware also applies to serving the swagger.json document.
// So this is a good place to plug in a panic handling middleware, logging and metrics.
func setupGlobalMiddleware(handler http.Handler) http.Handler {
	return pkgmiddleware.SetupGlobalMiddleware(handler)
}
