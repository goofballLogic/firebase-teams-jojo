# firebase-teams-jojo
Simple teams and entitlements in Firebase

## Features

- [ ] Create team
- [ ] Delete team
- [ ] Rename team
- [ ] View team members
- [ ] Invite team member
- [ ] Remove team member

### Invitations

Invitations are issued against a particular email address and must match the logged-in email address of the user accepting an invitation.

### Business logic

#### Via firestore rules

- [x] Team can only be created by an account admin
- [x] Team can only be created if the account has entitlements to create a team
- [x] User can be made admin of a team only by an account admin or another team admin
- [x] Team members can only be removed by team or account admin
- [x] Only a user can update their own user record
- [x] Only admin can update their own team memberships
- [x] Nobody can update Public user directly
- [x] Invitation can only be created by account or team admin
- [x] Only a logged in user with matching email can accept an invitation

#### Via functions

- [x] Account has record of teams
- [ ] Person creating a team is a member
- [ ] Public user is created by the server in response to user write
- [ ] Team membership can be updated by the server in response to invitation acceptance

### Schema
- Account has...
  - 0 or many teams
  - 0 or many users
  - 0 or many admins
  - entitlements to create 0 or many teams

- Team has...
  - 0 or many members
  - members have 0 or many roles

- User has...
  - 0 or many teams
  - name, email, uid
  - 1 or many accounts

- [READONLY] Public user has...
  - name, email

- Invitation has...
  - To
    - name, email
  - From
    - name, uid
  - 0 or 1 Accept
    - uid, when


