/**
 * bbplayer.js -- made by vodnibivol
 */

const El = (function () {
  // vars
  const _ELEMENTS = {};

  // f(x)
  function get(selector) {
    let el = _ELEMENTS[selector];

    if (!el || !el.parentNode) {
      el = document.querySelector(selector);
      _ELEMENTS[selector] = el;
    } else {
    }

    return el;
  }

  return { get };
})();

class BB {
  // default properties
  _SELECTORS = {
    BBContainer: '.bb-container',
    BBVideo: '.bb-video',
    BBLoadingImg: '.bb-loading-img',
    BBLoadingText: '.bb-loading-text',
    BBPlayBtnContainer: '.bb-play-btn-container',
    BBPlayBtn: '.bb-play-btn',
    BBErrBtn: '.bb-err-btn',
  };

  _STATES = {
    INITIAL: [
      { selector: this._SELECTORS.BBVideo, classList: ['bb-hidden', 'bb-no-pointer'] }, // TODO: delete bb-no-pointer?
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
      { selector: this._SELECTORS.BBVideo, classList: ['bb-hidden', 'bb-no-pointer'] }, // TODO: delete bb-no-pointer?
      { selector: this._SELECTORS.BBLoadingImg, classList: ['bb-hidden'] },
      { selector: this._SELECTORS.BBLoadingText, classList: ['bb-hidden'] },
      { selector: this._SELECTORS.BBPlayBtn, classList: ['bb-hidden'] },
      // { selector: this._SELECTORS.BBErrBtn, classList: [] },
    ],
  };

  // prettier-ignore
  _PLAY_BTN_HTML = '<svg class="bb-play-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path fill="#fff" d="M0 0h50v50H0z"/><path d="m43.301 25-21.65 12.5L0 50V0l21.65 12.5z"/></svg>';
  // GIF_SRC = 'https://media.giphy.com/media/1lALzcU4pUHWWMGTlK/giphy.gif';
  GIF_SRC = 'https://i.pinimg.com/originals/fe/ae/ea/feaeea33c22a7a7195e430a9bfe538c5.gif';

  constructor(selector, properties = null) {
    this._ID = randomId('bbplayer_', 10 ** 6);

    // provided properties
    properties = properties || {};

    this.DEBUG = properties.debug || false;

    this.WRAPPER_SELECTOR = selector;
    this.AUTOPLAY = properties.autoplay || false;
    this.CONTROLS = properties.controls || false;
    this.LOADING_IMG_SRC = properties.loadingImgSrc || this.GIF_SRC;
    this.LOADING_TEXT = properties.loadingText || 'loading ..';

    this._currentState = null; // state of element classes

    this.create();
    this._renderState(this._STATES.INITIAL);

    this.bindEvents();
  }

  // --- API

  load(videoUrl) {
    // TODO: premakni kam drugam?
    if (typeof Hls === 'undefined') {
      this._renderState(this._STATES.ERROR);
      return;
    }

    this._renderState(this._STATES.LOADING);

    if (this.DEBUG) console.log('video loading : ' + videoUrl);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(El.get(this._SELECTORS.BBVideo));
    } else if (El.get(this._SELECTORS.BBVideo).canPlayType('application/vnd.apple.mpegurl')) {
      El.get(this._SELECTORS.BBVideo).src = videoUrl;
    }

    // rebind events TODO: what for ?
    this.bindEvents();
  }

  play() {
    this._renderState(this._STATES.PLAYING);
    El.get(this._SELECTORS.BBVideo).play();
  }

  pause() {
    this._renderState(this._STATES.PAUSED);
    El.get(this._SELECTORS.BBVideo).pause();
  }

  setVolume(volume) {
    El.get(this._SELECTORS.BBVideo).volume = volume;
  }

  setLoadingImg(src) {
    this.LOADING_IMG_SRC = src;
    El.get(this._SELECTORS.BBLoadingImg).src = src;
  }

  forceLoadingAnim() {
    this._renderState(this._STATES.LOADING);
  }

  _renderState(newState) {
    // unload current state
    if (this._currentState) {
      for (let i of this._currentState) {
        let el = El.get(i.selector);
        el.classList.remove(...i.classList);
      }
    }

    // load new state
    for (let i of newState) {
      let el = El.get(i.selector);
      el.classList.add(...i.classList);
    }

    this._currentState = newState;
  }

  // --- INIT

  create() {
    const playerHTML = `\
    <div id="${this._ID}">
      <div class="bb-container">
        <video class="bb-video" ${this.CONTROLS ? 'controls' : ''} ${this.AUTOPLAY ? 'autoplay' : ''}></video>
        <img class="bb-loading-img" src="${this.LOADING_IMG_SRC}">
        <span class="bb-loading-text">${this.LOADING_TEXT}</span>
        <div class="bb-play-btn-container">
          ${this._PLAY_BTN_HTML}
        </div>
      </div>
    </div>`;

    // main container
    El.get(this.WRAPPER_SELECTOR).insertAdjacentHTML('beforeend', playerHTML);

    // move loading text
    El.get(this._SELECTORS.BBLoadingText).style.transform = randomTranslate();
  }

  bindEvents() {
    let el, listenerName;

    // video data loaded
    listenerName = 'listenerLoadedData';
    el = El.get(this._SELECTORS.BBVideo);
    if (!(listenerName in el.dataset)) {
      el.addEventListener('loadeddata', () => {
        if (this.DEBUG) console.log('video loaded');
        this._renderState(this._STATES.READY);
      });

      el.dataset[listenerName] = '';
    }

    // pause fired
    listenerName = 'listenerPauseFired';
    el = El.get(this._SELECTORS.BBVideo);
    if (!(listenerName in el.dataset)) {
      el.addEventListener('pause', (e) => {
        if (El.get(this._SELECTORS.BBVideo).readyState === 4) {
          e.preventDefault();
          if (this.DEBUG) console.log('video paused');
          this.pause();
        }
      });

      el.dataset[listenerName] = '';
    }

    // play fired
    listenerName = 'listenerPlayFired';
    el = El.get(this._SELECTORS.BBVideo);
    if (!(listenerName in el.dataset)) {
      el.addEventListener('play', (e) => {
        e.preventDefault();
        if (this.DEBUG) console.log('video playing');
        this.play();
      });

      el.dataset[listenerName] = '';
    }

    // BB play button clicked
    listenerName = 'listenerPlayBtnClicked';
    el = El.get(this._SELECTORS.BBPlayBtn);
    if (!(listenerName in el.dataset)) {
      el.addEventListener('click', () => {
        this.play();
      });
    }

    el.dataset[listenerName] = '';
  }
}

// --- HELPER FUNCTIONS

function randomId(prefix = '') {
  while (true) {
    let randId = prefix + randomHex(10 ** 6);
    if (!El.get(randId)) return randId;
  }
}

function randomHex(size = 1000) {
  return randomNum(size).toString(16);
}

function randomTranslate() {
  // |   MAX----MIN  X  MIN----MAX   |

  const MAX_DISTANCE = 100; // %
  const MIN_DISTANCE = 50; // %

  let randX = randomSign() * randomNum(MIN_DISTANCE, MAX_DISTANCE);
  let randY = randomSign() * randomNum(MIN_DISTANCE, MAX_DISTANCE);

  return `translate(${-50 + randX}%, ${-50 + randY}%)`;
}

function randomNum(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }

  return min + Math.floor(Math.random() * (max - min));
}

function randomSign() {
  return Math.random() < 0.5 ? -1 : 1;
}
