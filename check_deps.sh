for d in invariant react-fast-compare shallowequal html-parse-stringify void-elements; do
  if ls /app/node_modules/$d/package.json 2>/dev/null; then
    echo "$d OK"
  else
    echo "$d MISSING"
  fi
done
