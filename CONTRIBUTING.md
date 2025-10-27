# Guide de Contribution

Merci de votre intérêt pour contribuer à **educ-ci-genius** ! 🎉

## Table des matières

- [Code de Conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Configuration de l'environnement](#configuration-de-lenvironnement)
- [Standards de code](#standards-de-code)
- [Process de Pull Request](#process-de-pull-request)
- [Architecture du projet](#architecture-du-projet)

---

## Code de Conduite

Ce projet adhère à un code de conduite. En participant, vous vous engagez à respecter ce code. Soyez respectueux, inclusif et professionnel dans toutes vos interactions.

---

## Comment contribuer

### Signaler un bug

1. Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/votre-repo/issues)
2. Créez une nouvelle issue avec le label `bug`
3. Incluez :
   - Description claire du problème
   - Étapes pour reproduire
   - Comportement attendu vs comportement observé
   - Screenshots si pertinent
   - Environnement (navigateur, OS, version)

### Proposer une fonctionnalité

1. Créez une issue avec le label `enhancement`
2. Décrivez la fonctionnalité et son utilité
3. Attendez les retours avant de commencer le développement

### Soumettre une Pull Request

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/MaSuperFeature`)
3. Committez vos changements (`git commit -m 'feat: ajout de MaSuperFeature'`)
4. Push vers la branche (`git push origin feature/MaSuperFeature`)
5. Ouvrez une Pull Request

---

## Configuration de l'environnement

### Prérequis

- Node.js >= 18
- npm ou bun
- Git

### Installation

```bash
# Cloner le repo
git clone https://github.com/votre-repo/educ-ci-genius.git
cd educ-ci-genius

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env

# Démarrer le serveur de dev
npm run dev
```

---

## Standards de code

### Conventions de nommage

- **Variables/Fonctions** : camelCase (`myFunction`, `userData`)
- **Composants React** : PascalCase (`UserCard`, `DashboardLayout`)
- **Fichiers** : PascalCase pour composants, camelCase pour utils
- **Constants** : SCREAMING_SNAKE_CASE (`API_URL`, `MAX_RETRIES`)

### TypeScript

- **Toujours typer** les paramètres et retours de fonction
- **Éviter `any`** sauf cas exceptionnel documenté
- **Interfaces** pour les props de composants
- **Types** pour les unions et intersections

```typescript
// ✅ BON
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

const UserCard = ({ user, onEdit }: UserCardProps) => {
  // ...
};

// ❌ MAUVAIS
const UserCard = ({ user, onEdit }: any) => {
  // ...
};
```

### Composants React

- **Composants fonctionnels** uniquement
- **Hooks** au début du composant
- **Export named** pour composants réutilisables
- **Export default** pour pages

```typescript
// ✅ BON
export const Button = ({ children, onClick }: ButtonProps) => {
  const [loading, setLoading] = useState(false);

  return <button onClick={onClick}>{children}</button>;
};

// ❌ MAUVAIS - hooks conditionnels
export const Button = ({ children, onClick }: ButtonProps) => {
  if (someCondition) {
    const [loading, setLoading] = useState(false);
  }
  // ...
};
```

### Structure des fichiers

```
src/
├── features/           # Features par domaine
│   ├── cours/
│   │   ├── services/   # Logique métier
│   │   ├── hooks/      # React Query hooks
│   │   ├── types/      # Types TypeScript
│   │   └── index.ts    # Barrel export
│   └── devoirs/
├── components/         # Composants réutilisables
│   ├── ui/            # Composants UI de base
│   └── auth/          # Composants d'authentification
├── pages/             # Pages de l'application
├── lib/               # Utilitaires et config
└── hooks/             # Hooks globaux
```

### CSS / TailwindCSS

- **Utiliser les tokens** du design system (`--primary`, `--secondary`)
- **Pas de colors directs** (❌ `text-white`, ✅ `text-primary-foreground`)
- **Classes sémantiques** quand possible
- **Variants** pour les composants shadcn/ui

```tsx
// ✅ BON
<Button className="bg-primary text-primary-foreground">Cliquez</Button>

// ❌ MAUVAIS
<Button className="bg-orange-500 text-white">Cliquez</Button>
```

### Commits

Utiliser [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: ajout du mode hors-ligne
fix: correction du bug de connexion
docs: mise à jour du README
style: formatage du code
refactor: restructuration du service cours
test: ajout de tests unitaires
chore: mise à jour des dépendances
```

---

## Process de Pull Request

### Avant de soumettre

- [ ] Le code compile sans erreur (`npm run build`)
- [ ] Les tests passent (`npm run test`)
- [ ] Le linter passe (`npm run lint`)
- [ ] Le code est formaté (`npm run format`)
- [ ] La documentation est à jour
- [ ] Les commits suivent les conventions

### Review

- Au moins **1 reviewer** requis
- Tous les commentaires doivent être résolus
- CI/CD doit passer (lint, build, tests)

### Merge

- **Squash and merge** préféré pour garder un historique propre
- Le titre du squash doit suivre Conventional Commits

---

## Architecture du projet

### Features par domaine

Chaque feature suit cette structure :

```typescript
// features/cours/services/coursService.ts
export const coursService = {
  getCours: (id: string) => Promise<Cours>,
  createCours: (data: Partial<Cours>) => Promise<Cours>,
  // ...
};

// features/cours/hooks/useCours.ts
export const useCours = (id: string) => {
  return useQuery({
    queryKey: coursKeys.detail(id),
    queryFn: () => coursService.getCours(id),
  });
};

// features/cours/types/index.ts
export interface Cours {
  id: string;
  titre: string;
  // ...
}
```

### React Query

- **Query keys** hiérarchiques : `['cours', 'list', filters]`
- **Invalidation** automatique après mutations
- **Cache** 5 minutes par défaut
- **Retry** 3 fois pour les queries, 1 fois pour les mutations

### Supabase

- **Service layer** pure (pas de React)
- **RLS policies** strictes sur toutes les tables
- **Type safety** avec types auto-générés
- **Error handling** dans les services

---

## Questions ?

N'hésitez pas à ouvrir une issue ou à contacter l'équipe !

**Merci de contribuer à educ-ci-genius ! 🇨🇮❤️**
