/** Shared theme interactions. Viewport sizing boots before visible markup. */

/**
 * Header: hidden on scroll down, back on scroll up.
 */
(function () {
	'use strict';

	var bar = document.getElementById('mainheader');
	if (!bar) {
		return;
	}

	var THRESHOLD = 6; // ignore sub-pixel jitter and rubber-banding
	var last = 0;
	var ticking = false;
	var hidden = false;

	/*
	 * The theme sets body { overflow-y: scroll }, which in this document makes
	 * the body the scrolling box rather than the viewport — window.scrollY can
	 * stay pinned at its initial value while the page scrolls. So read all
	 * three offsets and take whichever is moving.
	 */
	function offset() {
		return window.scrollY ||
			document.documentElement.scrollTop ||
			document.body.scrollTop || 0;
	}

	function hide() {
		if (!hidden) {
			bar.classList.add('is-hidden');
			hidden = true;
		}
	}

	function show() {
		if (hidden) {
			bar.classList.remove('is-hidden');
			hidden = false;
		}
	}

	function update() {
		ticking = false;
		var y = offset();

		/*
		 * Never hide while a menu is open. Scrolling a long burger panel or an
		 * open dropdown would otherwise pull the bar — and the panel with it —
		 * out from under the pointer.
		 */
		if (document.querySelector('#nav-content[open], .grh-has-sub[open], .gr-langmenu:not([hidden])')) {
			show();
			last = y;
			return;
		}

		// Always visible at the top of the page.
		if (y <= bar.offsetHeight) {
			show();
			last = y;
			return;
		}

		var delta = y - last;
		if (delta > THRESHOLD) {
			hide();
		} else if (delta < -THRESHOLD) {
			show();
		}
		last = y;
	}

	function onScroll() {
		if (!ticking) {
			ticking = true;
			window.requestAnimationFrame(update);
		}
	}

	// Capture phase, so a scroll on an inner scrolling element is seen too.
	document.addEventListener('scroll', onScroll, { capture: true, passive: true });
	window.addEventListener('resize', show, { passive: true });

	last = offset();
})();

/**
 * FAQ accordions.
 *
 * The Default Page and Guide artboards both draw a bordered accordion. Rather
 * than a shortcode or a block, this upgrades markup that is already writable
 * in the editor: any element with class "gr-faq" whose children are an <h3>
 * question followed by its answer becomes an accordion. Pages without one are
 * untouched, and with JS off every question and answer is still readable — the
 * panels are only hidden once this runs.
 */
(function () {
	'use strict';

	var boxes = document.querySelectorAll('.gr-faq');
	if (boxes.length) {
		Array.prototype.forEach.call(boxes, upgradeHeadingFaq);
	}

	// Schema FAQ blocks are controlled by the main theme.

	function upgradeHeadingFaq(box) {
		var heads = box.querySelectorAll('h3');
		if (!heads.length) {
			return;
		}

		box.classList.add('grc-faq');

		Array.prototype.forEach.call(heads, function (head, i) {
			// Everything between this heading and the next one is the answer.
			var body = document.createElement('div');
			var node = head.nextSibling;
			var next;

			while (node && !(node.nodeType === 1 && node.tagName === 'H3')) {
				next = node.nextSibling;
				body.appendChild(node);
				node = next;
			}

			var item = document.createElement('div');
			item.className = 'grc-faq-item';
			head.parentNode.insertBefore(item, head);

			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'grc-faq-q';
			btn.setAttribute('aria-expanded', 'false');
			btn.id = 'grc-faq-q-' + i;
			while (head.firstChild) {
				btn.appendChild(head.firstChild);
			}

			var mark = document.createElement('span');
			mark.className = 'grc-faq-mark';
			mark.setAttribute('aria-hidden', 'true');
			btn.appendChild(mark);

			head.className = 'grc-faq-head';
			head.appendChild(btn);

			body.className = 'grc-faq-a';
			body.id = 'grc-faq-a-' + i;
			body.hidden = true;
			btn.setAttribute('aria-controls', body.id);

			item.appendChild(head);
			item.appendChild(body);

			btn.addEventListener('click', function () {
				var open = btn.getAttribute('aria-expanded') === 'true';
				btn.setAttribute('aria-expanded', open ? 'false' : 'true');
				body.hidden = open;
			});
		});
	}
})();


/*
 * NOTE — the "How we rate" carousel is deliberately NOT implemented here.
 *
 * I wrote one, twice over, on the conclusion that Splide was never enqueued,
 * having grepped the rendered HTML for `src='...js'` with SINGLE quotes while
 * the markup uses double quotes. Then I over-corrected and recorded here that
 * the bundle loads on staging too. Both were wrong. The measured position:
 *
 *   production  loads .../public/build/assets/app-CXPFtiFA.js, deferred by
 *               WP Rocket as type="text/rocketlazyloadscript" with the real
 *               URL in data-rocket-src. It contains Splide. Woken, the slider
 *               comes up as splide--slide splide--ltr splide--draggable
 *               is-active is-overflow is-initialized, arrows working.
 *   staging     public/build/assets/ holds app.css and 9 SVGs and NO .js at
 *               all — confirmed by directory listing, not by grep. So
 *               window.grcThemeBundle is false there and nothing initialises.
 *
 * A second carousel driving the same markup would fight the theme's, exactly
 * as the FAQ did, so this stays CSS-only: the pre-initialisation state is
 * styled to read as a two-up grid rather than an empty box. The fix is to
 * deploy the built bundle; the enqueue in functions.php picks it up by glob.
 */

/*
 * Intro "More" / "Less" — fallback only.
 *
 * app.css already has the whole open/closed state, keyed on one class:
 *   .intro .intro-excerpt   { display: inline }   .intro .intro-full { display: none }
 *   .intro.is-expanded .intro-excerpt { display: none }
 *   .intro.is-expanded .intro-full    { display: block }
 * and both buttons are marked [data-intro-toggle]. So nothing needs styling —
 * what is missing on staging is the script that adds the class, which lives in
 * the same undeployed bundle as the carousel. That is why the button is inert
 * on mobile and why it looks fine on desktop, where the excerpt is hidden and
 * the full text shown without any interaction.
 *
 * Gated on grcThemeBundle for the same reason as the FAQ: when the bundle IS
 * deployed it toggles this class itself, and two handlers on one class cancel
 * each other out. Delegated from the document so it survives the block being
 * re-rendered.
 */
(function () {
	if (window.grcThemeBundle) {
		return;
	}

	document.addEventListener('click', function (ev) {
		var btn = ev.target && ev.target.closest ? ev.target.closest('[data-intro-toggle]') : null;
		if (!btn) {
			return;
		}

		var intro = btn.closest('.intro');
		if (!intro) {
			return;
		}

		ev.preventDefault();
		intro.classList.toggle('is-expanded');

		/* Both buttons are real <button>s with no accessible state of their
		   own; app.css swaps which one is visible, so the label is already
		   correct either way. Only the expanded flag needs saying out loud. */
		intro.setAttribute('data-expanded', intro.classList.contains('is-expanded') ? 'true' : 'false');
	});
})();

/*
 * GRTV player overlay.
 *
 * The canvas draws a poster with an 88px play button and no chrome. The markup
 * underneath is a real <video controls preload="metadata">, so this is the
 * whole behaviour: click the overlay, start the video, get out of the way.
 *
 * Not gated on grcThemeBundle. The theme's bundle has no player code — I read
 * it: its only DOM work is mounting Splide on .gr-how-we-rate, the header
 * menu, and the intro toggle — so there is nothing here for a second handler
 * to fight. Delegated from the document so it survives any re-render.
 *
 * The overlay is aria-hidden with tabindex="-1" in the markup: the <video> is
 * already a labelled, focusable control, and a second tab stop doing the same
 * job is noise rather than help. Keyboard and screen-reader users get the
 * native controls, which is why the overlay can be decorative.
 */
(function () {
	function reveal(player) {
		if (player) { player.classList.add('is-playing'); }
	}

	document.addEventListener('click', function (ev) {
		var btn = ev.target && ev.target.closest ? ev.target.closest('[data-grc-play]') : null;
		if (!btn) { return; }

		var player = btn.closest('[data-grc-player]');
		var video  = player ? player.querySelector('video') : null;
		if (!video) { return; }

		ev.preventDefault();
		reveal(player);

		/*
		 * play() rejects on some browsers when the gesture is not recognised
		 * (and on iOS Low Power Mode). Swallowing it silently would leave the
		 * reader looking at a poster with the button gone, so put the button
		 * back and let the native controls take the second attempt.
		 */
		var started = video.play();
		if (started && typeof started.catch === 'function') {
			started.catch(function () {
				player.classList.remove('is-playing');
				video.controls = true;
			});
		}
	});

	/* Started from the native controls rather than the overlay: hide it too. */
	document.addEventListener('play', function (ev) {
		if (ev.target && ev.target.tagName === 'VIDEO') {
			reveal(ev.target.closest('[data-grc-player]'));
		}
	}, true);
})();

/* ----------------------------------------------------------------------
 * Games archive: apply a filter on change.
 *
 * The panel is a plain GET form and the SEARCH button applies everything,
 * so this is an enhancement, not the mechanism — with JS off, the filters
 * still work, they just need the button. Only the selects auto-submit;
 * the text field must not, or every keystroke would navigate.
 *
 * The script is enqueued in the footer, so the panel is already parsed.
 * ---------------------------------------------------------------------- */
(function () {
	var form = document.querySelector('[data-grc-gamefilters]');
	if (!form) {
		return;
	}
	form.addEventListener('change', function (e) {
		if (e.target && e.target.tagName === 'SELECT') {
			form.submit();
		}
	});
})();

/* ----------------------------------------------------------------------
 * Brand homepage: make the filter rows filter.
 *
 * ENHANCEMENT, NOT THE MECHANISM. Every pill is a real link to a real
 * archive and stays one — with this script blocked, or before it runs, a
 * click navigates there and nothing is lost. What this adds is: fetch the
 * same block rendered against that filter from the REST route, swap the
 * grid in place, and move aria-current. Clicking the active pill again
 * clears the filter.
 *
 * Modifier-clicks and middle-clicks are left alone so "open in new tab"
 * still reaches the archive.
 * ---------------------------------------------------------------------- */
(function () {
	var rows = document.querySelectorAll('[data-grc-hptabs]');
	if (!rows.length || !window.fetch || !window.grcHpFilter) {
		return;
	}

	rows.forEach(function (row) {
		var block  = row.getAttribute('data-grc-hptabs');
		var target = document.querySelector('[data-grc-hpswap="' + block + '"]');
		if (!target) {
			return;
		}
		var busy = false;

		row.addEventListener('click', function (ev) {
			var tab = ev.target.closest ? ev.target.closest('.hp-tab') : null;
			if (!tab || !row.contains(tab)) {
				return;
			}
			if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) {
				return;
			}
			ev.preventDefault();
			if (busy) {
				return;
			}

			/* Clicking the pill that is already on clears back to everything. */
			var value = tab.getAttribute('aria-current') ? '' : (tab.getAttribute('data-grc-hpvalue') || '');
			var url   = window.grcHpFilter + '?block=' + encodeURIComponent(block) +
			            '&f=' + encodeURIComponent(value);

			busy = true;
			target.setAttribute('aria-busy', 'true');

			fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
				.then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
				.then(function (data) {
					if (!data || typeof data.html !== 'string' || !data.html) {
						throw new Error('empty');
					}
					var host = document.createElement('div');
					host.innerHTML = data.html;
					var fresh = host.firstElementChild;
					if (!fresh) {
						throw new Error('empty');
					}
					target.parentNode.replaceChild(fresh, target);
					target = fresh;

					/* A section change starts at page one; reload and pagination
					   must retain that section rather than silently selecting All. */
					var homeUrl = fresh.getAttribute('data-grc-home-url');
					if (homeUrl) {
						window.history.replaceState(null, '', homeUrl + '#latest');
					}

					/* Selected moves to the clicked chip, or back to "All"
					   (the chip whose value is empty) when the filter is
					   cleared — so the row always has exactly one. */
					row.querySelectorAll('.hp-tab').forEach(function (t) {
						var v = t.getAttribute('data-grc-hpvalue') || '';
						if (v === value) {
							t.setAttribute('aria-current', 'page');
						} else {
							t.removeAttribute('aria-current');
						}
					});
				})
				.catch(function () {
					/* Anything at all goes wrong: follow the link, as before. */
					window.location.href = tab.href;
				})
				.then(function () {
					busy = false;
					if (target) {
						target.removeAttribute('aria-busy');
					}
				});
		});
	});
})();

/* ======================================================================
 * COPY LINK  +  ESCAPE-TO-CLOSE FOR THE SLOTS POPUP
 *
 * Both added after the September QA sweep:
 *   - the share row's copy button needs a clipboard write;
 *   - #sl-single-game-popup closed only by clicking its scrim, so a
 *     keyboard user had no way out of a full-screen overlay.
 * ====================================================================== */
(function () {
	'use strict';

	/*
	 * ---- copy link -------------------------------------------------
	 *
	 * KEPT AFTER THE SHARE ROW WAS REMOVED (10 Sep), on purpose.
	 *
	 * It binds to [data-grc-copy] on the document, so it is inert until some
	 * markup carries that attribute — there is no cost to leaving it. Sharing
	 * is being rebuilt into the author byline, and this is the half that is
	 * awkward to write again: the Clipboard API is HTTPS-only and can be
	 * refused by permissions policy, so the execCommand path below is a real
	 * fallback rather than legacy cruft.
	 *
	 * To use it from the byline, the button needs:
	 *   data-grc-copy="<url>"  data-copied="<translated confirmation>"
	 * and, for the confirmation to show, a child element with class
	 * .grc-share-toast. The three strings are already in inc/strings.php for
	 * all 23 locales as share_label / share_copy / share_copied.
	 */
	document.addEventListener('click', function (ev) {
		var btn = ev.target && ev.target.closest ? ev.target.closest('[data-grc-copy]') : null;
		if (!btn) { return; }
		ev.preventDefault();

		var url = btn.getAttribute('data-grc-copy') || window.location.href;

		var confirmCopy = function () {
			var toast = btn.querySelector('.grc-share-toast');
			if (toast) { toast.textContent = btn.getAttribute('data-copied') || 'Copied'; }
			btn.classList.add('is-copied');
			window.setTimeout(function () { btn.classList.remove('is-copied'); }, 1800);
		};

		/*
		 * navigator.clipboard is https-only and can be blocked by permissions
		 * policy, so the execCommand path is a real fallback and not legacy
		 * cruft. The textarea is positioned off-screen rather than
		 * display:none because a hidden element cannot be selected.
		 */
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(url).then(confirmCopy, function () { legacyCopy(url, confirmCopy); });
		} else {
			legacyCopy(url, confirmCopy);
		}
	});

	function legacyCopy(text, done) {
		var ta = document.createElement('textarea');
		ta.value = text;
		ta.setAttribute('readonly', 'readonly');
		ta.className = 'gr-copy-field';
		document.body.appendChild(ta);
		ta.select();
		try { document.execCommand('copy'); done(); } catch (e) { /* nothing to do */ }
		document.body.removeChild(ta);
	}

	/* ---- escape closes the slots popup ----------------------------- */
	document.addEventListener('keydown', function (ev) {
		if (ev.key !== 'Escape' && ev.key !== 'Esc') { return; }

		var pop = document.getElementById('sl-single-game-popup');
		if (!pop) { return; }
		if (window.getComputedStyle(pop).display === 'none') { return; }

		/*
		 * The plugin's own close path is a click on the scrim, and it also
		 * clears the iframe src. Reusing it means one close behaviour rather
		 * than two that can drift — a hand-rolled hide would leave the game
		 * running in a hidden iframe, still playing audio.
		 */
		pop.click();

		/* If the iframe is still there after the plugin has had its turn, the
		   game is muted by removing the src. Guarded so that a future plugin
		   version doing this itself is not fought over. */
		window.setTimeout(function () {
			if (window.getComputedStyle(pop).display === 'none') {
				var fr = pop.querySelector('iframe');
				if (fr && fr.getAttribute('src')) { fr.setAttribute('src', ''); }
			}
		}, 60);
	});

	/* ---- comparison table: cap at ten, button below the list --------
	 * The markup ships the FULL list and a hidden button, so no-JS and
	 * crawlers see everything. This applies the cap, which means the capped
	 * state only exists where it can be undone. The button lives after the
	 * list in the DOM, so it is below the rows whether they are capped or not.
	 */
	(function () {
		var btns = document.querySelectorAll('[data-grc-ga-more]');
		if (!btns.length) { return; }

		Array.prototype.forEach.call(btns, function (btn) {
			var table = btn.closest ? btn.closest('.grc-ga-table') : null;
			if (!table || !table.querySelector('.grc-ga-row-li.is-extra')) { return; }

			/* Cap it, then reveal the control that lifts the cap. */
			table.classList.add('is-capped');
			btn.setAttribute('aria-expanded', 'false');
			btn.hidden = false;

			btn.addEventListener('click', function () {
				var capped = table.classList.toggle('is-capped');
				btn.setAttribute('aria-expanded', capped ? 'false' : 'true');

				/*
				 * Collapsing from far down the list would otherwise leave the
				 * reader below the table looking at whatever follows it. Bring
				 * the button back into view instead — only when collapsing, and
				 * only if it actually left the viewport.
				 */
				if (capped) {
					var box = btn.getBoundingClientRect();
					if (box.top < 0 || box.bottom > window.innerHeight) {
						btn.scrollIntoView({ block: 'center' });
					}
				}
			});
		});
	}());
}());

/*
 * Wide article tables: native touch/keyboard scrolling, no arrow pair.
 *
 * The buttons are gone by decision — the table keeps its own visible
 * scrollbar (theme.css forces one on .gr-table-scroll rather than relying
 * on the OS overlay), which is the affordance readers already use, and the
 * arrows sat above the table duplicating it.
 *
 * What stays is everything the scrollbar does NOT give you: the region only
 * takes focus while it actually overflows, so keyboard users can scroll it
 * with the arrow keys without collecting a tab stop on every table that
 * fits, and it is announced as a labelled region in that case only.
 */
(function () {
    var labels = window.grcTableLabels;
    if (!labels) { return; }
    document.querySelectorAll('.gr-article-body table, .grc-prose table, .e-content table').forEach(function (table, index) {
        if (table.parentElement.closest('table')) { return; }
        var region = table.parentElement;
        if (!region.classList.contains('wp-block-table')) {
            region = document.createElement('div');
            region.className = 'wp-block-table';
            table.parentNode.insertBefore(region, table);
            region.appendChild(table);
        }
        region.classList.add('gr-table-scroll');
        if (!region.id) { region.id = 'gr-table-scroll-' + index; }
        function update() {
            var max = Math.max(0, region.scrollWidth - region.clientWidth);
            region.tabIndex = max < 2 ? -1 : 0;
            if (max >= 2) {
                region.setAttribute('role', 'region');
                if (!region.hasAttribute('aria-label')) { region.setAttribute('aria-label', labels.table); }
            } else {
                region.removeAttribute('role');
            }
        }
        var observer = new ResizeObserver(update);
        observer.observe(region);
        observer.observe(table);
        update();
    });
}());
