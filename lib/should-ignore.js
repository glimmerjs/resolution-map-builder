'use strict';

const IGNORED_EXTENSIONS = ['', '.md', '.html'];
const IGNORED_SUFFIXES = ['.d.ts'];
const IGNORED_PREFIXES = ['.'];

/*
 * Returns true if the passed path.parse() object should be ignored.
 */
function shouldIgnore(pathParts) {
  // ignore any of these extensions (.md, .html, etc)
  if (IGNORED_EXTENSIONS.indexOf(pathParts.ext) > -1) {
    return true;
  }

  // ignore .d.ts files, etc
  if (IGNORED_SUFFIXES.some(suffix => pathParts.base.endsWith(suffix))) {
    return true;
  }

  // ignore dotfiles
  if (IGNORED_PREFIXES.some(prefix => pathParts.base.startsWith(prefix))) {
    return true;
  }

  return false;
}

module.exports = shouldIgnore;
