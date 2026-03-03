## ADDED Requirements

### Requirement: File attachments render with image thumbnails
The system SHALL render pending file attachments in the input area as preview cards. Image attachments SHALL display actual thumbnail previews with filename labels. Non-image attachments SHALL display as compact text badges with file type icons.

#### Scenario: User attaches an image file
- **WHEN** the user selects an image file for attachment
- **THEN** the file is displayed as a thumbnail preview card with rounded borders, shadow, and filename label below

#### Scenario: User attaches a non-image file
- **WHEN** the user selects a document or other non-image file
- **THEN** the file is displayed as a compact badge with file type icon and filename

### Requirement: User message attachments show image previews
The system SHALL render sent message attachments differently for images vs other files. Image attachments in sent messages SHALL display as thumbnail previews with bordered cards and filename labels. Non-image attachments SHALL display as inline badges with file type icons.

#### Scenario: Sent message with image attachments
- **WHEN** a user message with image attachments is displayed in the conversation
- **THEN** the images are shown as thumbnail previews in bordered cards with filename labels

#### Scenario: Sent message with non-image attachments
- **WHEN** a user message with non-image attachments is displayed
- **THEN** the attachments are shown as inline text badges with file type icons

### Requirement: File type validation against agent capabilities
The system SHALL validate file types against the connected agent's `supportedInputModes` before accepting attachments. Unsupported file types SHALL be rejected with a user-visible alert message.

#### Scenario: User attaches a supported file type
- **WHEN** the user attaches a file whose MIME type matches the agent's `supportedInputModes`
- **THEN** the file is accepted and displayed in the attachment preview

#### Scenario: User attaches an unsupported file type
- **WHEN** the user attaches a file whose MIME type does not match the agent's `supportedInputModes`
- **THEN** the file is rejected and an alert message is displayed listing supported types

### Requirement: Attachment remove functionality
The system SHALL allow users to remove individual attachments before sending by clicking a close button on each attachment preview.

#### Scenario: User removes an attachment
- **WHEN** the user clicks the remove button on an attachment
- **THEN** the attachment is removed from the pending attachments list and the preview updates

### Requirement: Agent response images render as clickable cards
The system SHALL render image file parts in agent responses as bordered cards with shadow styling. Clicking the image SHALL open the full-size image in a new browser tab.

#### Scenario: Image in agent response
- **WHEN** an agent response contains a file part with an image MIME type
- **THEN** the image is displayed in a rounded bordered card with shadow, clickable to open full-size in a new tab
