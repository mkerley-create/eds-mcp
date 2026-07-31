# Agent evaluations

Each scenario is run with the installed EDS agent block and without it. Generated
code is compiled, rendered, checked with axe, exercised by keyboard, and scanned
for invented APIs, raw Bootstrap components, inline styles, and primitive values.

The first recorded run becomes the release baseline. A stable release may not
reduce contract correctness, accessibility, or task completion scores.
