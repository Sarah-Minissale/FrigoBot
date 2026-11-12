const PANTRY_STORAGE_KEY = "frigobot-pantry-items";
const SHOPPING_STORAGE_KEY = "frigobot-shopping-list";

/* COSA FA: riconosce spezie, aromi e miscele dal nome inserito.
   COLLEGAMENTI: viene usata da classifyFood() e parseShoppingItem() per
   scegliere la Dispensa e, se manca la quantità, proporre un barattolino. */
function isSpice(foodName) {
    const normalizedName = foodName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const paddedName = ` ${normalizedName} `;
    const spiceKeywords = [
        "spezia",
        "spezie",
        "sale",
        "pepe",
        "paprika",
        "curcuma",
        "cannella",
        "cumino",
        "zenzero",
        "noce moscata",
        "chiodi di garofano",
        "cardamomo",
        "coriandolo",
        "peperoncino",
        "curry",
        "zafferano",
        "anice",
        "vaniglia",
        "origano",
        "basilico",
        "rosmarino",
        "timo",
        "salvia",
        "alloro",
        "maggiorana",
        "erba cipollina",
        "prezzemolo",
        "aglio in polvere",
        "cipolla in polvere",
        "garam masala",
        "sumac",
    ];

    return spiceKeywords.some((spice) => paddedName.includes(` ${spice} `));
}

/* COSA FA: assegna un alimento a Frigo, Freezer oppure Dispensa.
   COLLEGAMENTI: viene richiamata quando si aggiunge/modifica un prodotto e
   il risultato alimenta i contatori HTML fridgeItemCount, freezerItemCount
   e pantryItemCount tramite updateInventoryCounts(). */
function classifyFood(foodName) {
    const normalizedName = foodName.toLowerCase();
    const freezerKeywords = ["surgelat", "congelat"];
    const fridgeKeywords = [
        // Frutta
        "frutta",
        "mela",
        "mele",
        "pera",
        "pere",
        "banana",
        "arancia",
        "mandarino",
        "limone",
        "fragola",
        "uva",
        "kiwi",
        "pesca",
        "pesche",
        "albicocc",
        "cilieg",
        "ananas",
        "melone",
        "anguria",
        "mirtill",
        "zucca",
        "zucche",
        "lampon",
        // Carne
        "carne",
        "pollo",
        "manzo",
        "vitello",
        "maiale",
        "tacchino",
        "salsiccia",
        "bistecca",
        "hamburger",
        "prosciutto",
        "trippa",
        "fegatelli",
        "fegato",
        "salame",
        // Verdura
        "verdura",
        "zucchin",
        "carota",
        "pomodor",
        "insalata",
        "lattuga",
        "spinaci",
        "peperon",
        "melanzan",
        "broccol",
        "cavolfiore",
        "cipolla",
        "patata",
        "cetriolo",
        "sedano",
        // Uova e latticini
        "uovo",
        "uova",
        "latticin",
        "latte",
        "yogurt",
        "formaggio",
        "mozzarella",
        "parmigiano",
        "ricotta",
        "burro",
        "panna",
        "mascarpone",
    ];

    if (freezerKeywords.some((keyword) => normalizedName.includes(keyword))) {
        return "Freezer";
    }

    // GESTIONE SPEZIE: le spezie vengono conservate in dispensa.
    if (isSpice(foodName)) return "Dispensa";

    if (fridgeKeywords.some((keyword) => normalizedName.includes(keyword))) {
        return "Frigo";
    }

    return "Dispensa";
}

/* COSA FA: confronta una scadenza con la data odierna e prepara testo/stato.
   COLLEGAMENTI: openPantryModal() usa label e status per creare l'etichetta
   colorata .pantry-item-expiry mostrata nell'inventario. */
function getExpiryInfo(expiryDate) {
    if (!expiryDate) {
        return { label: "Scadenza non indicata", status: "unset" };
    }

    const expiry = new Date(`${expiryDate}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) {
        return { label: "Scadenza non valida", status: "expired" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysRemaining = Math.round(
        (expiry.getTime() - today.getTime()) / 86_400_000,
    );
    const formattedDate = new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(expiry);

    if (daysRemaining < 0) {
        return { label: `Scaduto il ${formattedDate}`, status: "expired" };
    }
    if (daysRemaining === 0) {
        return { label: "Scade oggi", status: "soon" };
    }
    if (daysRemaining <= 3) {
        return {
            label: `Scade tra ${daysRemaining} ${daysRemaining === 1 ? "giorno" : "giorni"}`,
            status: "soon",
        };
    }

    return { label: `Scade il ${formattedDate}`, status: "valid" };
}

// Dati iniziali usati soltanto al primo avvio dell'applicazione
const defaultPantryItems = [
    {
        id: 1,
        name: "Pasta integrale De Cecco",
        qty: "1000g (2 conf.)",
        place: "Dispensa",
    },
    {
        id: 2,
        name: "Yogurt Greco 0%",
        qty: "3 vasetti (450g)",
        place: "Frigo - Ripiano Alto",
    },
    {
        id: 3,
        name: "Zucchine fresche",
        qty: "3 pz (~400g)",
        place: "Cassetto Verdure",
    },
    {
        id: 4,
        name: "Uova bio da allevamento a terra",
        qty: "6 pz",
        place: "Ripiano Centrale",
    },
    {
        id: 5,
        name: "Petto di pollo",
        qty: "350g",
        place: "Frigo - Ripiano Basso",
    },
    {
        id: 6,
        name: "Parmigiano Reggiano 24 mesi",
        qty: "200g",
        place: "Frigo - Ripiano Alto",
    },
];

const defaultShoppingList = [
    { id: 101, name: "Latte di mandorla", qty: "1 Litro" },
    { id: 102, name: "Passata di pomodoro", qty: "700g" },
    { id: 103, name: "Mele Golden", qty: "1.5 kg" },
    { id: 104, name: "Riso Basmati", qty: "1 kg" },
];

/* COSA FA: legge una collezione JSON dal localStorage del browser.
   COLLEGAMENTI: inizializza pantryItems e shoppingList; se non trova dati
   validi, restituisce una copia dei rispettivi valori default. */
function loadFoodCollection(storageKey, fallbackItems) {
    try {
        const savedItems = JSON.parse(localStorage.getItem(storageKey));
        if (Array.isArray(savedItems)) return savedItems;
    } catch (error) {
        // Se i dati non sono leggibili vengono ripristinati quelli iniziali.
    }

    return fallbackItems.map((item) => ({ ...item }));
}

/* COSA FA: salva inventario e lista della spesa nel localStorage.
   COLLEGAMENTI: viene richiamata dopo ogni aggiunta, modifica, eliminazione
   o trasferimento, così i dati restano disponibili dopo il refresh. */
function saveFoodCollections() {
    try {
        localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(pantryItems));
        localStorage.setItem(
            SHOPPING_STORAGE_KEY,
            JSON.stringify(shoppingList),
        );
    } catch (error) {
        // Le modifiche restano disponibili nella sessione corrente.
    }
}

// Inventario e lista della spesa persistenti
const pantryItems = loadFoodCollection(PANTRY_STORAGE_KEY, defaultPantryItems);
const shoppingList = loadFoodCollection(
    SHOPPING_STORAGE_KEY,
    defaultShoppingList,
);

// Aggiunge la categoria anche ai dati salvati con le versioni precedenti.
pantryItems.forEach((item) => {
    if (!item.category) {
        const savedPlace = (item.place || "").toLowerCase();
        if (savedPlace.includes("freezer")) {
            item.category = "Freezer";
        } else if (
            savedPlace.includes("frigo") ||
            savedPlace.includes("ripiano") ||
            savedPlace.includes("cassetto")
        ) {
            item.category = "Frigo";
        } else {
            item.category = classifyFood(item.name);
        }
    }
});

shoppingList.forEach((item) => {
    if (!item.category) item.category = classifyFood(item.name);
});

saveFoodCollections();

let pendingChatAction = null;
let activeChatId = null;
let inMemoryChats = [];
let isAwaitingAiResponse = false;

// Indica se la chat attiva deve essere evidenziata nella lista a sinistra.
let isChatHistorySelectionVisible = true;

const CHAT_STORAGE_KEY = "frigobot-chat-history";
const CHAT_SUGGESTION_TEXT =
    "Come posso aiutarti? Puoi scrivere una lista della spesa oppure vedere cosa hai già in dispensa.";

/* COSA FA: legge dal localStorage tutte le conversazioni salvate.
   COLLEGAMENTI: fornisce i dati a renderHomeChatHistory(), loadStoredChat()
   e getApiConversationMessages(); inMemoryChats è la copia di emergenza. */
function readStoredChats() {
    try {
        const storedChats = JSON.parse(
            localStorage.getItem(CHAT_STORAGE_KEY) || "[]",
        );
        inMemoryChats = Array.isArray(storedChats) ? storedChats : [];
        return inMemoryChats;
    } catch (error) {
        return inMemoryChats;
    }
}

/* COSA FA: salva l'array delle conversazioni nel browser.
   COLLEGAMENTI: viene chiamata da creazione, registrazione ed eliminazione
   delle chat e mantiene sincronizzata anche la variabile inMemoryChats. */
function saveStoredChats(chats) {
    inMemoryChats = chats;
    try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
        // La chat continua a funzionare anche se il browser blocca localStorage.
    }
}

/* COSA FA: crea una nuova conversazione vuota con id e date univoche.
   COLLEGAMENTI: aggiorna activeChatId, chiama saveStoredChats() e ridisegna
   la sezione HTML #homeChatHistoryList nella sidebar. */
function createStoredChat() {
    const chats = readStoredChats();
    const now = new Date().toISOString();
    const chat = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: "Nuova chat",
        createdAt: now,
        updatedAt: now,
        pendingAction: null,
        messages: [],
    };

    chats.unshift(chat);
    saveStoredChats(chats);
    activeChatId = chat.id;
    renderHomeChatHistory();
    return chat;
}

/* COSA FA: aggiunge un messaggio utente/bot alla chat attualmente aperta.
   COLLEGAMENTI: appendChatMessage() la richiama quando persist=true; aggiorna
   localStorage e il titolo visibile nell'elenco delle chat salvate. */
function recordChatMessage(sender, text, type = "text") {
    if (!hasChatInterface()) return;

    const chats = readStoredChats();
    let chat = chats.find((item) => item.id === activeChatId);

    if (!chat) {
        chat = createStoredChat();
        return recordChatMessage(sender, text, type);
    }

    chat.messages.push({ sender, text, type });
    chat.pendingAction = pendingChatAction;
    chat.updatedAt = new Date().toISOString();

    if (sender === "user" && chat.title === "Nuova chat") {
        chat.title = text.length > 36 ? `${text.slice(0, 36)}…` : text;
    }

    saveStoredChats(chats);
    renderHomeChatHistory();
}

/* COSA FA: chiede conferma e cancella una conversazione salvata.
   COLLEGAMENTI: è associata al cestino della sidebar; se elimina la chat
   attiva, apre la più recente oppure mostra i suggerimenti iniziali. */
function deleteStoredChat(chatId) {
    const chats = readStoredChats();
    const chatToDelete = chats.find((chat) => chat.id === chatId);
    if (!chatToDelete) return;

    const confirmed = window.confirm(
        `Vuoi eliminare la chat “${chatToDelete.title}”?`,
    );
    if (!confirmed) return;

    const remainingChats = chats.filter((chat) => chat.id !== chatId);
    saveStoredChats(remainingChats);

    if (hasChatInterface() && activeChatId === chatId) {
        activeChatId = null;
        pendingChatAction = null;

        if (remainingChats.length > 0) {
            const nextChat = remainingChats.sort(
                (first, second) =>
                    new Date(second.updatedAt).getTime() -
                    new Date(first.updatedAt).getTime(),
            )[0];
            loadStoredChat(nextChat.id);
        } else {
            clearChatView();
            showChatSuggestions({ persist: false });
            renderHomeChatHistory();
        }
        return;
    }

    renderHomeChatHistory();
}

/* COSA FA: ricrea nell'HTML l'elenco delle chat salvate.
   COLLEGAMENTI: scrive dentro #homeChatHistoryList; ogni riga richiama
   loadStoredChat() al clic e deleteStoredChat() dal pulsante cestino. */
function renderHomeChatHistory() {
    const historyList = document.getElementById("homeChatHistoryList");
    if (!historyList) return;

    const chats = readStoredChats().sort(
        (first, second) =>
            new Date(second.updatedAt).getTime() -
            new Date(first.updatedAt).getTime(),
    );
    historyList.replaceChildren();

    if (chats.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "home-chat-history-empty";
        emptyState.textContent = "Non ci sono ancora conversazioni salvate.";
        historyList.appendChild(emptyState);
        return;
    }

    chats.forEach((chat) => {
        const entry = document.createElement("div");
        const openButton = document.createElement("button");
        const deleteButton = document.createElement("button");
        const icon = document.createElement("i");
        const title = document.createElement("span");

        entry.className = "home-chat-history-entry";
        openButton.className = "nav-item home-chat-history-item";
        openButton.type = "button";
        openButton.title = `Riprendi: ${chat.title}`;
        icon.className = "fa-regular fa-message";
        title.textContent = chat.title;
        openButton.append(icon, title);
        if (isChatHistorySelectionVisible && chat.id === activeChatId) {
            openButton.classList.add("active");
        }
        openButton.addEventListener("click", () => {
            isChatHistorySelectionVisible = true;
            loadStoredChat(chat.id);
        });
        deleteButton.className = "home-chat-history-delete";
        deleteButton.type = "button";
        deleteButton.title = `Elimina: ${chat.title}`;
        deleteButton.setAttribute(
            "aria-label",
            `Elimina la chat ${chat.title}`,
        );
        deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        deleteButton.addEventListener("click", () => deleteStoredChat(chat.id));
        entry.append(openButton, deleteButton);
        historyList.appendChild(entry);
    });
}

/* COSA FA: mostra quante voci contiene la lista della spesa.
   COLLEGAMENTI: legge shoppingList e aggiorna lo span HTML
   #shoppingItemCount presente sopra la barra della chat. */
function updateShoppingCount() {
    const counter = document.getElementById("shoppingItemCount");
    if (counter) counter.textContent = shoppingList.length;
}

/* COSA FA: conta separatamente gli alimenti di Frigo, Freezer e Dispensa.
   COLLEGAMENTI: legge pantryItems e aggiorna i tre contatori HTML del badge
   riassuntivo; viene richiamata dopo le modifiche all'inventario. */
function updateInventoryCounts() {
    const counters = {
        Frigo: document.getElementById("fridgeItemCount"),
        Freezer: document.getElementById("freezerItemCount"),
        Dispensa: document.getElementById("pantryItemCount"),
    };

    Object.entries(counters).forEach(([category, counter]) => {
        if (counter) {
            counter.textContent = pantryItems.filter(
                (item) => item.category === category,
            ).length;
        }
    });
}

/* COSA FA: apre o comprime la barra laterale.
   COLLEGAMENTI: è chiamata dai pulsanti HTML collapseSidebarBtn ed
   expandSidebarBtn e alterna la classe CSS #sidebar.collapsed. */
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const expandBtn = document.getElementById("expandSidebarBtn");
    sidebar.classList.toggle("collapsed");
    expandBtn.style.display = sidebar.classList.contains("collapsed")
        ? "flex"
        : "none";
}

/* COSA FA: copia un suggerimento pronto nel campo della chat.
   COLLEGAMENTI: è chiamata dai comandi della sidebar e scrive dentro
   l'input HTML #userPromptInput senza inviare subito il messaggio. */
function insertPrompt(text) {
    const input = document.getElementById("userPromptInput");
    input.value = text;
    input.focus();
}

/* COSA FA: costruisce avatar e fumetto di un messaggio e li mostra a video.
   COLLEGAMENTI: scrive in #chatMessages, rende visibile #chatConversation e,
   se persist=true, passa il messaggio a recordChatMessage(). */
function appendChatMessage(sender, text, options = {}) {
    const { persist = true, type = "text" } = options;
    const conversation = document.getElementById("chatConversation");
    const messages = document.getElementById("chatMessages");
    const message = document.createElement("div");
    const avatar = document.createElement("div");
    const bubble = document.createElement("div");

    conversation.hidden = false;
    message.className = `chat-message ${sender}`;
    avatar.className = "chat-avatar";
    avatar.setAttribute("aria-hidden", "true");

    if (sender === "user") {
        avatar.innerHTML = '<i class="fa-solid fa-user"></i>';
    } else {
        const logo = document
            .querySelector(".mascot-svg-box svg")
            .cloneNode(true);
        logo.classList.add("chat-logo-icon");
        logo.removeAttribute("style");
        logo.setAttribute("viewBox", "20 4 80 104");
        avatar.appendChild(logo);
    }

    bubble.className = "chat-bubble";
    bubble.textContent = text;

    message.append(avatar, bubble);
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;

    if (persist) recordChatMessage(sender, text, type);

    return bubble;
}

/* COSA FA: scorciatoia per mostrare un messaggio con mittente "bot".
   COLLEGAMENTI: inoltra testo e opzioni ad appendChatMessage(); viene usata
   da suggerimenti, inventario, conferme ed elaborazione AI. */
function appendBotMessage(text, options = {}) {
    return appendChatMessage("bot", text, options);
}

/* COSA FA: inserisce nel fumetto i pulsanti Spesa e Inventario.
   COLLEGAMENTI: i pulsanti richiamano handleChatChoice(); riceve il nodo
   bubble creato da appendBotMessage(). */
function attachChatSuggestions(bubble) {
    const actions = document.createElement("div");
    const choices = [
        {
            type: "shopping",
            icon: "fa-cart-shopping",
            label: "Scrivi lista della spesa",
        },
        {
            type: "pantry",
            icon: "fa-boxes-stacked",
            label: "Vedi cosa ho in dispensa",
        },
    ];

    actions.className = "chat-actions";
    choices.forEach((choice) => {
        const button = document.createElement("button");
        button.className = "chat-action-button";
        button.type = "button";
        button.innerHTML = `<i class="fa-solid ${choice.icon}"></i><span>${choice.label}</span>`;
        button.addEventListener("click", () => {
            actions
                .querySelectorAll("button")
                .forEach((actionButton) => (actionButton.disabled = true));
            handleChatChoice(choice.type);
        });
        actions.appendChild(button);
    });

    bubble.appendChild(actions);
}

/* COSA FA: mostra il messaggio iniziale di FrigoBot con i due suggerimenti.
   COLLEGAMENTI: combina appendBotMessage() e attachChatSuggestions(); viene
   usata all'avvio e al termine del flusso della lista della spesa. */
function showChatSuggestions(options = {}) {
    const bubble = appendBotMessage(CHAT_SUGGESTION_TEXT, {
        ...options,
        type: "suggestions",
    });
    attachChatSuggestions(bubble);
}

/* COSA FA: mette la chat in modalità inserimento lista della spesa.
   COLLEGAMENTI: imposta pendingChatAction="shopping"; il prossimo messaggio
   viene interpretato da respondToPrompt() tramite addShoppingItems(). */
function startShoppingList() {
    pendingChatAction = "shopping";
    appendBotMessage(
        "Perfetto! Scrivi gli alimenti da comprare separandoli con una virgola, per esempio: latte, pane, pomodori e caffè.",
    );

    const input = document.getElementById("userPromptInput");
    input.placeholder = "Scrivi gli alimenti da aggiungere alla spesa...";
    input.focus();
}

/* COSA FA: separa nome e quantità da frasi come "1 litro di latte".
   COLLEGAMENTI: addShoppingItems() la applica a ogni voce scritta; usa
   isSpice() per assegnare una quantità standard alle spezie. */
function parseShoppingItem(rawItem) {
    const itemText = rawItem.trim();
    const quantityWithUnitPattern =
        /^(\d+(?:[.,]\d+)?\s*(?:chilogramm(?:o|i)|chil(?:o|i)|kg|gramm(?:o|i)|gr\.?|g|millilitr(?:o|i)|ml|litr(?:o|i)|lt|l|confezion(?:e|i)|conf\.?|pacc(?:o|hi)|sacc(?:a|he|o|hi)|scatol(?:a|e)|bottigli(?:a|e)|vasett(?:o|i)|barattolin(?:o|i)|barattol(?:o|i)|lattin(?:a|e)|sacchett(?:o|i)|pezz(?:o|i)|pz|porzion(?:e|i)|vassoio|vassoi|carton(?:e|i)|tub(?:o|i)|rotol(?:o|i)))(?:\s+di\s+|\s+d['’]\s*|\s+)(.+)$/i;
    const quantityWithUnit = itemText.match(quantityWithUnitPattern);

    if (quantityWithUnit) {
        return {
            name: quantityWithUnit[2].trim(),
            qty: quantityWithUnit[1].replace(/\s+/g, " ").trim(),
        };
    }

    // Se è indicato solo un numero, viene interpretato come numero di pezzi.
    const quantityInPieces = itemText.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
    if (quantityInPieces) {
        return {
            name: quantityInPieces[2].trim(),
            qty: `${quantityInPieces[1]} pz`,
        };
    }

    // GESTIONE SPEZIE: quantità standard quando non viene specificata.
    if (isSpice(itemText)) {
        return { name: itemText, qty: "1 barattolino (35 grammi)" };
    }

    return { name: itemText, qty: "1 barattolino" };
}

/* COSA FA: trasforma un messaggio in più prodotti e li aggiunge alla spesa.
   COLLEGAMENTI: usa parseShoppingItem(), classifyFood(),
   saveFoodCollections() e updateShoppingCount(). */
function addShoppingItems(message) {
    const cleanMessage = message
        .replace(
            /^(aggiungi|metti|compra|vorrei|mi serve|devo comprare)\s+/i,
            "",
        )
        .trim();
    // GESTIONE QUANTITÀ: protegge la virgola dei decimali (es. 1,5 kg)
    // prima di separare i diversi alimenti della frase.
    const protectedMessage = cleanMessage.replace(
        /(\d),(\d)/g,
        "$1__DECIMAL_COMMA__$2",
    );
    const parsedItems = protectedMessage
        .split(/,\s*|;\s*|\s+e\s+/i)
        .map((item) => item.replaceAll("__DECIMAL_COMMA__", ","))
        .map((item) => item.trim())
        .filter(Boolean)
        .map(parseShoppingItem);

    parsedItems.forEach(({ name, qty }) => {
        shoppingList.push({
            id: Date.now() + shoppingList.length,
            name,
            qty,
            category: classifyFood(name),
        });
    });

    saveFoodCollections();
    updateShoppingCount();

    return parsedItems;
}

/* COSA FA: apre nella conversazione un riepilogo dell'inventario.
   COLLEGAMENTI: crea il fumetto con appendBotMessage() e delega le righe
   dei prodotti ad attachPantryContents(). */
function showPantryInChat() {
    pendingChatAction = null;
    const bubble = appendBotMessage(
        `In dispensa e in frigo risultano ${pantryItems.length} alimenti registrati:`,
        { type: "pantry" },
    );
    attachPantryContents(bubble);
}

/* COSA FA: aggiunge al fumetto nome, posizione e quantità degli alimenti.
   COLLEGAMENTI: legge pantryItems e collega il pulsante finale a
   openPantryModal("alimenti") per aprire l'inventario completo. */
function attachPantryContents(bubble) {
    const list = document.createElement("div");

    list.className = "chat-pantry-list";
    pantryItems.forEach((item) => {
        const row = document.createElement("div");
        const name = document.createElement("span");
        const quantity = document.createElement("span");

        row.className = "chat-pantry-item";
        name.textContent = item.name;
        quantity.textContent = `${item.category} · ${item.qty}`;
        row.append(name, quantity);
        list.appendChild(row);
    });
    bubble.appendChild(list);

    const actions = document.createElement("div");
    const openButton = document.createElement("button");
    actions.className = "chat-actions";
    openButton.className = "chat-action-button";
    openButton.type = "button";
    openButton.innerHTML =
        '<i class="fa-solid fa-up-right-from-square"></i><span>Apri inventario completo</span>';
    openButton.addEventListener("click", () => openPantryModal("alimenti"));
    actions.appendChild(openButton);
    bubble.appendChild(actions);

    document.getElementById("chatMessages").scrollTop =
        document.getElementById("chatMessages").scrollHeight;
}

/* COSA FA: gestisce uno dei due pulsanti suggeriti dal bot.
   COLLEGAMENTI: "shopping" richiama startShoppingList(); l'altra scelta
   richiama showPantryInChat(). In entrambi i casi registra il testo utente. */
function handleChatChoice(type) {
    if (type === "shopping") {
        appendChatMessage("user", "Voglio scrivere una lista della spesa.");
        startShoppingList();
        return;
    }

    appendChatMessage("user", "Fammi vedere cosa ho in dispensa.");
    showPantryInChat();
}

/* COSA FA: converte lo storico locale nel formato role/content dell'API.
   COLLEGAMENTI: requestAiResponse() inserisce il risultato nel body inviato
   a POST /api/chat, gestita dal file server.js. */
function getApiConversationMessages() {
    const activeChat = readStoredChats().find(
        (chat) => chat.id === activeChatId,
    );
    if (!activeChat) return [];

    return activeChat.messages
        .filter(
            (message) =>
                ["user", "bot"].includes(message.sender) &&
                typeof message.text === "string" &&
                message.text.trim(),
        )
        .map((message) => ({
            role: message.sender === "user" ? "user" : "assistant",
            content: message.text,
        }));
}

/* COSA FA: invia conversazione, inventario e spesa al backend Node.
   COLLEGAMENTI: chiama la rotta /api/chat di server.js; il server aggiunge
   chiave e system prompt, contatta OpenRouter e restituisce data.reply. */
async function requestAiResponse() {
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            messages: getApiConversationMessages(),
            context: {
                pantry: pantryItems.map(
                    ({ name, qty, category, place, expiryDate }) => ({
                        name,
                        qty,
                        category,
                        place,
                        expiryDate: expiryDate || null,
                    }),
                ),
                shopping: shoppingList.map(({ name, qty, category }) => ({
                    name,
                    qty,
                    category,
                })),
            },
        }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || "Impossibile contattare FrigoBot.");
    }
    return data.reply;
}

/* COSA FA: mostra l'attesa, blocca temporaneamente l'input e chiede la risposta.
   COLLEGAMENTI: usa requestAiResponse(); aggiorna .chat-bubble e salva la
   risposta con recordChatMessage(), oppure mostra lo stile CSS is-error. */
async function askAiAssistant() {
    const input = document.getElementById("userPromptInput");
    const sendButton = document.querySelector(".send-button");
    const loadingBubble = appendBotMessage("Sto pensando…", {
        persist: false,
    });

    isAwaitingAiResponse = true;
    loadingBubble.classList.add("is-loading");
    input.disabled = true;
    if (sendButton) sendButton.disabled = true;

    try {
        const reply = await requestAiResponse();
        loadingBubble.classList.remove("is-loading");
        loadingBubble.textContent = reply;
        recordChatMessage("bot", reply);
    } catch (error) {
        loadingBubble.classList.remove("is-loading");
        loadingBubble.classList.add("is-error");
        loadingBubble.textContent = error.message;
    } finally {
        isAwaitingAiResponse = false;
        input.disabled = false;
        if (sendButton) sendButton.disabled = false;
        input.focus();
    }
}

/* COSA FA: decide se il testo è un comando locale oppure una domanda all'AI.
   COLLEGAMENTI: smista verso lista spesa, inventario o askAiAssistant(); è
   richiamata da sendPrompt() e dal messaggio iniziale nell'indirizzo. */
async function respondToPrompt(message) {
    const normalizedMessage = message.toLowerCase();

    if (pendingChatAction === "shopping") {
        const addedItems = addShoppingItems(message);
        pendingChatAction = null;
        document.getElementById("userPromptInput").placeholder =
            "Scrivi un messaggio a FrigoBot...";

        if (addedItems.length > 0) {
            const savedItemsSummary = addedItems
                .map(({ name, qty }) => `${name} (${qty})`)
                .join(", ");
            appendBotMessage(
                `Fatto! Ho salvato nella lista della spesa: ${savedItemsSummary}.`,
            );
        }
        showChatSuggestions();
        return;
    }

    if (
        normalizedMessage.includes("cosa ho") ||
        normalizedMessage.includes("inventario") ||
        normalizedMessage.includes("mostra la dispensa") ||
        normalizedMessage.includes("vedi la dispensa")
    ) {
        showPantryInChat();
        return;
    }

    if (
        normalizedMessage.includes("spesa") ||
        normalizedMessage.includes("comprare") ||
        normalizedMessage.includes("acquistare")
    ) {
        startShoppingList();
        return;
    }

    await askAiAssistant();
}

/* COSA FA: controlla che i tre elementi essenziali della chat esistano.
   COLLEGAMENTI: protegge initializeChat(), resetChat() e recordChatMessage()
   da errori nel caso in cui lo script venga caricato su una pagina diversa. */
function hasChatInterface() {
    return Boolean(
        document.getElementById("chatConversation") &&
        document.getElementById("chatMessages") &&
        document.getElementById("userPromptInput"),
    );
}

/* COSA FA: legge il campo, mostra il testo dell'utente e avvia la risposta.
   COLLEGAMENTI: è chiamata dal pulsante Invio in index.html; usa
   appendChatMessage() e respondToPrompt(), impedendo invii durante l'attesa. */
async function sendPrompt() {
    const input = document.getElementById("userPromptInput");
    const val = input.value.trim();
    if (!val || isAwaitingAiResponse) return;

    appendChatMessage("user", val);
    input.value = "";
    await respondToPrompt(val);
}

// Supporto tasto Invio
/* COSA FA: permette di inviare il messaggio premendo il tasto Invio.
   COLLEGAMENTI: è richiamata dall'attributo onkeypress di #userPromptInput
   in index.html e, quando e.key è Enter, chiama sendPrompt(). */
function handleKeyPress(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendPrompt();
    }
}

/* COSA FA: svuota soltanto la conversazione mostrata, senza cancellare i dati.
   COLLEGAMENTI: agisce su #chatMessages, #chatConversation e input; viene
   usata prima di caricare o creare una conversazione. */
function clearChatView() {
    const input = document.getElementById("userPromptInput");
    const conversation = document.getElementById("chatConversation");
    const messages = document.getElementById("chatMessages");

    messages.replaceChildren();
    conversation.hidden = true;
    input.value = "";
    input.placeholder = "Scrivi un messaggio a FrigoBot...";
}

/* COSA FA: carica una conversazione salvata e ricostruisce tutti i fumetti.
   COLLEGAMENTI: è chiamata dalla sidebar; usa appendChatMessage() senza
   risalvare i messaggi e riaggancia eventuali pulsanti speciali. */
function loadStoredChat(chatId) {
    const chat = readStoredChats().find((item) => item.id === chatId);
    if (!chat) return;

    activeChatId = chat.id;
    pendingChatAction = chat.pendingAction || null;
    clearChatView();

    chat.messages.forEach((message) => {
        const bubble = appendChatMessage(message.sender, message.text, {
            persist: false,
            type: message.type || "text",
        });

        if (message.type === "suggestions") {
            attachChatSuggestions(bubble);
        } else if (message.type === "pantry") {
            attachPantryContents(bubble);
        }
    });

    if (chat.messages.length === 0) {
        showChatSuggestions();
    }

    if (pendingChatAction === "shopping") {
        document.getElementById("userPromptInput").placeholder =
            "Scrivi gli alimenti da aggiungere alla spesa...";
    }

    renderHomeChatHistory();
    document.getElementById("userPromptInput").focus();
}

/* COSA FA: azzera la vista e crea una nuova chat salvabile.
   COLLEGAMENTI: combina clearChatView(), createStoredChat() e
   showChatSuggestions(); viene chiamata da resetChat() e initializeChat(). */
function startNewStoredChat() {
    pendingChatAction = null;
    clearChatView();
    createStoredChat();
    showChatSuggestions();
    document.getElementById("userPromptInput").focus();
}

/* COSA FA: comando pubblico del pulsante "Nuova Chat" in index.html.
   COLLEGAMENTI: verifica hasChatInterface() e poi richiama
   startNewStoredChat() restando sempre nella stessa index.html. */
function resetChat() {
    if (hasChatInterface()) {
        startNewStoredChat();
    }
}

/* COSA FA: inizializza la chat quando index.html ha terminato il caricamento.
   COLLEGAMENTI: legge gli eventuali parametri URL, recupera localStorage e
   apre la chat richiesta, l'ultima chat oppure una conversazione nuova. */
function initializeChat() {
    if (!hasChatInterface()) return;

    updateShoppingCount();
    const searchParams = new URLSearchParams(window.location.search);
    const initialMessage = searchParams.get("message");
    const requestedChatId = searchParams.get("chat");
    const shouldStartNewChat = searchParams.get("new") === "1";

    if (initialMessage && initialMessage.trim()) {
        createStoredChat();
        appendChatMessage("user", initialMessage.trim());
        respondToPrompt(initialMessage.trim());
        try {
            window.history.replaceState({}, "", window.location.pathname);
        } catch (error) {
            // La rimozione del parametro non è essenziale per la chat.
        }
    } else if (shouldStartNewChat) {
        startNewStoredChat();
        try {
            window.history.replaceState({}, "", window.location.pathname);
        } catch (error) {
            // La rimozione del parametro non è essenziale per la chat.
        }
    } else {
        const chats = readStoredChats().sort(
            (first, second) =>
                new Date(second.updatedAt).getTime() -
                new Date(first.updatedAt).getTime(),
        );

        if (
            requestedChatId &&
            chats.some((chat) => chat.id === requestedChatId)
        ) {
            loadStoredChat(requestedChatId);
        } else if (chats.length > 0) {
            loadStoredChat(chats[0].id);
        } else {
            startNewStoredChat();
        }
    }

    renderHomeChatHistory();
    document.getElementById("userPromptInput").focus();
}

/* COLLEGAMENTI DI AVVIO: DOMContentLoaded parte quando index.html è pronto;
   pageshow ridisegna lo storico anche tornando alla pagina dalla cache. */
document.addEventListener("DOMContentLoaded", initializeChat);
document.addEventListener("DOMContentLoaded", renderHomeChatHistory);
document.addEventListener("DOMContentLoaded", updateShoppingCount);
document.addEventListener("DOMContentLoaded", updateInventoryCounts);
window.addEventListener("pageshow", renderHomeChatHistory);

// Un clic fuori dall'elenco rimuove soltanto i colori di selezione.
// La conversazione resta aperta e continua a essere salvata normalmente.
/* COSA FA: toglie il colore di selezione delle chat cliccando altrove.
   COLLEGAMENTI: modifica isChatHistorySelectionVisible e la classe CSS active;
   non cambia activeChatId e quindi non chiude la conversazione. */
document.addEventListener("click", (event) => {
    const clickedElement = event.target;
    if (
        clickedElement instanceof Element &&
        clickedElement.closest(".home-chat-history-item")
    ) {
        return;
    }

    isChatHistorySelectionVisible = false;
    document
        .querySelectorAll(".home-chat-history-item.active")
        .forEach((item) => item.classList.remove("active"));
});

/* COSA FA: simula graficamente avvio/arresto del microfono.
   COLLEGAMENTI: è chiamata dal pulsante .mic-button in index.html; cambia
   soltanto icona e colore, senza registrare realmente l'audio. */
function toggleMic(btn) {
    const icon = btn.querySelector("i");
    if (icon.classList.contains("fa-microphone")) {
        icon.classList.remove("fa-microphone");
        icon.classList.add("fa-stop");
        btn.style.color = "#ef4444";
    } else {
        icon.classList.add("fa-microphone");
        icon.classList.remove("fa-stop");
        btn.style.color = "#8da6ae";
    }
}

/* COSA FA: sposta la classe CSS active sulla voce di menu cliccata.
   COLLEGAMENTI: riceve l'elemento HTML tramite onclick e influenza lo stile
   definito da .nav-item.active in style.css. */
function activateNav(el) {
    document
        .querySelectorAll(".nav-item")
        .forEach((item) => item.classList.remove("active"));
    el.classList.add("active");
}

/* COSA FA: costruisce e apre il popup Inventario oppure Lista della spesa.
   COLLEGAMENTI: legge pantryItems/shoppingList, scrive in #modalBody e collega
   i pulsanti a inserimento, modifica, eliminazione e trasferimento. */
function openPantryModal(type) {
    const modal = document.getElementById("pantryModal");
    const title = document.getElementById("modalTitle");
    const body = document.getElementById("modalBody");

    const description = document.createElement("p");
    const list = document.createElement("ul");
    const modalToolbar = document.createElement("div");
    const addButton = document.createElement("button");
    description.className = "modal-description";
    list.className = "pantry-item-list";
    modalToolbar.className = "modal-list-toolbar";
    addButton.type = "button";

    if (type === "alimenti") {
        title.innerHTML =
            '<i class="fa-solid fa-boxes-stacked modal-title-icon pantry"></i> Inventario Frigo, Freezer e Dispensa';
        description.textContent =
            "Elenco completo di quantità, posizioni e date di scadenza:";
        addButton.className = "inventory-add-button";
        addButton.innerHTML = '<i class="fa-solid fa-plus"></i> Nuovo alimento';
        addButton.addEventListener("click", () => startAddingPantryItem(list));
        modalToolbar.append(description, addButton);

        // MODIFICA INVENTARIO: aggiunge i pulsanti Modifica ed Elimina a ogni alimento.
        pantryItems.forEach((item) => {
            const row = document.createElement("li");
            const details = document.createElement("div");
            const name = document.createElement("strong");
            const location = document.createElement("div");
            const position = document.createElement("small");
            const expiry = document.createElement("div");
            const expiryIcon = document.createElement("i");
            const controls = document.createElement("div");
            const quantity = document.createElement("span");
            const actions = document.createElement("div");
            const editButton = document.createElement("button");
            const deleteButton = document.createElement("button");

            row.className = "pantry-item-row";
            row.id = `pantry-item-${item.id}`;
            name.textContent = item.name;
            location.className = "pantry-item-location";
            position.className = `food-category ${item.category.toLowerCase()}`;
            position.textContent = item.place;
            location.append("Posizione:", position);
            const expiryInfo = getExpiryInfo(item.expiryDate);
            expiry.className = `pantry-item-expiry ${expiryInfo.status}`;
            expiryIcon.className = "fa-regular fa-calendar";
            expiry.append(expiryIcon, expiryInfo.label);
            controls.className = "pantry-item-controls";
            quantity.className = "pantry-qty-tag";
            quantity.textContent = item.qty;
            actions.className = "inventory-item-actions";
            editButton.className = "inventory-action-button edit";
            editButton.type = "button";
            editButton.title = `Modifica ${item.name} e la sua scadenza`;
            editButton.setAttribute(
                "aria-label",
                `Modifica ${item.name} e la sua scadenza`,
            );
            editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editButton.addEventListener("click", () =>
                startEditingPantryItem(item.id, row),
            );
            deleteButton.className = "inventory-action-button delete";
            deleteButton.type = "button";
            deleteButton.title = `Elimina ${item.name}`;
            deleteButton.setAttribute("aria-label", `Elimina ${item.name}`);
            deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            deleteButton.addEventListener("click", () =>
                deletePantryItem(item.id),
            );
            details.append(name, location, expiry);
            actions.append(editButton, deleteButton);
            controls.append(quantity, actions);
            row.append(details, controls);
            list.appendChild(row);
        });

        if (pantryItems.length === 0) {
            const emptyState = document.createElement("li");
            emptyState.className = "pantry-list-empty";
            emptyState.textContent = "L'inventario è vuoto.";
            list.appendChild(emptyState);
        }
    } else if (type === "spesa") {
        title.innerHTML =
            '<i class="fa-solid fa-cart-shopping modal-title-icon shopping"></i> Lista della Spesa Attiva';
        description.textContent =
            "Spuntando una voce, l'ingrediente verrà caricato automaticamente in dispensa:";
        addButton.className = "inventory-add-button shopping";
        addButton.innerHTML = '<i class="fa-solid fa-plus"></i> Nuovo prodotto';
        addButton.addEventListener("click", () =>
            startAddingShoppingItem(list),
        );
        modalToolbar.append(description, addButton);

        // MODIFICA LISTA SPESA: aggiunge modifica ed eliminazione a ogni voce.
        shoppingList.forEach((item) => {
            const row = document.createElement("li");
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            const details = document.createElement("span");
            const name = document.createElement("span");
            const category = document.createElement("small");
            const controls = document.createElement("div");
            const quantity = document.createElement("span");
            const actions = document.createElement("div");
            const editButton = document.createElement("button");
            const deleteButton = document.createElement("button");

            row.className = "pantry-item-row";
            row.id = `shop-item-${item.id}`;
            label.className = "shopping-item-label";
            checkbox.className = "shopping-checkbox";
            checkbox.type = "checkbox";
            checkbox.addEventListener("change", () =>
                transferToPantry(item.id, checkbox),
            );
            details.className = "shopping-item-details";
            name.textContent = item.name;
            category.className = `food-category ${item.category.toLowerCase()}`;
            category.textContent = item.category;
            controls.className = "shopping-item-controls";
            quantity.className = "pantry-qty-tag";
            quantity.textContent = item.qty;
            actions.className = "inventory-item-actions";
            editButton.className = "inventory-action-button edit";
            editButton.type = "button";
            editButton.title = `Modifica ${item.name}`;
            editButton.setAttribute("aria-label", `Modifica ${item.name}`);
            editButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editButton.addEventListener("click", () =>
                startEditingShoppingItem(item.id, row),
            );
            deleteButton.className = "inventory-action-button delete";
            deleteButton.type = "button";
            deleteButton.title = `Elimina ${item.name}`;
            deleteButton.setAttribute("aria-label", `Elimina ${item.name}`);
            deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            deleteButton.addEventListener("click", () =>
                deleteShoppingItem(item.id),
            );
            details.append(name, category);
            label.append(checkbox, details);
            actions.append(editButton, deleteButton);
            controls.append(quantity, actions);
            row.append(label, controls);
            list.appendChild(row);
        });

        if (shoppingList.length === 0) {
            const emptyState = document.createElement("li");
            emptyState.className = "pantry-list-empty";
            emptyState.textContent = "La lista della spesa è vuota.";
            list.appendChild(emptyState);
        }
    }

    body.replaceChildren(modalToolbar, list);

    modal.classList.add("active");
}

/* COSA FA: mostra un form inline per aggiungere a mano un prodotto alla spesa.
   COLLEGAMENTI: riceve la lista <ul> creata da openPantryModal(), aggiorna
   shoppingList/localStorage e i contatori; non richiede la scadenza. */
function startAddingShoppingItem(list) {
    if (document.getElementById("new-shopping-item")) return;

    const emptyState = list.querySelector(".pantry-list-empty");
    if (emptyState) emptyState.remove();

    const row = document.createElement("li");
    const form = document.createElement("form");
    const nameInput = document.createElement("input");
    const quantityInput = document.createElement("input");
    const actions = document.createElement("div");
    const saveButton = document.createElement("button");
    const cancelButton = document.createElement("button");

    row.id = "new-shopping-item";
    row.className = "pantry-item-row editing";
    form.className = "inventory-add-form shopping-add-form";

    nameInput.className = "inventory-edit-input";
    nameInput.type = "text";
    nameInput.placeholder = "Nome prodotto";
    nameInput.required = true;
    nameInput.setAttribute("aria-label", "Nome del nuovo prodotto");

    quantityInput.className = "inventory-edit-input quantity";
    quantityInput.type = "text";
    quantityInput.placeholder = "Quantità";
    quantityInput.required = true;
    quantityInput.setAttribute("aria-label", "Quantità da acquistare");

    actions.className = "inventory-edit-actions";
    saveButton.className = "inventory-edit-button save";
    saveButton.type = "submit";
    saveButton.innerHTML =
        '<i class="fa-solid fa-check"></i><span>Aggiungi</span>';
    cancelButton.className = "inventory-edit-button cancel";
    cancelButton.type = "button";
    cancelButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    cancelButton.setAttribute("aria-label", "Annulla aggiunta");
    cancelButton.addEventListener("click", () => openPantryModal("spesa"));

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = nameInput.value.trim();
        const quantity = quantityInput.value.trim();
        if (!name || !quantity) return;

        shoppingList.push({
            id: Date.now(),
            name,
            qty: quantity,
            category: classifyFood(name),
        });
        saveFoodCollections();
        updateShoppingCount();
        openPantryModal("spesa");
    });

    actions.append(saveButton, cancelButton);
    form.append(nameInput, quantityInput, actions);
    row.appendChild(form);
    list.prepend(row);
    nameInput.focus();
}

/* COSA FA: mostra un form per aggiungere un alimento senza usare il bot.
   COLLEGAMENTI: riceve la <ul> del popup, aggiorna pantryItems/localStorage e
   i contatori; posizione e scadenza vengono salvate insieme al prodotto. */
function startAddingPantryItem(list) {
    if (document.getElementById("new-pantry-item")) return;

    const emptyState = list.querySelector(".pantry-list-empty");
    if (emptyState) emptyState.remove();

    const row = document.createElement("li");
    const form = document.createElement("form");
    const nameInput = document.createElement("input");
    const quantityInput = document.createElement("input");
    const locationSelect = document.createElement("select");
    const expiryField = document.createElement("label");
    const expiryLabel = document.createElement("span");
    const expiryInput = document.createElement("input");
    const actions = document.createElement("div");
    const saveButton = document.createElement("button");
    const cancelButton = document.createElement("button");

    row.id = "new-pantry-item";
    row.className = "pantry-item-row editing";
    form.className = "inventory-add-form";

    nameInput.className = "inventory-edit-input";
    nameInput.type = "text";
    nameInput.placeholder = "Nome alimento";
    nameInput.required = true;
    nameInput.setAttribute("aria-label", "Nome del nuovo alimento");

    quantityInput.className = "inventory-edit-input quantity";
    quantityInput.type = "text";
    quantityInput.placeholder = "Quantità";
    quantityInput.required = true;
    quantityInput.setAttribute("aria-label", "Quantità del nuovo alimento");

    locationSelect.className = "inventory-edit-input";
    locationSelect.setAttribute("aria-label", "Posizione del nuovo alimento");
    ["Frigo", "Freezer", "Dispensa"].forEach((location) => {
        const option = document.createElement("option");
        option.value = location;
        option.textContent = location;
        locationSelect.appendChild(option);
    });

    expiryField.className = "inventory-expiry-field";
    expiryLabel.textContent = "Scadenza (facoltativa)";
    expiryInput.className = "inventory-edit-input expiry";
    expiryInput.type = "date";
    expiryInput.setAttribute("aria-label", "Data di scadenza");
    expiryField.append(expiryLabel, expiryInput);

    actions.className = "inventory-edit-actions";
    saveButton.className = "inventory-edit-button save";
    saveButton.type = "submit";
    saveButton.innerHTML =
        '<i class="fa-solid fa-check"></i><span>Aggiungi</span>';
    cancelButton.className = "inventory-edit-button cancel";
    cancelButton.type = "button";
    cancelButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    cancelButton.setAttribute("aria-label", "Annulla aggiunta");
    cancelButton.addEventListener("click", () => openPantryModal("alimenti"));

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = nameInput.value.trim();
        const quantity = quantityInput.value.trim();
        const location = locationSelect.value;
        if (!name || !quantity) return;

        pantryItems.push({
            id: Date.now(),
            name,
            qty: quantity,
            category: location,
            place: location,
            expiryDate: expiryInput.value,
        });
        saveFoodCollections();
        updateInventoryCounts();
        openPantryModal("alimenti");
    });

    actions.append(saveButton, cancelButton);
    form.append(nameInput, quantityInput, locationSelect, expiryField, actions);
    row.appendChild(form);
    list.prepend(row);
    nameInput.focus();
}

/* COSA FA: sostituisce temporaneamente una riga della spesa con un editor.
   COLLEGAMENTI: viene richiamata dalla matita creata in openPantryModal();
   al salvataggio aggiorna shoppingList e riapre il popup aggiornato. */
function startEditingShoppingItem(id, row) {
    const item = shoppingList.find((shoppingItem) => shoppingItem.id === id);
    if (!item) return;

    const form = document.createElement("form");
    const nameInput = document.createElement("input");
    const quantityInput = document.createElement("input");
    const actions = document.createElement("div");
    const saveButton = document.createElement("button");
    const cancelButton = document.createElement("button");

    row.classList.add("editing");
    form.className = "inventory-edit-form shopping-add-form";
    nameInput.className = "inventory-edit-input";
    nameInput.type = "text";
    nameInput.value = item.name;
    nameInput.required = true;
    nameInput.setAttribute("aria-label", "Nome alimento nella spesa");
    quantityInput.className = "inventory-edit-input quantity";
    quantityInput.type = "text";
    quantityInput.value = item.qty;
    quantityInput.required = true;
    quantityInput.setAttribute("aria-label", "Quantità da acquistare");
    actions.className = "inventory-edit-actions";
    saveButton.className = "inventory-edit-button save";
    saveButton.type = "submit";
    saveButton.innerHTML =
        '<i class="fa-solid fa-check"></i><span>Salva</span>';
    cancelButton.className = "inventory-edit-button cancel";
    cancelButton.type = "button";
    cancelButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    cancelButton.setAttribute("aria-label", "Annulla modifica");
    cancelButton.addEventListener("click", () => openPantryModal("spesa"));

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const updatedName = nameInput.value.trim();
        const updatedQuantity = quantityInput.value.trim();
        if (!updatedName || !updatedQuantity) return;

        item.name = updatedName;
        item.qty =
            updatedQuantity === "Da definire" && isSpice(updatedName)
                ? "1 barattolino (35 grammi)"
                : updatedQuantity;
        item.category = classifyFood(updatedName);
        saveFoodCollections();
        openPantryModal("spesa");
    });

    actions.append(saveButton, cancelButton);
    form.append(nameInput, quantityInput, actions);
    row.replaceChildren(form);
    nameInput.focus();
    nameInput.select();
}

/* COSA FA: elimina una voce dalla spesa dopo la conferma dell'utente.
   COLLEGAMENTI: è associata al cestino della riga; aggiorna localStorage,
   #shoppingItemCount e il contenuto del popup. */
function deleteShoppingItem(id) {
    const itemIndex = shoppingList.findIndex((item) => item.id === id);
    if (itemIndex === -1) return;

    const item = shoppingList[itemIndex];
    const confirmed = window.confirm(
        `Vuoi eliminare “${item.name}” dalla lista della spesa?`,
    );
    if (!confirmed) return;

    shoppingList.splice(itemIndex, 1);
    saveFoodCollections();
    updateShoppingCount();
    openPantryModal("spesa");
}

/* COSA FA: apre l'editor inline di nome, quantità e data di scadenza.
   COLLEGAMENTI: parte dalla matita dell'inventario; al salvataggio usa
   classifyFood(), saveFoodCollections() e updateInventoryCounts(). */
function startEditingPantryItem(id, row) {
    const item = pantryItems.find((pantryItem) => pantryItem.id === id);
    if (!item) return;

    const form = document.createElement("form");
    const nameInput = document.createElement("input");
    const quantityInput = document.createElement("input");
    const expiryField = document.createElement("label");
    const expiryLabel = document.createElement("span");
    const expiryInput = document.createElement("input");
    const actions = document.createElement("div");
    const saveButton = document.createElement("button");
    const cancelButton = document.createElement("button");

    row.classList.add("editing");
    form.className = "inventory-edit-form";
    nameInput.className = "inventory-edit-input";
    nameInput.type = "text";
    nameInput.value = item.name;
    nameInput.required = true;
    nameInput.setAttribute("aria-label", "Nome alimento");
    quantityInput.className = "inventory-edit-input quantity";
    quantityInput.type = "text";
    quantityInput.value = item.qty;
    quantityInput.required = true;
    quantityInput.setAttribute("aria-label", "Quantità alimento");
    expiryField.className = "inventory-expiry-field";
    expiryLabel.textContent = "Scadenza";
    expiryInput.className = "inventory-edit-input expiry";
    expiryInput.type = "date";
    expiryInput.value = item.expiryDate || "";
    expiryInput.setAttribute("aria-label", "Data di scadenza");
    expiryField.append(expiryLabel, expiryInput);
    actions.className = "inventory-edit-actions";
    saveButton.className = "inventory-edit-button save";
    saveButton.type = "submit";
    saveButton.innerHTML =
        '<i class="fa-solid fa-check"></i><span>Salva</span>';
    cancelButton.className = "inventory-edit-button cancel";
    cancelButton.type = "button";
    cancelButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    cancelButton.setAttribute("aria-label", "Annulla modifica");
    cancelButton.addEventListener("click", () => openPantryModal("alimenti"));

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const updatedName = nameInput.value.trim();
        const updatedQuantity = quantityInput.value.trim();
        if (!updatedName || !updatedQuantity) return;

        const category = classifyFood(updatedName);
        item.name = updatedName;
        item.qty = updatedQuantity;
        item.category = category;
        item.place = category;
        item.expiryDate = expiryInput.value;
        saveFoodCollections();
        updateInventoryCounts();
        openPantryModal("alimenti");
    });

    actions.append(saveButton, cancelButton);
    form.append(nameInput, quantityInput, expiryField, actions);
    row.replaceChildren(form);
    nameInput.focus();
    nameInput.select();
}

/* COSA FA: elimina un alimento dall'inventario dopo una conferma.
   COLLEGAMENTI: è richiamata dal cestino della riga e sincronizza pantryItems,
   localStorage, contatori e popup tramite le rispettive funzioni. */
function deletePantryItem(id) {
    const itemIndex = pantryItems.findIndex((item) => item.id === id);
    if (itemIndex === -1) return;

    const item = pantryItems[itemIndex];
    const confirmed = window.confirm(
        `Vuoi eliminare “${item.name}” dall'inventario?`,
    );
    if (!confirmed) return;

    pantryItems.splice(itemIndex, 1);
    saveFoodCollections();
    updateInventoryCounts();
    openPantryModal("alimenti");
}

/* COSA FA: sposta una voce spuntata dalla spesa all'inventario.
   COLLEGAMENTI: è associata alla checkbox del popup Spesa; modifica entrambi
   gli array, salva i dati, aggiorna i contatori e anima la rimozione della riga. */
function transferToPantry(id, checkbox) {
    const shoppingItemIndex = shoppingList.findIndex((item) => item.id === id);

    if (checkbox.checked && shoppingItemIndex !== -1) {
        const [shoppingItem] = shoppingList.splice(shoppingItemIndex, 1);
        const category =
            shoppingItem.category || classifyFood(shoppingItem.name);
        pantryItems.push({
            id: Date.now() + pantryItems.length,
            name: shoppingItem.name,
            qty: shoppingItem.qty,
            category,
            place: category,
            expiryDate: "",
        });
        checkbox.disabled = true;
        const elem = document.getElementById(`shop-item-${id}`);
        if (elem) {
            elem.classList.add("is-complete");
            const list = elem.parentElement;
            window.setTimeout(() => {
                elem.remove();

                if (list && shoppingList.length === 0) {
                    const emptyState = document.createElement("li");
                    emptyState.className = "pantry-list-empty";
                    emptyState.textContent = "La lista della spesa è vuota.";
                    list.appendChild(emptyState);
                }
            }, 220);
        }
        saveFoodCollections();
        updateShoppingCount();
        updateInventoryCounts();
    }
}

/* COSA FA: chiude il popup rimuovendo la classe CSS active.
   COLLEGAMENTI: è richiamata dal pulsante X presente nel modal di index.html. */
function closeModal() {
    document.getElementById("pantryModal").classList.remove("active");
}

/* COSA FA: chiude il popup solo se si clicca sullo sfondo esterno.
   COLLEGAMENTI: è richiamata dall'onclick di #pantryModal; evita che un clic
   dentro .modal-box chiuda accidentalmente la finestra. */
function closeModalOnBackdrop(e) {
    if (e.target.id === "pantryModal") {
        closeModal();
    }
}
