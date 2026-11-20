/**
 * On-demand native <dialog> lightbox for redacted TCS award certificates.
 * Loads WebP images strictly when clicked (0 KB initial page payload).
 */

function initCertificateLightbox(): void {
  const dialog = document.getElementById("cert-modal") as HTMLDialogElement | null;
  const img = document.getElementById("cert-modal-img") as HTMLImageElement | null;
  const titleEl = document.getElementById("cert-modal-title") as HTMLElement | null;
  const closeBtn = document.getElementById("cert-modal-close") as HTMLButtonElement | null;

  if (!dialog || !img || !titleEl || !closeBtn) {
    return;
  }

  function closeModal(): void {
    if (!dialog || !img) return;
    dialog.close();
    img.removeAttribute("src");
    img.alt = "";
  }

  document.querySelectorAll<HTMLButtonElement>("[data-cert-src]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-cert-src");
      const title = btn.getAttribute("data-cert-title") ?? "Certificate Preview";
      if (!src) return;

      titleEl.textContent = title;
      img.alt = title;
      img.src = src;
      dialog.showModal();
    });
  });

  closeBtn.addEventListener("click", () => {
    closeModal();
  });

  dialog.addEventListener("click", (event: MouseEvent) => {
    if (event.target === dialog) {
      closeModal();
    }
  });

  dialog.addEventListener("cancel", () => {
    img.removeAttribute("src");
    img.alt = "";
  });
}

initCertificateLightbox();
