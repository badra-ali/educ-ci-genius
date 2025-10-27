import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Traductions françaises
const fr = {
  common: {
    welcome: "Bienvenue",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    close: "Fermer",
    search: "Rechercher",
    filter: "Filtrer",
    back: "Retour",
    next: "Suivant",
    previous: "Précédent",
    submit: "Soumettre",
  },
  auth: {
    signIn: "Connexion",
    signUp: "Inscription",
    signOut: "Déconnexion",
    email: "Email",
    password: "Mot de passe",
    firstName: "Prénom",
    lastName: "Nom",
    role: "Rôle",
    student: "Élève",
    teacher: "Enseignant",
    parent: "Parent",
    admin: "Administrateur",
    createAccount: "Créer un compte",
    alreadyHaveAccount: "Vous avez déjà un compte ?",
    dontHaveAccount: "Vous n'avez pas de compte ?",
  },
  dashboard: {
    title: "Tableau de bord",
    courses: "Cours",
    assignments: "Devoirs",
    messages: "Messages",
    students: "Élèves",
    teachers: "Enseignants",
    stats: "Statistiques",
  },
  courses: {
    title: "Cours",
    create: "Créer un cours",
    edit: "Modifier le cours",
    delete: "Supprimer le cours",
    published: "Publié",
    draft: "Brouillon",
    archived: "Archivé",
  },
  assignments: {
    title: "Devoirs",
    create: "Créer un devoir",
    submit: "Soumettre",
    deadline: "Date limite",
    submitted: "Soumis",
    graded: "Noté",
    late: "En retard",
  },
  pwa: {
    installTitle: "Installer l'application",
    installDescription:
      "Installez educ-ci-genius sur votre appareil pour un accès rapide et une utilisation hors-ligne.",
    installButton: "Installer l'app",
    offlineTitle: "Mode hors-ligne",
    offlineDescription: "Vous êtes actuellement hors-ligne. Certaines fonctionnalités sont limitées.",
  },
};

// Traductions anglaises
const en = {
  common: {
    welcome: "Welcome",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    search: "Search",
    filter: "Filter",
    back: "Back",
    next: "Next",
    previous: "Previous",
    submit: "Submit",
  },
  auth: {
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
    firstName: "First Name",
    lastName: "Last Name",
    role: "Role",
    student: "Student",
    teacher: "Teacher",
    parent: "Parent",
    admin: "Administrator",
    createAccount: "Create Account",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
  },
  dashboard: {
    title: "Dashboard",
    courses: "Courses",
    assignments: "Assignments",
    messages: "Messages",
    students: "Students",
    teachers: "Teachers",
    stats: "Statistics",
  },
  courses: {
    title: "Courses",
    create: "Create Course",
    edit: "Edit Course",
    delete: "Delete Course",
    published: "Published",
    draft: "Draft",
    archived: "Archived",
  },
  assignments: {
    title: "Assignments",
    create: "Create Assignment",
    submit: "Submit",
    deadline: "Deadline",
    submitted: "Submitted",
    graded: "Graded",
    late: "Late",
  },
  pwa: {
    installTitle: "Install App",
    installDescription:
      "Install educ-ci-genius on your device for quick access and offline use.",
    installButton: "Install App",
    offlineTitle: "Offline Mode",
    offlineDescription: "You are currently offline. Some features are limited.",
  },
};

// Détection de la langue sauvegardée ou du navigateur
const savedLanguage = localStorage.getItem("language");
const browserLanguage = navigator.language.split("-")[0]; // 'fr-FR' -> 'fr'
const defaultLanguage = savedLanguage || (["fr", "en"].includes(browserLanguage) ? browserLanguage : "fr");

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: defaultLanguage,
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

