/* Layout Lab data: block types, slide types, templates.
   Grid: 12 columns x 12 rows inside the slide margins.
   Template blocks: [type, x, y, w, h, label]  (x, y start at 0) */
window.LAB = (function () {
  'use strict';

  var TYPES = {
    eyebrow: { name: 'Eyebrow label', w: 3, h: 1, group: 'Text', tip: 'A small label above the title, like "04 · The menu". Uppercase, small, accent color.' },
    title:   { name: 'Title', w: 6, h: 2, group: 'Text', tip: 'The slide title. One idea in a few words. Use your heading font.' },
    text:    { name: 'Text', w: 4, h: 2, group: 'Text', tip: 'One or two short lines. If it needs a paragraph, it belongs in your speaker notes.' },
    list:    { name: 'List', w: 5, h: 4, group: 'Text', tip: 'Three short lines with icons or dividers. Avoid long bullet lists.' },
    number:  { name: 'Big number', w: 3, h: 3, group: 'Text', tip: 'A price or one key number. Make it the biggest text so the eye goes there first.' },
    button:  { name: 'Button', w: 3, h: 1, group: 'Text', tip: 'One call to action: order, reserve, message us. Use your accent color.' },
    image:   { name: 'Photo', w: 4, h: 5, group: 'Pictures', tip: 'Your own photo, or a free photo with credit on your Sources slide.' },
    cutout:  { name: 'Cutout PNG', w: 3, h: 5, group: 'Pictures', tip: 'Your product with no background (GIMP by hand, or remove.bg on your own photo, declared). Add a soft shadow and let it break a card edge.' },
    logo:    { name: 'Logo', w: 1, h: 2, group: 'Pictures', tip: 'Your own logo, made in Canva from shapes and text. No AI.' },
    icon:    { name: 'Icon', w: 1, h: 2, group: 'Pictures', tip: 'A simple icon. Use the same icon style everywhere.' },
    video:   { name: 'Video', w: 5, h: 5, group: 'Media', tip: 'A short clip you filmed, 30 seconds or less. Insert › Video in Google Slides.' },
    audio:   { name: 'Audio', w: 2, h: 1, group: 'Media', tip: 'A short sound or jingle with a free license. Insert › Audio (from Drive).' },
    chart:   { name: 'Chart', w: 5, h: 6, group: 'Data', tip: 'Make it in Google Sheets, then Insert › Chart › From Sheets so it stays linked.' },
    table:   { name: 'Table', w: 6, h: 5, group: 'Data', tip: 'Prices or numbers in rows. Five or six rows at most.' },
    diagram: { name: 'Steps diagram', w: 12, h: 3, group: 'Data', tip: 'Steps with arrows. Google Slides: Insert › Diagram › Process.' },
    card:    { name: 'Card', w: 3, h: 4, group: 'Shapes', tip: 'A rounded box that holds one idea: a drink, a fact, a person. Same gap and corner radius for every card.' },
    shape:   { name: 'Color band', w: 12, h: 1, group: 'Shapes', tip: 'A block of color from your palette: a band, a panel or a background.' }
  };
  /* containers: other blocks may sit on top of these without a warning */
  var CONTAINERS = { card: 1, shape: 1, image: 1, video: 1 };

  var SLIDES = [
    { id: 'cover', name: 'Cover', n: 1, goal: 'Logo, business name, tagline and one strong picture.',
      must: [['logo', 1, 'Your own logo'], ['title', 1, 'The business name']] },
    { id: 'about', name: 'About us', n: 2, goal: 'Who you are in one sentence, and every member’s role.',
      must: [['title', 1, 'A title'], ['card|image|icon', 2, 'Team roles (cards or photos)']] },
    { id: 'need', name: 'Need and why us', n: 3, goal: 'The problem your customers have, and why your business is the answer.',
      must: [['title', 1, 'A title'], ['card|list|number', 2, 'Reasons or facts (cards, list or numbers)']] },
    { id: 'menu', name: 'Menu', n: 4, goal: 'Products, prices and cutout pictures with depth.',
      must: [['title', 1, 'A title'], ['cutout', 3, 'Three or more cutout pictures'], ['number|card|table|list', 1, 'Prices']] },
    { id: 'numbers', name: 'Prices and numbers', n: 5, goal: 'A price table and a chart made in Google Sheets.',
      must: [['title', 1, 'A title'], ['chart', 1, 'A chart from Google Sheets']] },
    { id: 'how', name: 'How it works', n: 6, goal: 'The steps a customer goes through, as a diagram.',
      must: [['title', 1, 'A title'], ['diagram|list|card', 1, 'The steps (diagram, list or step cards)']] },
    { id: 'customers', name: 'Customers', n: 7, goal: 'Who buys, where you sell and how people order.',
      must: [['title', 1, 'A title'], ['card|list|image', 2, 'Customer groups or personas']] },
    { id: 'offer', name: 'Offer', n: 8, goal: 'One offer and one clear call to action.',
      must: [['title', 1, 'The offer'], ['button', 1, 'A call to action button']] },
    { id: 'contact', name: 'Contact', n: 9, goal: 'Thank you, how to reach you, and the link to your proposal.',
      must: [['title', 1, 'A thank-you title'], ['text|list|card', 1, 'Contact details']] },
    { id: 'sources', name: 'Sources', n: 10, goal: 'Every picture, font, sound, video and tool, plus your declaration.',
      must: [['title', 1, 'A title'], ['table|list|card', 1, 'A credits table or list']] },
    { id: 'free', name: 'Free slide', n: 11, goal: 'Any extra slide: video, team photo, timeline, survey results.',
      must: [['title', 1, 'A title']] }
  ];

  /* ---------- templates (5 per pitch slide) ---------- */
  var T = {};
  T.cover = [
    { name: 'Split: words left, cups right', note: 'The sample, layout A', b: [
      ['shape', 7, 1, 5, 10, 'Color disc behind the cups'], ['logo', 0, 1, 1, 2, 'Your logo'], ['title', 0, 4, 6, 3, 'Business name'], ['text', 0, 7, 5, 1, 'Tagline'], ['eyebrow', 0, 9, 4, 1, 'A business pitch · Group'],
      ['cutout', 6, 4, 3, 6, 'Cup cutout'], ['cutout', 9, 4, 3, 6, 'Cup cutout'], ['cutout', 7, 2, 3, 8, 'Signature cutout']] },
    { name: 'Centered poster with a shelf', note: 'The sample, layout B', b: [
      ['logo', 5, 0, 2, 2, 'Your logo'], ['title', 2, 2, 8, 3, 'Business name'], ['text', 3, 5, 6, 1, 'Tagline'], ['eyebrow', 4, 6, 4, 1, 'A business pitch'],
      ['cutout', 1, 7, 2, 4], ['cutout', 3, 7, 2, 4], ['cutout', 5, 6, 2, 5, 'Signature cutout'], ['cutout', 7, 7, 2, 4], ['cutout', 9, 7, 2, 4], ['shape', 0, 11, 12, 1, 'Shelf band']] },
    { name: 'Full photo with a title card', note: 'Photo fills the slide; text sits on a card', b: [
      ['image', 0, 0, 12, 12, 'Full photo of your product or shop'], ['card', 0, 5, 6, 7, 'Title card'], ['logo', 1, 6, 1, 2, 'Your logo'], ['title', 1, 8, 5, 2, 'Business name'], ['text', 1, 10, 4, 1, 'Tagline']] },
    { name: 'Z-pattern', note: 'The eye reads top left, top right, bottom left, bottom right', b: [
      ['logo', 0, 0, 1, 2, 'Your logo'], ['text', 8, 0, 4, 1, 'Tagline'], ['cutout', 0, 3, 5, 9, 'Hero cutout'], ['title', 6, 5, 6, 3, 'Business name'], ['button', 6, 9, 3, 1, 'A pitch by Group']] },
    { name: 'Giant name', note: 'Type is the picture', b: [
      ['logo', 0, 0, 1, 2, 'Your logo'], ['title', 0, 2, 12, 4, 'Business name, very big'], ['text', 0, 7, 6, 1, 'Tagline'], ['eyebrow', 0, 9, 4, 1, 'Group and section'], ['cutout', 9, 5, 3, 7, 'Cup cutout']] }
  ];
  T.about = [
    { name: 'Statement, picture, role cards', note: 'The sample, layout A', b: [
      ['eyebrow', 0, 0, 3, 1, '02 · About us'], ['title', 0, 1, 5, 2, 'About Us'], ['text', 0, 4, 7, 3, 'Who we are, in one sentence'], ['shape', 8, 1, 4, 7, 'Color circle'], ['cutout', 9, 1, 2, 7, 'Cup cutout'],
      ['card', 0, 9, 3, 3, 'Role: Project Lead'], ['card', 3, 9, 3, 3, 'Role: Content Writer'], ['card', 6, 9, 3, 3, 'Role: Visual Designer'], ['card', 9, 9, 3, 3, 'Role: Media Producer']] },
    { name: 'Dark panel and team grid', note: 'The sample, layout B', b: [
      ['eyebrow', 0, 0, 3, 1, '02 · About us'], ['title', 0, 1, 5, 2, 'About Us'], ['card', 0, 3, 4, 9, 'Story panel (dark)'], ['logo', 0, 4, 1, 2, 'Logo'], ['text', 0, 7, 4, 3, 'Who we are'],
      ['card', 4, 3, 4, 4, 'Member 1 and role'], ['card', 8, 3, 4, 4, 'Member 2 and role'], ['card', 4, 8, 4, 4, 'Member 3 and role'], ['card', 8, 8, 4, 4, 'Member 4 and role'],
      ['icon', 4, 3, 1, 2, 'Avatar'], ['icon', 8, 3, 1, 2, 'Avatar'], ['icon', 4, 8, 1, 2, 'Avatar'], ['icon', 8, 8, 1, 2, 'Avatar']] },
    { name: 'Photo and story', note: 'Half photo, half words', b: [
      ['image', 0, 0, 6, 12, 'Group photo'], ['eyebrow', 7, 1, 3, 1, '02 · About us'], ['title', 7, 2, 5, 2, 'About Us'], ['text', 7, 5, 5, 3, 'Our story in two lines'], ['list', 7, 8, 5, 3, 'Our four roles']] },
    { name: 'Story timeline', note: 'How the idea grew', b: [
      ['eyebrow', 0, 0, 3, 1, '02 · About us'], ['title', 0, 1, 6, 2, 'About Us'], ['diagram', 0, 4, 12, 3, 'Idea → test → launch'],
      ['text', 0, 8, 4, 3, 'How it started'], ['text', 4, 8, 4, 3, 'What we tested'], ['text', 8, 8, 4, 3, 'Where we are now']] },
    { name: 'Team faces row', note: 'Four people, four roles', b: [
      ['title', 0, 0, 6, 2, 'About Us'], ['text', 0, 2, 8, 1, 'Our mission in one line'],
      ['image', 0, 4, 3, 6, 'Member photo'], ['image', 3, 4, 3, 6, 'Member photo'], ['image', 6, 4, 3, 6, 'Member photo'], ['image', 9, 4, 3, 6, 'Member photo'],
      ['text', 0, 10, 3, 2, 'Name and role'], ['text', 3, 10, 3, 2, 'Name and role'], ['text', 6, 10, 3, 2, 'Name and role'], ['text', 9, 10, 3, 2, 'Name and role']] }
  ];
  T.need = [
    { name: 'Bento grid', note: 'The sample, layout A', b: [
      ['eyebrow', 0, 0, 4, 1, '03 · The need'], ['title', 0, 1, 7, 2, 'The Need and Why Us'], ['card', 0, 3, 6, 9, 'The need + why us (dark)'], ['text', 0, 4, 5, 3, 'The need, one sentence'], ['cutout', 4, 8, 2, 4, 'Cup cutout'],
      ['card', 6, 3, 3, 4, 'Fact card'], ['card', 9, 3, 3, 4, 'Fact card'], ['card', 6, 8, 3, 4, 'Fact card'], ['card', 9, 8, 3, 4, 'Fact card (accent)'],
      ['number', 6, 3, 3, 2, '₱55'], ['number', 9, 3, 3, 2, '0–100%'], ['number', 6, 8, 3, 2, '3 min'], ['number', 9, 8, 3, 2, '₱5 off']] },
    { name: 'Problem → solution', note: 'The sample, layout B', b: [
      ['eyebrow', 0, 0, 4, 1, '03 · The need'], ['title', 0, 1, 7, 2, 'The Need and Why Us'], ['card', 0, 3, 5, 9, 'The need'], ['list', 0, 6, 5, 5, 'Three pain points'],
      ['shape', 5, 7, 2, 1, 'Arrow'], ['card', 7, 3, 5, 9, 'Why us (accent)'], ['list', 7, 6, 4, 5, 'Three answers'], ['cutout', 10, 8, 2, 4, 'Cup cutout']] },
    { name: 'One big number', note: 'Lead with a fact from your survey', b: [
      ['eyebrow', 0, 0, 4, 1, '03 · The need'], ['title', 0, 1, 7, 2, 'The Need and Why Us'], ['number', 0, 3, 5, 5, 'One big fact'], ['text', 0, 8, 5, 2, 'What it means'],
      ['card', 6, 3, 6, 3, 'Reason 1'], ['card', 6, 6, 6, 3, 'Reason 2'], ['card', 6, 9, 6, 3, 'Reason 3']] },
    { name: 'Before and after', note: 'Two pictures tell the story', b: [
      ['title', 0, 0, 7, 2, 'The Need and Why Us'], ['image', 0, 3, 6, 8, 'Before: the problem'], ['image', 6, 3, 6, 8, 'After: with us'], ['text', 0, 11, 6, 1, 'Caption'], ['text', 6, 11, 6, 1, 'Caption']] },
    { name: 'Three pain points', note: 'Equal cards, one answer button', b: [
      ['title', 0, 0, 7, 2, 'The Need and Why Us'], ['text', 0, 2, 8, 1, 'Who has the need'], ['card', 0, 4, 4, 6, 'Pain point 1'], ['card', 4, 4, 4, 6, 'Pain point 2'], ['card', 8, 4, 4, 6, 'Pain point 3'],
      ['icon', 0, 4, 1, 2, 'Icon'], ['icon', 4, 4, 1, 2, 'Icon'], ['icon', 8, 4, 1, 2, 'Icon'], ['button', 0, 11, 4, 1, 'Our answer →']] }
  ];
  T.menu = [
    { name: 'Hero card and bento cards', note: 'The sample, layout A', b: [
      ['eyebrow', 0, 0, 3, 1, '04 · The menu'], ['title', 0, 1, 5, 2, 'The Menu'], ['text', 7, 1, 5, 1, 'Add-ons and sizes'], ['card', 0, 3, 6, 9, 'Signature drink'], ['text', 0, 4, 3, 3, 'Name + description'], ['number', 0, 8, 3, 3, 'Price'], ['cutout', 3, 2, 3, 9, 'Signature cutout'],
      ['card', 6, 3, 3, 4, 'Drink: price + name'], ['card', 9, 3, 3, 4, 'Drink: price + name'], ['card', 6, 8, 3, 4, 'Drink: price + name'], ['card', 9, 8, 3, 4, 'Drink: price + name'],
      ['cutout', 8, 2, 1, 3, 'Cutout'], ['cutout', 11, 2, 1, 3, 'Cutout'], ['cutout', 8, 7, 1, 3, 'Cutout'], ['cutout', 11, 7, 1, 3, 'Cutout']] },
    { name: 'Café menu board', note: 'The sample, layout B', b: [
      ['shape', 0, 0, 12, 12, 'Dark background'], ['eyebrow', 0, 0, 3, 1, '04 · The menu'], ['title', 0, 1, 4, 2, 'The Menu'], ['text', 0, 3, 4, 1, 'Prices for 16 oz'], ['cutout', 0, 4, 4, 8, 'Signature cutout'],
      ['table', 5, 1, 7, 9, 'Menu: name …… price'], ['text', 5, 10, 7, 1, 'Add-ons line']] },
    { name: 'Product row', note: 'Every item gets the same space', b: [
      ['title', 3, 0, 6, 2, 'The Menu'], ['text', 3, 2, 6, 1, 'One line about the menu'],
      ['cutout', 0, 4, 3, 5, 'Cutout'], ['cutout', 3, 4, 3, 5, 'Cutout'], ['cutout', 6, 4, 3, 5, 'Cutout'], ['cutout', 9, 4, 3, 5, 'Cutout'],
      ['number', 0, 9, 3, 2, 'Price'], ['number', 3, 9, 3, 2, 'Price'], ['number', 6, 9, 3, 2, 'Price'], ['number', 9, 9, 3, 2, 'Price'],
      ['text', 0, 11, 3, 1, 'Name'], ['text', 3, 11, 3, 1, 'Name'], ['text', 6, 11, 3, 1, 'Name'], ['text', 9, 11, 3, 1, 'Name']] },
    { name: 'Spotlight in the center', note: 'One big product, details on both sides', b: [
      ['title', 0, 0, 4, 2, 'The Menu'], ['text', 0, 4, 4, 2, 'Name + description'], ['number', 0, 6, 3, 3, 'Price'], ['cutout', 4, 1, 4, 11, 'Signature cutout, big'],
      ['list', 8, 2, 4, 6, 'Other drinks + prices'], ['cutout', 8, 8, 2, 4, 'Cutout'], ['cutout', 10, 8, 2, 4, 'Cutout'], ['button', 0, 10, 3, 1, 'Order now']] },
    { name: 'Grid of six', note: 'Six equal cards, each cup breaks its card', b: [
      ['title', 0, 0, 5, 2, 'The Menu'],
      ['card', 0, 3, 4, 4, 'Drink card'], ['card', 4, 3, 4, 4, 'Drink card'], ['card', 8, 3, 4, 4, 'Drink card'], ['card', 0, 8, 4, 4, 'Drink card'], ['card', 4, 8, 4, 4, 'Drink card'], ['card', 8, 8, 4, 4, 'Drink card'],
      ['cutout', 2, 2, 2, 4, 'Cutout'], ['cutout', 6, 2, 2, 4, 'Cutout'], ['cutout', 10, 2, 2, 4, 'Cutout'], ['cutout', 2, 7, 2, 4, 'Cutout'], ['cutout', 6, 7, 2, 4, 'Cutout'], ['cutout', 10, 7, 2, 4, 'Cutout']] }
  ];
  T.numbers = [
    { name: 'Table and column chart', note: 'The sample, layout A', b: [
      ['eyebrow', 0, 0, 4, 1, '05 · Prices and numbers'], ['title', 0, 1, 6, 2, 'Prices and Numbers'], ['table', 0, 3, 7, 6, 'Price, cost, profit'], ['number', 0, 9, 3, 3, 'Profit per cup'], ['number', 3, 9, 3, 3, 'Cups per month'], ['chart', 7, 3, 5, 9, 'Cups per week (from Sheets)']] },
    { name: 'KPI tiles and ranking bars', note: 'The sample, layout B', b: [
      ['eyebrow', 0, 0, 4, 1, '05 · Prices and numbers'], ['title', 0, 1, 6, 2, 'Prices and Numbers'], ['card', 0, 3, 4, 3, 'KPI tile (dark)'], ['card', 4, 3, 4, 3, 'KPI tile'], ['card', 8, 3, 4, 3, 'KPI tile'],
      ['number', 0, 3, 4, 3, 'Number'], ['number', 4, 3, 4, 3, 'Number'], ['number', 8, 3, 4, 3, 'Number'], ['chart', 0, 7, 12, 5, 'Profit per drink, sorted bars']] },
    { name: 'One big number', note: 'The number first, the chart as proof', b: [
      ['title', 0, 0, 6, 2, 'Prices and Numbers'], ['number', 0, 3, 7, 6, 'The one number to remember'], ['text', 0, 9, 6, 2, 'What it means'], ['chart', 7, 3, 5, 9, 'Chart from Sheets']] },
    { name: 'Chart hero', note: 'A big chart with three insights', b: [
      ['title', 0, 0, 6, 2, 'Prices and Numbers'], ['chart', 0, 2, 8, 10, 'Big chart from Sheets'], ['card', 8, 2, 4, 3, 'Insight 1'], ['card', 8, 5, 4, 3, 'Insight 2'], ['card', 8, 8, 4, 3, 'Insight 3'], ['text', 8, 11, 4, 1, 'Source line']] },
    { name: 'Big table', note: 'All numbers in one table, one highlight', b: [
      ['title', 0, 0, 6, 2, 'Prices and Numbers'], ['table', 0, 3, 12, 6, 'Full price table'], ['chart', 0, 9, 4, 3, 'Small chart'], ['text', 4, 10, 4, 2, 'Note: sample figures and source'], ['number', 8, 9, 4, 3, 'Highlight number']] }
  ];
  T.how = [
    { name: 'Horizontal steps', note: 'The sample, layout A', b: [
      ['eyebrow', 0, 0, 4, 1, '06 · How it works'], ['title', 0, 1, 6, 2, 'How It Works'], ['diagram', 0, 4, 12, 4, 'Four steps with arrows'], ['shape', 0, 10, 8, 1, 'Option pills (sugar level)']] },
    { name: 'Timeline and labelled product', note: 'The sample, layout B', b: [
      ['eyebrow', 0, 0, 4, 1, '06 · How it works'], ['title', 0, 1, 6, 2, 'How It Works'], ['list', 0, 3, 5, 9, 'Timeline: four steps'], ['cutout', 6, 2, 3, 10, 'Product cutout'],
      ['text', 9, 3, 3, 1, 'Label: lid'], ['text', 9, 6, 3, 1, 'Label: sugar'], ['text', 9, 9, 3, 1, 'Label: pearls']] },
    { name: 'Cycle', note: 'For steps that repeat', b: [
      ['title', 0, 0, 6, 2, 'How It Works'], ['diagram', 3, 2, 6, 10, 'Cycle diagram'], ['text', 0, 4, 3, 4, 'Note'], ['text', 9, 4, 3, 4, 'Note']] },
    { name: 'Zig-zag cards', note: 'Steps step down the slide', b: [
      ['title', 0, 0, 6, 2, 'How It Works'], ['card', 0, 3, 6, 2, 'Step 1'], ['card', 6, 5, 6, 2, 'Step 2'], ['card', 0, 7, 6, 2, 'Step 3'], ['card', 6, 9, 6, 2, 'Step 4'],
      ['icon', 0, 3, 1, 2, 'Number'], ['icon', 6, 5, 1, 2, 'Number'], ['icon', 0, 7, 1, 2, 'Number'], ['icon', 6, 9, 1, 2, 'Number']] },
    { name: 'Steps with photos', note: 'A photo for every step', b: [
      ['title', 0, 0, 6, 2, 'How It Works'], ['image', 0, 3, 3, 5, 'Step photo'], ['image', 3, 3, 3, 5, 'Step photo'], ['image', 6, 3, 3, 5, 'Step photo'], ['image', 9, 3, 3, 5, 'Step photo'],
      ['text', 0, 8, 3, 3, 'Step 1'], ['text', 3, 8, 3, 3, 'Step 2'], ['text', 6, 8, 3, 3, 'Step 3'], ['text', 9, 8, 3, 3, 'Step 4']] }
  ];
  T.customers = [
    { name: 'Three info cards', note: 'The sample, layout A', b: [
      ['eyebrow', 0, 0, 4, 1, '07 · Customers'], ['title', 0, 1, 8, 2, 'Customers and Where We Sell'], ['card', 0, 3, 4, 9, 'Who'], ['card', 4, 3, 4, 9, 'Where'], ['card', 8, 3, 4, 9, 'How we sell'],
      ['icon', 0, 3, 1, 2, 'Icon'], ['icon', 4, 3, 1, 2, 'Icon'], ['icon', 8, 3, 1, 2, 'Icon'], ['list', 0, 6, 4, 5, 'Three lines'], ['list', 4, 6, 4, 5, 'Three lines'], ['list', 8, 6, 4, 5, 'Three lines']] },
    { name: 'Persona cards', note: 'The sample, layout B', b: [
      ['eyebrow', 0, 0, 4, 1, '07 · Customers'], ['title', 0, 1, 8, 2, 'Customers and Where We Sell'], ['card', 0, 3, 4, 6, 'Persona 1'], ['card', 4, 3, 4, 6, 'Persona 2'], ['card', 8, 3, 4, 6, 'Persona 3'],
      ['icon', 0, 3, 1, 2, 'Avatar'], ['icon', 4, 3, 1, 2, 'Avatar'], ['icon', 8, 3, 1, 2, 'Avatar'], ['shape', 0, 10, 12, 2, 'Where + how strip (dark)']] },
    { name: 'Map and list', note: 'Show where you are', b: [
      ['title', 0, 0, 6, 2, 'Customers and Where We Sell'], ['image', 0, 2, 7, 10, 'Simple map of your area'], ['list', 7, 3, 5, 6, 'Who and when'], ['button', 7, 10, 3, 1, 'Visit us']] },
    { name: 'One big persona', note: 'Tell the story of one customer', b: [
      ['image', 0, 0, 5, 12, 'Persona drawing or photo'], ['eyebrow', 6, 0, 4, 1, '07 · Customers'], ['title', 6, 1, 6, 2, 'Meet your customer'], ['text', 6, 4, 6, 3, 'Needs and habits'], ['card', 6, 8, 3, 4, 'Buys'], ['card', 9, 8, 3, 4, 'When']] },
    { name: 'Quote and stats', note: 'A real survey answer and three numbers', b: [
      ['title', 0, 0, 7, 2, 'Customers and Where We Sell'], ['text', 0, 3, 8, 4, 'Survey quote (a real answer)'], ['number', 0, 8, 4, 3, 'Stat 1'], ['number', 4, 8, 4, 3, 'Stat 2'], ['number', 8, 8, 4, 3, 'Stat 3']] }
  ];
  T.offer = [
    { name: 'Big statement and picture', note: 'The sample, layout A', b: [
      ['shape', 0, 0, 12, 12, 'Accent background'], ['eyebrow', 0, 1, 4, 1, '08 · Opening offer'], ['title', 0, 3, 7, 4, 'The offer, big'], ['text', 0, 7, 6, 1, 'Who and when'], ['button', 0, 9, 4, 1, 'Call to action'],
      ['cutout', 7, 1, 3, 10, 'Cutout'], ['cutout', 9, 3, 3, 8, 'Cutout']] },
    { name: 'Coupon ticket', note: 'The sample, layout B', b: [
      ['eyebrow', 4, 0, 4, 1, '08 · Opening offer'], ['card', 1, 2, 7, 7, 'Ticket'], ['card', 8, 2, 3, 7, 'Ticket stub'], ['title', 1, 3, 5, 3, 'The offer'], ['text', 8, 4, 3, 2, 'Show this at the kiosk'], ['cutout', 5, 5, 2, 5, 'Cutout'], ['button', 4, 10, 4, 1, 'Reserve now']] },
    { name: 'Badge', note: 'A big discount badge', b: [
      ['number', 0, 3, 4, 6, 'Big discount'], ['title', 5, 2, 7, 4, 'The offer'], ['text', 5, 6, 6, 2, 'Who and when'], ['button', 5, 9, 4, 1, 'Call to action']] },
    { name: 'Full photo and offer card', note: 'Photo behind, card in front', b: [
      ['image', 0, 0, 12, 12, 'Photo of the product'], ['card', 6, 2, 6, 8, 'Offer card'], ['title', 7, 3, 4, 3, 'The offer'], ['text', 7, 6, 4, 1, 'Who and when'], ['button', 7, 8, 4, 1, 'Call to action']] },
    { name: 'Centered call', note: 'Symmetry with two products', b: [
      ['title', 2, 2, 8, 4, 'The offer'], ['text', 3, 6, 6, 1, 'Who and when'], ['button', 4, 8, 4, 1, 'Call to action'], ['cutout', 0, 5, 2, 7, 'Cutout'], ['cutout', 10, 5, 2, 7, 'Cutout']] }
  ];
  T.contact = [
    { name: 'Thanks, list and cup lineup', note: 'The sample, layout A', b: [
      ['logo', 0, 0, 1, 2, 'Logo'], ['title', 1, 0, 6, 2, 'Salamat!'], ['text', 0, 3, 5, 1, 'See you at the kiosk'], ['list', 0, 5, 6, 4, 'Facebook, place, hours, proposal link'],
      ['cutout', 6, 8, 1, 4, 'Cutout'], ['cutout', 7, 8, 1, 4, 'Cutout'], ['cutout', 8, 8, 1, 4, 'Cutout'], ['cutout', 9, 8, 1, 4, 'Cutout'], ['cutout', 10, 8, 1, 4, 'Cutout']] },
    { name: 'Centered thanks and tiles', note: 'The sample, layout B', b: [
      ['logo', 5, 0, 2, 2, 'Logo'], ['title', 3, 2, 6, 3, 'Salamat!'], ['text', 4, 5, 4, 1, 'See you at the kiosk'],
      ['card', 0, 8, 3, 4, 'Facebook'], ['card', 3, 8, 3, 4, 'Find us'], ['card', 6, 8, 3, 4, 'Open hours'], ['card', 9, 8, 3, 4, 'Proposal link']] },
    { name: 'Dark half', note: 'Thank you on the left, details on the right', b: [
      ['card', 0, 0, 6, 12, 'Dark panel'], ['logo', 1, 1, 1, 2, 'Logo'], ['title', 1, 4, 5, 3, 'Thank you'], ['text', 1, 8, 4, 1, 'One line'],
      ['icon', 7, 2, 1, 2, 'Icon'], ['text', 8, 2, 4, 2, 'Facebook'], ['icon', 7, 5, 1, 2, 'Icon'], ['text', 8, 5, 4, 2, 'Place'], ['icon', 7, 8, 1, 2, 'Icon'], ['text', 8, 8, 4, 2, 'Hours']] },
    { name: 'QR and details', note: 'A code people can scan', b: [
      ['title', 0, 0, 6, 2, 'Salamat!'], ['image', 0, 3, 4, 7, 'QR code to your page'], ['list', 5, 3, 7, 6, 'Contact details'], ['button', 5, 10, 4, 1, 'Message us']] },
    { name: 'Big thank you', note: 'One huge line, then the details', b: [
      ['title', 0, 3, 12, 4, 'Salamat!'], ['text', 2, 8, 8, 1, 'How to reach you, in one line'], ['logo', 5, 10, 2, 2, 'Logo']] }
  ];
  T.sources = [
    { name: 'Table and declaration card', note: 'The sample, layout A', b: [
      ['eyebrow', 0, 0, 4, 1, '10 · Sources'], ['title', 0, 1, 6, 2, 'Sources and Credits'], ['table', 0, 3, 8, 9, 'Item, source, license'], ['card', 8, 3, 4, 7, 'Declaration (dark)']] },
    { name: 'Credit cards and banner', note: 'The sample, layout B', b: [
      ['eyebrow', 0, 0, 4, 1, '10 · Sources'], ['title', 0, 1, 6, 2, 'Sources and Credits'], ['card', 0, 3, 3, 5, 'Fonts'], ['card', 3, 3, 3, 5, 'Pictures'], ['card', 6, 3, 3, 5, 'Data'], ['card', 9, 3, 3, 5, 'Tools'], ['card', 0, 9, 12, 3, 'Declaration banner (dark)']] },
    { name: 'Two lists', note: 'Simple and complete', b: [
      ['title', 0, 0, 6, 2, 'Sources and Credits'], ['list', 0, 3, 6, 8, 'Pictures and fonts'], ['list', 6, 3, 6, 8, 'Data and tools'], ['text', 0, 11, 12, 1, 'Declaration line']] },
    { name: 'Thumbnail credits', note: 'A small picture beside each credit', b: [
      ['title', 0, 0, 6, 2, 'Sources and Credits'], ['image', 0, 3, 2, 3, 'Thumb'], ['text', 2, 3, 4, 3, 'Credit'], ['image', 6, 3, 2, 3, 'Thumb'], ['text', 8, 3, 4, 3, 'Credit'],
      ['image', 0, 7, 2, 3, 'Thumb'], ['text', 2, 7, 4, 3, 'Credit'], ['image', 6, 7, 2, 3, 'Thumb'], ['text', 8, 7, 4, 3, 'Credit'], ['text', 0, 11, 12, 1, 'Declaration line']] },
    { name: 'Declaration first', note: 'Honesty on top', b: [
      ['title', 0, 0, 6, 2, 'Sources and Credits'], ['card', 0, 2, 12, 4, 'Declaration (signed by all)'], ['table', 0, 7, 12, 5, 'Credits table']] }
  ];
  T.free = [
    { name: 'Title only', note: 'Start from almost nothing', b: [['title', 0, 0, 6, 2, 'Title']] },
    { name: 'Video slide', note: 'A clip with a short caption', b: [
      ['title', 0, 0, 6, 2, 'Watch us make it'], ['video', 0, 3, 8, 9, 'Your 30-second clip'], ['text', 8, 3, 4, 3, 'What you will see'], ['audio', 8, 10, 3, 1, 'Jingle (optional)']] },
    { name: 'Survey results', note: 'Three numbers and a chart', b: [
      ['title', 0, 0, 6, 2, 'What our survey says'], ['number', 0, 3, 4, 3, 'Result'], ['number', 4, 3, 4, 3, 'Result'], ['number', 8, 3, 4, 3, 'Result'], ['chart', 0, 7, 12, 5, 'Survey chart from Sheets']] },
    { name: 'Timeline', note: 'Plans for the next months', b: [
      ['title', 0, 0, 6, 2, 'Our plan'], ['diagram', 0, 4, 12, 3, 'Month 1 → 2 → 3'], ['card', 0, 8, 4, 4, 'Month 1'], ['card', 4, 8, 4, 4, 'Month 2'], ['card', 8, 8, 4, 4, 'Month 3']] },
    { name: 'Gallery', note: 'Four photos, one caption', b: [
      ['title', 0, 0, 6, 2, 'Gallery'], ['image', 0, 3, 6, 9, 'Big photo'], ['image', 6, 3, 3, 4, 'Photo'], ['image', 9, 3, 3, 4, 'Photo'], ['image', 6, 7, 6, 4, 'Photo'], ['text', 6, 11, 6, 1, 'Caption']] }
  ];

  /* Font pairings to use in the real deck. Every font here is a free Google Font — already in the
     font menu of Google Slides and Canva, and free to add to PowerPoint. "safe" is the no-install
     fallback that exists on every system. "stack" falls back to the app's own bundled fonts so the
     on-screen sample always looks right even when the real font is not installed. */
  function serif(n) { return '"' + n + '","Fraunces",Georgia,"Times New Roman",serif'; }
  function sans(n) { return '"' + n + '","DM Sans",system-ui,"Segoe UI",Arial,sans-serif'; }
  var FONT_SETS = [
    [{ role: 'Headings', name: 'Playfair Display', safe: 'Georgia', note: 'Elegant high-contrast serif', stack: serif('Playfair Display') },
     { role: 'Body', name: 'Lato', safe: 'Arial', note: 'Clean, friendly sans', stack: sans('Lato') }],
    [{ role: 'Headings', name: 'Montserrat', safe: 'Arial', note: 'Bold geometric sans', stack: sans('Montserrat') },
     { role: 'Body', name: 'Merriweather', safe: 'Georgia', note: 'Readable serif for text', stack: serif('Merriweather') }],
    [{ role: 'Headings', name: 'Lora', safe: 'Georgia', note: 'Warm modern serif', stack: serif('Lora') },
     { role: 'Body', name: 'Roboto', safe: 'Arial', note: 'Neutral, clear sans', stack: sans('Roboto') }],
    [{ role: 'Headings', name: 'Poppins', safe: 'Arial', note: 'Rounded geometric sans', stack: sans('Poppins') },
     { role: 'Body', name: 'PT Serif', safe: 'Georgia', note: 'Steady serif for text', stack: serif('PT Serif') }],
    [{ role: 'Headings', name: 'Oswald', safe: 'Arial', note: 'Tall condensed sans', stack: sans('Oswald') },
     { role: 'Body', name: 'Open Sans', safe: 'Arial', note: 'Plain, legible sans', stack: sans('Open Sans') }],
    [{ role: 'Headings', name: 'Raleway', safe: 'Arial', note: 'Elegant thin sans', stack: sans('Raleway') },
     { role: 'Body', name: 'Lora', safe: 'Georgia', note: 'Warm serif for text', stack: serif('Lora') }]
  ];

  return { TYPES: TYPES, CONTAINERS: CONTAINERS, SLIDES: SLIDES, TEMPLATES: T,
    PALETTE: ['#F4EADB', '#D9B48A', '#93552A', '#2A1B12', '#3F5E3A'],
    ROLES: ['Background', 'Surface', 'Accent', 'Text', 'Highlight'],
    FONT_SETS: FONT_SETS, FONTS: FONT_SETS[0] };
})();
