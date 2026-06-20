module.exports = function (api) {
  const platform = api.caller((caller) => caller?.platform) ?? 'ios';
  api.cache.using(() => platform);

  // En web, resolver primero *.web.ts para poder dar implementaciones distintas por plataforma.
  const extensions =
    platform === 'web'
      ? ['.web.tsx', '.web.ts', '.tsx', '.ts', '.js', '.jsx', '.json']
      : ['.tsx', '.ts', '.js', '.jsx', '.json'];

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: { '@': './' },
          extensions,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
