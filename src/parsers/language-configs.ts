// src/parsers/language-configs.ts
import type { SupportedLanguage } from '../types.js';

export interface LanguageConfig {
  extensions: string[];
  parserModule: string;
  nodeTypes: {
    class: string[];
    function: string[];
    method: string[];
    import: string[];
    export: string[];
  };
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  typescript: {
    extensions: ['.ts', '.tsx'],
    parserModule: 'tree-sitter-typescript',
    nodeTypes: {
      class: ['class_declaration'],
      function: ['function_declaration', 'arrow_function'],
      method: ['method_definition'],
      import: ['import_statement'],
      export: ['export_statement'],
    },
  },
  javascript: {
    extensions: ['.js', '.jsx', '.mjs'],
    parserModule: 'tree-sitter-javascript',
    nodeTypes: {
      class: ['class_declaration'],
      function: ['function_declaration', 'arrow_function'],
      method: ['method_definition'],
      import: ['import_statement'],
      export: ['export_statement'],
    },
  },
  python: {
    extensions: ['.py'],
    parserModule: 'tree-sitter-python',
    nodeTypes: {
      class: ['class_definition'],
      function: ['function_definition'],
      method: ['function_definition'],
      import: ['import_statement', 'import_from_statement'],
      export: [],
    },
  },
  go: {
    extensions: ['.go'],
    parserModule: 'tree-sitter-go',
    nodeTypes: {
      class: ['type_declaration'],
      function: ['function_declaration'],
      method: ['method_declaration'],
      import: ['import_declaration'],
      export: [],
    },
  },
  rust: {
    extensions: ['.rs'],
    parserModule: 'tree-sitter-rust',
    nodeTypes: {
      class: ['struct_item', 'impl_item'],
      function: ['function_item'],
      method: ['function_item'],
      import: ['use_declaration'],
      export: ['pub'],
    },
  },
  java: {
    extensions: ['.java'],
    parserModule: 'tree-sitter-java',
    nodeTypes: {
      class: ['class_declaration', 'interface_declaration'],
      function: ['method_declaration'],
      method: ['method_declaration'],
      import: ['import_declaration'],
      export: [],
    },
  },
};

export function detectLanguage(filePath: string): SupportedLanguage | null {
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  for (const [lang, config] of Object.entries(LANGUAGE_CONFIGS)) {
    if (config.extensions.includes(ext)) {
      return lang as SupportedLanguage;
    }
  }
  return null;
}
