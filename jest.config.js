/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["js", "mjs", "cjs", "jsx", "ts", "tsx", "json", "node"],
  moduleNameMapper: {
    "^image![a-zA-Z0-9$_-]+$": "GlobalImageStub",
    "^[./a-zA-Z0-9$_-]+\\.png$": "<rootDir>/RelativeImageStub.js",
    "module_name_(.*)": "<rootDir>/substituted_module_$1.js",
    "assets/(.*)": ["<rootDir>/images/$1", "<rootDir>/photos/$1", "<rootDir>/recipes/$1"],
  },
};
