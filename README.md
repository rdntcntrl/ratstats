# Ratstats

Web-based game statistics for Ratarena.

## Installing

Install `npm`.

Install Tailwind:

    npm install -D tailwindcss


After installing Tailwind, run

    make clean
    make dist

The production-ready files will then be put in the `dist/` directory. Note that
this will **NOT** contain any demo match statistics in `matches/`, nor an
`matches.json` (which lists those matches).

If you wish to deploy this, those files need to be generated first (or copy the
demo stats from `demo_stats/` into dist/).

### Dev Server

To run a development server with demo stats that automatically updates the CSS
when anything is changed, run

    make demo
    ./devserve.sh

The server listens on 127.0.0.1:8000

You can replace the stats shown by replacing `www/matches.json` and `www/matches`.
(These will be deleted by `make clean`)

## Levelshots

After `make dist`, put the map levelshots in `dist/images/lvlshot` (as jpg).

For the development server (after `make demo`), put them in `www/images/lvlshot` instead.

# License

Copyright 2022 naeb, treb, rdnt cntrl
Licensed under GPLv2 (see LICENSE)

- Overpass Font:
  https://github.com/RedHatOfficial/Overpass.git
  Copyright 2016 Red Hat, Inc.,
  Licensed under LGPL 2.1 : http://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
- JQuery:
  https://jquery.org/
  MIT license
- Tailwind CSS:
  https://tailwindcss.com/
  MIT license
- The Datepicker
  https://github.com/thedatepicker/thedatepicker
  MIT license

