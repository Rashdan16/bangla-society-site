/*
  cms.js — boots Decap CMS and registers the live editor previews.

  Loaded by /admin/index.html after decap-cms.js. Decap exposes two globals for
  writing previews without a build step:
     h(tag, props, ...children)   — React.createElement
     createClass({ render })      — a React component
  Each preview gets `this.props.entry` (an Immutable map of the form values) and
  `this.props.getAsset(path)` (resolves an uploaded image to a URL).
*/
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. Boot. Decap initialises itself from /admin/config.yml as soon as its
        script loads; we only register extras here. (We deliberately don't use
        CMS_MANUAL_INIT: with it, Decap ignores config.yml when a dev server
        sends the wrong Content-Type, e.g. python's http.server.)
     ------------------------------------------------------------------------ */

  // Previews render inside an iframe — give it the fonts and the copied styles.
  CMS.registerPreviewStyle('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..700&family=Karla:wght@300;400;500;600;700&display=swap');
  CMS.registerPreviewStyle('/admin/preview.css');

  /* ------------------------------------------------------------------------
     2. Helpers
     ------------------------------------------------------------------------ */
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // get(entry, key, fallback): read one form value.
  function get(entry, key, fallback) {
    var v = entry.getIn(['data', key]);
    return (v === undefined || v === null) ? fallback : v;
  }

  // isoDate("2026-09-24") → Date (local midnight) or null.
  function isoDate(str) {
    var s = String(str || '').slice(0, 10);
    var d = new Date(s + 'T00:00:00');
    return isNaN(d) ? null : d;
  }

  // countdownLabel(date) → { text, soon } exactly like the homepage badge.
  function countdownLabel(d) {
    if (!d) return { text: 'Date TBC', soon: false };
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var days = Math.round((d - today) / 86400000);
    if (days === 0) return { text: 'Today', soon: true };
    if (days === 1) return { text: 'Tomorrow', soon: true };
    if (days > 1) return { text: 'In ' + days + ' days', soon: days <= 7 };
    return { text: 'Past', soon: false };
  }

  function money(n) { return '£' + Math.round(Number(n) || 0).toLocaleString('en-GB'); }

  // svg(path, extra): tiny inline icon builder (same paths as index.html).
  function svg(d, extra) {
    return h('svg', Object.assign({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }, extra || {}),
      d.map(function (p, i) { return h('path', { key: i, d: p }); }));
  }
  var ICON_CLOCK = function () { return svg(['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M12 7v5l3 2']); };
  var ICON_PIN = function () { return svg(['M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11Z', 'M12 7.8a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Z']); };
  var ICON_CAL = function () { return svg(['M3 5h18v16H3z', 'M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5']); };
  var ICON_ARROW = function () { return svg(['M5 12h14M13 6l6 6-6 6']); };

  /* ------------------------------------------------------------------------
     3. Event preview — the .ev-card from the homepage.
     ------------------------------------------------------------------------ */
  var EventPreview = createClass({
    render: function () {
      var e = this.props.entry;
      var title = get(e, 'title', '') || 'Event title';
      var d = isoDate(get(e, 'date', ''));
      var time = get(e, 'time', '');
      var venue = get(e, 'venue', '');
      var desc = get(e, 'description', '');
      var published = get(e, 'published', true) !== false;
      var badge = countdownLabel(d);

      return h('div', { className: 'pv pv-in' },
        h('p', { className: 'pv-kicker' }, 'Events · live preview'),
        h('p', { className: 'pv-note' },
          published ? h('span', null, h('b', null, 'Published'), ' — this card will show on the homepage once the change is approved.')
                    : h('span', null, h('b', null, 'Draft'), ' — saved, but hidden from the homepage until you tick “Published”.')),
        h('article', { className: 'ev-card' + (published ? '' : ' draft') },
          h('div', { className: 'chip' },
            d ? [h('span', { className: 'm', key: 'm' }, MONTHS[d.getMonth()]), h('span', { className: 'd', key: 'd' }, String(d.getDate()))]
              : [h('span', { className: 'm', key: 'm' }, 'DATE'), h('span', { className: 'd tbc', key: 'd' }, 'TBC')]),
          h('div', null,
            h('div', { className: 'ev-top' },
              h('h3', null, title),
              h('span', { className: 'count' + (badge.soon ? ' soon' : '') }, badge.text)),
            h('div', { className: 'ev-meta' },
              time ? h('span', null, ICON_CLOCK(), time) : null,
              venue ? h('span', null, ICON_PIN(), venue) : null),
            desc ? h('p', null, desc) : null,
            d ? h('div', { className: 'ev-actions' }, h('span', { className: 'mini' }, ICON_CAL(), 'Add to calendar')) : null)));
    },
  });
  CMS.registerPreviewTemplate('events', EventPreview);

  /* ------------------------------------------------------------------------
     4. Photo preview — the tile in context, so "wide"/"tall" make sense.
     ------------------------------------------------------------------------ */
  var PhotoPreview = createClass({
    render: function () {
      var e = this.props.entry;
      var caption = get(e, 'caption', '') || 'Caption';
      var image = get(e, 'image', '');
      var size = String(get(e, 'size', 'normal') || '').replace(/\bnormal\b/g, '').trim();
      var url = image ? String(this.props.getAsset(image)) : '';

      var tile = h('div', { className: 'shot ' + size + (url ? ' has-img' : ''), key: 'tile' },
        url ? h('img', { src: url, alt: '' }) : null,
        h('span', null, caption));

      // Ghost tiles around it, to show the mosaic.
      var ghosts = [];
      for (var i = 0; i < 5; i++) ghosts.push(h('div', { className: 'shot ghost', key: 'g' + i }, h('span', null, ' ')));

      return h('div', { className: 'pv pv-in' },
        h('p', { className: 'pv-kicker' }, 'Photos · live preview'),
        h('p', { className: 'pv-note' }, url ? 'Your tile, shown with faded placeholders for the tiles around it.' : 'No image yet — the patterned placeholder will show until one is uploaded.'),
        h('div', { className: 'gallery' }, [tile].concat(ghosts)));
    },
  });
  CMS.registerPreviewTemplate('photos', PhotoPreview);

  /* ------------------------------------------------------------------------
     5. Settings previews (file collection → template name = file `name`).
     ------------------------------------------------------------------------ */
  var BannerPreview = createClass({
    render: function () {
      var e = this.props.entry;
      var on = get(e, 'enabled', false) === true;
      var msg = get(e, 'message', '') || 'Your announcement goes here';
      var linkText = get(e, 'link_text', '');
      var linkUrl = get(e, 'link_url', '');
      return h('div', { className: 'pv pv-in' },
        h('p', { className: 'pv-kicker' }, 'Announcement · live preview'),
        h('p', { className: 'pv-note' }, on ? h('span', null, h('b', null, 'On'), ' — shows under the menu on every visit until dismissed.') : h('span', null, h('b', null, 'Off'), ' — nothing shows on the homepage.')),
        h('div', { className: 'fake-nav' }, h('img', { src: '/assets/logo.png', alt: '' }), 'Bangla Society'),
        h('div', { className: 'announce' + (on ? '' : ' off') },
          h('div', { className: 'announce-inner' },
            h('span', { className: 'announce-msg' }, h('i', null), h('span', null, msg),
              (linkText && linkUrl) ? h('a', { href: '#' }, linkText) : null),
            h('button', { className: 'announce-x', type: 'button' }, '×'))));
    },
  });
  CMS.registerPreviewTemplate('banner', BannerPreview);

  var CharityPreview = createClass({
    render: function () {
      var e = this.props.entry;
      var raised = Number(get(e, 'raised', 0)) || 0;
      var target = Number(get(e, 'target', 0)) || 0;
      var cause = String(get(e, 'cause', '') || '').trim();
      var url = String(get(e, 'donate_url', '') || '').trim();
      var pct = target > 0 ? Math.max(0, Math.min(100, Math.round(raised / target * 100))) : 0;
      return h('div', { className: 'pv pv-in' },
        h('p', { className: 'pv-kicker' }, 'Charity · live preview'),
        h('p', { className: 'pv-note' }, pct + '% of target' + (url ? '' : ' · no donate link yet, so the button stays a placeholder')),
        h('div', { className: 'charity' },
          h('div', { className: 'raise' },
            h('h3', null, 'How the money is raised'),
            h('div', { className: 'goal' },
              h('div', { className: 'nums' },
                h('span', null, cause ? 'Raised so far for ' + cause : 'Raised so far'),
                h('b', null, money(raised), ' ', h('small', null, 'of ', money(target)))),
              h('div', { className: 'bar' }, h('div', { className: 'fill', style: { '--pct': pct + '%' } })))),
          h('span', { className: 'btn' + (url ? '' : ' placeholder') }, 'Donate to ' + (cause || "this year's cause"), ICON_ARROW())));
    },
  });
  CMS.registerPreviewTemplate('charity', CharityPreview);

  var LinksPreview = createClass({
    render: function () {
      var e = this.props.entry;
      function btn(key, ic, label, sub, extra) {
        var url = String(get(e, key, '') || '').trim();
        return h('span', { className: 'sbtn ' + (extra || '') + (url ? '' : ' placeholder'), key: key },
          h('span', { className: 'ic ' + ic }, label.slice(0, 2).toUpperCase()),
          h('span', { className: 'lbl' }, h('strong', null, label), h('span', null, url || sub)));
      }
      return h('div', { className: 'pv pv-in' },
        h('p', { className: 'pv-kicker' }, 'Links · live preview'),
        h('p', { className: 'pv-note' }, 'Dashed buttons have no link yet and stay as placeholders on the site.'),
        h('div', { className: 'social-btns' },
          btn('instagram', 'ic-ig', 'Instagram', 'Event posts, stories and photos'),
          btn('whatsapp', 'ic-wa', 'WhatsApp', 'The members group chat'),
          btn('tiktok', 'ic-tt', 'TikTok', 'Clips from our nights out'),
          btn('su_membership', '', 'BSOC membership', "Join through the Students' Union", 'primary')));
    },
  });
  CMS.registerPreviewTemplate('links', LinksPreview);
})();
