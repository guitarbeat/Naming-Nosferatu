export class LightBoxImage extends HTMLElement {
	image: HTMLImageElement | null = null;
	toggle: HTMLButtonElement | null = null;

	get dialog(): HTMLDialogElement {
		const attr = this.getAttribute("dialog-id");
		const el = document.getElementById(attr || "");

		if (!attr) {
			throw new Error("<lightbox-image> missing dialog-id attribute");
		}

		if (!el) {
			throw new Error(`Cannot find targeted <dialog> element: ${attr}`);
		}

		return el as HTMLDialogElement;
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		this.image = this.querySelector("img");
		if (!this.image) {
			// It might be nested in a picture or div, try to find it
			// But the provided code used querySelector("img"), so we stick to that.
			// It finds the first img descendant.
			console.warn("<lightbox-image> requires an <img> child");
		}

		if (this.shadowRoot && this.image) {
			this.shadowRoot.innerHTML = this.setupToggle();
			this.toggle = this.shadowRoot.querySelector("button");
			this.toggle?.addEventListener("click", this);
		}
	}

	disconnectedCallback() {
		this.toggle?.removeEventListener("click", this);
		this.cleanupDialogListeners();
	}

	setupToggle() {
		// Use inline styles from provided code
		// Added cursor: zoom-in
		return `
      <style>
        button {
          all: unset;
          outline: revert;
          display: grid;
          grid-template-areas: "stack";
          cursor: zoom-in;
          width: 100%;
          height: 100%;
        }
        button > * {
          grid-area: stack;
        }
        img {
          max-width: 100%;
          height: auto;
          visibility: hidden;
        }
      </style>
      <button aria-label="Open lightbox">
        ${this.image?.outerHTML || ""}
        <div>
          <slot></slot>
        </div>
      </button>
    `;
	}

	handleEvent(e: Event) {
		if (e.type === "click") {
			this._handleClick(e as MouseEvent);
		} else if (e.type === "cancel") {
			this._handleCancel(e);
		}
	}

	_handleClick(e: MouseEvent) {
		if (e.currentTarget === this.toggle) {
			e.stopPropagation();
			this.moveImage(() => this.moveImageToTarget());
		}
		if (e.currentTarget === this.dialog) {
			if (this.dialog.contains(this.image)) {
				e.preventDefault(); // Prevent default dialog behavior if any
				this.moveImage(() => this.moveImageBack());
			}
		}
	}

	_handleCancel(e: Event) {
		if (this.dialog.contains(this.image)) {
			e.preventDefault(); // Prevent default close, we handle it with animation
			this.moveImage(() => this.moveImageBack());
		}
	}

	moveImage(fn: () => void) {
		if ("startViewTransition" in document) {
			this.handleViewTransition(fn);
		} else {
			fn();
		}
	}

	async handleViewTransition(fn: () => void) {
		if (this.image) {
			this.image.style.viewTransitionName = "active-lightbox-image";

			const transition = document.startViewTransition(() => fn());
			try {
				await transition.finished;
			} finally {
				this.image.style.removeProperty("view-transition-name");
			}
		} else {
			fn();
		}
	}

	moveImageToTarget() {
		if (this.image) {
			this.dialog.append(this.image);
			this.dialog.showModal();
			this.setupDialogListeners();
		}
	}

	moveImageBack() {
		if (this.image) {
			this.append(this.image);
			this.dialog.close();
			this.cleanupDialogListeners();
		}
	}

	setupDialogListeners() {
		this.dialog.addEventListener("click", this);
		this.dialog.addEventListener("cancel", this);
	}

	cleanupDialogListeners() {
		try {
			this.dialog.removeEventListener("click", this);
			this.dialog.removeEventListener("cancel", this);
		} catch (_e) {
			// ignore
		}
	}
}

if (!customElements.get("lightbox-image")) {
	customElements.define("lightbox-image", LightBoxImage);
}
