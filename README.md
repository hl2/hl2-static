HL2 Static
==========

- [Description](#description)
- [Tasks](#tasks)
  - [Release](#release)
  - [Deploy](#deploy)
- [License](#license)

Description
-----------

Static content for HL2 projects

Tasks
-----

- `npm install` install dependencies
- `npm run clean` clean up
- `npm run build` run clean task

### Release

To release a branch run the following commands:
> Please, check that your local Git repository is clean before release

```
  $ git checkout branchname
  $ npm run release [major | minor | patch | premajor | preminor | prepatch | prerelease]
```

### Deploy

To deploy a version on CloudFront run the following command:
> Please, check that your local Git repository is clean and up to date before deploy

```
  $ npm run deploy -- [--environment (dev|staging|prod)
```

License
-------

### Copyright (C) hl2

#### All rights reserved
#### contact@hl2.com

All information contained herein is, and remains the property of
hl2 and its suppliers, if any. The intellectual and technical
concepts contained herein are proprietary to hl2 and its suppliers
and may be covered by foreign patents, patents in process, and are
protected by trade secret or copyright law. Dissemination of this
information or reproduction of this material is strictly forbidden unless
prior written permission is obtained from hl2.
