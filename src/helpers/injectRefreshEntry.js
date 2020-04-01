/** @typedef {string | string[] | import('webpack').Entry} StaticEntry */
/** @typedef {StaticEntry | import('webpack').EntryFunc} WebpackEntry */

/**
 * Injects an entry to the bundle for react-refresh.
 * @param {WebpackEntry} [originalEntry] A Webpack entry object.
 * @param {import('../types').ReactRefreshPluginOptions} [options] Configuration options for this plugin.
 * @returns {WebpackEntry} An injected entry object.
 */
const injectRefreshEntry = (originalEntry, options) => {
  const sockHost = options.sockHost ? `&sockHost=${options.sockHost}` : '';
  const sockPort = options.sockPort ? `&sockPort=${options.sockPort}` : '';
  const sockPath = options.sockPath ? `&sockPath=${options.sockPath}` : '';
  const queryParams = `?options${sockHost}${sockPort}${sockPath}`;
  const entryInjects = [
    // Legacy WDS SockJS integration
    options.useLegacyWDSSockets && require.resolve('../runtime/LegacyWebpackDevServerSocket'),
    // React-refresh runtime
    require.resolve('../runtime/ReactRefreshEntry'),
    // Error overlay runtime
    options.overlay && options.overlay.entry + queryParams,
  ].filter(Boolean);

  // Single string entry point
  if (typeof originalEntry === 'string') {
    return [...entryInjects, originalEntry];
  }
  // Single array entry point
  if (Array.isArray(originalEntry)) {
    return [...entryInjects, ...originalEntry];
  }
  // Multiple entry points
  if (typeof originalEntry === 'object') {
    return Object.entries(originalEntry).reduce(
      (acc, [curKey, curEntry]) => ({
        ...acc,
        [curKey]: injectRefreshEntry(curEntry, options),
      }),
      {}
    );
  }
  // Dynamic entry points
  if (typeof originalEntry === 'function') {
    return (...args) =>
      Promise.resolve(originalEntry(...args)).then((resolvedEntry) =>
        injectRefreshEntry(resolvedEntry, options)
      );
  }

  throw new Error('Failed to parse the Webpack `entry` object!');
};

module.exports = injectRefreshEntry;
