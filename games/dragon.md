---
layout: scenario
title: ドラゴンリバース
js: /assets/js/character-details.js
permalink: /games/dragon/
---
<head>
  <link href="https://fonts.googleapis.com/css2?family=Corsiva&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Zen+Antique&display=swap" rel="stylesheet">
</head>
<body class="dragon-body">
<header class="scenarios-header">
  <nav class="scenarios-nav">
    <a href="/games/" class="scenarios-link scenarios-button dragon-link dragon-button">Scenarios</a>
  </nav>
</header>

<a class="site-title" style="color:gray;margin-left:30px;margin-top:10px" rel="author" href="{{ "/" |
relative_url }}">{{ site.title | escape }}</a>

<div class="dragon-page">
  <h1 class="dragon-title">ドラゴンリバース</h1>
  <div class="dragon-intro">
    <p></p>
    <h2>―――これは冒険者の道を選んだ君たちが恐るべき竜に挑んだ夜の物語。</h2>
    <p>剣士・武闘家・魔法使い・僧侶の4人からなる冒険隊一行は、忌まわしき竜が眠るという「竜の塔」を突き止め、攻略へと乗り出した。彼らの目標は竜を討伐し、竜の塔に眠るだいじなお宝を手に入れることだ。</p>
    <p>実力派と名高い冒険隊は順調に歩を進めていくのだが、その中で思わぬ悲運に見舞われることとなる…。</p>
    <p><strong>マダミスアプリUZUにて、本格マダミスウィークの作品として2024/11/2に公開予定！</strong></p>
  </div>

  <div class="dragon-details" style="margin-top:50px;">
    <h2>シナリオの特徴</h2>
    <ul>
      <li>GM不要4人用のRPG風マーダーミステリー！</li>
      <li>ファンタジー世界のパーティメンバーになりきって冒険しよう！</li>
      <li>ボリュームたっぷりのシナリオ！</li>
      <li>プレイ時間：120分</li>
    </ul>
  </div>

  <div class="dragon-characters">
    <h2 style="color:#34495e; margin-top:30px;text-align:center; font-family: 'Zen Antique', serif;">登場人物一覧</h2>
    <p style="text-align:center;"><strong>詳細はキャラクターをクリック</strong></p>
    <div class="characters-container">
      <button class="animated-button char-button button-fighter" style="font-family: 'Corsiva', cursive;" data-target="#fighter-details"><span>Fighter</span></button>
      <button class="animated-button char-button button-mage" style="font-family: 'Corsiva', cursive;" data-target="#mage-details"><span>Mage</span></button>
      <button class="animated-button char-button button-priest" style="font-family: 'Corsiva', cursive;" data-target="#priest-details"><span>Priest</span></button>
      <button class="animated-button char-button button-theif" style="font-family: 'Corsiva', cursive;" data-target="#theif-details"><span>Theif</span></button>
    </div>
    <div id="fighter-details" class="character-details fighter-details">
      <h3>武闘家</h3>
      <p>ちょっと乱暴者だが人情を大切にする男武闘家。昔は悪いこともしていたが剣士の仲間になってからは心を入れ替えた。一人称は「俺」</p>
      <h4>能力：「馬鹿力」と「におうだち」</h4>
      <ul>
      <li><strong>馬鹿力</strong>： 鍛え上げられた肉体から炸裂する渾身の一撃。</li>
      <li><strong>におうだち</strong>： 仲間を守るための盾となる。</li>
      </ul>
    </div>
    <div id="mage-details" class="character-details mage-details">
      <h3>魔法使い</h3>
      <p>天才肌で人の言うことを聞かない女魔法使い。魔法に人一倍熱心で、今回の竜の塔に関する情報を持ってきたのも、攻略を推したのも魔法使い。一人称は「私」</p>
      <h4>能力：「炎魔法」と「魔力探知」</h4>
      <ul>
      <li><strong>炎魔法</strong>： 炎を出す魔法。攻撃の他、料理をしたり辺りを明るくしたりなど様々な使い道がある。</li>
      <li><strong>魔力探知</strong>： 対象が持つ魔力量や魔力の流れを感知できる。</li>
      </ul>
    </div>
    <div id="priest-details" class="character-details priest-details">
      <h3>僧侶</h3>
      <p>真面目で穏やかな男僧侶。教会の聖騎士であったが、昔馴染みの剣士に誘われたことで2人旅を始め、道中で仲間を見つけてきた。一人称は「僕」</p>
      <h4>能力：「癒やし魔法」と「状態異常回復魔法」</h4>
      <ul>
      <li><strong>癒やし魔法</strong>： 自分や人の傷を治す魔法。死者には効果がない。</li>
      <li><strong>状態異常回復魔法</strong>： 毒・麻痺・やけど・呪いなどの異常を治す魔法。各状態異常に対応する特定の魔法を使うことで治せる。死者には効果がない。</li>
      </ul>
    </div>
    <div id="theif-details" class="character-details theif-details">
      <h3>盗賊</h3>
      <p>自由奔放で人懐っこい小さな女盗賊。唯一剣士のパーティメンバーではない。竜の後ろの宝箱の中に隠れていたところを助けられた。一人称は「あたし」</p>
      <h4>能力：「宝探し」と「盗賊の直感」</h4>
      <ul>
      <li><strong>宝探し</strong>： 同じ階にある空いていない宝箱の場所をひとつ指し示す。</li>
      <li><strong>盗賊の直感</strong>： ダンジョン内の空いていない宝箱の数がわかる。</li>
      </ul>
    </div>
    <p style="text-align:center;margin-top:20px;">イラスト：花見酒39様</p>
  </div>
</div>
<script src="/assets/js/character-details.js"></script>
