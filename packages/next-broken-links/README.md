# next-broken-links

[![Code quality](https://github.com/Vahor/next-broken-links/actions/workflows/quality.yml/badge.svg)](https://github.com/Vahor/next-broken-links/actions/workflows/quality.yml)
[![npm downloads](https://img.shields.io/npm/dm/%40vahor%2Fnext-broken-links)](https://www.npmjs.com/package/@vahor/next-broken-links)


## About

This is a CLI tool that will check broken links in your Next.js project.

The experimental nextjs [Statically Typed Links](https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links) feature is not enough for catch all segments. This tool helps in that case.

Plus as we check links directly in the `.next` (or `out`) directory, we also check for broken links coming from CMS or other external sources. Whereas the next features is only limited to the `<Link>` tags present directly in the code.\
But that's also a limit of our tool as we can only check server side rendered links.

### Features

- Check broken links for public assets (images, json etc...)
- Check broken links for sitemap.xml
- Check broken links for all `<a>` tags (including `<Link>`)

## Installation

```bash
bun install @vahor/next-broken-links -D
```

## Usage

After a nextjs build, run the following command:

```bash
bunx @vahor/next-broken-links
```
or
```bash
bun next-broken-links
```

It will output the following:

```bash
✔ Extracted links from all pages
✔ No broken links found
```

If you have broken links, it will output the following:

```
✔ Extracted links from all pages
✖ error Found 1 broken links
        /path/to/page.html: broken-link
```

### Options

- `--config <path>` - Path to your next.config.js file. 
  - If not set, it will try to find a `next.config.js` (mjs, cjs, ts or js) file in the current directory.
- `--domain <domain>` - Domain to check links against. 
  - If not set, non relative links will be ignored.
- `--verbose` - Enable verbose mode.

# Who is using this?

- [vahor.fr](https://vahor.fr/project/next-broken-links) [(source)](https://github.com/Vahor/vahor.fr/blob/main/package.json)


