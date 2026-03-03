## ADDED Requirements

### Requirement: File attachments use AI Elements Attachments component
The system SHALL render pending file attachments in the input area using the AI Elements `Attachments` component with `Attachment`, `AttachmentPreview`, `AttachmentInfo`, and `AttachmentRemove` sub-components.

#### Scenario: User attaches an image file
- **WHEN** the user selects an image file for attachment
- **THEN** the file is displayed as an `Attachment` with `AttachmentPreview` showing a thumbnail, `AttachmentInfo` showing the filename and type, and `AttachmentRemove` allowing removal

#### Scenario: User attaches a non-image file
- **WHEN** the user selects a document or other non-image file
- **THEN** the file is displayed as an `Attachment` with a file type icon in `AttachmentPreview`, filename in `AttachmentInfo`, and `AttachmentRemove` for removal

### Requirement: Attachments support grid and inline layout variants
The system SHALL use the `grid` variant for the attachment preview area in the prompt input (showing thumbnails) and the `inline` variant for attachment badges displayed within sent messages.

#### Scenario: Attachments in prompt input area
- **WHEN** one or more files are attached before sending
- **THEN** they are displayed in a grid layout with thumbnail previews in the prompt input header area

#### Scenario: Attachments shown in sent user message
- **WHEN** a user message with file attachments is displayed in the conversation
- **THEN** the attachments are shown as inline badges within the message bubble using `MessageAttachments`

### Requirement: Drag-and-drop file upload
The system SHALL support drag-and-drop file upload using the `PromptInput` component's `globalDrop` capability, allowing users to drop files anywhere on the chat area.

#### Scenario: User drags files onto the chat
- **WHEN** the user drags one or more files over the chat area and drops them
- **THEN** the files are added as attachments in the prompt input, subject to the agent's supported input modalities

### Requirement: File type validation against agent capabilities
The system SHALL validate file types against the connected agent's `supportedInputModes` before accepting attachments. Unsupported file types SHALL be rejected with a user-visible error message.

#### Scenario: User attaches a supported file type
- **WHEN** the user attaches a file whose MIME type matches the agent's `supportedInputModes`
- **THEN** the file is accepted and displayed in the attachment preview

#### Scenario: User attaches an unsupported file type
- **WHEN** the user attaches a file whose MIME type does not match the agent's `supportedInputModes`
- **THEN** the file is rejected and an error message is displayed to the user

### Requirement: Attachment remove functionality
The system SHALL allow users to remove individual attachments before sending by clicking the `AttachmentRemove` button on each attachment.

#### Scenario: User removes an attachment
- **WHEN** the user clicks the remove button on an attachment
- **THEN** the attachment is removed from the pending attachments list and the preview updates
