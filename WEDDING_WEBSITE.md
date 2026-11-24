# Wedding website

Use **Wedding Website** in the navigation to publish invitation details. Set `WEDDING_SITE_ADMIN_EMAIL` to the verified Firebase account authorized to publish, and configure the existing Firebase Admin service account on the API server. The panel's development login cannot publish public content.

The public endpoint is `GET /api/public/wedding-site`. It serves only the invitation fields defined in `src/config/wedding-fields.json`. Published values use the manager's existing Turso database or local JSON storage, depending on its configuration.

Rebuild the panel with `npm --prefix client run build` before serving the production bundle with Express. Set `MARRIAGE_MANAGER_URL` in the Next.js deployment to this server's origin. Manage personalized RSVP links through **Guests** as usual.
