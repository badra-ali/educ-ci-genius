# 🎓 educ-ci-genius

**L'avenir de l'éducation en Côte d'Ivoire**

Application web full-stack conçue pour renforcer les liens entre Parents, Enseignants et Élèves à travers une meilleure communication, un suivi personnalisé et une collaboration transparente.

[![Made with Lovable](https://img.shields.io/badge/Made%20with-Lovable-ff69b4.svg)](https://lovable.app)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-green.svg)](https://supabase.com)

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Développement](#-développement)
- [Architecture](#-architecture)
- [Sécurité](#-sécurité)
- [Contribution](#-contribution)

---

## ✨ Fonctionnalités

### 🔐 Authentification & Autorisation
- Système d'authentification sécurisé avec JWT
- RBAC (Role-Based Access Control) : Élève, Enseignant, Parent, Admin École, Admin Système
- Protection des routes avec `ProtectedRoute` et `RoleGate`
- Row-Level Security (RLS) sur toutes les tables Supabase

### 📚 Gestion des Cours
- Création et gestion de cours par les enseignants
- Bibliothèque de ressources pédagogiques
- Attachements multiples (PDF, images, vidéos)
- Statut de publication (brouillon, publié)

### 📝 Devoirs & QCM
- Création de devoirs avec dates limites
- Soumission des devoirs par les élèves
- Système de notation avec feedback
- QCM interactifs avec correction automatique
- Suivi des tentatives et scores

### 💬 Forum & Messagerie
- Fils de discussion par cours
- Messages en temps réel
- Notifications de nouveaux messages
- Support des pièces jointes

### 📊 Suivi & Analytics
- Tableau de bord personnalisé par rôle
- Statistiques de progression
- Suivi des notes et compétences
- Rapports d'absences et discipline

### 🤖 Tuteur IA
- Assistant IA pour l'aide aux devoirs
- Modes d'assistance adaptés (explication, exercices, révision)
- Historique des conversations

---

## 🛠 Stack Technique

### Frontend
- **React 18.3** - Framework UI
- **TypeScript 5.5** - Type safety
- **Vite** - Build tool ultra-rapide
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Composants UI réutilisables
- **React Query** - Gestion d'état serveur
- **React Router** - Routing côté client
- **Zod** - Validation de schémas

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL - Base de données
  - Auth - Authentification
  - Storage - Stockage de fichiers
  - Edge Functions - Serverless
  - Real-time - Mises à jour en temps réel

### DevOps & Qualité
- **ESLint** - Linting
- **Prettier** - Formatage de code
- **TypeScript** - Type checking
- **Husky** - Git hooks (à venir)
- **Vitest** - Tests unitaires (à venir)
- **Playwright** - Tests e2e (à venir)

---

## 🚀 Installation

### Prérequis

- Node.js >= 18
- npm ou bun
- Compte Supabase (fourni via Lovable Cloud)

### Étapes

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd educ-ci-genius
```

2. **Installer les dépendances**
```bash
npm install
# ou
bun install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Puis éditer .env avec vos valeurs Supabase
```

4. **Lancer le serveur de développement**
```bash
npm run dev
# ou
bun dev
```

L'application sera accessible sur `http://localhost:5173`

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine avec les variables suivantes :

```env
VITE_SUPABASE_PROJECT_ID=votre_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=votre_publishable_key
VITE_SUPABASE_URL=https://votre-projet.supabase.co
```

> ⚠️ **Important** : Ne commitez JAMAIS le fichier `.env` dans Git. Utilisez `.env.example` comme modèle.

### Supabase

Le projet utilise **Lovable Cloud** qui fournit automatiquement un backend Supabase complet avec :
- Base de données PostgreSQL configurée
- Tables avec RLS policies
- Authentification activée
- Storage buckets créés

---

## 👨‍💻 Développement

### Scripts disponibles

```bash
# Démarrer le serveur de dev
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview

# Linting
npm run lint

# Type checking
npm run typecheck
```

### Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── auth/           # ProtectedRoute, RoleGate
│   ├── ui/             # shadcn/ui components
│   └── ErrorBoundary   # Gestion d'erreurs
├── hooks/              # Hooks personnalisés
│   ├── useUserRole     # Gestion des rôles
│   ├── useCours        # CRUD cours
│   ├── useDevoirs      # CRUD devoirs
│   └── useThreads      # Messagerie
├── pages/              # Pages de l'application
├── lib/                # Utilitaires
│   ├── queryClient.ts  # Config React Query
│   └── utils.ts        # Helpers
├── integrations/       # Intégrations externes
│   └── supabase/       # Client & types Supabase
└── App.tsx             # Point d'entrée avec routing
```

---

## 🏗 Architecture

### Protection des routes

Toutes les routes sensibles sont protégées par deux couches :

1. **ProtectedRoute** : Vérifie l'authentification
2. **RoleGate** : Vérifie les permissions par rôle

```tsx
<Route
  path="/cours/new"
  element={
    <ProtectedRoute>
      <RoleGate allowedRoles={["ENSEIGNANT", "ADMIN_ECOLE"]}>
        <CreerCours />
      </RoleGate>
    </ProtectedRoute>
  }
/>
```

### Gestion d'état

Le projet utilise **React Query** pour :
- Cache automatique des requêtes
- Retry intelligent
- Optimistic updates
- Invalidation de cache
- Gestion des erreurs globale

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 minutes
      gcTime: 1000 * 60 * 30,       // 30 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 🔒 Sécurité

### Pratiques implémentées

✅ **Row-Level Security (RLS)** sur toutes les tables  
✅ **Validation Zod** sur tous les formulaires  
✅ **Protection CSRF** via Supabase Auth  
✅ **Secrets dans .env** (jamais committés)  
✅ **ErrorBoundary** pour capturer les erreurs  
✅ **HTTPS uniquement** en production  
✅ **Gestion sécurisée des erreurs d'auth**

### RLS Policies

Chaque table Supabase a des policies strictes :

```sql
-- Exemple : Table cours
CREATE POLICY "Enseignants peuvent créer des cours"
ON cours FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'ENSEIGNANT') 
  AND auth.uid() = enseignant_id
);
```

### Validation des entrées

Tous les formulaires utilisent Zod :

```tsx
const signUpSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  role: z.enum(['ELEVE', 'ENSEIGNANT', 'PARENT']),
});
```

---

## 📊 Base de données

### Schéma principal

```
profiles           - Profils utilisateurs
user_roles         - Rôles et permissions
etablissements     - Établissements scolaires
classes            - Classes/niveaux
matieres           - Matières enseignées
cours              - Cours créés
devoirs            - Devoirs assignés
rendus_devoir      - Soumissions élèves
qcms               - Questionnaires
questions          - Questions de QCM
tentatives_qcm     - Tentatives élèves
threads            - Fils de discussion
messages           - Messages du forum
attachments        - Pièces jointes
audit_log          - Logs d'audit
```

---

## 🎨 Design System

Le projet utilise un design system basé sur les couleurs de la Côte d'Ivoire :

- **Orange** (`--primary`) : Couleur principale
- **Vert** (`--secondary`) : Couleur de prospérité
- **Blanc** : Pureté et clarté

### Tokens disponibles

```css
/* Couleurs */
--primary: 25 95% 53%;
--secondary: 140 60% 35%;
--accent: 30 100% 50%;

/* Gradients */
--gradient-hero
--gradient-primary
--gradient-ivoirien

/* Shadows */
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl
```

---

## 📈 Feuille de route

### Phase 1 - Fondations ✅
- [x] Protection des routes
- [x] RBAC avec RoleGate
- [x] React Query configuré
- [x] ErrorBoundary
- [x] Validation Zod
- [x] .env.example créé

### Phase 2 - Architecture (À venir)
- [ ] Structure par features
- [ ] Service layer
- [ ] ESLint + Prettier configurés
- [ ] Skeletons & loading states
- [ ] Husky + lint-staged

### Phase 3 - Avancé (À venir)
- [ ] Tests (Vitest + Playwright)
- [ ] CI/CD GitHub Actions
- [ ] PWA + offline mode
- [ ] i18n (fr/en)
- [ ] Analytics dashboard

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT.

---

**Fait avec ❤️ en Côte d'Ivoire 🇨🇮**

---

## Project info

**URL**: https://lovable.dev/projects/3bd5242d-99c7-4716-b5ae-b75d7c5f9802
