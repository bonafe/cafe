import { ReactiveComponent } from '../vendor/ultima/reactive_component.js';
import { CafeItem } from './cafe-item.js';

/**
 * Vertical, full-screen feed (Shorts/Reels style). State: {items: [...]} — see cafe-item.js.
 * Paging is native CSS scroll-snap; this class only decides which slide is active, keeps the
 * address bar on "#/<id>" so a slide can be shared, and handles the keyboard on desktop.
 */
export class CafeFeed extends ReactiveComponent {

    //Bump together with CafeItem.VERSION and data-template-version in cafe-item.html when changing
    //them: the debug stamp shows all three, so a stale cached file is visible on a phone.
    static VERSION = '0.2.0';

    #observer;
    #muted = true;
    #stampRefreshed = false;

    constructor() {
        super(
            {
                templateUrl: './cafe-feed.html',
                shadowDom: true
            },
            import.meta.url
        );
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this.#onKey);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this.#onKey);
        this.#observer?.disconnect();
    }

    render() {
        super.render();
        if (!this.loaded) {
            return;
        }
        this.#watchSlides();
        this.#showStamp();
    }

    get slides() {
        return Array.from(this.rootNode.querySelectorAll('cafe-item'));
    }

    next() { this.#page(1); }

    previous() { this.#page(-1); }

    toggleSound() {
        this.#muted = !this.#muted;
        this.refs.sound.textContent = this.#muted ? '🔇' : '🔊';
        this.slides.forEach(slide => slide.setMuted(this.#muted));
    }

    #page(direction) {
        const scroller = this.refs.scroller;
        scroller.scrollBy({ top: direction * scroller.clientHeight, behavior: 'smooth' });
    }

    #onKey = (event) => {
        if (event.key === 'ArrowDown' || event.key === 'j') {
            event.preventDefault();
            this.next();
        } else if (event.key === 'ArrowUp' || event.key === 'k') {
            event.preventDefault();
            this.previous();
        }
    };

    #watchSlides() {
        const slides = this.slides;
        if (slides.length === 0) {
            return;
        }

        if (!this.#observer) {
            //A slide is "active" once most of it is on screen; snapping guarantees only one is
            this.#observer = new IntersectionObserver(entries => {
                const visible = entries.find(entry => entry.isIntersecting);
                if (visible) {
                    this.#activate(visible.target);
                }
            }, { root: this.refs.scroller, threshold: 0.6 });
        }

        slides.forEach(slide => this.#observer.observe(slide));

        const wanted = location.hash.startsWith('#/') ? decodeURIComponent(location.hash.slice(2)) : null;
        const start = slides.find(slide => slide.state?.id === wanted);
        if (start) {
            start.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
    }

    //Version stamp for testing on a phone. Shown on localhost, private-network addresses and with
    //?debug in the URL; never on the public site.
    #showStamp() {
        const host = location.hostname;
        const isLocal = host === 'localhost' || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.)/.test(host) || host.endsWith('.local');
        const stamp = this.refs.stamp;
        if (!stamp || !(isLocal || new URLSearchParams(location.search).has('debug'))) {
            return;
        }
        const item = this.slides[0];
        if (item && !this.#stampRefreshed) {
            //The item's template is still loading on the first render: refresh once it is in
            this.#stampRefreshed = true;
            item.whenLoaded().then(() => this.#showStamp());
        }
        stamp.textContent = `feed ${CafeFeed.VERSION} · item ${CafeItem.VERSION} · tpl ${item?.templateVersion ?? '?'}`;
        stamp.hidden = false;
    }

    #activate(active) {
        const slides = this.slides;
        const index = slides.indexOf(active);

        slides.forEach((slide, i) => {
            slide.setMuted(this.#muted);
            //Loads one slide behind and two ahead: people mostly move forward, and a slide that
            //is still fetching when it arrives is what shows up as a flash
            slide.setNear(i - index >= -1 && i - index <= 2);
            slide.setActive(slide === active);
        });

        this.#showStamp();

        const id = active.state?.id;
        if (id) {
            history.replaceState(null, '', `#/${encodeURIComponent(id)}`);
        }
    }
}

window.customElements.define('cafe-feed', CafeFeed);
