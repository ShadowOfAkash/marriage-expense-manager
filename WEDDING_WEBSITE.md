# Wedding website

Use **Wedding Website** in the navigation to publish invitation details. The existing manager owner can publish after signing in with verified Firebase credentials. Configure the existing Firebase Admin service account on the API server. To use a different verified account, set `WEDDING_SITE_ADMIN_EMAIL` and `WEDDING_SITE_ADMIN_UID`. The panel's development login cannot publish public content.

The public endpoint is `GET /api/public/wedding-site`. It serves only the invitation fields defined in `src/config/wedding-fields.json`. Published values use the manager's existing Turso database or local JSON storage, depending on its configuration.

Rebuild the panel with `npm --prefix client run build` before serving the production bundle with Express. Set `MARRIAGE_MANAGER_URL` in the Next.js deployment to this server's origin. Manage personalized RSVP links through **Guests** as usual.

Public wedding RSVPs appear in **Guests**, tagged **Website RSVP**. The list refreshes every three seconds while open. Existing responses from the former inbox transfer when the verified wedding owner opens Guests. For a publishing account other than the existing legacy owner, also set `WEDDING_SITE_ADMIN_UID` to that account’s Firebase UID so website RSVPs are assigned to the correct guest list.
