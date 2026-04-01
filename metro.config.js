const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// react-i18next v17 ships an ESM build (dist/es/) with a "type":"module" package.json.
// Metro's package-exports resolver picks that build but then can't resolve the internal
// ./useTranslation.js imports (package-exports enforcement blocks non-exported paths).
// Redirect the main import to the CommonJS build so Metro can bundle it correctly.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-i18next') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/react-i18next/dist/commonjs/index.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
