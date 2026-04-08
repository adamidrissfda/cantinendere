/**
 * ============================================================
 * Fichier : js/data.js
 * Description : Données de l'application — menu, étudiants,
 *               paiements, tickets et gestion localStorage
 *
 * IMAGES : Toutes les images sont locales (dossier images/)
 *          Si une image est absente, l'emoji de repli s'affiche.
 * ============================================================
 */

/* ============================================================
   BASE DE DONNÉES PRINCIPALE DE L'APPLICATION
   ============================================================ */
const BDD = {

  /* ── Ressources visuelles de l'université ─────────────────
     Placez vos fichiers dans le dossier images/
     ─────────────────────────────────────────────────────── */
  universite: {
    logo:    'images/logo.png',      /* Logo officiel de l'université */
    heroBg:  'images/hero-bg.jpg',   /* Photo arrière-plan du héro */
  },

  /* ── Catégories du menu ────────────────────────────────── */
  categories: [
    { id: 'tous',    icone: '🍽️', libelle: 'Tous les plats'  },
    { id: 'chaud',   icone: '🔥', libelle: 'Plats chauds'    },
    { id: 'boisson', icone: '☕', libelle: 'Boissons'         },
    { id: 'snack',   icone: '🍞', libelle: 'Snacks & Encas'  },
    { id: 'dessert', icone: '🍮', libelle: 'Desserts'         },
  ],

  /* ── Menu complet de la cantine ───────────────────────────
     Champs :
       id       : identifiant unique du plat
       categorie: correspond aux ids des catégories
       emoji    : icône de remplacement si l'image est absente
       nom      : nom du plat affiché
       description: courte description
       prix     : prix en FCFA
       disponible: true/false (géré par l'admin)
       populaire: affiche le badge "Populaire"
       image    : chemin vers le fichier dans images/
     ─────────────────────────────────────────────────────── */
  menu: [

    /* ═══════════════ PLATS CHAUDS ═══════════════════════ */
    {
      id: 1,
      categorie: 'chaud',
      emoji: '🍗',
      nom: 'Poulet rôti',
      description: 'Demi-poulet rôti au feu de bois, sauce tomate maison',
      prix: 1500,
      disponible: true,
      populaire: true,
      image: 'images/poulet-roti.jpg',
    },
    {
      id: 2,
      categorie: 'chaud',
      emoji: '🫘',
      nom: 'Haricot au lait',
      description: 'Haricots rouges cuisinés au lait concentré sucré',
      prix: 500,
      disponible: true,
      populaire: false,
      image: 'images/haricot-lait.jpg',
    },
    {
      id: 3,
      categorie: 'chaud',
      emoji: '🫘',
      nom: 'Haricot au sel',
      description: 'Haricots blancs bien assaisonnés, sauce légère',
      prix: 400,
      disponible: true,
      populaire: false,
      image: 'images/haricot-sel.jpg',
    },
    {
      id: 4,
      categorie: 'chaud',
      emoji: '🍳',
      nom: 'Omelette',
      description: 'Omelette moelleuse aux œufs frais et légumes du jardin',
      prix: 700,
      disponible: true,
      populaire: false,
      image: 'images/omelette.jpg',
    },
    {
      id: 5,
      categorie: 'chaud',
      emoji: '🍚',
      nom: 'Riz sauce tomate',
      description: 'Riz blanc parfumé, sauce tomate fraîche maison',
      prix: 800,
      disponible: false,  /* Actuellement épuisé */
      populaire: false,
      image: 'images/riz-sauce.jpg',
    },
    {
      id: 6,
      categorie: 'chaud',
      emoji: '🐟',
      nom: 'Poisson braisé',
      description: 'Tilapia grillé au feu de bois, épices locales',
      prix: 1200,
      disponible: true,
      populaire: false,
      image: 'images/poisson-braise.jpg',
    },
    {
      id: 7,
      categorie: 'chaud',
      emoji: '🥬',
      nom: 'Ndolé',
      description: 'Plat national camerounais — feuilles de ndolé, crevettes et arachides',
      prix: 1000,
      disponible: true,
      populaire: true,
      image: 'images/ndole.jpg',
    },
    {
      id: 8,
      categorie: 'chaud',
      emoji: '🍝',
      nom: 'Spaghetti sauté',
      description: 'Spaghetti à la sauce épicée maison, légumes frais',
      prix: 600,
      disponible: true,
      populaire: false,
      image: 'images/spaghetti.jpg',
    },
    {
      id: 9,
      categorie: 'chaud',
      emoji: '🍲',
      nom: 'Soupe de légumes',
      description: 'Bouillon chaud de légumes frais du marché local',
      prix: 450,
      disponible: true,
      populaire: false,
      image: 'images/soupe-legumes.jpg',
    },

    /* ═══════════════ BOISSONS ═══════════════════════════ */
    {
      id: 10,
      categorie: 'boisson',
      emoji: '🥤',
      nom: 'Loubérine',
      description: 'Boisson locale sucrée, très rafraîchissante',
      prix: 200,
      disponible: true,
      populaire: true,
      image: 'images/loubeline.jpg',
    },
    {
      id: 11,
      categorie: 'boisson',
      emoji: '☕',
      nom: 'Café noir',
      description: 'Café arabica du terroir camerounais, bien serré',
      prix: 150,
      disponible: true,
      populaire: false,
      image: 'images/cafe-noir.jpg',
    },
    {
      id: 12,
      categorie: 'boisson',
      emoji: '🥛',
      nom: 'Lait chaud',
      description: 'Lait entier pasteurisé, bien chaud',
      prix: 200,
      disponible: true,
      populaire: false,
      image: 'images/lait-chaud.jpg',
    },
    {
      id: 13,
      categorie: 'boisson',
      emoji: '🍵',
      nom: 'Thé nature',
      description: 'Thé noir ou vert, sucré selon votre préférence',
      prix: 150,
      disponible: true,
      populaire: false,
      image: 'images/the.jpg',
    },
    {
      id: 14,
      categorie: 'boisson',
      emoji: '💧',
      nom: 'Eau minérale',
      description: 'Bouteille de 50cl, eau de source fraîche',
      prix: 100,
      disponible: true,
      populaire: false,
      image: 'images/eau-minerale.jpg',
    },
    {
      id: 15,
      categorie: 'boisson',
      emoji: '🌺',
      nom: 'Bissap',
      description: 'Jus d\'hibiscus maison, légèrement sucré et frais',
      prix: 200,
      disponible: true,
      populaire: false,
      image: 'images/bissap.jpg',
    },
    {
      id: 16,
      categorie: 'boisson',
      emoji: '🫚',
      nom: 'Jus de gingembre',
      description: 'Jus naturel fraîchement pressé au gingembre frais',
      prix: 250,
      disponible: true,
      populaire: false,
      image: 'images/jus-gingembre.jpg',
    },

    /* ═══════════════ SNACKS & ENCAS ═════════════════════ */
    {
      id: 17,
      categorie: 'snack',
      emoji: '🍩',
      nom: 'Beignet',
      description: 'Beignets gonflés et moelleux, frits à la commande',
      prix: 100,
      disponible: true,
      populaire: true,
      image: 'images/beignet.jpg',
    },
    {
      id: 18,
      categorie: 'snack',
      emoji: '🍞',
      nom: 'Pain beurre',
      description: 'Demi-baguette fraîche du jour avec beurre',
      prix: 200,
      disponible: true,
      populaire: false,
      image: 'images/pain-beurre.jpg',
    },
    {
      id: 19,
      categorie: 'snack',
      emoji: '🥪',
      nom: 'Sandwich poulet',
      description: 'Baguette garnie poulet-mayonnaise et légumes frais',
      prix: 600,
      disponible: true,
      populaire: false,
      image: 'images/sandwich.jpg',
    },
    {
      id: 20,
      categorie: 'snack',
      emoji: '🍌',
      nom: 'Plantain frit',
      description: 'Plantains mûrs bien frits à l\'huile de palme',
      prix: 300,
      disponible: true,
      populaire: false,
      image: 'images/plantain-frit.jpg',
    },
    {
      id: 21,
      categorie: 'snack',
      emoji: '🫓',
      nom: 'Galette de maïs',
      description: 'Galette artisanale croustillante au maïs local',
      prix: 150,
      disponible: false,  /* Épuisé aujourd'hui */
      populaire: false,
      image: 'images/galette-mais.jpg',
    },

    /* ═══════════════ DESSERTS ═══════════════════════════ */
    {
      id: 22,
      categorie: 'dessert',
      emoji: '🍮',
      nom: 'Yaourt maison',
      description: 'Yaourt artisanal nature ou sucré à la vanille',
      prix: 250,
      disponible: true,
      populaire: false,
      image: 'images/yaourt.jpg',
    },
    {
      id: 23,
      categorie: 'dessert',
      emoji: '🍊',
      nom: 'Fruits frais',
      description: 'Assortiment de fruits tropicaux de saison',
      prix: 200,
      disponible: true,
      populaire: false,
      image: 'images/fruits-frais.jpg',
    },
    {
      id: 24,
      categorie: 'dessert',
      emoji: '🥣',
      nom: 'Bouillie de maïs',
      description: 'Bouillie sucrée traditionnelle, bien crémeuse et chaude',
      prix: 200,
      disponible: true,
      populaire: false,
      image: 'images/bouillie-mais.jpg',
    },
  ],

  /* ── Accompagnements proposés lors de la commande ─────── */
  accompagnements: [
    { id: 'aucun',   libelle: 'Aucun',   emoji: '✗', prix: 0,   image: null },
    { id: 'beignet', libelle: 'Beignet', emoji: '🍩', prix: 100, image: 'images/beignet.jpg' },
    { id: 'pain',    libelle: 'Pain',    emoji: '🍞', prix: 200, image: 'images/pain-beurre.jpg' },
  ],

  /* ── Modes de paiement acceptés ───────────────────────── */
  paiements: [
    {
      id: 'espece',
      libelle: 'Espèces',
      icone: '💵',
      detail: 'Payer directement au guichet',
      necessiteTelephone: false,   /* Pas de numéro requis */
    },
    {
      id: 'orange',
      libelle: 'Orange Money',
      icone: '🟠',
      detail: 'Paiement mobile Orange Cameroun',
      necessiteTelephone: true,    /* Numéro de téléphone obligatoire */
    },
    {
      id: 'mtn',
      libelle: 'MTN MoMo',
      icone: '🟡',
      detail: 'Mobile Money MTN Cameroun',
      necessiteTelephone: true,
    },
    {
      id: 'paypal',
      libelle: 'PayPal / Carte',
      icone: '💳',
      detail: 'Visa · Mastercard · PayPal',
      necessiteTelephone: false,
    },
  ],

  /* ── Base de données étudiants (simulation)
     En production : remplacer par un appel à l'API de l'université
     Format : 'MATRICULE': { informations de l'étudiant }
     ─────────────────────────────────────────────────────── */
  etudiants: {
    '20G03456': { nom: 'Alima Oumarou',      departement: 'Informatique',  niveau: 'Licence 3', faculte: 'Sciences'  },
    '19D01234': { nom: 'Ibrahim Bello',       departement: 'Génie Civil',   niveau: 'Master 1',  faculte: 'Polytech'  },
    '21A05678': { nom: 'Fatima Amadou',       departement: 'Droit privé',   niveau: 'Licence 1', faculte: 'Droit'     },
    '22B07890': { nom: 'Jean-Baptiste Ndi',   departement: 'Économie',      niveau: 'Licence 2', faculte: 'FSEG'      },
    '18E09876': { nom: 'Mariama Garba',       departement: 'Médecine',      niveau: 'Année 5',   faculte: 'Médecine'  },
    '23C04321': { nom: 'Ousmane Hamidou',     departement: 'Agronomie',     niveau: 'Licence 1', faculte: 'Agro'      },
    '17F02222': { nom: 'Aissatou Djibrine',   departement: 'Chimie',        niveau: 'Master 2',  faculte: 'Sciences'  },
    '20H08888': { nom: 'Paul Mbarga',         departement: 'Physique',      niveau: 'Licence 3', faculte: 'Sciences'  },
  },

  /* ── Comptes du personnel de la cantine ───────────────────
     IMPORTANT : En production, utiliser une vraie API sécurisée
     avec hachage des mots de passe (bcrypt) côté serveur
     ─────────────────────────────────────────────────────── */
  personnel: {
    'admin':      { motdepasse: 'admin123',   nom: 'Responsable Cantine', role: 'admin'    },
    'caissier1':  { motdepasse: 'caisse123',  nom: 'Caissier Principal',  role: 'caissier' },
  },

  /* ── Tickets de commande (stockés en localStorage)
     Clé    : référence unique de la commande (ex: CMD-XX-XXXXX)
     Valeur : objet ticket avec toutes les informations
     ─────────────────────────────────────────────────────── */
  tickets: {},

  /* ── Statistiques du jour (simulation) ────────────────── */
  statistiques: {
    commandesAujourdhui: 47,
    recetteDuJour:       92500,
    commandesEnAttente:  9,
    etudiantsServis:     38,
  },

  /* ══════════════════════════════════════════════════════════
     MÉTHODES DE GESTION DES TICKETS (anti-fraude)
     ══════════════════════════════════════════════════════════ */

  /**
   * Charge les tickets sauvegardés depuis le localStorage
   * Appelé au démarrage de l'application
   */
  chargerTickets() {
    try {
      const donnees = localStorage.getItem('cantine_univ_ngaoundere_tickets');
      if (donnees) {
        Object.assign(this.tickets, JSON.parse(donnees));
      }
    } catch (erreur) {
      console.warn('Impossible de lire le localStorage :', erreur.message);
    }
  },

  /**
   * Sauvegarde tous les tickets dans le localStorage
   * Appelé après chaque modification
   */
  sauvegarderTickets() {
    try {
      localStorage.setItem(
        'cantine_univ_ngaoundere_tickets',
        JSON.stringify(this.tickets)
      );
    } catch (erreur) {
      console.warn('Impossible d\'écrire dans le localStorage :', erreur.message);
    }
  },

  /**
   * Enregistre un nouveau ticket lors d'une commande confirmée
   * @param {string} reference - Référence unique de la commande
   * @param {object} infos - Données de la commande
   */
  enregistrerTicket(reference, infos) {
    this.tickets[reference] = {
      reference:         reference,
      utilise:           false,            /* Non encore servi */
      dateCreation:      new Date().toISOString(),
      dateService:       null,             /* Rempli lors du service */
      nomClient:         infos.nomClient   || 'Anonyme',
      matricule:         infos.matricule   || null,
      totalPaye:         infos.totalPaye   || 0,
      detailArticles:    infos.detailArticles || '',
      modePaiement:      infos.modePaiement  || 'Espèces',
    };
    this.sauvegarderTickets();

    /* Mettre à jour le compteur de commandes en attente */
    this.statistiques.commandesEnAttente++;
  },

  /**
   * Vérifie l'état d'un ticket
   * @param {string} reference - Référence à vérifier
   * @returns {object} { statut: 'valide'|'utilise'|'invalide', ticket }
   */
  verifierTicket(reference) {
    const ticket = this.tickets[reference.trim().toUpperCase()];

    if (!ticket) {
      return { statut: 'invalide', ticket: null };
    }

    if (ticket.utilise) {
      return { statut: 'utilise', ticket: ticket };
    }

    return { statut: 'valide', ticket: ticket };
  },

  /**
   * Marque un ticket comme "servi" (utilisé une seule fois)
   * @param {string} reference - Référence du ticket à valider
   * @returns {boolean} true si succès, false si déjà utilisé
   */
  marquerCommeServi(reference) {
    const ticket = this.tickets[reference];

    if (!ticket) return false;           /* Ticket introuvable */
    if (ticket.utilise) return false;    /* Déjà servi, refus */

    /* Marquer comme servi avec horodatage */
    ticket.utilise     = true;
    ticket.dateService = new Date().toISOString();

    /* Mettre à jour les statistiques */
    this.statistiques.commandesEnAttente = Math.max(0, this.statistiques.commandesEnAttente - 1);
    this.statistiques.etudiantsServis++;
    this.statistiques.commandesAujourdhui++;

    /* Sauvegarder immédiatement */
    this.sauvegarderTickets();
    return true;
  },

};
