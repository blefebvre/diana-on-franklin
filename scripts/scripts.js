import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
} from './lib-franklin.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'dianalefebvre.ca'; // add your RUM generation information here

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

function buildTabNavigation(main) {
  // Find all divs that are direct descendents of main
  const sections = Array.from(main.children).filter((el) => el.tagName === 'DIV');

  // Hide all but the first one
  sections.forEach((section, i) => {
    if (i > 0) {
      section.classList.add('visuallyhidden');
    }
  });

  // Get array of section titles
  const sectionTitles = sections.map((section) => section.querySelector('h3').innerText);

  // Create the tab navigation
  const nav = document.createElement('nav');
  nav.classList.add('tab-nav');
  nav.role = 'tablist';

  sectionTitles.forEach((title, i) => {
    const sectionAnchor = document.createElement('a');
    sectionAnchor.href = `#${title.toLowerCase().replace(' ', '-')}`;
    sectionAnchor.innerText = title;
    if (i === 0) {
      sectionAnchor.classList.add('active');
    }
    nav.append(sectionAnchor);
  });

  main.prepend(nav);

  function openTab(hash) {
    // Remove active class from all tabs
    document.querySelector('nav > a.active').classList.remove('active');

    sections.forEach((section) => {
      const sectionTitle = section.querySelector('h3').innerText.toLowerCase();
      if (`#${sectionTitle}` === hash) {
        section.classList.remove('visuallyhidden');
      } else {
        section.classList.add('visuallyhidden');
      }
    });

    document.querySelector(`nav > a[href='${hash}']`).classList.add('active');
  }

  // Listen for hash changes
  window.addEventListener(
    'hashchange',
    (e) => {
      e.preventDefault();
      const { hash } = window.location;
      if (hash) {
        openTab(hash);
      }
    },
    false,
  );

  // Activate tab if it's hash is provided on page load
  const { hash: initialHash } = window.location;
  if (initialHash) {
    openTab(initialHash);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
    buildTabNavigation(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  addFavIcon(`${window.hlx.codeBasePath}/styles/favicon.svg`);
  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

// JS is enabled! Set a class on the body to enable our 'hidden' class
document.body.className = 'js-enabled';

loadPage();
