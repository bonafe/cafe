import { ReactiveComponent } from '../vendor/ultima/reactive_component.js';

/**
 * One full-screen slide of the feed. State (set by <cafe-feed> from feed.json):
 *   {id, type: "video" | "image" | "link", src, poster, title, text, bg, cta_label, cta_url, download_name}
 *
 * Playback is driven imperatively by the feed (setActive/setNear/setMuted) instead of through
 * state: it changes on every scroll, and writing it into state would re-render the whole feed.
 */
export class CafeItem extends ReactiveComponent {

    static VERSION = '0.2.0';

    #active = false;
    #near = false;
    #muted = true;
    #wired = new WeakSet();
    #scrubbing = false;

    constructor() {
        super(
            {
                templateUrl: './cafe-item.html',
                shadowDom: true
            },
            import.meta.url
        );
    }

    //Version declared by the template file this instance actually loaded (see the debug stamp)
    get templateVersion() {
        return this.rootNode.querySelector('[data-template-version]')?.dataset.templateVersion;
    }

    computed() {
        const type = this.state?.type;
        return {
            isVideo: type === 'video',
            isImage: type === 'image'
        };
    }

    render() {
        super.render();
        this.#applyPlayback();
    }

    setActive(active) {
        this.#active = active;
        this.#applyPlayback();
    }

    //Only slides next to the visible one hold a video source; the others release it
    setNear(near) {
        this.#near = near;
        this.#applyPlayback();
    }

    setMuted(muted) {
        this.#muted = muted;
        this.#applyPlayback();
    }

    toggle() {
        const video = this.refs.video;
        if (!video) {
            return;
        }
        if (video.paused) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    }

    #applyPlayback() {
        const video = this.refs?.video;
        if (!video) {
            return;
        }

        video.muted = this.#muted;
        this.#wire(video);

        if (this.#near && !video.hasAttribute('src')) {
            video.src = this.state.src;
        } else if (!this.#near && video.hasAttribute('src')) {
            video.pause();
            video.removeAttribute('src');
            video.load();
            this.classList.remove('live');
        }

        if (this.#active) {
            video.play().catch(() => {});
        } else if (video.hasAttribute('src')) {
            video.pause();
            video.currentTime = 0;
            this.classList.remove('live');
        }
    }

    #wire(video) {
        if (this.#wired.has(video)) {
            return;
        }
        this.#wired.add(video);

        const bar = this.refs.bar;
        video.addEventListener('timeupdate', () => {
            if (bar && video.duration) {
                bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
            }
        });
        video.addEventListener('pause', () => this.classList.toggle('paused', this.#active && !video.ended && !this.#scrubbing));
        video.addEventListener('play', () => this.classList.remove('paused'));
        video.addEventListener('playing', () => this.classList.add('live'));

        this.#wireScrub(video);
    }

    //Tap or drag on the bar to seek; the video resumes on release if it was playing
    #wireScrub(video) {
        const scrub = this.refs.scrub;
        let wasPlaying = false;

        const seek = (event) => {
            if (!video.duration) {
                return;
            }
            const rect = scrub.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
            video.currentTime = ratio * video.duration;
            this.refs.bar.style.transform = `scaleX(${ratio})`;
        };

        scrub.addEventListener('pointerdown', event => {
            scrub.setPointerCapture(event.pointerId);
            this.#scrubbing = true;
            this.classList.add('scrubbing');
            wasPlaying = !video.paused;
            video.pause();
            seek(event);
        });
        scrub.addEventListener('pointermove', event => {
            if (this.#scrubbing) {
                seek(event);
            }
        });
        const end = () => {
            if (!this.#scrubbing) {
                return;
            }
            this.#scrubbing = false;
            this.classList.remove('scrubbing');
            if (wasPlaying) {
                video.play().catch(() => {});
            }
        };
        scrub.addEventListener('pointerup', end);
        scrub.addEventListener('pointercancel', end);
    }
}

window.customElements.define('cafe-item', CafeItem);
