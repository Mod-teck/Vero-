document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const sizeInput = document.getElementById("sizeInput");
  const quantityInput = document.getElementById("quantityInput");
  const addSizeBtn = document.getElementById("addSizeBtn");
  const sizesContainer = document.getElementById("sizesContainer");
  const sizesHidden = document.getElementById("sizesHidden");

  // Verify elements exist to prevent errors on other pages
  if (!sizeInput || !addSizeBtn || !sizesContainer || !sizesHidden) return;

  /**
   * Each entry: { id: string, size: string, quantity: number }
   * `id` is a stable unique key — never shifts on splice.
   */
  let sizes = [];

  /** Generate a unique ID for each size entry */
  const generateId = () =>
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);

  /** Add a new size entry */
  const addSize = () => {
    const value = sizeInput.value.trim();
    if (!value) return;

    const quantity = Math.max(1, parseInt(quantityInput.value, 10) || 1);
    sizes.push({ id: generateId(), size: value, quantity: quantity });

    sizeInput.value = "";
    quantityInput.value = "1";
    sizeInput.focus();

    renderSizes();
  };

  addSizeBtn.addEventListener("click", addSize);

  /**
   * Remove a size entry by its stable unique ID (not by index).
   * This fixes the bug where splice shifted indices and deleted wrong items.
   */
  const removeSize = (id) => {
    sizes = sizes.filter((entry) => entry.id !== id);
    renderSizes();
  };

  /** Render all size tags in the container */
  function renderSizes() {
    sizesContainer.innerHTML = "";

    sizes.forEach((entry) => {
      const tag = document.createElement("div");
      tag.className = "size-tag";
      tag.setAttribute("data-id", entry.id);

      const label = document.createElement("span");
      label.textContent = `${entry.size} × ${entry.quantity}`;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "size-tag-remove";
      removeBtn.textContent = "×";
      removeBtn.setAttribute("data-id", entry.id);
      removeBtn.addEventListener("click", function () {
        removeSize(this.getAttribute("data-id"));
      });

      tag.appendChild(label);
      tag.appendChild(removeBtn);
      sizesContainer.appendChild(tag);
    });

    // Only update hidden input — server receives [{size, quantity}]
    sizesHidden.value = JSON.stringify(
      sizes.map((entry) => ({ size: entry.size, quantity: entry.quantity })),
    );
  }

  // Debounced Enter-key handler to prevent double-adds on rapid presses
  let enterDebounceTimer = null;
  sizeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (enterDebounceTimer) return; // still within debounce window
      addSize();
      enterDebounceTimer = setTimeout(() => {
        enterDebounceTimer = null;
      }, 300);
    }
  });

  // Optional frontend validation for images total size
  const addProductForm = document.getElementById("addProductForm");
  if (addProductForm) {
    addProductForm.addEventListener("submit", (e) => {
      const files = document.getElementById("images").files;
      let totalSize = 0;
      for (const file of files) totalSize += file.size;

      if (totalSize > 5 * 1024 * 1024) {
        e.preventDefault();
        alert(
          "مجموع كل الصور يجب ألا يتجاوز 5 ميجابايت (Total images size must not exceed 5MB)",
        );
      }
    });
  }
});
