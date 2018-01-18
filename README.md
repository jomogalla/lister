# lister
### making life with fogbugz easier
## App Layout:
App.js - the brains/coordinator of this whole mess
Utilities.js - the grunt, handling API, building charts and other essential tasks
Constants.js - the `config` file of this whole mess.

## todo:
- Update Table rows to be components so they have start/stop/etc links
- Update prepareClockData() & calculateTimeWorked() to use the latest helpers, and have them accept params and return the arrays.
- Separate Login/Logout more in utilities, and less in vue
- separate different pages into components
- add routing
- fix mobile styles
- Add a way to pass functions to update the donuts
- add token validation/ajax check
- clean unused variables
- pass parameters into function instead of using vue data
- clean out unused scripts/styles (ongoing)
- use route params to specify fogbugz subdomain
- add comment editing.
- re add login with username/password
- add logout
- Allow the control button to allow inputting of a case number to start work on it.
- bug where updating current case in fogbugz doesnt update current case in top left

## todone:
- ~~move data passed into donuts into constants~~
- ~~find solution for cases updated in Fogbugz not being displayed until data is pulled again~~
- ~~combine the http response handlers~~
- ~~add start/stop on every case entry, everywhere (potentially make it a vue component)~~
- ~~organize css~~
- ~~fix utilities to actually build the donuts (potentially put in vue components), not the mess we have~~ 
- ~~hide html before vue renders~~
- ~~paginate time entry list~~
- ~~save token in cookie/localstorage~~
- ~~make case detail page~~

## notes: 
Case 44073 is the case for deleting time.