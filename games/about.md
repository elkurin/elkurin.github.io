---
layout: page
title: マダミス作家える@elkurin
permalink: /games/about
---

マーダーミステリーのシナリオを書いているえるです。  
X/Twitter アカウント → [@elkurin_games](https://x.com/elkurin_games)  

<img src="/assets/images/phantom.png" width="100px" alt="">

## 作品一覧

新しい順に並んでいます。各作品の画像付き一覧は [Scenarios](/games/scenarios/) へ。

{% assign works = site.data.scenarios | reverse %}
<ul class="about-works">
{%- for w in works %}
  <li>
    <h3>
      {%- if w.page -%}
        <a href="/games/{{ w.slug }}/">{{ w.title | escape }}</a>
      {%- else -%}
        {{ w.title | escape }}
      {%- endif -%}
      {%- if w.status == 'ended' %} <small>（提供終了）</small>{% endif -%}
    </h3>
    {%- if w.tagline %}<p>{{ w.tagline | escape }}</p>{% endif %}
    <p class="about-works__meta">
      {%- if w.players %}{{ w.players }}人{% endif -%}
      {%- if w.playtime %} / {{ w.playtime }}{% endif -%}
      {%- if w.gm %} / GM{{ w.gm }}{% endif -%}
      {%- for l in w.links %}{% if forloop.first %}　{% else %}・{% endif %}{% if l.url %}<a href="{{ l.url }}" target="_blank" rel="noopener">{{ l.label | escape }}</a>{% else %}{{ l.label | escape }}{% endif %}{% endfor -%}
    </p>
  </li>
{%- endfor %}
</ul>
