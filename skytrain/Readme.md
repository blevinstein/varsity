# Skytrain

## Database

Hierarchy:

- Account
  - Operation

Account:

- Address (string)
- WaitUntil (timestamp)
- Region (string/enum)

Operation:

- Priority (int), lower numbers are higher priority
- Details (string/json), blob containing execution details
  - Operation type
  - Arguments
- Status (TODO, DONE, FAILED)

## Runner

One runner is created for each region, and runs in a corresponding AWS VPC. Each runner periodically
wakes up and looks for an account with:

- WaitUntil < Now
- Highest-priority Operation in TODO state
- Region corresponding to the runner region

Upon finding such an account:

- The operation is executed
- On success, Status=DONE, WaitUntil = Now + Random(WaitAfterMin, WaitAfterMax)
- On failure, Status=FAILED

Failure states must be recovered from manually.

## Scheduler

The schedule is given:
- A list of addresses and start times
- A list of operations

Each address is scheduled to perform all of the given operations, starting at the appointed start
time, by setting WaitUntil appropriately.

