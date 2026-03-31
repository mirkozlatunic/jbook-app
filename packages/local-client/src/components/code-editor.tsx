import Editor, { type OnMount } from '@monaco-editor/react';
import * as prettier from 'prettier';
import estreePlugin from 'prettier/plugins/estree';
import babelPlugin from 'prettier/plugins/babel';
import { useRef } from 'react';
import './code-editor.css';
import './syntax.css';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import Highlighter from 'monaco-jsx-highlighter';

const babelParse = (code: string) =>
  parse(code, { sourceType: 'module', plugins: ['jsx'] });

interface CodeEditorProps {
  initialValue: string;
  onChange(value: string): void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ initialValue, onChange }) => {
  const editorRef = useRef<Parameters<OnMount>[0] | undefined>(undefined);
  const onEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });

    editor.getModel()?.updateOptions({ tabSize: 2, insertSpaces: true });

    const highlighter = new Highlighter(
      // @ts-expect-error - monaco is attached to window by @monaco-editor/react
      window.monaco,
      babelParse,
      traverse,
      editor,
    );
    // First arg is debounceTime (ms); other params default to internal getAstPromise
    highlighter.highLightOnDidChangeModelContent(100);
  };

  const onFormatClick = async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const unformatted = editor.getModel()?.getValue() ?? '';
    const format = (prettier.default ?? prettier).format;
    const formatted = (
      await format(unformatted, {
        parser: 'babel',
        plugins: [estreePlugin, babelPlugin],
        useTabs: false,
        semi: true,
        singleQuote: true,
      })
    ).replace(/\n$/, '');

    editor.setValue(formatted);
  };

  return (
    <div className="editor-wrapper">
      <button
        className="button button-format is-primary is-small"
        onClick={onFormatClick}
      >
        Format
      </button>
      <Editor
        onMount={onEditorDidMount}
        value={initialValue}
        theme="vs-dark"
        language="javascript"
        height="100%"
        options={{
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: false,
          wordWrap: 'on',
          minimap: { enabled: false },
          showUnused: false,
          folding: false,
          lineNumbersMinChars: 3,
          fontSize: 16,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;
