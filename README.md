HL2 Static
==========

- [Description](#description)
- [Tasks](#tasks)
  - [Deploy](#deploy)

Description
-----------

Static content for HL2 projects

Tasks
-----

- `npm install` install dependencies
- `npm run clean` clean up
- `npm run build` run clean task

### Deploy

To deploy a version run the following command:

```
  $ npm run deploy -- --environment [dev | staging | prod]
```

**Please, use `git fetch origin master --dry-run` to check that your local Git repository is up to date.**
