module.exports = api => ({
  presets: ['module:@react-native/babel-preset'],
  plugins: api.env('test')
    ? []
    : [
        [
          'module:react-native-dotenv',
          {
            moduleName: '@env',
            path: '.env',
            safe: false,
            allowUndefined: true,
            allowlist: [
              'SUPABASE_URL',
              'SUPABASE_PUBLISHABLE_KEY',
              'LOCATIONIQ_PUBLIC_KEY',
              'API_BASE_URL',
            ],
          },
        ],
      ],
});
