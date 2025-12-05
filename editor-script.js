// Variable d'état pour le mode édition
let isEditing = false;
let currentHighlightedElement = null;

// --- UTILITIES ---

// 1. Fonction pour générer un sélecteur CSS le plus fiable possible
function getElementSelector(el) {
    if (el.id) {
        return `#${el.id}`;
    }

    let selector = el.tagName.toLowerCase();
    
    if (el.className) {
        // Utiliser les classes (en prenant la première comme fallback)
        const classes = el.className.trim().split(/\s+/).filter(c => c.length > 0);
        if (classes.length > 0) {
            selector += `.${classes[0]}`; 
        }
    }
    
    // Ajouter l'index si pas d'ID ou de classe spécifique pour augmenter la spécificité
    let parent = el.parentNode;
    if (parent) {
        let siblings = Array.from(parent.children);
        let index = siblings.indexOf(el) + 1; // CSS est 1-basé
        selector += `:nth-child(${index})`;
    }
    
    return selector;
}

// 2. Fonction de style
function highlightElement(el) {
    if (currentHighlightedElement) {
        currentHighlightedElement.style.outline = '';
    }
    if (el && el !== document.body) {
        el.style.outline = '4px solid rgba(255, 0, 0, 0.8)'; // Bordure rouge pour marquer
        currentHighlightedElement = el;
    }
}

// --- GESTION DES ÉVÉNEMENTS ---

function handleMouseOver(e) {
    if (isEditing) {
        e.stopPropagation();
        highlightElement(e.target);
    }
}

function handleMouseOut(e) {
    if (isEditing) {
        e.stopPropagation();
        if (e.target === currentHighlightedElement) {
            e.target.style.outline = '';
            currentHighlightedElement = null;
        }
    }
}

function handleClick(e) {
    if (isEditing) {
        e.preventDefault(); // Empêche la navigation ou l'action par défaut
        e.stopPropagation();
        
        const el = e.target;
        const selector = getElementSelector(el);
        
        // Sauvegarder la règle
        saveRule(selector, el);
        
        // Cacher immédiatement l'élément
        el.style.display = 'none';
        el.style.outline = ''; 
    }
}

// --- PERSISTANCE ET LOGIQUE ---

// Sauvegarde le sélecteur dans le storage
async function saveRule(selector, element) {
    const hostname = window.location.hostname;
    
    // 1. Récupérer les règles existantes
    const data = await chrome.storage.local.get([hostname]);
    let rules = data[hostname] || [];

    // 2. Ajouter la nouvelle règle si elle n'existe pas déjà
    const newRule = { selector: selector, url_match: "domain" };
    const ruleExists = rules.some(r => r.selector === selector);
    
    if (!ruleExists) {
        rules.push(newRule);
        
        // 3. Sauvegarder la liste mise à jour
        await chrome.storage.local.set({ [hostname]: rules });
        
        // 4. Notifier le content-script qu'une nouvelle règle a été ajoutée pour re-appliquer le style global
        chrome.runtime.sendMessage({ action: "rule_applied", rule: newRule });
        
        alert(`ZenWeb : Element masque et sauvegarde !\nSelecteur: ${selector}`);
    } else {
        alert(`ZenWeb : Cet element (ou un selecteur similaire) est deja masque.`);
    }
}

// Active/Désactive le mode édition
function toggleEditor(forceState) {
    const newState = (forceState !== undefined) ? forceState : !isEditing;
    
    if (newState === isEditing) return isEditing; // Pas de changement d'état
    
    isEditing = newState;
    
    if (isEditing) {
        // ACTIVER
        console.log("ZenWeb Mode Edition Active.");
        document.body.addEventListener('mouseover', handleMouseOver, true);
        document.body.addEventListener('mouseout', handleMouseOut, true);
        document.body.addEventListener('click', handleClick, true);
        // Styliser le curseur
        document.body.style.cursor = 'crosshair';
        
    } else {
        // DÉSACTIVER
        console.log("ZenWeb Mode Edition Desactive.");
        document.body.removeEventListener('mouseover', handleMouseOver, true);
        document.body.removeEventListener('mouseout', handleMouseOut, true);
        document.body.removeEventListener('click', handleClick, true);
        
        // Retirer le surlignage et le curseur
        if (currentHighlightedElement) {
            currentHighlightedElement.style.outline = '';
            currentHighlightedElement = null;
        }
        document.body.style.cursor = ''; 
    }
    
    return isEditing;
}

// Écouteur de message depuis le popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggle_editor") {
        const state = toggleEditor();
        sendResponse({ isEditing: state });
    }
});

// Auto-initialisation de l'éditeur (pour le cas où le popup.js ne gère pas bien l'injection)
// Nous le laissons non initialisé par défaut, c'est le popup qui le déclenche.