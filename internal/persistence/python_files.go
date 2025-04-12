package persistence

import (
	"os"
	"path/filepath"
	"strings"
)

const (
	pythonFilesDir = "python_files"
)

type PythonFile struct {
	Name    string `json:"name"`
	Content string `json:"content"`
}

func init() {
	// Create python_files directory if it doesn't exist
	os.MkdirAll(pythonFilesDir, 0755)
}

func ListPythonFiles() ([]string, error) {
	files, err := os.ReadDir(pythonFilesDir)
	if err != nil {
		return nil, err
	}

	var pythonFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".py") {
			pythonFiles = append(pythonFiles, file.Name())
		}
	}

	return pythonFiles, nil
}

func GetPythonFile(name string) (*PythonFile, error) {
	content, err := os.ReadFile(filepath.Join(pythonFilesDir, name))
	if err != nil {
		return nil, err
	}

	return &PythonFile{
		Name:    name,
		Content: string(content),
	}, nil
}

func SavePythonFile(file *PythonFile) error {
	if !strings.HasSuffix(file.Name, ".py") {
		file.Name = file.Name + ".py"
	}
	return os.WriteFile(filepath.Join(pythonFilesDir, file.Name), []byte(file.Content), 0600)
}

func DeletePythonFile(name string) error {
	return os.Remove(filepath.Join(pythonFilesDir, name))
}
