// OTS one-shot decoration, borrowing cancellation patterns from the design report.
// Content and counts always return to their complete resting state.
const article = document.querySelector<HTMLElement>('article[data-demo="witness"]');
const registered = new WeakSet<HTMLElement>();
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const active = new Set<() => void>();
const observers = new Set<IntersectionObserver>();
const path = (url: string) => new URL(url, location.href).pathname.replace(/\/$/, '') || '/';

if (article) {
  const notes: string[] = JSON.parse(document.getElementById('witness-notes')?.textContent || '[]');
  const flagged = new Set(notes.map(path));
  let cameFrom: string | undefined;
  if (document.referrer) {
    const referrer = new URL(document.referrer);
    if (referrer.origin === location.origin && flagged.has(path(referrer.href))) {
      cameFrom = path(referrer.href);
    }
  }
  document.querySelectorAll<HTMLElement>('[data-source]').forEach((source) => {
    if (path(source.dataset.source!) !== cameFrom) return;
    const tag = document.createElement('span');
    tag.className = 'cue-caption';
    tag.textContent = 'You came from here';
    source.querySelector('.bl-source-title')?.after(tag);
    source.dataset.cueFrom = '';
  });

  function register(root: HTMLElement, target: HTMLElement, play: (signal: AbortSignal) => Promise<void>, count?: HTMLElement | null, replayControl = true) {
    if (registered.has(root) || motion.matches) return;
    registered.add(root);
    const finalCount = count?.textContent || '';
    let played = false;
    let visible = false;
    let stop = () => {};
    const restore = () => {
      root.querySelectorAll('.cue-pending, .cue-arrive, .cue-wash, .cue-line, .cue-arrow').forEach((node) => {
        node.classList.remove('cue-pending', 'cue-arrive', 'cue-wash', 'cue-line', 'cue-arrow');
      });
      root.classList.remove('cue-summary');
      root.querySelectorAll('.cue-summary').forEach((node) => node.classList.remove('cue-summary'));
      delete root.dataset.cueArmed;
      if (count) count.textContent = finalCount;
    };
    const run = async () => {
      if (motion.matches) return;
      stop();
      const controller = new AbortController();
      const cancel = () => {
        controller.abort();
        if (stop === cancel) restore();
      };
      stop = cancel;
      active.add(cancel);
      const watchdog = window.setTimeout(cancel, 6000);
      root.dataset.cueArmed = '';
      try { await play(controller.signal); }
      catch (error) { if (!controller.signal.aborted) console.error('Witness cue restored:', error); }
      finally {
        clearTimeout(watchdog);
        if (!controller.signal.aborted) cancel();
        active.delete(cancel);
      }
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !played) {
          played = true;
          void run();
        } else if (!entry.isIntersecting) stop();
      }
    }, { threshold: [0, 0.5] });
    observer.observe(target);
    observers.add(observer);
    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'cue-replay';
    replay.textContent = 'Replay witness cues';
    replay.addEventListener('click', () => { played = true; void run(); });
    if (replayControl && !root.matches('[data-cue-mobile]')) {
      const header = root.querySelector('.bl-header');
      if (header) header.after(replay);
      else root.prepend(replay);
    }
    return {
      cancel: () => stop(),
      replay: () => { if (visible) { played = true; void run(); } },
    };
  }

  function wait(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) { reject(signal.reason); return; }
      const abort = () => { clearTimeout(timer); reject(signal.reason); };
      const timer = window.setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
      signal.addEventListener('abort', abort, { once: true });
    });
  }

  async function arrivals(panel: HTMLElement, count: HTMLElement | null, signal: AbortSignal) {
    // Flagged graphs precompute their layout; this delay leaves a quiet beat after load.
    await wait(Math.max(0, 900 - performance.now()), signal);
    const sources = Array.from(panel.querySelectorAll<HTMLElement>('.bl-source'));
    const step = Math.min(450, 2200 / Math.max(1, sources.length));
    sources.forEach((source) => source.classList.add('cue-pending'));
    if (count) count.textContent = '0';
    let total = 0;
    for (const source of sources) {
      source.classList.remove('cue-pending');
      source.classList.add('cue-arrive');
      source.querySelectorAll('.bl-hit').forEach((hit) => hit.classList.add('cue-wash'));
      total += source.querySelectorAll('.bl-mention').length;
      if (count) count.textContent = String(total);
      await wait(step, signal);
    }
    await wait(1500, signal);
  }

  document.querySelectorAll<HTMLElement>('[data-cue-panel]').forEach((panel) => {
    const details = panel.closest<HTMLDetailsElement>('[data-cue-mobile]');
    const count = (details || panel).querySelector<HTMLElement>('[data-cue-count]');
    const target = panel.querySelector<HTMLElement>('.bl-source-title, .bl-empty') || panel;
    if (details) {
      const summary = details.querySelector<HTMLElement>('summary')!;
      const stopSummary = register(details, summary, async (signal) => {
        const total = Number(count?.textContent || 0);
        summary.classList.add('cue-summary');
        if (count) count.textContent = '0';
        for (let i = 1; i <= Math.min(total, 12); i++) {
          await wait(600 / Math.min(total, 12), signal);
          if (count) count.textContent = String(Math.round(total * i / Math.min(total, 12)));
        }
        await wait(600, signal);
        summary.classList.remove('cue-summary');
      }, count);
      let opened = false;
      details.addEventListener('toggle', () => {
        if (!details.open || opened) return;
        opened = true;
        // Restore the summary count before the entry runner captures its final value.
        stopSummary?.cancel();
        register(panel, target, (signal) => arrivals(panel, count, signal), count);
      });
    } else {
      register(panel, target, (signal) => arrivals(panel, count, signal), count);
    }
  });

  if (article.dataset.noteType === 'journal') {
    const prose = article.querySelector<HTMLElement>('.prose-body')!;
    const witnesses = Array.from(prose.querySelectorAll<HTMLElement>(':scope > ul > li')).filter((item) => {
      const first = item.firstElementChild;
      const link = first?.matches('a[class*="wl-"]') ? first : first?.matches('p') ? first.firstElementChild : null;
      const lead = first?.matches('p') ? first : item;
      const firstContent = Array.from(lead.childNodes).find((node) => node.nodeType !== 3 || node.textContent?.trim());
      return firstContent === link && link?.matches('a[class*="wl-"]:not(.wl-unresolved)') && item.querySelector(':scope > ul');
    });
    // The onward link may sit in a witness bullet or in a witness typed inline as prose.
    const onward = Array.from(prose.querySelectorAll<HTMLAnchorElement>(':scope > p > a[href], :scope > ul > li > a[href], :scope > ul > li > p > a[href]'))
      .find((link) => link.origin === location.origin && flagged.has(path(link.href)));
    // One sequence in page order: a witness typed inline as prose (the onward link) and each
    // witness bullet. It starts when the first step is in view; later steps wait until they are
    // at least partly on screen, so a bullet below the fold is not skipped or cancelled.
    const steps: { el: HTMLElement; play: (signal: AbortSignal) => Promise<void> }[] = [];
    if (onward) steps.push({ el: onward, play: async (signal) => {
      onward.classList.add('cue-shimmer');
      onward.addEventListener('animationend', () => onward.classList.remove('cue-shimmer'), { once: true });
      // Two 1400 ms passes (global.css); let them finish so each beat is its own.
      await wait(2800, signal);
    } });
    witnesses.forEach((item) => steps.push({ el: item, play: async (signal) => {
      item.querySelectorAll(':scope > a, :scope > p > a').forEach((link) => link.classList.add('cue-wash'));
      await wait(450, signal);
      item.querySelector(':scope > ul > li')?.classList.add('cue-line');
      await wait(650, signal);
    } }));
    steps.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

    const inView = (el: HTMLElement, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
      if (signal.aborted) { reject(signal.reason); return; }
      const io = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.3)) { io.disconnect(); resolve(); }
      }, { threshold: [0, 0.3, 1] });
      io.observe(el);
      observers.add(io);
      signal.addEventListener('abort', () => { io.disconnect(); reject(signal.reason); }, { once: true });
    });

    let current: AbortController | undefined;
    const clear = () => prose.querySelectorAll('.cue-wash, .cue-line, .cue-shimmer').forEach((node) => node.classList.remove('cue-wash', 'cue-line', 'cue-shimmer'));
    const playSequence = async (replaying = false) => {
      if (motion.matches || !steps.length) return;
      current?.abort();
      clear();
      const controller = new AbortController();
      current = controller;
      const cancel = () => { controller.abort(); clear(); };
      active.add(cancel);
      try {
        for (const step of steps) {
          // A replay plays straight through; the first run waits for each step to be on screen.
          if (!replaying) await inView(step.el, controller.signal);
          await step.play(controller.signal);
        }
        await wait(900, controller.signal);
      } catch (error) {
        if (!controller.signal.aborted) console.error('Witness cue restored:', error);
      } finally {
        active.delete(cancel);
        if (current === controller) clear();
      }
    };
    if (steps.length && !motion.matches) {
      void playSequence();
      const replay = document.createElement('button');
      replay.type = 'button';
      replay.className = 'cue-replay';
      replay.textContent = 'Replay witness cues';
      replay.addEventListener('click', () => { void playSequence(true); });
      prose.prepend(replay);
    }
  }

  const cancelAll = () => {
    active.forEach((cancel) => cancel());
    observers.forEach((observer) => observer.disconnect());
  };
  motion.addEventListener('change', (event) => { if (event.matches) cancelAll(); });
  window.addEventListener('pagehide', cancelAll);
  window.addEventListener('pageshow', (event) => { if (event.persisted) cancelAll(); });
}
