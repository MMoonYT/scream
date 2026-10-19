/**
 * Minimal frontend-adfærd. Originalen læner sig på jQuery + et stort
 * shared_functions.js; her genskabes kun det menuen og lazy-loadet har brug for.
 */
(function () {
	'use strict';

	var dialog = document.getElementById('nav-content');
	var toggle = document.getElementById('3barsmenu');
	var close  = document.querySelector('.gr-nav-close');

	var menuBody = dialog.querySelector('.gr-nav-body');
	var scrollPosition = null;

	function openMenu() {
		if (dialog.open) return;
		scrollPosition = { x: window.scrollX, y: window.scrollY };
		document.documentElement.classList.add('gr-menu-open');
		document.body.style.setProperty('--gr-menu-scroll-y', -scrollPosition.y + 'px');
		document.body.classList.add('gr-menu-open');
		dialog.showModal();
		menuBody.scrollTop = 0;
		toggle.setAttribute('aria-expanded', 'true');
		// Keep the close action reachable without opening a phone's keyboard.
		close.focus({ preventScroll: true });
	}

	function closeMenu() {
		dialog.close();
	}

	function restorePage() {
		document.body.classList.remove('gr-menu-open');
		document.body.style.removeProperty('--gr-menu-scroll-y');
		// The root still has scroll-behavior:auto during position restoration.
		window.scrollTo(scrollPosition.x, scrollPosition.y);
		document.documentElement.classList.remove('gr-menu-open');
		toggle.setAttribute('aria-expanded', 'false');
		toggle.focus({ preventScroll: true });
	}

	toggle.addEventListener('click', openMenu);
	close.addEventListener('click', closeMenu);
	// Native Escape, the X and backdrop clicks all restore the same page state.
	dialog.addEventListener('close', restorePage);
	dialog.addEventListener('click', function (e) {
		if (e.target !== dialog) return;
		var bounds = dialog.getBoundingClientRect();
		if (e.clientX < bounds.left || e.clientX > bounds.right ||
			e.clientY < bounds.top || e.clientY > bounds.bottom) {
			closeMenu();
		}
	});

	// Lazy-load: originalen bruger data-src + class="lazy".
	var lazy = document.querySelectorAll('img.lazy[data-src]');
	if ('IntersectionObserver' in window && lazy.length) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				var img = entry.target;
				img.src = img.dataset.src;
				img.classList.remove('lazy');
				io.unobserve(img);
			});
		}, { rootMargin: '200px' });
		lazy.forEach(function (img) { io.observe(img); });
	} else {
		lazy.forEach(function (img) { img.src = img.dataset.src; });
	}

	// Instagram/TikTok har ingen del-URL. Originalen kopierer linket til
	// udklipsholderen og åbner appens indbakke — samme adfærd her.
	document.querySelectorAll('a.gr-copy-link').forEach(function (link) {
		link.addEventListener('click', function () {
			var url = link.dataset.copy;
			if (!url || !navigator.clipboard) return;
			navigator.clipboard.writeText(url).then(function () {
				var badge = link.querySelector('.linkCopied');
				if (!badge) return;
				badge.classList.add('is-visible');
				setTimeout(function () { badge.classList.remove('is-visible'); }, 1500);
			});
		});
	});
})();


/* Language links use a disclosure, not a listbox of selectable options. */
(function () {
    'use strict';
    var picker = document.querySelector('[data-gr-langpick]');
    if (!picker) return;
    var button = picker.querySelector('.gr-langbtn');
    var links = picker.querySelector('.gr-langmenu');

    function setOpen(open, restoreFocus) {
        links.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
        if (restoreFocus) button.focus();
    }
    button.addEventListener('click', function () { setOpen(links.hidden, false); });
    picker.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !links.hidden) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false, true);
        }
    });
    picker.addEventListener('focusout', function (event) {
        if (!picker.contains(event.relatedTarget)) setOpen(false, false);
    });
    document.addEventListener('click', function (event) {
        if (!picker.contains(event.target)) setOpen(false, false);
    });
})();

/* A single controller owns schema FAQ state in both theme presentations. */
(function () {
    'use strict';
    document.querySelectorAll('.schema-faq').forEach(function (box, boxIndex) {
        box.classList.add('gr-faq');
        box.querySelectorAll('.schema-faq-section').forEach(function (section, index) {
            var question = section.querySelector('.schema-faq-question');
            var answer = section.querySelector('.schema-faq-answer');
            if (!question || !answer) return;
            // Inline formatting belongs to one flex item, so nested strong
            // text does not become separate columns beside the toggle icon.
            if (!question.querySelector(':scope > .gr-faq-question-text')) {
                var label = document.createElement('span');
                label.className = 'gr-faq-question-text';
                Array.from(question.childNodes).forEach(function (node) {
                    if (node.nodeType === 1 && node.matches('svg, i, .grc-faq-icon')) return;
                    label.appendChild(node);
                });
                question.prepend(label);
            }
            if (!answer.id) answer.id = 'gr-faq-answer-' + boxIndex + '-' + index;
            question.setAttribute('role', 'button');
            question.setAttribute('tabindex', '0');
            question.setAttribute('aria-controls', answer.id);
            function setOpen(open) {
                question.setAttribute('aria-expanded', String(open));
                section.classList.toggle('is-open', open);
                answer.hidden = !open;
            }
            setOpen(index === 0);
            question.addEventListener('click', function () {
                setOpen(question.getAttribute('aria-expanded') !== 'true');
            });
            question.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    question.click();
                }
            });
        });
    });
})();
