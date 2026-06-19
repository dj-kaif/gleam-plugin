import plugin from '../plugin.json';
import { StreamLanguage } from '@codemirror/language';

/**
 * Minimal stream-based tokenizer for Gleam syntax highlighting (v1).
 *
 * This covers the common cases: keywords, types, strings, numbers,
 * comments (line + block), attributes (@external etc.) and operators.
 * It is regex/state based rather than a full parse tree, so it won't
 * catch every edge case - that's intentional for a first release.
 *
 * Planned for a later version: a proper Lezer grammar (real syntax
 * tree, bracket matching, indentation) and LSP-powered autocomplete
 * via `gleam lsp`.
 */
const gleamStreamParser = {
  startState() {
    return { inBlockComment: false };
  },

  token(stream, state) {
    if (state.inBlockComment) {
      if (stream.match(/^[\s\S]*?\*\//)) {
        state.inBlockComment = false;
      } else {
        stream.skipToEnd();
      }
      return 'comment';
    }

    if (stream.eatSpace()) return null;

    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    if (stream.match('/*')) {
      state.inBlockComment = true;
      return 'comment';
    }

    if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) {
      return 'string';
    }

    // Attributes like @external, @deprecated, @target
    if (stream.match(/^@[a-zA-Z_][a-zA-Z0-9_]*/)) {
      return 'meta';
    }

    if (stream.match(/^\d[\d_]*\.[\d_]+/) || stream.match(/^\d[\d_]*/)) {
      return 'number';
    }

    if (
      stream.match(
        /^(pub|fn|let|assert|case|of|import|as|type|opaque|const|use|todo|panic|if|else|in)\b/
      )
    ) {
      return 'keyword';
    }

    if (stream.match(/^(True|False|Nil)\b/)) {
      return 'atom';
    }

    // Uppercase identifiers: custom types, module-qualified names
    if (stream.match(/^[A-Z][a-zA-Z0-9_]*/)) {
      return 'typeName';
    }

    // Lowercase identifiers: variables, function names, labels
    if (stream.match(/^[a-z_][a-zA-Z0-9_]*/)) {
      return 'variableName';
    }

    if (stream.match(/^(\|>|->|<>|\.\.|==|!=|<=|>=|&&|\|\|)/)) {
      return 'operator';
    }

    if (stream.match(/^[+\-*/%<>=!]/)) {
      return 'operator';
    }

    if (stream.match(/^[(){}\[\],.:;]/)) {
      return 'punctuation';
    }

    stream.next();
    return null;
  },
};

const gleamLanguage = StreamLanguage.define(gleamStreamParser);

const FILE_ICON_STYLE_ID = 'gleam-plugin-file-icon';

/**
 * Acode renders file-tree/tab icons as
 * <span class="file file_type_default file_type_<ext>">, with a core
 * stylesheet that paints a background image per file_type_X class
 * (confirmed by inspecting the rendered DOM - e.g. package.json gets
 * file_type_json + file_type_npm). There's no public API for this,
 * so we inject one CSS rule for file_type_gleam. Matched on
 * `.file.file_type_gleam` and !important to be safe against
 * specificity/order differences with Acode's own stylesheet.
 */
function registerGleamFileIcon(baseUrl) {
  if (document.getElementById(FILE_ICON_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = FILE_ICON_STYLE_ID;
  style.textContent = `
    .file.file_type_gleam {
      background-image: url("${baseUrl}icon.png") !important;
      background-size: contain !important;
      background-repeat: no-repeat !important;
      background-position: center !important;
    }
  `;
  document.head.appendChild(style);
}

function unregisterGleamFileIcon() {
  const style = document.getElementById(FILE_ICON_STYLE_ID);
  if (style) style.remove();
}

class AcodePlugin {

  async init() {
    const editorLanguages = acode.require('editorLanguages');
    editorLanguages.register(
      'gleam',
      ['gleam'],
      'Gleam',
      async () => gleamLanguage,
    );

    registerGleamFileIcon(this.baseUrl);
  }

  async destroy() {
    const editorLanguages = acode.require('editorLanguages');
    editorLanguages.unregister('gleam');

    unregisterGleamFileIcon();
  }
}

if (window.acode) {
  const acodePlugin = new AcodePlugin();
  acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    acodePlugin.baseUrl = baseUrl;
    await acodePlugin.init($page, cacheFile, cacheFileUrl);
  });
  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
