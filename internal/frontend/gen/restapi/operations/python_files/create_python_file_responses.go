// Code generated by go-swagger; DO NOT EDIT.

package python_files

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"net/http"

	"github.com/go-openapi/runtime"

	"github.com/dagu-org/dagu/internal/frontend/gen/models"
)

// CreatePythonFileCreatedCode is the HTTP code returned for type CreatePythonFileCreated
const CreatePythonFileCreatedCode int = 201

/*
CreatePythonFileCreated Created

swagger:response createPythonFileCreated
*/
type CreatePythonFileCreated struct {

	/*
	  In: Body
	*/
	Payload *models.PythonFile `json:"body,omitempty"`
}

// NewCreatePythonFileCreated creates CreatePythonFileCreated with default headers values
func NewCreatePythonFileCreated() *CreatePythonFileCreated {

	return &CreatePythonFileCreated{}
}

// WithPayload adds the payload to the create python file created response
func (o *CreatePythonFileCreated) WithPayload(payload *models.PythonFile) *CreatePythonFileCreated {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the create python file created response
func (o *CreatePythonFileCreated) SetPayload(payload *models.PythonFile) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *CreatePythonFileCreated) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(201)
	if o.Payload != nil {
		payload := o.Payload
		if err := producer.Produce(rw, payload); err != nil {
			panic(err) // let the recovery middleware deal with this
		}
	}
}

/*
CreatePythonFileDefault Generic error response.

swagger:response createPythonFileDefault
*/
type CreatePythonFileDefault struct {
	_statusCode int

	/*
	  In: Body
	*/
	Payload *models.Error `json:"body,omitempty"`
}

// NewCreatePythonFileDefault creates CreatePythonFileDefault with default headers values
func NewCreatePythonFileDefault(code int) *CreatePythonFileDefault {
	if code <= 0 {
		code = 500
	}

	return &CreatePythonFileDefault{
		_statusCode: code,
	}
}

// WithStatusCode adds the status to the create python file default response
func (o *CreatePythonFileDefault) WithStatusCode(code int) *CreatePythonFileDefault {
	o._statusCode = code
	return o
}

// SetStatusCode sets the status to the create python file default response
func (o *CreatePythonFileDefault) SetStatusCode(code int) {
	o._statusCode = code
}

// WithPayload adds the payload to the create python file default response
func (o *CreatePythonFileDefault) WithPayload(payload *models.Error) *CreatePythonFileDefault {
	o.Payload = payload
	return o
}

// SetPayload sets the payload to the create python file default response
func (o *CreatePythonFileDefault) SetPayload(payload *models.Error) {
	o.Payload = payload
}

// WriteResponse to the client
func (o *CreatePythonFileDefault) WriteResponse(rw http.ResponseWriter, producer runtime.Producer) {

	rw.WriteHeader(o._statusCode)
	if o.Payload != nil {
		payload := o.Payload
		if err := producer.Produce(rw, payload); err != nil {
			panic(err) // let the recovery middleware deal with this
		}
	}
}
