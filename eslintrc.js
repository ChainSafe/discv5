module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint",
        "@typescript-eslint/tslint"
    ],
    "rules": {
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": "error",
        "@typescript-eslint/ban-types": "error",
        "@typescript-eslint/class-name-casing": "error",
        "@typescript-eslint/explicit-member-accessibility": [
            "error",
            {
                "overrides": {
                    "constructors": "off"
                }
            }
        ],
        "@typescript-eslint/indent": "error",
        "@typescript-eslint/interface-name-prefix": "error",
        "@typescript-eslint/no-angle-bracket-type-assertion": "error",
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-triple-slash-reference": "error",
        "@typescript-eslint/no-use-before-declare": "off",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-interface": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/type-annotation-spacing": "error",
        "@typescript-eslint/unified-signatures": "error",
        "arrow-body-style": "error",
        "arrow-parens": [
            "error",
            "as-needed"
        ],
        "complexity": "off",
        "constructor-super": "error",
        "curly": "error",
        "dot-notation": "error",
        "eol-last": "error",
        "guard-for-in": "error",
        "max-classes-per-file": [
            "error",
            1
        ],
        "member-ordering": "error",
        "new-parens": "error",
        "no-bitwise": "off",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": "off",
        "no-debugger": "error",
        "no-empty": "off",
        "no-empty-functions": "off",
        "no-eval": "error",
        "no-fallthrough": "off",
        "no-invalid-this": "off",
        "no-multiple-empty-lines": "error",
        "no-new-wrappers": "error",
        "no-throw-literal": "error",
        "no-undef-init": "error",
        "no-unsafe-finally": "error",
        "no-unused-labels": "error",
        "no-var": "error",
        "object-shorthand": "error",
        "one-var": "error",
        "prefer-const": "error",
        "quote-props": [
            "error",
            "consistent-as-needed"
        ],
        "radix": "error",
        "space-before-function-paren": [
            "error",
            {
                "anonymous": "never",
                "asyncArrow": "always",
                "constructor": "never",
                "method": "never",
                "named": "never"
            }
        ],
        "use-isnan": "error",
        "valid-typeof": "off",
        "@typescript-eslint/tslint/config": [
            "error",
            {
                "rules": {
                    "align": [
                        true,
                        "parameters",
                        "statements"
                    ],
                    "comment-format": [
                        true,
                        "check-space"
                    ],
                    "import-spacing": true,
                    "jsdoc-format": true,
                    "max-line-length": [
                        true,
                        120
                    ],
                    "no-reference-import": true,
                    "no-shadowed-variable": true,
                    "no-trailing-whitespace": true,
                    "no-unused-expression": true,
                    "one-line": [
                        true,
                        "check-catch",
                        "check-else",
                        "check-finally",
                        "check-open-brace",
                        "check-whitespace"
                    ],
                    "only-arrow-functions": [
                        true,
                        "allow-declarations",
                        "allow-named-functions"
                    ],
                    "ordered-imports": [
                        true,
                        {
                            "import-sources-order": "case-insensitive",
                            "module-source-path": "full",
                            "named-imports-order": "case-insensitive"
                        }
                    ],
                    "quotemark": [
                        true,
                        "double",
                        "avoid-escape"
                    ],
                    "semicolon": [
                        true,
                        "always"
                    ],
                    "triple-equals": [
                        true,
                        "allow-null-check"
                    ],
                    "variable-name": [
                        true,
                        "ban-keywords",
                        "check-format",
                        "allow-pascal-case"
                    ],
                    "whitespace": [
                        true,
                        "check-branch",
                        "check-decl",
                        "check-operator",
                        "check-separator",
                        "check-type",
                        "check-typecast"
                    ]
                }
            }
        ]
    }
};
