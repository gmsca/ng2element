# Convert Ng App to Ng element

> Working with Angular 8 and later.

## Try it

### Install it from npmjs

- go to your exist angular project folder
- run `ng add @gmsca/ng2element`
- run `npm run build:ngelement`
- then, you will get a `<projectname>-element.js` file in `root/elements/`
- Use webserver to load `elements` folder.
  - I use `live server` to open it in vscode.
- Open live server: http://localhost:5500
- it should work that is web component by angular element.

## Reference

- [Angular Elements Quick Start Guide by Jeff Delaney](https://angularfirebase.com/lessons/angular-elements-quick-start-guide/)
- [Schematics Utilities by Nitay Neeman](https://github.com/nitayneeman/schematics-utilities)
