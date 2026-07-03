# ABP Menuiseries — Gestion des congés

Application complète : Next.js + vraie base de données Postgres. Aucun salarié
n'a besoin d'un compte Google/Claude/GitHub — seuls des comptes propres à
l'application (e-mail + mot de passe créés dans l'app) existent, plus l'accès
direction par mot de passe fixe (`ABPm2026`, modifiable via la variable
d'environnement `DIRECTION_PASSWORD`).

## Déploiement (environ 15 minutes, une seule fois)

Vous n'avez besoin que d'**un compte Vercel** (gratuit) et d'**un compte
GitHub** (gratuit) pour héberger le code. Vos salariés n'auront besoin d'aucun
compte externe pour utiliser l'app.

### 1. Mettre le code sur GitHub
1. Créez un compte sur https://github.com si vous n'en avez pas.
2. Créez un nouveau dépôt (bouton vert "New repository"), par exemple nommé `abp-conges`. Laissez-le vide (sans README).
3. Sur votre ordinateur, dans le dossier de ce projet, exécutez :
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/abp-conges.git
   git push -u origin main
   ```

### 2. Créer le projet sur Vercel
1. Créez un compte sur https://vercel.com (vous pouvez vous inscrire directement avec votre compte GitHub, c'est le plus simple).
2. Cliquez sur "Add New… > Project", puis choisissez le dépôt `abp-conges` que vous venez de créer.
3. Laissez les réglages par défaut (Vercel détecte Next.js automatiquement) et cliquez sur "Deploy". Le premier déploiement va échouer (normal, la base de données n'existe pas encore) — c'est prévu, continuez à l'étape suivante.

### 3. Ajouter la base de données Postgres
1. Dans votre projet Vercel, ouvrez l'onglet "Storage".
2. Cliquez sur "Create Database" > choisissez "Postgres" (ou "Neon" selon l'offre affichée) > suivez l'assistant.
3. Une fois créée, Vercel vous propose de la "connecter" à votre projet : acceptez. Cela ajoute automatiquement les variables `POSTGRES_URL` et `POSTGRES_URL_NON_POOLING` à votre projet — vous n'avez rien à copier vous-même.

### 4. Ajouter les variables d'environnement restantes
Toujours dans Vercel : onglet "Settings" > "Environment Variables", ajoutez :
- `DIRECTION_PASSWORD` = `ABPm2026` (ou un autre mot de passe si vous préférez)
- `SESSION_SECRET` = une longue chaîne aléatoire (générez-en une sur https://generate-secret.vercel.app/32 et collez-la)
- `NEXT_PUBLIC_APP_URL` = l'adresse de votre app une fois déployée (ex : `https://abp-conges.vercel.app`) — vous pouvez la mettre à jour après le premier déploiement réussi.

L'envoi d'e-mail de réinitialisation de mot de passe (`RESEND_API_KEY`,
`RESEND_FROM_EMAIL`) est **optionnel** : si vous ne le configurez pas, la
fonctionnalité "mot de passe oublié" reste fonctionnelle autrement — la
direction peut réinitialiser le mot de passe de n'importe quel salarié
directement depuis l'onglet "Salariés" de son espace. Si vous voulez activer
l'envoi d'e-mail réel plus tard : créez un compte gratuit sur
https://resend.com, vérifiez un domaine qui vous appartient, récupérez une
clé API et ajoutez-la dans ces deux variables.

### 5. Relancer le déploiement
Onglet "Deployments" > cliquez sur les trois points du dernier déploiement > "Redeploy". Cette fois, ça fonctionne : les tables de la base de données se créent automatiquement au premier appel de l'application.

### 6. Récupérer le lien final
Vercel vous donne une adresse fixe du type `https://abp-conges.vercel.app` (visible en haut de la page du projet, à côté de "Domains"). C'est ce lien que vous partagez à vos salariés.

## Action nécessaire pour que le lien reste actif dans la durée
Il suffit de garder votre compte Vercel (gratuit) et votre base de données Postgres actifs — aucune carte bancaire n'est requise sur l'offre gratuite, mais Vercel peut demander une reconnexion occasionnelle ou suspendre un projet resté totalement inactif plusieurs mois : reconnectez-vous de temps en temps pour éviter cela.

## Développement local (optionnel)
```
npm install
cp .env.example .env.local   # puis remplissez les variables
npm run dev
```
