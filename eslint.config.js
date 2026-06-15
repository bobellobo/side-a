const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

const baseConfig = Array.isArray(expoConfig) ? expoConfig : [expoConfig];

module.exports = defineConfig([
	...baseConfig,
	{
		rules: {
			"@typescript-eslint/array-type": "off",
		},
	},
]);
