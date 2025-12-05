document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleEditor');
    const managementLink = document.getElementById('managementLink');
    const statusMessage = document.getElementById('statusMessage');
    
    // Fonction pour envoyer un message au script de l'onglet actif
    function sendMessageToContentScript(action) {
        // Utilise l'API scripting pour exécuter un script sur l'onglet actif
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length === 0) {
                statusMessage.textContent = "Erreur : Aucun onglet actif trouve.";
                return;
            }
            
            const tabId = tabs[0].id;
            
            // 1. Injecter l'éditeur (s'il n'est pas déjà là)
            chrome.scripting.executeScript({
                target: {tabId: tabId},
                files: ['editor-script.js']
            }, () => {
                // 2. Une fois injecté, envoyer le message pour basculer le mode
                chrome.tabs.sendMessage(tabId, { action: action }, (response) => {
                    if (chrome.runtime.lastError) {
                        statusMessage.textContent = "Erreur : Rechargez la page ou réessayez.";
                        return;
                    }
                    if (response && response.isEditing !== undefined) {
                        if (response.isEditing) {
                            toggleButton.textContent = "Desactiver le Mode Edition";
                            statusMessage.textContent = "Mode Edition ACTIF. Cliquez pour masquer.";
                        } else {
                            toggleButton.textContent = "Activer le Mode Edition";
                            statusMessage.textContent = "Mode Edition INACTIF.";
                        }
                    }
                });
            });
        });
    }

    toggleButton.addEventListener('click', () => {
        // Le script de l'éditeur gérera l'état ACTIF/INACTIF
        sendMessageToContentScript('toggle_editor');
    });

    managementLink.addEventListener('click', () => {
        // Ouvre la page de gestion dans un nouvel onglet
        chrome.runtime.openOptionsPage();
    });
    
    // Initialisation : on pourrait aussi demander l'état actuel de l'éditeur ici si on voulait un état persistant.
    // Pour simplifier, on suppose qu'il est désactivé au départ.
});