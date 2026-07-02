#!/bin/sh
# Cursor hooks → ジオラマ。同じフォルダの diorama-bridge.mjs を呼ぶだけ。
exec node "$(dirname "$0")/diorama-bridge.mjs"
