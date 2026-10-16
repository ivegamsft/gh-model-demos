# ADR N-014: Notification dispatch

Status: proposed; review owner: Messaging lead. Date: 2026-10-01.
This is a fictional offline exercise, not a provider pricing claim.

## 1. Requirements

- R1: Process 20,000 jobs/day and bursts of 50 jobs/second with a two-person
  on-call team and no queue service already operated by the team.
- R2: Accept at-least-once internal delivery. Every acknowledged enqueue must
  survive a process crash; dispatch p95 must be under 60 seconds.
- R3: Suppress duplicate user-visible email sends for 24 hours, including
  retries after an ambiguous provider timeout.
- R4: An operator must be able to identify poison jobs and resume dispatch
  within 15 minutes, without database surgery.
- R5: Delete completed payloads within seven days. Keep aggregate counts only
  afterward. Payloads contain synthetic recipient handles in this exercise.

## 2. Proposed database-backed worker

Enqueue and the originating business transaction commit in the same database.
Workers atomically claim rows with a ten-second lease; a crashed worker's rows
become claimable again. Workers poll once per second in batches of 50.
The email provider may take 30 seconds to respond. Idempotency is held only in
the current worker's memory and the provider receives no stable idempotency key.
Another worker may claim a row when its lease expires.

Jobs retry indefinitely with exponential backoff capped at one minute.
There is no failed-job view, dead-letter state, or operator replay command.
Operators currently inspect rows by hand.

Completed rows and their complete payloads remain in the database indefinitely.
Daily aggregate metrics are also recorded.

## 3. Alternatives and evidence

A managed queue would still require a durable outbox or a transaction boundary
between database commit and publication. The team has not measured its
operational burden. No external price or throughput guarantee is assumed.
The database can currently claim 100 rows/second in the synthetic load test;
that measures claims, not provider throughput or end-to-end latency.

## 4. Open review questions and owners

Messaging lead owns delivery identity and provider timeout experiments.
Operations lead owns a timed poison-job recovery drill.
Data governance owner owns payload retention approval and deletion verification.
These owners may resolve material gaps; consensus is not required.
