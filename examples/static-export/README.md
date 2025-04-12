# Static Export

This example shows how to use `next-broken-links` with `output: "export"`.

## Running the example

```bash
bun install
bun run build
```

You should see the following output:

```bash
✔ Extracted links from all pages
✖ error Found 1 broken links
        index.html: /hello/world/again
```

Update the links in `src/app/page.tsx` to point to the correct URLs or remove the broken links, then run `bun run build` again.\
This time, you should see the following output:

```bash
✔ Extracted links from all pages
✔ No broken links found
```


