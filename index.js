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
        cards: [...col.cards]
    }));
    localStorage.setItem('kanbanData', JSON.stringify(dataToStore));
}

// Charger depuis localStorage
function loadFromLocalStorage() {
    const stored = localStorage.getItem('kanbanData');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            parsed.forEach((storedCol, idx) => {
                if (columnsData[idx] && columnsData[idx].id === storedCol.id) {
                    columnsData[idx].cards = storedCol.cards;
                }
            });
        } catch(e) { console.warn("Erreur de chargement", e); }
    }
}

// Afficher la barre d'ajout globale
function showGlobalAddBar() {
    const bar = document.getElementById('global-add-bar');
    if (bar) {
        bar.classList.remove('hidden');
        document.getElementById('new-task-input').focus();
    }
}

// Masquer la barre d'ajout globale
function hideGlobalAddBar() {
    const bar = document.getElementById('global-add-bar');
    if (bar) {
        bar.classList.add('hidden');
        document.getElementById('new-task-input').value = '';
    }
}

// Ajouter une nouvelle tâche (toujours dans "À faire")
function addNewTask() {
    const input = document.getElementById('new-task-input');
    const text = input.value.trim();
    if (text === '') return;

    const todoColumn = columnsData.find(col => col.id === 'todo');
    if (todoColumn) {
        todoColumn.cards.push(text);
        saveToLocalStorage();
        renderBoard();
    }
    hideGlobalAddBar();
}

// Créer un élément carte avec gestion du drag
function createCardElement(text, columnId) {
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

// Rendre tout le tableau
function renderBoard() {
    if (!boardElement) return;
    boardElement.innerHTML = '';
    columnsData.forEach((column) => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'column';
        columnDiv.setAttribute('data-column-id', column.id);

        // En-tête
        const header = document.createElement('div');
        header.className = 'column-header';

        // Partie gauche : titre + compteur
        const titleSection = document.createElement('div');
        titleSection.className = 'title-section';
        titleSection.innerHTML = `<span>${column.title}</span><span>${column.cards.length}</span>`;
        header.appendChild(titleSection);

        // Bouton "+" uniquement pour la colonne "À faire"
        if (column.id === 'todo') {
            const addBtn = document.createElement('button');
            addBtn.textContent = '+';
            addBtn.className = 'add-task-btn';
            addBtn.title = 'Ajouter une tâche';
            addBtn.addEventListener('click', showGlobalAddBar);
            header.appendChild(addBtn);
        }

        columnDiv.appendChild(header);

        // Conteneur des cartes (zone de drop)
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container';
        cardsContainer.setAttribute('data-column-id', column.id);

        // Événements pour le drop
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
                const movedCard = sourceColumn.cards.splice(cardIndex, 1)[0];
                const targetColumn = columnsData.find(col => col.id === column.id);
                if (targetColumn) {
                    targetColumn.cards.push(movedCard);
                    saveToLocalStorage();
                    renderBoard();
                }
            }
        });

        // Ajouter les cartes
        column.cards.forEach((cardText) => {
            const card = createCardElement(cardText, column.id);
            cardsContainer.appendChild(card);
        });

        columnDiv.appendChild(cardsContainer);
        boardElement.appendChild(columnDiv);
    });
}

// Initialisation
function init() {
    boardElement = document.getElementById('kanban-board');
    loadFromLocalStorage();
    renderBoard();

    // Événements de la barre d'ajout globale
    const confirmBtn = document.getElementById('confirm-add-btn');
    const closeBtn = document.getElementById('close-add-bar-btn');
    const taskInput = document.getElementById('new-task-input');

    if (confirmBtn) confirmBtn.addEventListener('click', addNewTask);
    if (closeBtn) closeBtn.addEventListener('click', hideGlobalAddBar);
    if (taskInput) taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTask();
    });
}

init();