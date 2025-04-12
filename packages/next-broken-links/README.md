# next-broken-links

[![Code quality](https://github.com/Vahor/next-broken-links/actions/workflows/quality.yml/badge.svg)](https://github.com/Vahor/next-broken-links/actions/workflows/quality.yml)
[![npm downloads](https://img.shields.io/npm/dm/%40vahor%2Fnext-broken-links)](https://www.npmjs.com/package/@vahor/next-broken-links)


## About

This is a CLI tool that will check broken links in your Next.js project.

The experimental nextjs [Statically Typed Links](https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links) feature is not enough for catch all segments. This tool helps in that case.


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
