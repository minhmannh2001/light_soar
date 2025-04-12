// Code generated by go-swagger; DO NOT EDIT.

package python_files

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/runtime"

	"github.com/dagu-org/dagu/internal/frontend/gen/models"
)

// DeletePythonFileNoContentCode is the HTTP code returned for type DeletePythonFileNoContent
const DeletePythonFileNoContentCode int = 204

/*
DeletePythonFileNoContent Deleted

swagger:response deletePythonFileNoContent
*/
type DeletePythonFileNoContent struct {
}

// NewDeletePythonFileNoContent creates DeletePythonFileNoContent with default headers values
func NewDeletePythonFileNoContent() *DeletePythonFileNoContent {

	return &DeletePythonFileNoContent{}
}

// WriteResponse to the client
func (o *DeletePythonFileNoContent) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.Header().Del(runtime.HeaderContentType) //Remove Content-Type on empty responses

	rw.WriteHeader(204)
}

/*
DeletePythonFileDefault Generic error response.

swagger:response deletePythonFileDefault
*/
type DeletePythonFileDefault struct {
	_statusCode int

	/*
	  In: Body
	*/
	Payload *models.Error `json:"body,omitempty"`
}

// NewDeletePythonFileDefault creates DeletePythonFileDefault with default headers values
func NewDeletePythonFileDefault(code int) *DeletePythonFileDefault {
	if code <= 0 {
		code = 500
	}

	return &DeletePythonFileDefault{
		_statusCode: code,
	}
}

// WithStatusCode adds the status to the delete python file default response
func (o *DeletePythonFileDefault) WithStatusCode(code int) *DeletePythonFileDefault {
	o._statusCode = code
	return o
}

// SetStatusCode sets the status to the delete python file default response
func (o *DeletePythonFileDefault) SetStatusCode(code int) {
	o._statusCode = code
}

// WithPayload adds the payload to the delete python file default response
func (o *DeletePythonFileDefault) WithPayload(payload *models.Error) *DeletePythonFileDefault {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the delete python file default response
func (o *DeletePythonFileDefault) SetPayload(payload *models.Error) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *DeletePythonFileDefault) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(o._statusCode)
	if o.Payload != nil {
		payload := o.Payload
		if err := producer.Produce(rw, payload); err != nil {
			panic(err) // let the recovery middleware deal with this
		}
	}
}
