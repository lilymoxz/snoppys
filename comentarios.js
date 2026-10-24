
const stars = document.querySelectorAll(".star-button");
let rating = 0;

stars.forEach((star) => {
    star.addEventListener("click", () => {
        rating = Number(star.dataset.rating);

        stars.forEach((item) => {
            if (Number(item.dataset.rating) <= rating) {
                item.style.color = "#FFD700";
            } else {
                item.style.color = "#D8D0C2";
            }
        });
    });
});

const commentForm = document.getElementById("commentForm");
const userName = document.getElementById("userName");
const userComment = document.getElementById("userComment");
const starPicker = document.getElementById("starPicker");
const formError = document.getElementById("formError");
const commentsList = document.getElementById("commentsList");
const commentCount = document.getElementById("commentCount");
const emptyState = document.getElementById("emptyState");
const submitButton = document.getElementById("submitButton");

const STORAGE_KEY = "snoopyClubComments";


let editingId = null;
let comments = loadComments();

function loadComments() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("No se pudieron leer los comentarios:", error);
        return [];
    }
}

function saveComments() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
        return true;
    } catch (error) {
        console.error("No se pudieron guardar los comentarios:", error);
        formError.textContent =
            "No se pudo guardar. Comprueba el almacenamiento del navegador.";
        return false;
    }
}

function paintStars(value) {
    starPicker.querySelectorAll(".star-button").forEach((star) => {
        const selected = Number(star.dataset.rating) <= value;
        star.classList.toggle("selected", selected);
        star.style.color = selected ? "#e8b522" : "#d8d0c2";
        star.setAttribute("aria-pressed", String(
            Number(star.dataset.rating) === value
        ));
    });
}

starPicker.querySelectorAll(".star-button").forEach((star) => {
    star.addEventListener("click", () => {
        rating = Number(star.dataset.rating);
        paintStars(rating);
        formError.textContent = "";
    });

    star.addEventListener("mouseenter", () => {
        paintStars(Number(star.dataset.rating));
    });
});

starPicker.addEventListener("mouseleave", () => {
    paintStars(rating);
});

function formatDate(dateValue) {
    return new Date(dateValue).toLocaleDateString("es", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function renderComments() {
    commentsList.replaceChildren();

    commentCount.textContent =
        `${comments.length} ${comments.length === 1 ? "comentario" : "comentarios"}`;

    emptyState.hidden = comments.length > 0;

    comments.forEach((comment) => {
        const card = createElement("article", "comment-card");
        const top = createElement("div", "comment-top");
        const author = createElement("div", "comment-author");
        const avatar = createElement(
            "div",
            "avatar",
            (comment.name || "?").trim().charAt(0).toUpperCase()
        );

        avatar.setAttribute("aria-hidden", "true");

        const details = createElement("div", "author-details");
        details.append(
            createElement("h3", "", comment.name),
            createElement("span", "comment-date", formatDate(comment.date))
        );

        author.append(avatar, details);

        const menuWrap = createElement("div", "comment-menu-wrap");
        const menuButton = createElement("button", "menu-dots", "⋯");
        menuButton.type = "button";
        menuButton.setAttribute("aria-label", "Opciones del comentario");
        menuButton.setAttribute("aria-expanded", "false");

        const menu = createElement("div", "comment-menu");
        menu.hidden = true;

        const editButton = createElement("button", "", "Editar comentario");
        editButton.type = "button";

        const deleteButton = createElement(
            "button",
            "delete-action",
            "Eliminar comentario"
        );
        deleteButton.type = "button";

        menuButton.addEventListener("click", () => {
            menu.hidden = !menu.hidden;
            menuButton.setAttribute("aria-expanded", String(!menu.hidden));
        });

        editButton.addEventListener("click", () => {
            const newName = prompt("Editar tu nombre:", comment.name);
            if (newName === null) return;

            const newText = prompt("Editar tu comentario:", comment.text);
            if (newText === null) return;

            if (!newName.trim() || !newText.trim()) {
                alert("El nombre y el comentario no pueden estar vacíos.");
                return;
            }

            const previousComments = comments;
            comments = comments.map((item) =>
                item.id === comment.id
                    ? {
                        ...item,
                        name: newName.trim().slice(0, 50),
                        text: newText.trim().slice(0, 1000),
                        edited: true
                    }
                    : item
            );

            if (saveComments()) {
                renderComments();
            } else {
                comments = previousComments;
            }
        });

        deleteButton.addEventListener("click", () => {
            if (!confirm("¿Seguro que quieres eliminar este comentario?")) {
                return;
            }

            const previousComments = comments;
            comments = comments.filter((item) => item.id !== comment.id);

            if (saveComments()) {
                renderComments();
            } else {
                comments = previousComments;
            }
        });

        menu.append(editButton, deleteButton);
        menuWrap.append(menuButton, menu);
        top.append(author, menuWrap);

        const stars = createElement(
            "div",
            "comment-stars",
            "★".repeat(comment.rating) + "☆".repeat(5 - comment.rating)
        );
        stars.setAttribute("aria-label", `${comment.rating} de 5 estrellas`);

        const text = createElement("p", "comment-text", comment.text);

        card.append(top, stars, text);

        if (comment.edited) {
            card.append(
                createElement("p", "comment-edited", "Comentario editado")
            );
        }

        commentsList.append(card);
    });
}

commentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formError.textContent = "";

    const name = userName.value.trim();
    const text = userComment.value.trim();

    if (!name || !text) {
        formError.textContent = "Escribe tu nombre y tu comentario.";
        return;
    }

    if (rating < 1 || rating > 5) {
        formError.textContent = "Selecciona una valoración de 1 a 5 estrellas.";
        return;
    }

    const previousComments = comments;

    if (editingId !== null) {
        comments = comments.map((item) =>
            item.id === editingId
                ? {
                    ...item,
                    name: name.slice(0, 50),
                    text: text.slice(0, 1000),
                    rating,
                    edited: true
                }
                : item
        );
    } else {
        comments.unshift({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: name.slice(0, 50),
            text: text.slice(0, 1000),
            rating,
            date: new Date().toISOString(),
            edited: false
        });
    }

    if (!saveComments()) {
        comments = previousComments;
        return;
    }

    commentForm.reset();
    rating = 0;
    editingId = null;
    paintStars(0);
    submitButton.textContent = "Guardar comentario ↗";
    renderComments();
});

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("show");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

paintStars(0);
renderComments();
