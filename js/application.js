/**
 * ============================================================
 * Fichier : js/application.js
 * Description : État global, routeur, panier, utilitaires
 *               et fonctions de sécurité de l'application
 * ============================================================
 */

'use strict'; /* Mode strict JavaScript pour éviter les erreurs silencieuses */

/* ============================================================
   ÉTAT GLOBAL DE L'APPLICATION
   Objet central contenant toutes les données d'état
   ============================================================ */
const Etat = {
  pageActuelle:        'menu',      /* Page actuellement affichée */
  categorieActuelle:   'tous',      /* Catégorie sélectionnée dans le menu */
  panier:              {},          /* Contenu du panier { idPlat: quantite } */
  paiementSelectionne: 'espece',    /* Mode de paiement choisi */
  accompSelectionne:   'aucun',     /* Accompagnement choisi */
  utilisateurConnecte: null,        /* Utilisateur actuel (ou null si non connecté) */
  /* Structure utilisateur :
     { type: 'anonyme'|'etudiant'|'visiteur'|'admin'|'caissier',
       nom: 'Nom affiché', matricule: '20G03456' ou null,
       role: 'admin'|'caissier' ou null (null = pas de droits admin) }
  */
  derniereCommande: null,           /* Données de la dernière commande passée */
};

/* ============================================================
   ROUTEUR — Navigation entre les pages sans rechargement
   ============================================================ */
const Routeur = {
  /**
   * Navigue vers une page donnée
   * @param {string} nomPage - Identifiant de la page cible
   */
  allerVers(nomPage) {

    /* Vérification des droits d'accès pour les pages protégées */
    if (nomPage === 'admin' || nomPage === 'verification') {
      if (!Etat.utilisateurConnecte?.role) {
        Toast.afficher('Accès réservé au personnel autorisé', 'avertiss');
        return; /* Bloquer l'accès */
      }
    }

    /* Masquer toutes les pages */
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    /* Afficher la page cible */
    const cible = document.getElementById('page-' + nomPage);
    if (!cible) {
      console.error('Page introuvable :', nomPage);
      return;
    }

    cible.classList.add('active');
    Etat.pageActuelle = nomPage;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    /* Appeler la fonction d'initialisation spécifique à chaque page */
    const initialisations = {
      commande:     () => PageCommande.initialiser(),
      ticket:       () => PageTicket.afficher(Etat.derniereCommande),
      admin:        () => PageAdmin.initialiser(),
      verification: () => PageVerification.initialiser(),
    };

    if (initialisations[nomPage]) {
      initialisations[nomPage]();
    }
  },
};

/* ============================================================
   GESTIONNAIRE DU PANIER
   ============================================================ */
const Panier = {

  /** Ajoute un plat au panier (ou incrémente la quantité) */
  ajouter(idPlat) {
    Etat.panier[idPlat] = (Etat.panier[idPlat] || 0) + 1;
    this._mettreAJourAffichage();
    Toast.afficher('Ajouté au panier ✓', 'succes');
  },

  /** Retire une unité d'un plat du panier */
  retirer(idPlat) {
    if (Etat.panier[idPlat]) {
      Etat.panier[idPlat]--;
      if (Etat.panier[idPlat] <= 0) {
        delete Etat.panier[idPlat]; /* Supprimer si quantité = 0 */
      }
    }
    this._mettreAJourAffichage();
  },

  /** Vide complètement le panier */
  vider() {
    Etat.panier              = {};
    Etat.accompSelectionne   = 'aucun';
    Etat.paiementSelectionne = 'espece';
    this._mettreAJourAffichage();
  },

  /** Retourne le nombre total d'articles dans le panier */
  compterArticles() {
    return Object.values(Etat.panier).reduce((total, qte) => total + qte, 0);
  },

  /** Calcule le sous-total (sans accompagnement) */
  calculerSousTotal() {
    return Object.entries(Etat.panier).reduce((total, [id, qte]) => {
      const plat = BDD.menu.find(m => m.id == id);
      return total + (plat ? plat.prix * qte : 0);
    }, 0);
  },

  /** Retourne le coût de l'accompagnement sélectionné */
  coutAccompagnement() {
    const acc = BDD.accompagnements.find(a => a.id === Etat.accompSelectionne);
    return acc ? acc.prix : 0;
  },

  /** Calcule le total final (sous-total + accompagnement) */
  calculerTotal() {
    return this.calculerSousTotal() + this.coutAccompagnement();
  },

  /** Retourne la liste des articles avec toutes leurs informations */
  obtenirArticles() {
    return Object.entries(Etat.panier)
      .filter(([, qte]) => qte > 0)
      .map(([id, qte]) => {
        const plat = BDD.menu.find(m => m.id == id);
        return {
          ...plat,
          quantite:     qte,
          sousTotal:    plat.prix * qte,
        };
      });
  },

  /** Met à jour le bouton FAB et le total si on est sur la page commande */
  _mettreAJourAffichage() {
    const nb    = this.compterArticles();
    const fab   = document.getElementById('boutonPanier');
    const badge = document.getElementById('badgePanier');

    if (fab && badge) {
      badge.textContent  = nb;
      fab.style.display  = nb > 0 ? 'flex' : 'none';
    }

    /* Rafraîchir le total si on est sur la page commande */
    if (Etat.pageActuelle === 'commande') {
      PageCommande.rafraichirTotal();
    }
  },
};

/* ============================================================
   SYSTÈME DE NOTIFICATIONS (Toasts)
   ============================================================ */
const Toast = {
  zoneToast: null,

  /** Initialise le système de toasts (appelé au démarrage) */
  initialiser() {
    this.zoneToast = document.getElementById('zoneToast');
  },

  /**
   * Affiche une notification temporaire
   * @param {string} message - Texte à afficher
   * @param {string} type - 'succes' | 'avertiss' | 'danger' | '' (info)
   * @param {number} duree - Durée en millisecondes (défaut: 3000)
   */
  afficher(message, type = '', duree = 3000) {
    if (!this.zoneToast) return;

    const icones = {
      succes:   '✅',
      avertiss: '⚠️',
      danger:   '❌',
      '':       'ℹ️',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${icones[type] || icones['']}</span> ${message}`;
    this.zoneToast.appendChild(toast);

    /* Faire disparaître le toast après la durée définie */
    setTimeout(() => {
      toast.style.opacity   = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = '.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duree);
  },
};

/* ============================================================
   UTILITAIRES DE SÉCURITÉ
   ============================================================ */
const Securite = {

  /**
   * Échappe le HTML pour prévenir les injections XSS
   * À utiliser avant d'insérer du texte utilisateur dans le DOM
   */
  echapperHTML(chaine) {
    if (typeof chaine !== 'string') return '';
    return chaine
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  },

  /**
   * Génère une référence de commande unique et non prévisible
   * Format : CMD-[timestamp base36]-[aléatoire][checksum]
   */
  genererReference() {
    const horodatage  = Date.now().toString(36).toUpperCase();
    const aleatoire   = Math.random().toString(36).substr(2, 5).toUpperCase();
    const verification = ((Date.now() % 9999) + 1000).toString(36).toUpperCase();
    return `CMD-${horodatage}-${aleatoire}${verification}`;
  },

  /** Valide un numéro de téléphone camerounais (6X XXX XXX) */
  validerTelephone(tel) {
    return /^6[5-9]\d{7}$/.test(tel.replace(/[\s\-\.]/g, ''));
  },

  /** Valide le format d'un matricule universitaire (ex: 20G03456) */
  validerMatricule(matricule) {
    return /^\d{2}[A-Z]\d{5}$/.test(matricule.toUpperCase().trim());
  },

  /** Valide une adresse email */
  validerEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
};

/* ============================================================
   UTILITAIRES DE FORMATAGE
   ============================================================ */
const Formater = {

  /** Formate un montant en FCFA avec séparateurs de milliers */
  monnaie(montant) {
    return montant.toLocaleString('fr-FR') + ' FCFA';
  },

  /** Formate une date complète en français */
  date(d = new Date()) {
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
    });
  },

  /** Formate l'heure au format HH:MM */
  heure(d = new Date()) {
    return d.toLocaleTimeString('fr-FR', {
      hour:   '2-digit',
      minute: '2-digit',
    });
  },
};

/* ============================================================
   HELPERS DOM (raccourcis pour manipuler le DOM)
   ============================================================ */
const DOM = {
  /** Trouve un élément par son id */
  par(id)            { return document.getElementById(id); },

  /** Définit le HTML interne d'un élément */
  html(id, html)     { const e = this.par(id); if (e) e.innerHTML = html; },

  /** Définit le texte d'un élément (sans risque XSS) */
  texte(id, texte)   { const e = this.par(id); if (e) e.textContent = texte; },

  /** Retourne la valeur d'un champ de formulaire (trimée) */
  valeur(id)         { const e = this.par(id); return e ? e.value.trim() : ''; },

  /** Affiche un élément (efface display:none) */
  afficher(id)       { const e = this.par(id); if (e) e.style.display = ''; },

  /** Masque un élément */
  masquer(id)        { const e = this.par(id); if (e) e.style.display = 'none'; },

  /** Affiche ou masque selon un booléen */
  visibilite(id, v)  { const e = this.par(id); if (e) e.style.display = v ? '' : 'none'; },

  /** Sélectionne plusieurs éléments */
  tous(selecteur, contexte = document) { return [...contexte.querySelectorAll(selecteur)]; },

  /** Sélectionne le premier élément correspondant */
  premier(selecteur, contexte = document) { return contexte.querySelector(selecteur); },
};

/* ============================================================
   RECHERCHE D'ÉTUDIANT PAR MATRICULE
   ============================================================ */
const RechercheEtudiant = {

  /**
   * Cherche un étudiant dans la base par son matricule
   * @param {string} matricule - Matricule à rechercher
   * @returns {object|null} Données de l'étudiant ou null si absent
   */
  chercher(matricule) {
    return BDD.etudiants[matricule.toUpperCase().trim()] || null;
  },

  /**
   * Affiche le résultat de la recherche dans la zone prévue
   * Appelé à chaque frappe dans le champ matricule
   * @param {string} valeur - Valeur saisie dans le champ
   * @param {string} idZone - ID de la zone d'affichage du résultat
   */
  afficherResultat(valeur, idZone = 'resultatMatricule') {
    const zone     = DOM.par(idZone);
    if (!zone) return;

    const etudiant = this.chercher(valeur);

    if (etudiant && Securite.validerMatricule(valeur)) {
      /* Étudiant trouvé dans la base */
      zone.style.display = 'flex';
      zone.className     = 'alerte alerte--succes';
      zone.innerHTML = `
        ✅ <div>
          <strong>${Securite.echapperHTML(etudiant.nom)}</strong><br>
          <small>
            ${Securite.echapperHTML(etudiant.departement)} ·
            ${Securite.echapperHTML(etudiant.niveau)} ·
            Faculté de ${Securite.echapperHTML(etudiant.faculte)}
          </small>
        </div>`;

    } else if (valeur.length >= 8) {
      /* Matricule non trouvé (longueur suffisante pour être complet) */
      zone.style.display = 'flex';
      zone.className     = 'alerte alerte--avertiss';
      zone.innerHTML     = '⚠️ Matricule non trouvé dans la base — commande acceptée quand même.';

    } else {
      /* Saisie trop courte — ne rien afficher */
      zone.style.display = 'none';
    }
  },
};

/* ============================================================
   MISE À JOUR DE LA BARRE DE NAVIGATION
   Affiche/masque les boutons selon l'utilisateur connecté
   ============================================================ */
function mettreAJourNavbar() {
  const u           = Etat.utilisateurConnecte;
  const btnAdmin    = DOM.par('btnNavAdmin');
  const infoUser    = DOM.par('infoUtilisateur');

  /* Bouton Admin : visible seulement pour le personnel */
  if (btnAdmin) {
    btnAdmin.style.display = u?.role ? '' : 'none';
  }

  /* Information utilisateur dans la navbar */
  if (infoUser) {
    if (u && u.nom) {
      infoUser.textContent   = u.nom;
      infoUser.style.display = '';
    } else {
      infoUser.style.display = 'none';
    }
  }
}

/* ============================================================
   INITIALISATION AU CHARGEMENT DE LA PAGE
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* 1. Charger les tickets sauvegardés (localStorage) */
  BDD.chargerTickets();

  /* 2. Initialiser le système de notifications */
  Toast.initialiser();

  /* 3. Mettre à jour l'affichage du panier */
  Panier._mettreAJourAffichage();

  /* 4. Appliquer le logo de l'université dans la navbar */
  const imgLogo = DOM.par('imgLogoNav');
  if (imgLogo) {
    imgLogo.src = BDD.universite.logo;
    imgLogo.onload = () => {
      /* Logo chargé avec succès — masquer l'emoji de repli */
      imgLogo.style.display = 'block';
      const emojiRepli = DOM.par('emojiLogoNav');
      if (emojiRepli) emojiRepli.style.display = 'none';
    };
    imgLogo.onerror = () => {
      /* Logo absent — garder l'emoji de repli visible */
      imgLogo.style.display = 'none';
    };
  }

  /* 5. Appliquer l'image de fond du héro */
  const sectionHero = DOM.par('sectionHero');
  if (sectionHero) {
    /* On crée une image temporaire pour tester si le fichier existe */
    const imgTest   = new Image();
    imgTest.onload  = () => {
      sectionHero.style.backgroundImage = `url('${BDD.universite.heroBg}')`;
    };
    imgTest.onerror = () => {
      /* Image absente : le dégradé CSS de repli s'applique automatiquement */
      console.info('Image hero-bg.jpg absente — dégradé utilisé à la place');
    };
    imgTest.src = BDD.universite.heroBg;
  }

  /* 6. Initialiser et afficher la page menu */
  PageMenu.initialiser();
  Routeur.allerVers('menu');
});
