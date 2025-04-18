// Code generated by go-swagger; DO NOT EDIT.

package python_files

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the generate command

import (
	"net/http"

	"github.com/go-openapi/runtime/middleware"
)

// UpdatePythonFileHandlerFunc turns a function with the right signature into a update python file handler
type UpdatePythonFileHandlerFunc func(UpdatePythonFileParams) middleware.Responder

// Handle executing the request and returning a response
func (fn UpdatePythonFileHandlerFunc) Handle(params UpdatePythonFileParams) middleware.Responder {
	return fn(params)
}

// UpdatePythonFileHandler interface for that can handle valid update python file params
type UpdatePythonFileHandler interface {
	Handle(UpdatePythonFileParams) middleware.Responder
}

// NewUpdatePythonFile creates a new http.Handler for the update python file operation
func NewUpdatePythonFile(ctx *middleware.Context, handler UpdatePythonFileHandler) *UpdatePythonFile {
	return &UpdatePythonFile{Context: ctx, Handler: handler}
}

/*
	UpdatePythonFile swagger:route PUT /python-files/{name} python_files updatePythonFile

Update a Python file
*/
type UpdatePythonFile struct {
	Context *middleware.Context
	Handler UpdatePythonFileHandler
}

func (o *UpdatePythonFile) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	route, rCtx, _ := o.Context.RouteInfo(r)
	if rCtx != nil {
		*r = *rCtx
	}
	var Params = NewUpdatePythonFileParams()
	if err := o.Context.BindValidRequest(r, route, &Params); err != nil { // bind params
		o.Context.Respond(rw, r, route.Produces, route, err)
		return
	}

	res := o.Handler.Handle(Params) // actually handle the request
	o.Context.Respond(rw, r, route.Produces, route, res)

}
