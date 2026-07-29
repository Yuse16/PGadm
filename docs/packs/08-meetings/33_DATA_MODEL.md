# Modelo funcional de datos

## Meeting

- id
- title
- type
- store_id
- area
- scheduled_at
- status
- organizer_id
- current_version_id

## MeetingVersion

- id
- meeting_id
- version_number
- status
- approved_by
- approved_at

## MeetingParticipant

- meeting_id
- user_id
- external_name
- role
- attended

## MeetingAsset

- id
- version_id
- type
- title
- file_url
- uploaded_by
- uploaded_at

## Transcript

- id
- asset_id
- language
- text
- status
- created_at

## TranscriptSegment

- transcript_id
- speaker_label
- start_time
- end_time
- text

## Agreement

- id
- version_id
- description
- owner_id
- area
- due_at
- status
- source_reference

## MeetingQuestion

- id
- version_id
- question
- owner_id
- status
- answer

## MeetingTask

- id
- agreement_id
- module
- title
- assigned_to
- due_at
- status
