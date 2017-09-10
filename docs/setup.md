# Setup

This is what you need to install:

 - [NodeJS](https://nodejs.org) v6 or higher

Then open a shell and clone the repository to your local machine.

To ensure everything is working, run this command from the root of the repository:

```sh
npm install
```

This will install the dependencies, compile the library source and run the suite of tests.

### Coding Style

The coding style is based on [Prettier](https://github.com/prettier/prettier)
and can be validated from the command line:

```sh
npm run is-it-pretty
```

To ensure your changes match the formatting, just run this before committing:

```sh
npm run prettify
```

Or add [prettier integration for your editor](https://github.com/prettier/prettier#editor-integration)
for first-class support.

