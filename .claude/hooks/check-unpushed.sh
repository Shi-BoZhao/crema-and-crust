#!/bin/sh
# Stop hook: 使い捨てコンテナで push し忘れた変更が消えるのを防ぐ。
# 警告対象: 未 push のコミット(自 repo と ../agents-share)、
#           ../agents-share の未コミット変更(記憶は即 push がルールのため)。
# 自 repo の未コミット変更は作業中の通常状態なので対象外。

input=$(cat)
# 直前にこの hook で止めた場合は再ブロックしない(無限ループ防止)
echo "$input" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true' && exit 0

warn=""
for d in . ../agents-share; do
  [ -d "$d/.git" ] || continue
  unpushed=$(git -C "$d" log --branches --not --remotes --oneline 2>/dev/null | head -1)
  [ -n "$unpushed" ] && warn="$warn [$d] 未 push のコミットあり。"
done
dirty=$(git -C ../agents-share status --porcelain 2>/dev/null | head -1)
[ -n "$dirty" ] && warn="$warn [../agents-share] 未 commit の変更あり。"

if [ -n "$warn" ]; then
  echo "この環境は使い捨てのため push しない変更は消えます。$warn 必要なら commit・push を、不要なら破棄をユーザーに確認すること。" >&2
  exit 2
fi
exit 0
