        // Structure initiale des colonnes
        const columnsData = [
            { id: 'todo', title: 'À faire', cards: ['Apprendre le drag & drop', 'Créer un kanban'] },
            { id: 'inprogress', title: 'En cours', cards: [] },
            { id: 'done', title: 'Terminé', cards: [] }
        ];

        // Éléments DOM
        let boardElement;

        // Sauvegarde dans localStorage
        function saveToLocalStorage() {
            const dataToStore = columnsData.map(col => ({
                id: col.id,
                title: col.title,
                cards: [...col.cards]   // copie simple
            }));
            localStorage.setItem('kanbanData', JSON.stringify(dataToStore));
        }

        // Charger depuis localStorage (ou garder les données par défaut)
        function loadFromLocalStorage() {
            const stored = localStorage.getItem('kanbanData');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    // Réinitialiser columnsData avec les données sauvegardées
                    // On garde la structure, mais on remplit cards
                    parsed.forEach((storedCol, idx) => {
                        if (columnsData[idx] && columnsData[idx].id === storedCol.id) {
                            columnsData[idx].cards = storedCol.cards;
                        }
                    });
                } catch(e) { console.warn("Erreur de chargement", e); }
            }
        }

        // Rendre tout le tableau
function renderBoard() {
    if (!boardElement) return;
    boardElement.innerHTML = '';
    columnsData.forEach((column, colIndex) => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'column';
        columnDiv.setAttribute('data-column-id', column.id);
        
        // En-tête
        const header = document.createElement('div');
        header.className = 'column-header';
        header.innerHTML = `
            <span>${column.title}</span>
            <span>${column.cards.length}</span>
        `;
        
        // Conteneur des cartes (zone de drop)
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container';
        cardsContainer.setAttribute('data-column-id', column.id);
        
        // Événements pour le drop (inchangés)
        cardsContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            cardsContainer.classList.add('drag-over');
        });
        cardsContainer.addEventListener('dragleave', () => {
            cardsContainer.classList.remove('drag-over');
        });
        cardsContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            cardsContainer.classList.remove('drag-over');
            const cardId = e.dataTransfer.getData('text/plain');
            if (!cardId) return;
            
            // Trouver la colonne source et la carte
            let sourceColumn = null;
            let cardIndex = -1;
            for (let col of columnsData) {
                const idx = col.cards.indexOf(cardId);
                if (idx !== -1) {
                    sourceColumn = col;
                    cardIndex = idx;
                    break;
                }
            }
            if (sourceColumn && cardIndex !== -1) {
                // Supprimer de la colonne source
                const movedCard = sourceColumn.cards.splice(cardIndex, 1)[0];
                // Ajouter à la colonne cible
                const targetColumn = columnsData.find(col => col.id === column.id);
                if (targetColumn) {
                    targetColumn.cards.push(movedCard);
                    saveToLocalStorage();
                    renderBoard();
                }
            }
        });
        
        // Ajouter les cartes
        column.cards.forEach((cardText, cardIdx) => {
            const card = createCardElement(cardText, cardIdx, column.id);
            cardsContainer.appendChild(card);
        });
        
        columnDiv.appendChild(header);
        columnDiv.appendChild(cardsContainer);

        // Formulaire d'ajout de carte : uniquement pour la colonne "À faire"
        if (column.id === 'todo') {
            const addCardDiv = document.createElement('div');
            addCardDiv.className = 'add-card';
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Nouvelle carte...';
            const addBtn = document.createElement('button');
            addBtn.textContent = '+ Ajouter';
            addBtn.addEventListener('click', () => {
                const text = input.value.trim();
                if (text === '') return;
                column.cards.push(text);
                saveToLocalStorage();
                renderBoard();
            });
            addCardDiv.appendChild(input);
            addCardDiv.appendChild(addBtn);
            columnDiv.appendChild(addCardDiv);
        }
        
        boardElement.appendChild(columnDiv);
    });
}
        
        // Créer un élément carte avec gestion du drag
        function createCardElement(text, cardIndex, columnId) {
            const card = document.createElement('div');
            card.className = 'card';
            card.setAttribute('draggable', 'true');
            card.setAttribute('data-card-text', text);
            card.setAttribute('data-column-id', columnId);
            
            const textSpan = document.createElement('span');
            textSpan.className = 'card-text';
            textSpan.textContent = text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-card';
            deleteBtn.innerHTML = '✕';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Supprimer la carte
                const col = columnsData.find(c => c.id === columnId);
                if (col) {
                    const idx = col.cards.indexOf(text);
                    if (idx !== -1) {
                        col.cards.splice(idx, 1);
                        saveToLocalStorage();
                        renderBoard();
                    }
                }
            });
            
            card.appendChild(textSpan);
            card.appendChild(deleteBtn);
            
            // Événements drag & drop
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', text);
                e.dataTransfer.effectAllowed = 'move';
                card.classList.add('dragging');
            });
            card.addEventListener('dragend', (e) => {
                card.classList.remove('dragging');
            });
            
            return card;
        }
        
        // Initialisation
        function init() {
            boardElement = document.getElementById('kanban-board');
            loadFromLocalStorage();
            renderBoard();
        }
        
        init();
