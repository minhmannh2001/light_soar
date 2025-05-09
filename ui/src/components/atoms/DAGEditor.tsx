import React, { useEffect, useRef } from 'react';
import MonacoEditor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';

// Configure schema at module level (before editor initialization)
configureMonacoYaml(monaco, {
  enableSchemaRequest: true,
  hover: true,
  completion: true,
  validate: true,
  format: true,
  schemas: [
    {
      uri: 'https://raw.githubusercontent.com/daguflow/dagu/main/schemas/dag.schema.json',
      fileMatch: ['*'], // Match all YAML files
    },
  ],
});

loader.config({ monaco });

type Props = {
  value: string;
  onChange: (value?: string) => void;
};

function DAGEditor({ value, onChange }: Props) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    return () => {
      editorRef.current?.dispose();
    };
  }, []);

  const editorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Wait for editor to be fully initialized and content to be set
    setTimeout(() => {
      const action = editor.getAction('editor.action.formatDocument');
      if (action && editor.hasTextFocus()) {
        action.run().catch((err) => {
          console.warn('Format document action failed:', err);
        });
      }
    }, 300); // Increased timeout to ensure content is loaded
  };

  return (
    <MonacoEditor
      height="60vh"
      language="yaml"
      value={value}
      onChange={onChange}
      onMount={editorDidMount}
      options={{
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        quickSuggestions: { other: true, comments: false, strings: true },
        formatOnType: true,
        formatOnPaste: true,
        renderValidationDecorations: 'on',
        lineNumbers: 'on',
        glyphMargin: true,
      }}
    />
  );
}

export default DAGEditor;
