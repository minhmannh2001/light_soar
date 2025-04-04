// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"
	"strconv"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
	"github.com/go-openapi/validate"
)

// DAG Core DAG configuration containing workflow definition and metadata
//
// swagger:model DAG
type DAG struct {

	// Default parameter values in JSON format if not specified at runtime
	// Required: true
	DefaultParams *string `json:"DefaultParams"`

	// Human-readable description of the DAG's purpose and behavior
	// Required: true
	Description *string `json:"Description"`

	// Logical grouping of related DAGs for organizational purposes
	// Required: true
	Group *string `json:"Group"`

	// Unique identifier for the DAG within its group
	// Required: true
	Name *string `json:"Name"`

	// List of parameter names that can be passed to the DAG at runtime
	// Required: true
	Params []string `json:"Params"`

	// List of scheduling expressions defining when the DAG should run
	// Required: true
	Schedule []*Schedule `json:"Schedule"`

	// List of tags for categorizing and filtering DAGs
	// Required: true
	Tags []string `json:"Tags"`
}

// Validate validates this d a g
func (m *DAG) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validateDefaultParams(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateDescription(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateGroup(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateName(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateParams(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateSchedule(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateTags(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *DAG) validateDefaultParams(formats strfmt.Registry) error {

	if err := validate.Required("DefaultParams", "body", m.DefaultParams); err != nil {
		return err
	}

	return nil
}

func (m *DAG) validateDescription(formats strfmt.Registry) error {

	if err := validate.Required("Description", "body", m.Description); err != nil {
		return err
	}

	return nil
}

func (m *DAG) validateGroup(formats strfmt.Registry) error {

	if err := validate.Required("Group", "body", m.Group); err != nil {
		return err
	}

	return nil
}

func (m *DAG) validateName(formats strfmt.Registry) error {

	if err := validate.Required("Name", "body", m.Name); err != nil {
		return err
	}

	return nil
}

func (m *DAG) validateParams(formats strfmt.Registry) error {

	if err := validate.Required("Params", "body", m.Params); err != nil {
		return err
	}

	return nil
}

func (m *DAG) validateSchedule(formats strfmt.Registry) error {

	if err := validate.Required("Schedule", "body", m.Schedule); err != nil {
		return err
	}

	for i := 0; i < len(m.Schedule); i++ {
		if swag.IsZero(m.Schedule[i]) { // not required
			continue
		}

		if m.Schedule[i] != nil {
			if err := m.Schedule[i].Validate(formats); err != nil {
				if ve, ok := err.(*errors.Validation); ok {
					return ve.ValidateName("Schedule" + "." + strconv.Itoa(i))
				} else if ce, ok := err.(*errors.CompositeError); ok {
					return ce.ValidateName("Schedule" + "." + strconv.Itoa(i))
				}
				return err
			}
		}

	}

	return nil
}

func (m *DAG) validateTags(formats strfmt.Registry) error {

	if err := validate.Required("Tags", "body", m.Tags); err != nil {
		return err
	}

	return nil
}

// ContextValidate validate this d a g based on the context it is used
func (m *DAG) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	var res []error

	if err := m.contextValidateSchedule(ctx, formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *DAG) contextValidateSchedule(ctx context.Context, formats strfmt.Registry) error {

	for i := 0; i < len(m.Schedule); i++ {

		if m.Schedule[i] != nil {

			if swag.IsZero(m.Schedule[i]) { // not required
				return nil
			}

			if err := m.Schedule[i].ContextValidate(ctx, formats); err != nil {
				if ve, ok := err.(*errors.Validation); ok {
					return ve.ValidateName("Schedule" + "." + strconv.Itoa(i))
				} else if ce, ok := err.(*errors.CompositeError); ok {
					return ce.ValidateName("Schedule" + "." + strconv.Itoa(i))
				}
				return err
			}
		}

	}

	return nil
}

// MarshalBinary interface implementation
func (m *DAG) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *DAG) UnmarshalBinary(b []byte) error {
	var res DAG
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
