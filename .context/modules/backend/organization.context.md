# Organization Module Context

## Purpose
The **Organization Module** enables multi-tenancy for enterprise or institutional users (Schools, Language Centers). It groups Teachers under a single billing/administrative entity.

## Key Models
See `server/api/models.py`.

-   **Organization**: The top-level entity.
    -   `name`, `logo_url`.
    -   `owner`: FK to User (Admin).
-   **OrganizationMembership**: Links Teachers to Organizations.
    -   `role`: `owner`, `admin`, `member`.

## Core Features
1.  **Creation**: `POST /api/organizations/`.
2.  **Invitations**: Admin adds teachers via email.
3.  **Dashboard**: Aggregated stats for all classrooms under the org.

## Key Files
-   `server/api/views/organization_views.py`: CRUD logic.
