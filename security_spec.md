# Security Specification for X-Sphere

## Data Invariants
1. A user can only edit their own profile.
2. A post can only be edited or deleted by its author.
3. Messages can only be read/written by participants of the chat.
4. Private groups can only be seen and joined by invited members or via owner approval (simplified to membership check).
5. All IDs must be strictly validated.
6. Timestamps must be server-generated.

## The Dirty Dozen Payloads (Rejection Tests)
1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
2. **Post Hijacking**: Attempt to edit a post authoring ID.
3. **Ghost Post**: Create a post with a fake authorId.
4. **Message Sniffing**: Attempt to read messages from a chat the user is not in.
5. **Shadow Update**: Add an `isVerified: true` field to a user profile update.
6. **Timestamp Faking**: Provide a client-side `createdAt` for a new post.
7. **Orphan Message**: Create a message in a chat that doesn't exist.
8. **Group Escalation**: A non-member trying to update group settings.
9. **Large ID Poisoning**: Using a 2KB string as a document ID.
10. **Type Swapping**: Sending a number for a post content field.
11. **Massive Payload**: Sending a 2MB post content.
12. **Status Skipping**: Manually setting a terminal status like "deleted" without proper flow.

## Firestore Rules
I will now generate the rules following the 8 pillars.
