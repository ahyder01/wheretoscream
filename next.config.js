module.exports = {
	// Ensure Next doesn't emit browser source maps in production
	productionBrowserSourceMaps: false,
	// explicitly opt-in/declare turbopack config to silence the message
	turbopack: {},
	webpack: (config, { dev }) => {
		// Disable devtool in development to avoid parsing malformed source maps
		if (dev) {
			config.devtool = false;
		}
		return config;
	},
};
