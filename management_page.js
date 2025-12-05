document.addEventListener('DOMContentLoaded', loadSites);

const siteListContainer = document.getElementById('siteList');
const globalResetButton = document.getElementById('globalReset');

// 1. Charger et afficher tous les domaines
async function loadSites() {
    siteListContainer.innerHTML = '<p id="loadingMessage">Chargement des règles...</p>'; // Afficher le message de chargement
    
    try {
        const allData = await chrome.storage.local.get(null);
        const hostnames = Object.keys(allData);

        // Vider le conteneur pour l'affichage
        siteListContainer.innerHTML = '';

        if (hostnames.length === 0) {
            siteListContainer.innerHTML = '<p>Aucun site n\'a ete nettoye pour le moment.</p>';
            return;
        }
        
        hostnames.forEach(hostname => {
            const rules = allData[hostname];
            if (rules && rules.length > 0) {
                const item = document.createElement('div');
                item.className = 'site-item';
                item.innerHTML = `
                    <span>
                        <strong>${hostname}</strong> 
                        (${rules.length} regles masquees)
                    </span>
                    <button class="reset-btn" data-hostname="${hostname}">Reinitialiser ce site</button>
                `;
                siteListContainer.appendChild(item);
            }
        });
        
        // Attacher les écouteurs pour les boutons de réinitialisation individuelle
        document.querySelectorAll('.reset-btn').forEach(button => {
            button.addEventListener('click', handleResetSite);
        });
        
    } catch (e) {
        siteListContainer.innerHTML = `<p style="color: red;">Erreur lors du chargement des données: ${e.message}</p>`;
    }
}

// 2. Gérer la réinitialisation d'un site (laissé ici pour la complétude)
function handleResetSite(event) {
    const hostnameToReset = event.target.getAttribute('data-hostname');
    
    if (confirm(`Êtes-vous sûr de vouloir réinitialiser le site ${hostnameToReset} ? Toutes les règles seront supprimées.`)) {
        chrome.storage.local.remove(hostnameToReset, () => {
            console.log(`[ZenWeb] Site ${hostnameToReset} réinitialisé.`);
            loadSites();
        });
    }
}

// 3. Gérer la réinitialisation globale (Focus de la correction)
globalResetButton.addEventListener('click', () => {
    // Étape de sécurité
    if (confirm("ATTENTION ! Etes-vous sur de vouloir reinitialiser TOUS les sites ? Toutes les regles sauvegardees seront perdues.")) {
        
        console.log("[ZenWeb] Tentative de reinitialisation globale de chrome.storage.local...");

        chrome.storage.local.clear(() => {
            // Vérifier s'il y a une erreur après le clear
            if (chrome.runtime.lastError) {
                console.error("[ZenWeb ERROR] Échec de la réinitialisation globale:", chrome.runtime.lastError.message);
                alert("Erreur lors de la réinitialisation globale. Voir la console pour les details.");
                return;
            }
            
            console.log("[ZenWeb] Reinitialisation globale effectuee avec succes.");
            
            // Mise à jour de l'interface utilisateur
            loadSites();
            alert("Reinitialisation globale effectuee. Tous les sites sont revenus a leur etat d'origine.");
        });
    }
});