# 戦争ツールの自動テスト

Node.js の標準モジュールだけを使用します。npm install は不要です。

リポジトリのルートで以下を実行してください。

```sh
node got/test-core.cjs
node got/test-intrigue.cjs
```

テストは同じフォルダの `war_tool.html` を読み込みます。実行する場所に依存しません。
すべて成功すると、戦争計算は `12 scenario groups passed`、暗殺・護衛は `50 intrigue scenario groups passed` と表示されます。失敗時はエラーを表示し、終了コードが 0 以外になります。

- `test-core.cjs`: 兵力・忠誠心・相手による補正、確定と取り消し、保存失敗時の状態復元など。
- `test-intrigue.cjs`: 暗殺・護衛・毒見・耐性・拘束解除・六芒星・Round3との連携など。

各シナリオには複数の検証が含まれます。HTML内のJavaScriptをNode.jsのVMで実行し、DOM・通知・localStorageはテスト用の代替を使います。ブラウザの保存データは変更しません。

これは内部処理とJavaScript構文のテストです。画面の見た目、ドラッグ、スクロールなどのブラウザ操作や、すべてのルールの網羅を保証するものではありません。
