/**
 * ============================================================
 * Fichier : js/pages.js
 * Description : Logique de toutes les pages de l'application
 *   - PageMenu         : affichage et filtrage du menu
 *   - PageCommande     : panier, identification, paiement
 *   - PageTicket       : affichage et impression du bon
 *   - PageAuthentification : connexion staff / accès libre
 *   - PageAdmin        : tableau de bord administration
 *   - PageVerification : vérification anti-fraude des bons
 * ============================================================
 */

'use strict';

/* ============================================================
   PAGE MENU — Affichage et filtrage des plats
   ============================================================ */
const PageMenu = {

  /** Initialise la page menu (catégories + grille) */
  initialiser() {
    this.afficherCategories();
    this.afficherGrille('tous');
  },

  /** Génère et insère les boutons de catégorie */
  afficherCategories() {
    const zone = DOM.par('zoneCategories');
    if (!zone) return;

    zone.innerHTML = BDD.categories.map((cat, index) => `
      <button
        class="btn-categorie ${index === 0 ? 'actif' : ''}"
        data-categorie="${cat.id}"
        onclick="PageMenu.filtrerParCategorie('${cat.id}', this)"
      >
        ${cat.icone} ${cat.libelle}
      </button>`
    ).join('');
  },

  /**
   * Filtre les plats par catégorie
   * @param {string} idCat - Identifiant de la catégorie
   * @param {HTMLElement} bouton - Le bouton cliqué
   */
  filtrerParCategorie(idCat, bouton) {
    /* Retirer la classe actif de tous les boutons */
    DOM.tous('.btn-categorie').forEach(b => b.classList.remove('actif'));
    /* Activer le bouton cliqué */
    bouton.classList.add('actif');
    Etat.categorieActuelle = idCat;
    this.afficherGrille(idCat);
  },

  /**
   * Affiche la grille des plats selon la catégorie
   * @param {string} idCat - 'tous' ou un id de catégorie
   */
  afficherGrille(idCat) {
    const zone = DOM.par('grilleMenu');
    if (!zone) return;

    /* Filtrer les plats selon la catégorie */
    const plats = idCat === 'tous'
      ? BDD.menu
      : BDD.menu.filter(p => p.categorie === idCat);

    if (!plats.length) {
      zone.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--texte-discret)">
          <div style="font-size:3rem;margin-bottom:12px;opacity:.5">🍽️</div>
          <p>Aucun plat dans cette catégorie pour le moment</p>
        </div>`;
      return;
    }

    zone.innerHTML = plats.map(plat => this._genererCartePlat(plat)).join('');
  },

  /**
   * Génère le HTML d'une carte de plat
   * @param {object} plat - Données du plat
   * @returns {string} HTML de la carte
   */
  _genererCartePlat(plat) {

    /* Pastille de statut sur l'image */
    const pastille = !plat.disponible
      ? `<span class="carte-plat__pastille carte-plat__pastille--epuise">Épuisé</span>`
      : plat.populaire
        ? `<span class="carte-plat__pastille carte-plat__pastille--populaire">⭐ Populaire</span>`
        : '';

    /* Bouton d'ajout au panier (masqué si indisponible) */
    const boutonAjouter = plat.disponible
      ? `<button
           class="carte-plat__btn-ajouter"
           onclick="event.stopPropagation(); Panier.ajouter(${plat.id})"
           aria-label="Ajouter ${Securite.echapperHTML(plat.nom)} au panier"
           title="Ajouter au panier"
         >+</button>`
      : '';

    return `
      <div
        class="carte-plat ${!plat.disponible ? 'carte-plat--indisponible' : ''}"
        onclick="${plat.disponible ? `Panier.ajouter(${plat.id})` : ''}"
        role="article"
        aria-label="${Securite.echapperHTML(plat.nom)} — ${Formater.monnaie(plat.prix)}"
      >
        <!-- Zone image du plat (photo locale depuis images/) -->
        <div class="carte-plat__image carte-plat__image--chargement">

          <!-- Image locale — se charge depuis le dossier images/ -->
          <img
            src="${plat.image}"
            alt="${Securite.echapperHTML(plat.nom)}"
            loading="lazy"
            onload="this.parentElement.classList.remove('carte-plat__image--chargement')"
            onerror="
              this.style.display='none';
              this.parentElement.classList.remove('carte-plat__image--chargement');
              this.parentElement.insertAdjacentHTML('beforeend',
                '<div class=\\'carte-plat__emoji-repli\\'>${plat.emoji}</div>'
              );
            "
          >

          <!-- Pastille de statut (populaire / épuisé) -->
          ${pastille}
        </div>

        <!-- Informations textuelles -->
        <div class="carte-plat__infos">
          <div class="carte-plat__nom">${Securite.echapperHTML(plat.nom)}</div>
          <div class="carte-plat__description">${Securite.echapperHTML(plat.description)}</div>
          <div class="carte-plat__prix">${Formater.monnaie(plat.prix)}</div>
        </div>

        <!-- Bouton + d'ajout -->
        ${boutonAjouter}
      </div>`;
  },
};

/* ============================================================
   PAGE COMMANDE — Récapitulatif et saisie des informations
   ============================================================ */
const PageCommande = {

  /** Initialise tous les blocs de la page commande */
  initialiser() {
    this.afficherArticlesPanier();
    this.afficherAccompagnements();
    this.afficherModesPaiement();
    this.rafraichirTotal();
    this._definirModeIdentification('anonyme'); /* Mode anonyme par défaut */
  },

  /* ── Bloc 1 : Articles du panier ── */

  /** Affiche la liste des articles dans le panier */
  afficherArticlesPanier() {
    const zone    = DOM.par('listeArticlesPanier');
    if (!zone) return;

    const articles = Panier.obtenirArticles();

    if (!articles.length) {
      zone.innerHTML = `
        <div style="text-align:center;padding:24px 0;color:var(--texte-discret)">
          Votre panier est vide.
          <a href="#" onclick="Routeur.allerVers('menu')"
             style="color:var(--vert-principal);font-weight:700">
            ← Retour au menu
          </a>
        </div>`;
      return;
    }

    zone.innerHTML = articles.map(art => `
      <div class="article-panier">

        <!-- Vignette image de l'article -->
        <div class="article-panier__vignette">
          <img
            src="${art.image}"
            alt="${Securite.echapperHTML(art.nom)}"
            onerror="this.style.display='none';this.parentElement.innerHTML='${art.emoji}'"
          >
        </div>

        <!-- Nom et prix unitaire -->
        <div class="article-panier__infos">
          <div class="article-panier__nom">${Securite.echapperHTML(art.nom)}</div>
          <div class="article-panier__prix-unitaire">${Formater.monnaie(art.prix)} / unité</div>
        </div>

        <!-- Contrôle de quantité -->
        <div class="ctrl-quantite">
          <button class="btn-quantite" onclick="PageCommande.changerQuantite(${art.id}, -1)"
                  aria-label="Diminuer la quantité">−</button>
          <span class="valeur-quantite">${art.quantite}</span>
          <button class="btn-quantite" onclick="PageCommande.changerQuantite(${art.id}, 1)"
                  aria-label="Augmenter la quantité">+</button>
        </div>

        <!-- Sous-total de cet article -->
        <div class="article-panier__sous-total">${Formater.monnaie(art.sousTotal)}</div>

      </div>`
    ).join('');
  },

  /**
   * Modifie la quantité d'un article dans le panier
   * @param {number} idPlat - ID du plat
   * @param {number} delta  - +1 ou -1
   */
  changerQuantite(idPlat, delta) {
    if (delta > 0) Panier.ajouter(idPlat);
    else           Panier.retirer(idPlat);
    this.afficherArticlesPanier();
    this.rafraichirTotal();
  },

  /* ── Bloc 2 : Accompagnements ── */

  /** Affiche les choix d'accompagnement */
  afficherAccompagnements() {
    const zone = DOM.par('zoneAccompagnements');
    if (!zone) return;

    zone.innerHTML = BDD.accompagnements.map(acc => `
      <button
        class="puce ${acc.id === Etat.accompSelectionne ? 'selectionnee' : ''}"
        onclick="PageCommande.choisirAccompagnement('${acc.id}', this)"
        aria-pressed="${acc.id === Etat.accompSelectionne}"
      >
        ${acc.emoji} ${acc.libelle}
        ${acc.prix > 0 ? `<small style="opacity:.75">+${Formater.monnaie(acc.prix)}</small>` : ''}
      </button>`
    ).join('');
  },

  /**
   * Sélectionne un accompagnement
   * @param {string} id - Identifiant de l'accompagnement
   * @param {HTMLElement} el - Le bouton cliqué
   */
  choisirAccompagnement(id, el) {
    DOM.tous('.puce').forEach(p => {
      p.classList.remove('selectionnee');
      p.setAttribute('aria-pressed', 'false');
    });
    el.classList.add('selectionnee');
    el.setAttribute('aria-pressed', 'true');
    Etat.accompSelectionne = id;
    this.rafraichirTotal();
  },

  /* ── Bloc 3 : Mode de paiement ── */

  /** Affiche les cartes de mode de paiement */
  afficherModesPaiement() {
    const zone = DOM.par('zoneModesPaiement');
    if (!zone) return;

    zone.innerHTML = BDD.paiements.map(pm => `
      <div
        class="carte-paiement ${pm.id === Etat.paiementSelectionne ? 'selectionnee' : ''}"
        onclick="PageCommande.choisirPaiement('${pm.id}', this)"
        role="radio"
        aria-checked="${pm.id === Etat.paiementSelectionne}"
        tabindex="0"
        onkeydown="if(event.key==='Enter') PageCommande.choisirPaiement('${pm.id}', this)"
      >
        <span class="carte-paiement__icone">${pm.icone}</span>
        <div class="carte-paiement__nom">${pm.libelle}</div>
        <div class="carte-paiement__detail">${pm.detail}</div>
      </div>`
    ).join('');
  },

  /**
   * Sélectionne un mode de paiement
   * @param {string} id - Identifiant du mode de paiement
   * @param {HTMLElement} el - La carte cliquée
   */
  choisirPaiement(id, el) {
    DOM.tous('.carte-paiement').forEach(c => {
      c.classList.remove('selectionnee');
      c.setAttribute('aria-checked', 'false');
    });
    el.classList.add('selectionnee');
    el.setAttribute('aria-checked', 'true');
    Etat.paiementSelectionne = id;

    /* Afficher le champ téléphone si paiement mobile */
    const pm = BDD.paiements.find(p => p.id === id);
    DOM.visibilite('secteurTelephoneMobile', pm && pm.necessiteTelephone);
  },

  /* ── Bloc 4 : Identification ── */

  /**
   * Définit le mode d'identification (anonyme / matricule / visiteur)
   * @param {string} mode - Le mode choisi
   */
  _definirModeIdentification(mode) {
    DOM.visibilite('secteurAnonyme',   mode === 'anonyme');
    DOM.visibilite('secteurMatricule', mode === 'matricule');
    DOM.visibilite('secteurVisiteur',  mode === 'visiteur');

    /* Mettre à jour les onglets */
    DOM.tous('.onglet-identification').forEach(o => {
      o.classList.toggle('actif', o.dataset.mode === mode);
    });
  },

  /** Appelé par les boutons d'onglet d'identification */
  definirModeIdentification(mode) {
    this._definirModeIdentification(mode);
  },

  /* ── Bloc 5 : Total récapitulatif ── */

  /** Recalcule et affiche le total de la commande */
  rafraichirTotal() {
    const zone = DOM.par('zoneRecapitulatif');
    if (!zone) return;

    const sousTotal   = Panier.calculerSousTotal();
    const coutAccomp  = Panier.coutAccompagnement();
    const total       = Panier.calculerTotal();
    const accObj      = BDD.accompagnements.find(a => a.id === Etat.accompSelectionne);

    let html = `
      <div class="ligne-montant">
        <span>Sous-total repas</span>
        <span>${Formater.monnaie(sousTotal)}</span>
      </div>`;

    /* Afficher la ligne accompagnement seulement s'il y en a un */
    if (coutAccomp > 0) {
      html += `
        <div class="ligne-montant">
          <span>Accompagnement (${accObj.libelle})</span>
          <span>+${Formater.monnaie(coutAccomp)}</span>
        </div>`;
    }

    html += `
      <div class="ligne-montant ligne-montant--totale">
        <span>Total à payer</span>
        <span>${Formater.monnaie(total)}</span>
      </div>`;

    zone.innerHTML = html;
  },

  /* ── Validation et confirmation ── */

  /** Valide le formulaire et confirme la commande */
  confirmerCommande() {
    /* Vérifier que le panier n'est pas vide */
    if (!Panier.obtenirArticles().length) {
      Toast.afficher('Votre panier est vide', 'avertiss');
      return;
    }

    /* Vérifier le numéro de téléphone pour paiement mobile */
    const pm = BDD.paiements.find(p => p.id === Etat.paiementSelectionne);
    if (pm?.necessiteTelephone) {
      const tel = DOM.valeur('champTelephoneMobile');
      if (!Securite.validerTelephone(tel)) {
        Toast.afficher('Numéro mobile invalide — ex : 690 123 456', 'danger');
        DOM.par('champTelephoneMobile').focus();
        return;
      }
    }

    /* Vérifier le nom si mode visiteur */
    const modeActif = DOM.premier('.onglet-identification.actif');
    if (modeActif?.dataset.mode === 'visiteur') {
      if (!DOM.valeur('champNomVisiteur')) {
        Toast.afficher('Veuillez saisir votre nom', 'avertiss');
        DOM.par('champNomVisiteur').focus();
        return;
      }
    }

    /* Simuler le traitement du paiement */
    const btn = DOM.par('btnConfirmerCommande');
    btn.disabled  = true;
    btn.innerHTML = '<span class="spinner"></span> Traitement du paiement...';

    setTimeout(() => {
      /* Construire les données de la commande */
      const commande = this._construireCommande();
      Etat.derniereCommande = commande;

      /* Enregistrer le ticket dans la base (localStorage) */
      BDD.enregistrerTicket(commande.reference, {
        nomClient:      commande.identification.nomAffiche,
        matricule:      commande.identification.matricule || null,
        totalPaye:      commande.totaux.total,
        detailArticles: commande.articles.map(a => `${a.nom} x${a.quantite}`).join(', '),
        modePaiement:   commande.paiement?.libelle || 'Espèces',
      });

      /* Vider le panier et aller à la page ticket */
      Panier.vider();
      Routeur.allerVers('ticket');

      btn.disabled  = false;
      btn.innerHTML = '✅ Confirmer et payer';
    }, 1800);
  },

  /**
   * Construit l'objet de données de la commande
   * @returns {object} Données complètes de la commande
   */
  _construireCommande() {
    const modeEl    = DOM.premier('.onglet-identification.actif');
    const mode      = modeEl?.dataset.mode || 'anonyme';
    const pm        = BDD.paiements.find(p => p.id === Etat.paiementSelectionne);
    const acc       = BDD.accompagnements.find(a => a.id === Etat.accompSelectionne);

    /* Déterminer l'identité selon le mode choisi */
    let nomAffiche = 'Anonyme';
    let matricule  = null;

    if (mode === 'matricule') {
      matricule  = DOM.valeur('champMatricule').toUpperCase().trim();
      const et   = BDD.etudiants[matricule];
      nomAffiche = et ? et.nom : (matricule || 'Étudiant non vérifié');

    } else if (mode === 'visiteur') {
      nomAffiche = DOM.valeur('champNomVisiteur') || 'Visiteur';
    }

    return {
      reference:  Securite.genererReference(),
      date:       Formater.date(),
      heure:      Formater.heure(),
      articles:   Panier.obtenirArticles(),
      accompagnement: acc,
      paiement:   pm,
      identification: { mode, nomAffiche, matricule },
      totaux: {
        sousTotal: Panier.calculerSousTotal(),
        accomp:    Panier.coutAccompagnement(),
        total:     Panier.calculerTotal(),
      },
    };
  },
};

/* ============================================================
   PAGE TICKET — Affichage du bon de commande
   ============================================================ */
const PageTicket = {

  /**
   * Affiche toutes les informations du ticket
   * @param {object} commande - Données de la commande
   */
  afficher(commande) {
    if (!commande) return;

    /* Référence et informations client */
    DOM.texte('refCommande', commande.reference);
    DOM.texte('dateCommande', `${commande.date} à ${commande.heure}`);
    DOM.texte('nomClientTicket', commande.identification.nomAffiche);

    /* Ligne matricule (visible seulement si renseigné) */
    if (commande.identification.matricule) {
      DOM.texte('matriculeTicket', commande.identification.matricule);
      DOM.afficher('ligneMatricule');
    } else {
      DOM.masquer('ligneMatricule');
    }

    /* Générer le QR code de vérification */
    this._genererQRCode(commande.reference);

    /* Lignes de détail des articles */
    let lignesHTML = commande.articles.map(art => `
      <div class="ticket__ligne">
        <span>${Securite.echapperHTML(art.nom)} × ${art.quantite}</span>
        <span>${Formater.monnaie(art.sousTotal)}</span>
      </div>`
    ).join('');

    /* Ligne accompagnement si applicable */
    if (commande.accompagnement?.id !== 'aucun') {
      lignesHTML += `
        <div class="ticket__ligne">
          <span>${commande.accompagnement.emoji} Accompagnement — ${commande.accompagnement.libelle}</span>
          <span>${Formater.monnaie(commande.accompagnement.prix)}</span>
        </div>`;
    }

    /* Ligne mode de paiement */
    lignesHTML += `
      <div class="ticket__ligne">
        <span>Mode de paiement</span>
        <span>${commande.paiement?.libelle || 'Espèces'}</span>
      </div>`;

    DOM.html('lignesDetailTicket', lignesHTML);

    /* Total payé */
    DOM.html('totalTicket', `
      <span>TOTAL PAYÉ</span>
      <span>${Formater.monnaie(commande.totaux.total)}</span>`);
  },

  /**
   * Génère un QR code visuel sur le canvas
   * (représentation graphique basée sur la référence)
   * @param {string} ref - Référence de la commande
   */
  _genererQRCode(ref) {
    const canvas = DOM.par('canvasQR');
    if (!canvas) return;

    const ctx      = canvas.getContext('2d');
    const taille   = 120;
    const cellules = 12;
    const cellule  = taille / cellules;

    canvas.width  = taille;
    canvas.height = taille;

    /* Fond blanc */
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, taille, taille);

    /* Motif pseudo-aléatoire basé sur la référence (reproductible) */
    ctx.fillStyle = '#1A1A2E';
    let graine = 0;
    for (let i = 0; i < ref.length; i++) {
      graine += ref.charCodeAt(i);
    }

    for (let ligne = 0; ligne < cellules; ligne++) {
      for (let col = 0; col < cellules; col++) {
        graine = (graine * 1664525 + 1013904223) & 0xFFFFFFFF;
        const val = (graine >>> 0) % 100;

        /* Coins du cadre QR (fixes) */
        const estCoin = (ligne < 3 && col < 3) ||
                        (ligne < 3 && col > cellules - 4) ||
                        (ligne > cellules - 4 && col < 3);

        if (estCoin) {
          ctx.fillRect(col * cellule, ligne * cellule, cellule, cellule);
          continue;
        }

        /* Données du QR (aléatoires basées sur la ref) */
        if (val > 52) {
          ctx.fillRect(col * cellule + .5, ligne * cellule + .5, cellule - 1, cellule - 1);
        }
      }
    }

    /* Intérieur des coins (blanc) */
    ctx.fillStyle = '#fff';
    ctx.fillRect(cellule, cellule, cellule, cellule);
    ctx.fillRect((cellules - 2) * cellule, cellule, cellule, cellule);
    ctx.fillRect(cellule, (cellules - 2) * cellule, cellule, cellule);
  },

  /** Ouvre la boîte de dialogue d'impression */
  imprimer() { window.print(); },

  /** Repart vers la page menu pour une nouvelle commande */
  nouvelleCommande() {
    Etat.derniereCommande = null;
    Routeur.allerVers('menu');
  },
};

/* ============================================================
   PAGE AUTHENTIFICATION
   Connexion du personnel (admin/caissier)
   Les étudiants et visiteurs accèdent directement sans compte
   ============================================================ */
const PageAuthentification = {
  modeActuel: 'connexion',

  /**
   * Bascule entre les onglets Connexion / Inscription
   * @param {string} mode - 'connexion' | 'inscription'
   */
  basculerOnglet(mode) {
    this.modeActuel = mode;
    DOM.visibilite('formulaireConnexion',  mode === 'connexion');
    DOM.visibilite('formulaireInscription', mode === 'inscription');
    DOM.tous('.onglet-auth').forEach(o => {
      o.classList.toggle('actif', o.dataset.tab === mode);
    });
    DOM.html('zoneErreurAuth', ''); /* Effacer les erreurs */
  },

  /** Tente la connexion du personnel */
  seConnecter() {
    const identifiant   = DOM.valeur('champIdentifiant');
    const motdepasse    = DOM.valeur('champMotdepasse');

    if (!identifiant || !motdepasse) {
      this._afficherErreur('Veuillez remplir tous les champs.');
      return;
    }

    const btn = DOM.par('btnSeConnecter');
    btn.disabled  = true;
    btn.innerHTML = '<span class="spinner"></span>';

    setTimeout(() => {
      /* Vérifier dans la base du personnel */
      const membre = BDD.personnel[identifiant.toLowerCase()];

      if (membre && motdepasse === membre.motdepasse) {
        /* Connexion réussie */
        Etat.utilisateurConnecte = {
          type:      'personnel',
          nom:       membre.nom,
          role:      membre.role,      /* 'admin' ou 'caissier' */
          matricule: null,
        };
        DOM.par('btnNavAdmin').style.display = '';
        mettreAJourNavbar();
        Toast.afficher(`Bienvenue, ${membre.nom} !`, 'succes');
        Routeur.allerVers('admin');

      } else {
        this._afficherErreur('Identifiants incorrects. Essayez : admin / admin123');
      }

      btn.disabled  = false;
      btn.innerHTML = 'Se connecter';
    }, 900);
  },

  /** Enregistre un nouveau compte étudiant */
  sInscrire() {
    const prenom   = DOM.valeur('champPrenom');
    const nom      = DOM.valeur('champNom');
    const matricule= DOM.valeur('champMatriculeInscription');
    const email    = DOM.valeur('champEmailInscription');
    const mdp      = DOM.valeur('champMdpInscription');

    /* Validation des champs obligatoires */
    if (!prenom || !nom || !matricule || !email || !mdp) {
      this._afficherErreur('Tous les champs marqués * sont obligatoires.');
      return;
    }
    if (!Securite.validerMatricule(matricule)) {
      this._afficherErreur('Format de matricule invalide — exemple : 20G03456');
      return;
    }
    if (!Securite.validerEmail(email)) {
      this._afficherErreur('Adresse email invalide.');
      return;
    }
    if (mdp.length < 8) {
      this._afficherErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    const btn = DOM.par('btnSInscrire');
    btn.disabled  = true;
    btn.innerHTML = '<span class="spinner"></span>';

    setTimeout(() => {
      Toast.afficher('Compte créé avec succès ! Vous pouvez maintenant vous connecter.', 'succes', 4500);
      this.basculerOnglet('connexion');
      btn.disabled  = false;
      btn.innerHTML = 'Créer mon compte';
    }, 1100);
  },

  /** Accès anonyme — aucune information requise */
  accesAnonyme() {
    Etat.utilisateurConnecte = { type: 'anonyme', nom: null, role: null, matricule: null };
    mettreAJourNavbar();
    Routeur.allerVers('menu');
    Toast.afficher('Mode anonyme — commandez librement', '', 2000);
  },

  /** Accès comme visiteur (nom optionnel) */
  accesVisiteur() {
    Etat.utilisateurConnecte = { type: 'visiteur', nom: 'Visiteur', role: null, matricule: null };
    mettreAJourNavbar();
    Routeur.allerVers('menu');
    Toast.afficher('Bienvenue, visiteur !', '', 2000);
  },

  /** Déconnexion */
  seDeconnecter() {
    Etat.utilisateurConnecte = null;
    DOM.par('btnNavAdmin').style.display = 'none';
    mettreAJourNavbar();
    Toast.afficher('Déconnecté avec succès', '', 2000);
    Routeur.allerVers('menu');
  },

  /**
   * Affiche un message d'erreur dans le formulaire
   * @param {string} message - Message d'erreur
   */
  _afficherErreur(message) {
    const zone = DOM.par('zoneErreurAuth');
    if (!zone) return;
    zone.className     = 'alerte alerte--danger';
    zone.style.display = 'flex';
    zone.textContent   = '❌ ' + message;
  },
};

/* ============================================================
   PAGE ADMINISTRATION — Tableau de bord (PERSONNEL UNIQUEMENT)
   ============================================================ */
const PageAdmin = {

  /** Initialise le tableau de bord admin */
  initialiser() {
    /* Sécurité : rediriger si pas de droits */
    if (!Etat.utilisateurConnecte?.role) {
      Routeur.allerVers('menu');
      return;
    }
    this.afficherStatistiques();
    this.afficherTableauMenu();
    this.afficherTableauCommandes();
  },

  /** Affiche les cartes de statistiques du jour */
  afficherStatistiques() {
    const s = BDD.statistiques;
    const nbDispo = BDD.menu.filter(m => m.disponible).length;

    DOM.html('zoneStatistiques', `
      <div class="stat">
        <div class="stat__icone">📋</div>
        <div class="stat__valeur">${s.commandesAujourdhui}</div>
        <div class="stat__libelle">Commandes aujourd'hui</div>
      </div>
      <div class="stat">
        <div class="stat__icone">💰</div>
        <div class="stat__valeur">${Formater.monnaie(s.recetteDuJour)}</div>
        <div class="stat__libelle">Recettes du jour</div>
      </div>
      <div class="stat">
        <div class="stat__icone">⏳</div>
        <div class="stat__valeur">${s.commandesEnAttente}</div>
        <div class="stat__libelle">En attente de service</div>
      </div>
      <div class="stat">
        <div class="stat__icone">✅</div>
        <div class="stat__valeur">${s.etudiantsServis}</div>
        <div class="stat__libelle">Étudiants servis</div>
      </div>
      <div class="stat">
        <div class="stat__icone">🍽️</div>
        <div class="stat__valeur">${nbDispo}</div>
        <div class="stat__libelle">Plats disponibles</div>
      </div>`);
  },

  /** Affiche le tableau de gestion du menu */
  afficherTableauMenu() {
    const tbody = DOM.par('corpsTableauMenu');
    if (!tbody) return;

    tbody.innerHTML = BDD.menu.map(plat => `
      <tr>
        <!-- Colonne : Plat (vignette + nom) -->
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="tableau__vignette">
              <img
                src="${plat.image}"
                alt="${Securite.echapperHTML(plat.nom)}"
                onerror="this.style.display='none';this.parentElement.textContent='${plat.emoji}'"
              >
            </div>
            <strong>${Securite.echapperHTML(plat.nom)}</strong>
          </div>
        </td>

        <!-- Colonne : Catégorie -->
        <td>
          <span class="pastille pastille--neutre">${plat.categorie}</span>
        </td>

        <!-- Colonne : Prix -->
        <td style="font-weight:800;color:var(--vert-principal)">
          ${Formater.monnaie(plat.prix)}
        </td>

        <!-- Colonne : Disponibilité -->
        <td>
          <span class="pastille ${plat.disponible ? 'pastille--succes' : 'pastille--danger'}">
            ${plat.disponible ? '✓ Disponible' : '✗ Épuisé'}
          </span>
        </td>

        <!-- Colonne : Actions -->
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <!-- Interrupteur disponible/épuisé -->
            <label class="interrupteur" title="${plat.disponible ? 'Marquer épuisé' : 'Marquer disponible'}">
              <input
                type="checkbox"
                ${plat.disponible ? 'checked' : ''}
                onchange="PageAdmin.basculerDisponibilite(${plat.id}, this.checked)"
              >
              <div class="interrupteur__piste"></div>
              <div class="interrupteur__pouce"></div>
            </label>
            <!-- Bouton modifier le prix -->
            <button class="btn btn--ambre btn--petit"
                    onclick="PageAdmin.modifierPrix(${plat.id})">
              Modifier prix
            </button>
            <!-- Bouton supprimer -->
            <button class="btn btn--danger btn--petit"
                    onclick="PageAdmin.supprimerPlat(${plat.id})">
              Supprimer
            </button>
          </div>
        </td>
      </tr>`
    ).join('');
  },

  /** Affiche le tableau des commandes enregistrées */
  afficherTableauCommandes() {
    const tbody = DOM.par('corpsTableauCommandes');
    if (!tbody) return;

    /* Récupérer les tickets triés du plus récent au plus ancien */
    const tickets = Object.values(BDD.tickets)
      .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
      .slice(0, 30); /* Limiter aux 30 dernières commandes */

    if (!tickets.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:24px;color:var(--texte-discret)">
            Aucune commande enregistrée pour le moment
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = tickets.map(t => `
      <tr>
        <!-- Référence de commande -->
        <td style="font-family:monospace;font-size:.76rem;letter-spacing:.5px">
          ${Securite.echapperHTML(t.reference)}
        </td>

        <!-- Client -->
        <td>
          <strong>${Securite.echapperHTML(t.nomClient)}</strong>
          ${t.matricule ? `<br><small style="color:var(--texte-discret)">${Securite.echapperHTML(t.matricule)}</small>` : ''}
        </td>

        <!-- Montant -->
        <td style="font-weight:800;color:var(--vert-principal)">
          ${Formater.monnaie(t.totalPaye)}
        </td>

        <!-- Mode paiement -->
        <td>${Securite.echapperHTML(t.modePaiement || '—')}</td>

        <!-- Date et heure -->
        <td>
          <small style="color:var(--texte-discret)">
            ${new Date(t.dateCreation).toLocaleString('fr-FR')}
          </small>
        </td>

        <!-- Statut et action de service -->
        <td>
          ${t.utilise
            /* Commande déjà servie */
            ? `<span class="pastille pastille--succes">✅ Servi</span>
               <br><small style="color:var(--texte-discret);font-size:.7rem">
                 ${new Date(t.dateService).toLocaleTimeString('fr-FR')}
               </small>`
            /* Commande en attente — bouton pour servir */
            : `<button class="btn btn--principal btn--petit"
                       onclick="PageAdmin.servirClient('${t.reference}')">
                 ✓ Servir
               </button>`
          }
        </td>
      </tr>`
    ).join('');
  },

  /**
   * Bascule la disponibilité d'un plat
   * @param {number} idPlat - ID du plat
   * @param {boolean} valeur - true = disponible, false = épuisé
   */
  basculerDisponibilite(idPlat, valeur) {
    const plat = BDD.menu.find(m => m.id === idPlat);
    if (!plat) return;

    plat.disponible = valeur;
    Toast.afficher(
      `"${plat.nom}" marqué comme ${valeur ? 'disponible' : 'épuisé'}`,
      valeur ? 'succes' : 'avertiss'
    );
    this.afficherTableauMenu();
    this.afficherStatistiques();
  },

  /**
   * Modifie le prix d'un plat
   * @param {number} idPlat - ID du plat
   */
  modifierPrix(idPlat) {
    const plat = BDD.menu.find(m => m.id === idPlat);
    if (!plat) return;

    const saisie = prompt(
      `Nouveau prix pour "${plat.nom}"\nPrix actuel : ${plat.prix} FCFA\n\nEntrez le nouveau prix :`,
      plat.prix
    );

    if (saisie !== null) {
      const nouveauPrix = parseInt(saisie, 10);
      if (!isNaN(nouveauPrix) && nouveauPrix > 0) {
        plat.prix = nouveauPrix;
        Toast.afficher(`Prix mis à jour : ${Formater.monnaie(nouveauPrix)}`, 'succes');
        this.afficherTableauMenu();
      } else {
        Toast.afficher('Prix invalide — veuillez entrer un nombre positif', 'danger');
      }
    }
  },

  /**
   * Supprime un plat du menu
   * @param {number} idPlat - ID du plat à supprimer
   */
  supprimerPlat(idPlat) {
    const plat  = BDD.menu.find(m => m.id === idPlat);
    if (!plat) return;

    const confirmé = confirm(`Supprimer "${plat.nom}" du menu ?\n\nCette action est irréversible.`);
    if (confirmé) {
      const index = BDD.menu.findIndex(m => m.id === idPlat);
      BDD.menu.splice(index, 1);
      Toast.afficher(`"${plat.nom}" supprimé du menu`, 'succes');
      this.afficherTableauMenu();
      this.afficherStatistiques();
    }
  },

  /**
   * Marque une commande comme servie depuis le tableau de bord
   * @param {string} reference - Référence du ticket
   */
  servirClient(reference) {
    const succes = BDD.marquerCommeServi(reference);
    if (succes) {
      Toast.afficher('✅ Client servi — bon validé avec succès !', 'succes', 4000);
      this.afficherTableauCommandes();
      this.afficherStatistiques();
    } else {
      Toast.afficher('Erreur : bon introuvable ou déjà utilisé', 'danger');
    }
  },
};

/* ============================================================
   PAGE VÉRIFICATION — Contrôle anti-fraude (PERSONNEL UNIQUEMENT)
   Un bon de commande ne peut être servi qu'une seule fois.
   ============================================================ */
const PageVerification = {

  /** Initialise la page de vérification */
  initialiser() {
    /* Sécurité : rediriger si pas de droits admin */
    if (!Etat.utilisateurConnecte?.role) {
      Routeur.allerVers('menu');
      return;
    }
    DOM.html('zoneResultatVerification', '');
    const champ = DOM.par('champReferenceVerif');
    if (champ) champ.value = '';
  },

  /** Lance la vérification du bon saisi */
  verifier() {
    const reference = DOM.valeur('champReferenceVerif').trim().toUpperCase();

    if (!reference) {
      Toast.afficher('Veuillez saisir une référence de commande', 'avertiss');
      return;
    }

    /* Vérifier le ticket dans la base */
    const resultat = BDD.verifierTicket(reference);
    this._afficherResultat(resultat);
  },

  /**
   * Affiche le résultat de la vérification
   * @param {object} resultat - { statut: 'valide'|'utilise'|'invalide', ticket }
   */
  _afficherResultat(resultat) {
    const zone = DOM.par('zoneResultatVerification');
    if (!zone) return;

    let html = '';

    if (resultat.statut === 'valide') {
      /* ── BON VALIDE — service autorisé ── */
      const t = resultat.ticket;
      html = `
        <div class="resultat-verification">
          <div class="resultat-verification__entete resultat-verification__entete--valide">
            <span class="resultat-verification__icone">✅</span>
            <div>
              <div class="resultat-verification__titre resultat-verification__titre--valide">
                BON VALIDE — Service autorisé
              </div>
              <small style="color:var(--texte-discret)">Ce bon n'a pas encore été utilisé</small>
            </div>
          </div>
          <div class="resultat-verification__corps">
            <div class="alerte alerte--succes" style="margin-bottom:16px">
              ✅ Vous pouvez servir ce client — bon authentique et non utilisé.
            </div>

            <!-- Détails du bon -->
            <div style="display:grid;gap:6px;margin-bottom:16px">
              <div class="ticket__ligne">
                <span>Référence</span>
                <span style="font-family:monospace;font-weight:800">
                  ${Securite.echapperHTML(t.reference)}
                </span>
              </div>
              <div class="ticket__ligne">
                <span>Client</span>
                <span>${Securite.echapperHTML(t.nomClient)}</span>
              </div>
              ${t.matricule
                ? `<div class="ticket__ligne">
                     <span>Matricule</span>
                     <span>${Securite.echapperHTML(t.matricule)}</span>
                   </div>`
                : ''}
              <div class="ticket__ligne">
                <span>Montant</span>
                <span style="font-weight:800;color:var(--vert-principal)">
                  ${Formater.monnaie(t.totalPaye)}
                </span>
              </div>
              <div class="ticket__ligne">
                <span>Commande passée le</span>
                <span>${new Date(t.dateCreation).toLocaleString('fr-FR')}</span>
              </div>
              <div class="ticket__ligne">
                <span>Articles commandés</span>
                <span style="font-size:.8rem">${Securite.echapperHTML(t.detailArticles || '—')}</span>
              </div>
            </div>

            <!-- Bouton de validation -->
            <button class="btn btn--principal btn--pleine-largeur btn--grand"
                    onclick="PageVerification.validerEtServir('${t.reference}')">
              ✅ Valider le service — Marquer comme servi
            </button>
          </div>
        </div>`;

    } else if (resultat.statut === 'utilise') {
      /* ── BON DÉJÀ UTILISÉ — refus obligatoire ── */
      const t = resultat.ticket;
      html = `
        <div class="resultat-verification">
          <div class="resultat-verification__entete resultat-verification__entete--utilise">
            <span class="resultat-verification__icone">⚠️</span>
            <div>
              <div class="resultat-verification__titre resultat-verification__titre--utilise">
                BON DÉJÀ UTILISÉ — REFUS
              </div>
              <small style="color:var(--texte-discret)">Ce bon a déjà été présenté et validé</small>
            </div>
          </div>
          <div class="resultat-verification__corps">
            <div class="alerte alerte--avertiss" style="margin-bottom:14px">
              ⚠️ <strong>ATTENTION :</strong> Ce bon a déjà été utilisé.
              Ne pas servir à nouveau ce client.
            </div>

            <div style="display:grid;gap:6px;margin-bottom:14px">
              <div class="ticket__ligne">
                <span>Client</span>
                <span>${Securite.echapperHTML(t.nomClient)}</span>
              </div>
              <div class="ticket__ligne">
                <span>Servi le</span>
                <span style="color:var(--ambre-moyen);font-weight:700">
                  ${new Date(t.dateService).toLocaleString('fr-FR')}
                </span>
              </div>
            </div>

            <div class="alerte alerte--danger">
              ❌ Service refusé — Possible tentative de fraude. Alerter la direction si nécessaire.
            </div>
          </div>
        </div>`;

    } else {
      /* ── BON INVALIDE — référence inconnue ── */
      html = `
        <div class="resultat-verification">
          <div class="resultat-verification__entete resultat-verification__entete--invalide">
            <span class="resultat-verification__icone">❌</span>
            <div>
              <div class="resultat-verification__titre resultat-verification__titre--invalide">
                BON INVALIDE
              </div>
              <small style="color:var(--texte-discret)">Référence inconnue dans le système</small>
            </div>
          </div>
          <div class="resultat-verification__corps">
            <div class="alerte alerte--danger">
              ❌ Ce bon de commande est <strong>inconnu</strong> dans notre système.<br>
              Vérifiez la référence saisie ou refusez le service.
            </div>
          </div>
        </div>`;
    }

    zone.innerHTML = html;
  },

  /**
   * Valide le service et marque le ticket comme utilisé
   * @param {string} reference - Référence du ticket
   */
  validerEtServir(reference) {
    const succes = BDD.marquerCommeServi(reference);
    if (succes) {
      Toast.afficher('✅ Service validé — bon marqué comme utilisé !', 'succes', 4500);
      /* Ré-afficher le résultat mis à jour */
      const resultat = BDD.verifierTicket(reference);
      this._afficherResultat(resultat);
      /* Mettre à jour le tableau de bord admin si ouvert */
      if (typeof PageAdmin !== 'undefined') {
        PageAdmin.afficherTableauCommandes();
        PageAdmin.afficherStatistiques();
      }
    } else {
      Toast.afficher('Erreur lors de la validation du service', 'danger');
    }
  },

  /**
   * Simule un scan QR en utilisant la dernière commande passée
   * (utile pour tester le système de vérification)
   */
  simulerScanQR() {
    if (Etat.derniereCommande) {
      const champ = DOM.par('champReferenceVerif');
      if (champ) champ.value = Etat.derniereCommande.reference;
      this.verifier();
    } else {
      Toast.afficher('Aucune commande récente disponible pour la simulation', 'avertiss');
    }
  },
};
