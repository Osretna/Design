# Security Specification: AI Studio Video Designer Platform

This specification describes the data validations, authorization schemas, and security boundaries guarding the platform's Firestore collections (`users`, `login_logs`, and `generated_videos`).

## 1. Data Invariants

1. **User Privileges Control**:
   - A standard user profile (`users/{userId}`) can only be created upon login.
   - Standard users cannot promote their own roles to `admin`. The `role` field can only be written during registration as 'user', or altered if the operator is an authenticated Admin.
   - Each user can view their own profile. Only Admins can query and list the overall user database.

2. **Login Audit Trail (`login_logs/{logId}`)**:
   - Every logged-in session creates a write-only log entry tracking device info, language choice, and login times.
   - Logs are immutable: once created, they cannot be updated or deleted by any user.
   - Only Admins and high-privilege operations can read or aggregate database logs for dashboard visualizations.

3. **Generated Videos Workspaces (`generated_videos/{videoId}`)**:
   - Standard users can only create video requests where `userId` strictly matches their authenticated `uid`.
   - Users can read, update, or delete their own video generations.
   - Standard users cannot alter or view other users' files. Admins can view and moderate all public and private generations.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads attempt to violate security boundaries and must be blocked with `PERMISSION_DENIED`.

### Attack 1: Self-Promoted Admin Privileges
- **Target**: `users/{userId}`
- **Payload**: `{ "userId": "user123", "email": "attacker@gmail.com", "role": "admin" }`
- **Violation**: Standard user attempting to register or update their own database account to the role of admin.

### Attack 2: Impersonated Log Writing
- **Target**: `login_logs/malicious_log`
- **Payload**: `{ "logId": "malicious_log", "userId": "victim_user_id", "email": "victim@gmail.com", "loginTime": "2026-06-02T09:00:00Z" }`
- **Violation**: Attacker trying to submit a login log under another user's authenticated email to poison audit data.

### Attack 3: Log Tampering (Update / Erase)
- **Target**: `login_logs/some_log_id`
- **Payload (Update)**: `{ "logId": "some_log_id", "userId": "user123", "loginTime": "2026-06-02T09:00:00Z", "platform": "Hacked-Device" }`
- **Violation**: Trying to update or wipe logging parameters after creation.

### Attack 4: Orphaned Video Creations
- **Target**: `generated_videos/video999`
- **Payload**: `{ "videoId": "video999", "userId": "another_user_id", "prompt": "Scary prompt", "status": "completed" }`
- **Violation**: Standard user crafting a video database entry assigned to another subscriber.

### Attack 5: Video Hijacking (The Shadow Update)
- **Target**: `generated_videos/victim_video`
- **Payload**: `{ "videoId": "victim_video", "userId": "attacker_id", "prompt": "Overridden prompt", "status": "completed", "ghost_field": "hacker_payload" }`
- **Violation**: Writing unauthorized keys (the Ghost Field attack) or switching video ownership.

### Attack 6: Bypass Queue Status Control
- **Target**: `generated_videos/my_video`
- **Payload (Update)**: `{ "status": "completed", "videoUrl": "http://attacker-controlled-payload.mp4" }`
- **Violation**: Attempting to bypass AI Generation to directly mark status as "completed" with static links.

---

## 3. Test Assertion Specs

All attempts to carry out unauthorized requests will trigger instantaneous rejection by the database security provider.
- `request.auth != null` is evaluated first to save query cost.
- Strict mapping checks ensure incoming fields match definitions: `request.resource.data.keys().hasAll(['userId', 'email'])`.
- Immutability is active for fields like `createdAt`.
