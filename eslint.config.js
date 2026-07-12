import antfu from "@antfu/eslint-config";

export default antfu({
	formatters: true,
	typescript: true,
	stylistic: {
		indent: "tab", // 4, or 'tab'
		quotes: "double", // or 'double'
		braceStyle: "1tbs", // '1tbs', or 'allman'
		semi: true,
	},
	rules: {
		"node/prefer-global/process": ["error", "always"],
		"unused-imports/no-unused-vars": ["off"], // ["error", { argsIgnorePattern: "^_|^.{3}" }]
	},
});
