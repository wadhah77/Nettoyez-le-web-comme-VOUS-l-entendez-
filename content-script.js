// Fonction pour masquer les éléments en injectant du CSS
function applyZenWebRules(rules) {
    if (!rules || rules.length === 0) {
        // Pas de règles, on s'arrête
        return;
    }

    // 1. Créer le conteneur de styles s'il n'existe pas
    let styleEl = document.getElementById('zenweb-cleanup-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'zenweb-cleanup-styles';
        // Injection directement dans le head (ou le documentElement si head n'est pas encore là)
        (document.head || document.documentElement).appendChild(styleEl); 
    }

    // 2. Générer les règles CSS pour masquer les sélecteurs
    const selectors = rules.map(rule => rule.selector).join(', ');
    
    // Utiliser `display: none !important` pour forcer le masquage
    if (selectors.length > 0) {
        styleEl.textContent = `${selectors} { display: none !important; }`;
        console.log(`ZenWeb : ${rules.length} regles appliquees.`);
    }
}

// Récupérer les règles de masquage sauvegardées pour ce site
async function loadAndApplyRules() {
    const hostname = window.location.hostname;
    
    try {
        const data = await chrome.storage.local.get([hostname]);
        applyZenWebRules(data[hostname]);
    } catch (e) {
        console.error("ZenWeb: Erreur lors du chargement des regles", e);
    }
}

// Lancement de l'application des règles au tout début du chargement de la page
loadAndApplyRules();

// Écouteur de messages : utilisé par l'éditeur lorsqu'une nouvelle règle est ajoutée
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "rule_applied") {
        // Lorsqu'une nouvelle règle est ajoutée par l'éditeur, on re-applique tout
        loadAndApplyRules();
        sendResponse({ success: true });
        return true; 
    }
});