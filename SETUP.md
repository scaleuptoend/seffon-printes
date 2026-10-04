# Seffon Dupatta Centre: deploy on Cloudflare Pages with a D1 database

## Folder layout (keep it exactly like this)
public/index.html      the website + admin panel
functions/api/*.js     the server code (products, orders, photos, login)
functions/_lib.js      database + login helper
SETUP.md               this guide

## Steps
1. Make a free GitHub account, create a new repository, and upload ALL files and folders.
   (Keep the `public` and `functions` folders as they are.)

2. Create the database
   Cloudflare dashboard > Storage & Databases > D1 > Create database. Name it: seffon-db
   (You do NOT need to create tables. The site creates them automatically.)

3. Create the site
   Workers & Pages > Create > Pages > Connect to Git > choose your repository.
   Build settings:
      Framework preset ........ None
      Build command ........... (leave empty)
      Build output directory .. public
   Click Save and Deploy.

4. Connect the database
   Open your Pages project > Settings > Bindings > Add > D1 database
      Variable name:  DB          (must be exactly DB)
      D1 database:    seffon-db
   Save.

5. Set the admin password
   Settings > Variables and Secrets > Add
      Name:  ADMIN_PASSWORD
      Value: (a strong password)   Type: Secret
   Save.

6. Redeploy
   Deployments > latest deployment > Retry deployment / Redeploy,
   so the database and password are picked up.

7. Open  https://YOUR-PROJECT.pages.dev/#/admin  and log in.
   The first time, 48 sample products appear. Press "Save changes" once to store them.

## Deploy without GitHub (alternative)
Dashboard drag-and-drop upload may not include the `functions` folder. Use Wrangler instead:
   npx wrangler pages deploy public --project-name seffon-dupatta
Run it from the folder that contains `public` and `functions`. Then do steps 2, 4, 5 and 6.

## Notes
- Customers tap Send Order on WhatsApp. The order opens in WhatsApp and is also saved in the admin Orders tab.
- Photos are resized to about 480px and stored in D1.
- Login lasts 12 hours. To change the password, edit ADMIN_PASSWORD and redeploy.
- Menu names in the Cloudflare dashboard change from time to time. If a name is different, look for the closest match.
