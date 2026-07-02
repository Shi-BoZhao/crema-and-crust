#!/bin/sh
# Stop hook: セッションに本人(ツイン)の観測が埋もれていないか、1セッション1回だけ
# Claude に確認させる。受動収集(twin-capture skill)を注意頼みにしないための仕組み。
# 発火しない条件: 既に確認済み(marker) / 書き込み先が環境に無い / 短いセッション。

input=$(cat)
# 直前にこの hook で止めた場合は再ブロックしない(無限ループ防止)
echo "$input" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true' && exit 0

# 書き込み先(gemini か、中継先の agents-share)が無い環境では何もしない
[ -d ../gemini ] || [ -d ../agents-share ] || exit 0

session_id=$(printf '%s' "$input" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
[ -n "$session_id" ] || exit 0
marker="${TMPDIR:-/tmp}/twin-observation-check-${session_id}"
[ -f "$marker" ] && exit 0

# 実質的なやり取りが無いセッション(単発の質問・雑談)では促さない
transcript=$(printf '%s' "$input" | sed -n 's/.*"transcript_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
if [ -n "$transcript" ] && [ -f "$transcript" ]; then
  lines=$(wc -l < "$transcript")
  [ "$lines" -lt 30 ] && exit 0
fi

touch "$marker"
echo "ツイン観測チェック(このセッションで1回だけ): この会話に本人の嗜好・価値観・判断パターンとして残す価値のある観測が現れていれば、twin-capture の手順で記録を提案すること。無ければ何もせずそのまま終了してよい。" >&2
exit 2
