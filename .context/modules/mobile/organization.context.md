# Organization Mobile Context

## Features
- **Org Dashboard**: High-level statistics for organization admins (Total Students, Teachers, Classrooms).
- **Member Management**: List, search, and view members within the organization.
- **Invite Flow**: Mobile optimized form for inviting new teachers or admins.
- **Branding**: UI components (buttons, headers) reflect the organization's `primary_color` if set.

## Navigation Patterns
- **Path**: `/m/org/:slug`
- **Tabs**: Overview (Dashboard), Members, Classrooms.

## Logic
- **Permission Mapping**: Roles (admin/teacher) determined via `OrganizationMembership` model.
- **Member Actions**: Admins can remove members or update roles directly from the mobile list view.
