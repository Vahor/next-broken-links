# Static Export

This example shows how to use `next-broken-links` with `output: "export"`.

## Running the example

```bash
bun install
bun run build
bun run ../../packages/next-broken-links/ # to run against the latest version
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

If you want to check links against a specific domain, you can use the `--domain` option:

```bash
bun run ../../packages/next-broken-links/  --domain vahor.fr
```
This time it will also check the sitemap.xml file as it contains only domain specific links.

```bash
✔ Parsed next config
✔ Extracted links from all pages
✔ Checked links
✖ error Found 3 broken links
        index.html: /hello/world/again
        index.html: https://vahor.fr/this/also/fails
        sitemap.xml: https://vahor.fr/this/should/fail
```
