class BB {
  #PLAY_BTN;
  #GIF_1;
  #GIF_2;

  constructor(selector, properties = null) {
    // prettier-ignore
    this.#PLAY_BTN = '<svg id="bb-play-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path fill="#fff" d="M0 0h50v50H0z"/><path d="m43.301 25-21.65 12.5L0 50V0l21.65 12.5z"/></svg>';
    this.#GIF_1 = 'https://media.giphy.com/media/1lALzcU4pUHWWMGTlK/giphy.gif';
    this.#GIF_2 = 'https://i.pinimg.com/originals/fe/ae/ea/feaeea33c22a7a7195e430a9bfe538c5.gif';

    properties = properties || {};

    // provided properties
    this._DEBUG = properties.debug || false;

    this._WRAPPER_SELECTOR = selector;
    this._AUTOPLAY = properties.autoplay || false;
    this._CONTROLS = properties.controls || false;
    this._LOADING_IMG_SRC = properties.loadingImgSrc || this.#GIF_2;
    this._LOADING_TEXT = properties.loadingText || 'loading ..'; // TODO

    // default properties
    this._SELECTORS = {
      BBContainer: '#bb-container',
      BBVideo: '#bb-video',
      BBLoadingImg: '#bb-loading-img',
      BBLoadingText: '#bb-loading-text',
      BBPlayBtnContainer: '#bb-play-btn-container',
      BBPlayBtn: '#bb-play-btn',
      BBErrBtn: '#bb-err-btn',
    };

    this._currentState = null;

    // this.loadSources();
    this.create();
    this.setup();
    this.renderState(this.STATES.INITIAL);

    this.bindEvents();
  }

  loadSources() {
    // TODO: load Hls.js here instead of manual html tag
    // this.loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest', callback);
  }

  setup() {
    this.STATES = {
      INITIAL: [
        { selector: this._SELECTORS.BBVideo, classList: ['bb-hidden', 'bb-no-pointer'] },
        { selector: this._SELECTORS.BBLoadingImg, classList: ['bb-hidden'] },
        { selector: this._SELECTORS.BBLoadingText, classList: ['bb-hidden'] },
        { selector: this._SELECTORS.BBPlayBtn, classList: ['bb-hidden'] },
        // { selector: this._SELECTORS.BBErrBtn, classList: ['bb-hidden'] },
      ],
      LOADING: [
        { selector: this._SELECTORS.BBVideo, classList: ['bb-no-pointer'] },
        { selector: this._SELECTORS.BBLoadingImg, classList: [] },
        { selector: this._SELECTORS.BBLoadingText, classList: [] },
        { selector: this._SELECTORS.BBPlayBtn, classList: ['bb-hidden'] },
        // { selector: this._SELECTORS.BBErrBtn, classList: ['bb-hidden'] },
      ],
      READY: [
        { selector: this._SELECTORS.BBVideo, classList: ['bb-no-pointer'] },
        { selector: this._SELECTORS.BBLoadingImg, classList: ['bb-dimmed'] },
        { selector: this._SELECTORS.BBLoadingText, classList: ['bb-hidden'] },
        { selector: this._SELECTORS.BBPlayBtn, classList: [] },
        // { selector: this._SELECTORS.BBErrBtn, classList: ['bb-hidden'] },
      ],
      PLAYING: [
        { selector: this._SELECTORS.BBLoadingImg, classList: ['bb-hidden'] },
        { selector: this._SELECTORS.BBLoadingText, classList: ['bb-hidden'] },
        { selector: this._SELECTORS.BBPlayBtn, classList: ['bb-hidden'] },
        // { selector: this._SELECTORS.BBErrBtn, classList: ['bb-hidden'] },
      ],
      PAUSED: [
        { selector: this._SELECTORS.BBVideo, classList: ['bb-no-pointer', 'bb-dimmed', 'bb-no-controls'] },
        { selector: this._SELECTORS.BBLoadingImg, classList: ['bb-hidden'] },
        { selector: this._SELECTORS.BBLoadingText, classList: ['bb-hidden'] },
        { selector: this._SELECTORS.BBPlayBtn, classList: [] },
        // { selector: this._SELECTORS.BBErrBtn, classList: ['bb-hidden'] },
      ],
      ERROR: [
        { selector: this._SELECTORS.BBVideo, classList: ['bb-no-pointer'] },
        { selector: this._SELECTORS.BBLoadingImg, classList: ['bb-hidden'] },
        { selector: this._SELECTORS.BBLoadingText, classList: ['bb-hidden'] },
        { selector: this._SELECTORS.BBPlayBtn, classList: ['bb-hidden'] },
        // { selector: this._SELECTORS.BBErrBtn, classList: [] },
      ],
    };
  }

  loadScript(url, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    script.onload = callback;

    // fire the loading
    document.head.appendChild(script);
  }

  forceLoadingAnim() {
    this.renderState(this.STATES.LOADING);
  }

  load(videoUrl) {
    this.renderState(this.STATES.LOADING);

    if (this._DEBUG) console.log('video loading : ' + videoUrl);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(this.DOMEl(this._SELECTORS.BBVideo));
    } else if (this.DOMEl(this._SELECTORS.BBVideo).canPlayType('application/vnd.apple.mpegurl')) {
      this.DOMEl(this._SELECTORS.BBVideo).src = videoUrl;
    }

    this.bindEvents();
  }

  play() {
    this.renderState(this.STATES.PLAYING);
    this.DOMEl(this._SELECTORS.BBVideo).play();
  }

  pause() {
    this.renderState(this.STATES.PAUSED);
    this.DOMEl(this._SELECTORS.BBVideo).pause();
  }

  renderState(newState) {
    // unload current state
    if (this._currentState) {
      for (let i of this._currentState) {
        let el = this.DOMEl(i.selector);
        el.classList.remove(...i.classList);
      }
    }

    // load new state
    for (let i of newState) {
      let el = this.DOMEl(i.selector);
      el.classList.add(...i.classList);
    }

    this._currentState = newState;
  }

  DOMEl(selector) {
    return document.querySelector(selector);
  }

  setVolume(volume) {
    this.DOMEl(this._SELECTORS.BBVideo).volume = volume;
  }

  setLoadingImg(src) {
    this._LOADING_IMG_SRC = src;
    this.DOMEl(this._SELECTORS.BBLoadingImg).src = src;
  }

  create() {
    const playerHTML = `\
    <div id="bb-container">
      <video id="bb-video" ${this._CONTROLS ? 'controls' : ''} ${this._AUTOPLAY ? 'autoplay' : ''}></video>
      <img id="bb-loading-img" src="${this._LOADING_IMG_SRC}">
      <span id="bb-loading-text">${this._LOADING_TEXT}</span>
      <div id="bb-play-btn-container">
        ${this.#PLAY_BTN}
      </div>
    </div>
    `;
    // main container
    this.DOMEl(this._WRAPPER_SELECTOR).insertAdjacentHTML('beforeend', playerHTML);

    // move loading text
    this.DOMEl(this._SELECTORS.BBLoadingText).style.transform = randomTranslate();
  }

  bindEvents() {
    let el, listenerName;

    // video data loaded
    listenerName = 'listenerLoadedData';
    el = this.DOMEl(this._SELECTORS.BBVideo);
    if (!(listenerName in el.dataset)) {
      el.addEventListener('loadeddata', () => {
        if (this._DEBUG) console.log('video loaded');
        this.renderState(this.STATES.READY);
      });

      el.dataset[listenerName] = '';
    }

    // pause fired
    listenerName = 'listenerPauseFired';
    el = this.DOMEl(this._SELECTORS.BBVideo);
    if (!(listenerName in el.dataset)) {
      el.addEventListener('pause', (e) => {
        if (this.DOMEl(this._SELECTORS.BBVideo).readyState === 4) {
          e.preventDefault();
          if (this._DEBUG) console.log('video paused');
          this.pause();
        }
      });

      el.dataset[listenerName] = '';
    }

    // play fired
    listenerName = 'listenerPlayFired';
    el = this.DOMEl(this._SELECTORS.BBVideo);
    if (!(listenerName in el.dataset)) {
      el.addEventListener('play', (e) => {
        e.preventDefault();
        if (this._DEBUG) console.log('video playing');
        this.play();
      });

      el.dataset[listenerName] = '';
    }

    // BB play button clicked
    listenerName = 'listenerPlayBtnClicked';
    el = this.DOMEl(this._SELECTORS.BBPlayBtn);
    if (!(listenerName in el.dataset)) {
      el.addEventListener('click', () => {
        this.play();
      });
    }

    el.dataset[listenerName] = '';
  }
}

// --- HELPER FUNCTIONS

function randomTranslate() {
  // |   MAX----MIN  X  MIN----MAX   |

  const MAX_DISTANCE = 100; // %
  const MIN_DISTANCE = 50; // %

  let randX = randomSign() * randomNum(MIN_DISTANCE, MAX_DISTANCE);
  let randY = randomSign() * randomNum(MIN_DISTANCE, MAX_DISTANCE);

  return `translate(${-50 + randX}%, ${-50 + randY}%)`;
}

function randomNum(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}

function randomSign() {
  return Math.random() < 0.5 ? -1 : 1;
}
