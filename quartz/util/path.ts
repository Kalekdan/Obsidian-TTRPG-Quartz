// Re-export shared path utilities from @quartz-community/utils
export {
  isFilePath,
  isFullSlug,
  isSimpleSlug,
  isRelativeURL,
  isAbsoluteURL,
  getFullSlug,
  slugifyFilePath,
  simplifySlug,
  joinSegments,
  endsWith,
  trimSuffix,
  stripSlashes,
  getFileExtension,
  isFolderPath,
  getAllSegmentPrefixes,
  pathToRoot,
  resolveRelative,
  splitAnchor,
  slugTag,
  transformInternalLink,
  transformLink,
  normalizeHastElement,
} from "@quartz-community/utils"

export type {
  FilePath,
  FullSlug,
  SimpleSlug,
  RelativeURL,
  TransformOptions,
} from "@quartz-community/utils"

// --- v5-specific exports below ---

export const QUARTZ = "quartz"

const normalizeBasePath = (basePath: string) => basePath.replace(/\/$/, "")

export function rebaseUrlWithBasePath(
  href: string,
  destination: string | URL,
  basePath = "",
) {
  const normalizedBasePath = normalizeBasePath(basePath)
  const rebasedDestination = new URL(destination.toString())

  if (normalizedBasePath && !rebasedDestination.pathname.startsWith(normalizedBasePath)) {
    rebasedDestination.pathname = `${normalizedBasePath}${
      rebasedDestination.pathname.startsWith("/") ? "" : "/"
    }${rebasedDestination.pathname}`
  }

  const rebased = new URL(href, rebasedDestination)
  if (
    normalizedBasePath &&
    rebased.origin === rebasedDestination.origin &&
    !rebased.pathname.startsWith(normalizedBasePath)
  ) {
    rebased.pathname = `${normalizedBasePath}${
      rebased.pathname.startsWith("/") ? "" : "/"
    }${rebased.pathname}`
  }

  return rebased
}

// from micromorph/src/utils.ts
// https://github.com/natemoo-re/micromorph/blob/main/src/utils.ts#L5
const _rebaseHtmlElement = (
  el: Element,
  attr: string,
  newBase: string | URL,
  basePath = "",
) => {
  const rebased = rebaseUrlWithBasePath(el.getAttribute(attr)!, newBase, basePath)
  el.setAttribute(attr, rebased.pathname + rebased.search + rebased.hash)
}
export function normalizeRelativeURLs(
  el: Element | Document,
  destination: string | URL,
  basePath = "",
) {
  el.querySelectorAll('[href=""], [href^="./"], [href^="../"]').forEach((item) => {
    _rebaseHtmlElement(item, "href", destination, basePath)
  })
  if (basePath) {
    el.querySelectorAll('[href^="/"]').forEach((item) => {
      const href = item.getAttribute("href")!
      if (href.startsWith(`${basePath}/`) || href === basePath) return
      item.setAttribute("href", href === "/" ? `${basePath}/` : `${basePath}${href}`)
    })
  }
  el.querySelectorAll('[src=""], [src^="./"], [src^="../"]').forEach((item) => {
    _rebaseHtmlElement(item, "src", destination, basePath)
  })
  if (basePath) {
    el.querySelectorAll('[src^="/"]').forEach((item) => {
      const src = item.getAttribute("src")!
      if (src.startsWith(`${basePath}/`) || src === basePath) return
      item.setAttribute("src", src === "/" ? `${basePath}/` : `${basePath}${src}`)
    })
  }
}
