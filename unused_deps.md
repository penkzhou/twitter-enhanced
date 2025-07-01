# Unused Dependencies Analysis

## Definitely Unused (Safe to Remove)

### Dependencies
1. **twitter-openapi-typescript** - Not imported anywhere in the codebase. The extension uses hardcoded Twitter GraphQL endpoints instead.

### DevDependencies
1. **file-loader** - Commented out in webpack.config.js (line 92). Webpack 5 uses asset modules instead.
2. **babel-preset-react-app** - Not used in .babelrc or webpack config. Only @babel/preset-react is active.
3. **@babel/plugin-proposal-class-properties** - Commented out in .babelrc (line 8).
4. **@babel/preset-env** - Commented out in .babelrc (line 3).
5. **type-fest** - No imports or usage of type-fest utilities found in the codebase.
6. **depcheck** - Meta dependency only used to check other dependencies, not part of the build.
7. **webpack-bundle-analyzer** - Referenced in package.json scripts but not installed as a dependency.

## Possibly Unused (Need Further Verification)

### DevDependencies
1. **@babel/eslint-parser** - May be used by eslint-config-react-app internally
2. **eslint-plugin-flowtype** - Part of eslint-config-react-app, but project uses TypeScript not Flow
3. **babel-loader** - Used in webpack.config.js for JS/JSX files, but the project is primarily TypeScript
4. **source-map-loader** - Used in webpack.config.js but may not be necessary for production

## Actually Used (Keep)

All other dependencies are actively used:
- **@radix-ui/react-dialog** & **@radix-ui/react-slot** - Used in UI components
- **class-variance-authority**, **clsx**, **tailwind-merge** - Used for styling utilities
- **date-fns** - Used for date formatting
- **dotenv-webpack** - Used in webpack config
- **idb** - Used for IndexedDB storage
- **lucide-react** - Used for icons
- **react** & **react-dom** - Core framework
- **tailwindcss-animate** - Used in tailwind.config.js
- All testing libraries - Used in test files
- All webpack-related plugins - Used in build process
- **postcss**, **postcss-import**, **postcss-loader** - Used for CSS processing
- **autoprefixer** - Used in postcss config
- **ts-loader**, **typescript** - Core TypeScript compilation
- **sass**, **sass-loader** - Used for SCSS support
- **prettier**, **eslint** and plugins - Code quality tools
- **jest** and related - Testing framework
- **zip-webpack-plugin** - Used in build.js to create extension package

## Recommendations

1. Remove the definitely unused dependencies to reduce package size
2. Consider removing Flow-related eslint plugin if not using Flow
3. webpack-bundle-analyzer should be added as a devDependency if the analyze script is to be used
4. Consider migrating fully from Babel to TypeScript compilation for consistency